import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, InvoiceItemLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { NotificationService } from '../notification/notification.service';

// ─── State Machine ─────────────────────────────────
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft:     ['received', 'cancelled'],
  received:  ['washing',  'cancelled'],
  washing:   ['ironing',  'cancelled'],
  ironing:   ['ready',    'cancelled'],
  ready:     ['completed','cancelled'],
  completed: [],
  cancelled: ['received'],
};

// ─── Select Presets ────────────────────────────────
const INVOICE_DETAIL_SELECT = {
  id: true,
  invoiceNumber: true,
  laundryId: true,
  status: true,
  paymentType: true,
  subtotal: true,
  discount: true,
  tax_amount: true,
  urgency_fee: true,
  totalAmount: true,
  paidAmount: true,
  dueAmount: true,
  notes: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  walk_in_name: true,
  walk_in_phone: true,
  walk_in_location: true,
  expected_delivery_at: true,
  items: {
    select: {
      id: true,
      itemId: true,
      itemName: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
      service_type: true,
      processing_type: true,
    },
  },
  customer: {
    select: { id: true, fullName: true, uniqueId: true, phoneNumber: true },
  },
} as const;

const INVOICE_LIST_SELECT = {
  id: true,
  invoiceNumber: true,
  status: true,
  paymentType: true,
  totalAmount: true,
  paidAmount: true,
  dueAmount: true,
  createdAt: true,
  walk_in_name: true,
  customer: {
    select: { id: true, fullName: true, uniqueId: true, phoneNumber: true },
  },
} as const;

// ─── Decimal formatter ─────────────────────────────
function toNum(val: any): number {
  return val !== null && val !== undefined ? Number(val) : 0;
}

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. POST /invoices — إنشاء فاتورة جديدة
  // ────────────────────────────────────────────────────
  async createInvoice(laundryId: string, dto: CreateInvoiceDto) {
    // ─── تحقق: يجب أن يكون هناك عميل (مسجّل أو walk-in) ───
    const isRegistered = !!(dto.customerId || dto.customerUniqueId);
    const isWalkIn     = !!(dto.walkInName && dto.walkInPhone);

    if (!isRegistered && !isWalkIn) {
      // Allow walk-in with name only (phone is optional)
      if (!dto.walkInName && !isRegistered) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'CUSTOMER_IDENTIFIER_REQUIRED',
            message: 'يجب إرسال (customerId أو customerUniqueId) أو اسم عميل walk-in (walkInName على الأقل)',
          },
        });
      }
    }

    // ─── جلب العميل المسجّل (إن وُجد) ───
    let customerId: string | null = null;

    if (isRegistered) {
      const customer = await this.prisma.user.findFirst({
        where: dto.customerId
          ? { id: dto.customerId }
          : { uniqueId: dto.customerUniqueId },
        select: { id: true, isActive: true },
      });
      if (!customer) {
        throw new NotFoundException({
          success: false,
          error: { code: 'CUSTOMER_NOT_FOUND', message: 'العميل غير موجود' },
        });
      }
      if (!customer.isActive) {
        throw new ForbiddenException({
          success: false,
          error: { code: 'CUSTOMER_INACTIVE', message: 'حساب العميل موقوف' },
        });
      }
      customerId = customer.id;
    }

    // ─── جلب إعدادات المغسلة (Tax + Urgency) ───
    const laundry = await this.prisma.laundry.findUnique({
      where: { id: laundryId },
      select: {
        tax_enabled: true,
        tax_rate: true,
        urgency_enabled: true,
        urgency_fee: true,
      },
    });

    // ─── بناء البنود ───
    const { lines, subtotal } = await this.buildItemLines(laundryId, dto.items);

    const discount = Number(dto.discount ?? 0);

    // حساب رسم الاستعجال: إضافة الرسوم إذا كان أي بند عاجل
    let urgencyFee = 0;
    const hasUrgentItem = dto.items.some(i => i.processingType === 'urgent');
    if (hasUrgentItem && laundry?.urgency_enabled) {
      urgencyFee = Number(laundry.urgency_fee ?? 0);
    }

    // حساب الضريبة (على المبلغ بعد الخصم)
    const afterDiscount = Math.max(0, subtotal - discount);
    let taxAmount = 0;
    if (laundry?.tax_enabled && laundry.tax_rate) {
      taxAmount = Math.round(afterDiscount * (Number(laundry.tax_rate) / 100) * 100) / 100;
    }

    const totalAmount = afterDiscount + taxAmount + urgencyFee;

    // ─── الإنشاء في Transaction ───
    const invoice = await this.prisma.$transaction(async (tx) => {
      // 1. تحديث العداد ذرياً (Atomic Increment)
      const counter = await tx.invoiceCounter.upsert({
        where: { laundryId },
        create: { laundryId, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });

      // 2. توليد رقم الفاتورة التسلسلي (مثال: INV-0001)
      const generatedInvoiceNumber = `INV-${counter.lastNumber.toString().padStart(4, '0')}`;

      const inv = await tx.invoice.create({
        data: {
          invoiceNumber: generatedInvoiceNumber,
          laundry: { connect: { id: laundryId } },
          customer: customerId ? { connect: { id: customerId } } : undefined,
          paymentType  : dto.paymentType as any,
          subtotal,
          discount,
          tax_amount: taxAmount,
          urgency_fee: urgencyFee,
          totalAmount,
          paidAmount   : 0,
          notes        : dto.notes,
          walk_in_name   : dto.walkInName,
          walk_in_phone  : dto.walkInPhone,
          walk_in_location: dto.walkInLocation,
          expected_delivery_at: dto.expectedDeliveryAt,
          items: {
            create: lines,
          },
        },
        select: INVOICE_DETAIL_SELECT,
      });

      return inv;
    });

    return { success: true, data: this.formatDetail(invoice) };
  }

  // ────────────────────────────────────────────────────
  // 2. GET /invoices — قائمة فواتير المغسلة
  // ────────────────────────────────────────────────────
  async findAll(laundryId: string, query: QueryInvoiceDto) {
    const { status, customerId, search, page = 1, limit = 20 } = query;

    const where: any = { laundryId };
    if (status)     where.status     = status;
    if (customerId) where.customerId = customerId;
    if (search && search.trim()) {
      where.OR = [
        { walk_in_name : { contains: search.trim(), mode: 'insensitive' } },
        { walk_in_phone: { contains: search.trim() } },
        { invoiceNumber: { contains: search.trim() } },
      ];
    }

    const [invoices, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: INVOICE_LIST_SELECT,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: invoices.map((inv) => ({
        ...inv,
        totalAmount : toNum(inv.totalAmount),
        paidAmount  : toNum(inv.paidAmount),
        dueAmount   : inv.dueAmount !== null ? toNum(inv.dueAmount) : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ────────────────────────────────────────────────────
  // 3. GET /invoices/:id — تفاصيل فاتورة (للمغسلة)
  // ────────────────────────────────────────────────────
  async findOne(invoiceId: string, laundryId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, laundryId },
      select: INVOICE_DETAIL_SELECT,
    });
    if (!invoice) this.throwNotFound();

    return { success: true, data: this.formatDetail(invoice) };
  }

  // ────────────────────────────────────────────────────
  // 4. PATCH /invoices/:id — تعديل الفاتورة
  // ────────────────────────────────────────────────────
  async updateInvoice(invoiceId: string, laundryId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, laundryId },
      select: { id: true, status: true, discount: true },
    });
    if (!invoice) this.throwNotFound();

    if (['completed', 'cancelled'].includes(invoice.status)) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: 'INVOICE_CANNOT_EDIT',
          message: `لا يمكن تعديل فاتورة بحالة ${invoice.status}`,
        },
      });
    }

    if (dto.items && dto.items.length > 0) {
      const { lines, subtotal } = await this.buildItemLines(laundryId, dto.items);
      const newDiscount   = dto.discount !== undefined ? Number(dto.discount) : toNum(invoice.discount);
      const newTotal      = Math.max(0, subtotal - newDiscount);

      await this.prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });
        await tx.invoiceItem.createMany({
          data: lines.map((l) => ({ ...l, invoiceId })),
        });
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal,
            discount   : newDiscount,
            totalAmount: newTotal,
            ...(dto.paymentType && { paymentType: dto.paymentType as any }),
            ...(dto.paidAmount !== undefined && { paidAmount: dto.paidAmount }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
          },
        });
      });
    } else {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ...(dto.paymentType !== undefined && { paymentType: dto.paymentType as any }),
          ...(dto.paidAmount  !== undefined && { paidAmount: dto.paidAmount }),
          ...(dto.discount    !== undefined && { discount: dto.discount }),
          ...(dto.notes       !== undefined && { notes: dto.notes }),
        },
      });
    }

    return this.findOne(invoiceId, laundryId);
  }

  // ────────────────────────────────────────────────────
  // 5. PATCH /invoices/:id/status — State Machine
  // ────────────────────────────────────────────────────
  async updateStatus(
    invoiceId : string,
    laundryId : string,
    changedBy : string,
    dto       : UpdateInvoiceStatusDto,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, laundryId },
      select: { id: true, status: true },
    });
    if (!invoice) this.throwNotFound();

    // ─── التحقق من الـ State Machine ───
    const allowed = ALLOWED_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException({
        success: false,
        error: {
          code: 'INVOICE_INVALID_TRANSITION',
          message: `لا يمكن الانتقال من "${invoice.status}" إلى "${dto.status}"`,
          allowedNext: allowed,
        },
      });
    }

    const isCompleting = dto.status === 'completed';

    const updated = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: dto.status as any,
          // completedAt يُعيَّن من DB Trigger — نعيّنه يدوياً كـ fallback
          ...(isCompleting && { completedAt: new Date() }),
        },
        select: INVOICE_DETAIL_SELECT,
      });

      await tx.invoiceStatusLog.create({
        data: {
          invoiceId,
          changedBy,
          oldStatus : invoice.status as any,
          newStatus : dto.status as any,
          note      : dto.notes || dto.note,
        },
      });

      return inv;
    });

    // ─── إرسال الإشعار للعميل بعد تحديث الحالة ───
    const fullInvoice = await this.prisma.invoice.findUnique({
      where : { id: invoiceId },
      select: { customerId: true, invoiceNumber: true },
    });
    if (fullInvoice) {
      this.notificationService
        .sendInvoiceStatusNotification(
          fullInvoice.customerId,
          fullInvoice.invoiceNumber,
          dto.status,
          invoiceId,
        )
        .catch((err) => console.error('Notification error:', err));
    }

    return { success: true, data: this.formatDetail(updated) };
  }

  // ────────────────────────────────────────────────────
  // 6. GET /invoices/:id/print — بيانات الطباعة
  // ────────────────────────────────────────────────────
  async getPrintData(invoiceId: string, laundryId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, laundryId },
      select: {
        invoiceNumber        : true,
        status               : true,
        paymentType          : true,
        subtotal             : true,
        discount             : true,
        tax_amount           : true,
        urgency_fee          : true,
        totalAmount          : true,
        paidAmount           : true,
        dueAmount            : true,
        notes                : true,
        createdAt            : true,
        completedAt          : true,
        expected_delivery_at : true,
        walk_in_name         : true,
        walk_in_phone        : true,
        laundry: {
          select: { name: true, phoneNumber: true, address: true, city: true },
        },
        customer: {
          select: { fullName: true, uniqueId: true, phoneNumber: true },
        },
        items: {
          select: {
            itemName        : true,
            unitPrice       : true,
            quantity        : true,
            subtotal        : true,
            service_type    : true,
            processing_type : true,
          },
        },
      },
    });

    if (!invoice) this.throwNotFound();

    return {
      success: true,
      data: {
        invoiceNumber       : invoice.invoiceNumber,
        createdAt           : invoice.createdAt,
        completedAt         : invoice.completedAt,
        expected_delivery_at: invoice.expected_delivery_at,
        status              : invoice.status,
        paymentType         : invoice.paymentType,
        laundry             : invoice.laundry,
        customer            : invoice.customer,
        walk_in_name        : invoice.walk_in_name,
        walk_in_phone       : invoice.walk_in_phone,
        items: invoice.items.map((i) => ({
          itemName       : i.itemName,
          unitPrice      : toNum(i.unitPrice),
          quantity       : i.quantity,
          subtotal       : toNum(i.subtotal),
          service_type   : i.service_type,
          processing_type: i.processing_type,
        })),
        subtotal   : toNum(invoice.subtotal),
        discount   : toNum(invoice.discount),
        tax_amount : toNum(invoice.tax_amount),
        urgency_fee: toNum(invoice.urgency_fee),
        totalAmount: toNum(invoice.totalAmount),
        paidAmount : toNum(invoice.paidAmount),
        dueAmount  : invoice.dueAmount !== null ? toNum(invoice.dueAmount) : null,
        notes      : invoice.notes,
      },
    };
  }

  // ────────────────────────────────────────────────────
  // 7. GET /my-invoices — سجل فواتير العميل
  // ────────────────────────────────────────────────────
  async findMyInvoices(customerId: string, query: QueryInvoiceDto) {
    const { status, page = 1, limit = 20 } = query;

    const where: any = { customerId };
    if (status) where.status = status;

    const [invoices, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id                  : true,
          invoiceNumber       : true,
          status              : true,
          paymentType         : true,
          totalAmount         : true,
          paidAmount          : true,
          dueAmount           : true,
          createdAt           : true,
          expected_delivery_at: true,
          laundry: {
            select: { id: true, name: true, logoUrl: true, city: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: invoices.map((inv) => ({
        ...inv,
        totalAmount: toNum(inv.totalAmount),
        paidAmount : toNum(inv.paidAmount),
        dueAmount  : inv.dueAmount !== null ? toNum(inv.dueAmount) : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ────────────────────────────────────────────────────
  // 8. GET /my-invoices/:id — تفاصيل فاتورة للعميل
  // ────────────────────────────────────────────────────
  async findMyInvoice(invoiceId: string, customerId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, customerId },
      select: {
        ...INVOICE_DETAIL_SELECT,
        laundry: {
          select: { id: true, name: true, phoneNumber: true, logoUrl: true, city: true },
        },
      },
    });
    if (!invoice) this.throwNotFound();

    return { success: true, data: this.formatDetail(invoice as any) };
  }

  // ─── Private Helpers ──────────────────────────────────

  /** بناء بنود الفاتورة مع السعر الصحيح (laundry_prices → base_price) */
  private async buildItemLines(
    laundryId : string,
    items     : InvoiceItemLineDto[],
  ): Promise<{ lines: any[]; subtotal: number }> {
    const lines: any[] = [];
    let subtotal = 0;

    for (const itemDto of items) {
      const [laundryPrice, item] = await Promise.all([
        this.prisma.laundryPrice.findUnique({
          where: { laundryId_itemId: { laundryId, itemId: itemDto.itemId } },
          select: { price: true },
        }),
        this.prisma.item.findUnique({
          where: { id: itemDto.itemId },
          select: {
            nameAr        : true,
            nameEn        : true,
            basePrice     : true,
            washing_price : true,
            ironing_price : true,
            isActive      : true,
          },
        }),
      ]);

      if (!item) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: `الصنف غير موجود: ${itemDto.itemId}`,
          },
        });
      }

      let unitPrice: number;

      if (itemDto.unitPrice !== undefined && itemDto.unitPrice !== null) {
        // المستخدم عدّل السعر يدوياً — نحترم تعديله
        unitPrice = itemDto.unitPrice;
      } else {
        // اختيار السعر تلقائياً حسب نوع الخدمة
        switch (itemDto.serviceType) {
          case 'washing_only':
            unitPrice = Number(item.washing_price ?? item.basePrice);
            break;
          case 'ironing_only':
            unitPrice = Number(item.ironing_price ?? item.basePrice);
            break;
          case 'washing_and_ironing':
          default:
            // سعر المغسلة أولاً → base_price كـ fallback
            unitPrice = laundryPrice?.price
              ? Number(laundryPrice.price)
              : Number(item.basePrice);
            break;
        }
      }

      subtotal += unitPrice * itemDto.quantity;

      // تحويل قيم نوع الخدمة من Frontend لتتطابق مع enum قاعدة البيانات
      const serviceTypeMap: Record<string, string> = {
        'washing_only'        : 'washing',
        'ironing_only'        : 'ironing',
        'washing_and_ironing' : 'washing_and_ironing',
      };
      const dbServiceType = serviceTypeMap[itemDto.serviceType ?? 'washing_and_ironing'] ?? 'washing_and_ironing';

      lines.push({
        itemId          : itemDto.itemId,
        itemName        : item.nameAr,
        item_name_ar    : item.nameAr,
        item_name_en    : item.nameEn,
        unitPrice,
        quantity        : itemDto.quantity,
        service_type    : dbServiceType,
        processing_type : itemDto.processingType ?? 'normal',
      });
    }

    return { lines, subtotal };
  }

  /** تحويل القيم العشرية لـ number في الـ response */
  private formatDetail(invoice: any) {
    return {
      ...invoice,
      subtotal   : toNum(invoice.subtotal),
      discount   : toNum(invoice.discount),
      tax_amount : toNum(invoice.tax_amount),
      urgency_fee: toNum(invoice.urgency_fee),
      totalAmount: toNum(invoice.totalAmount),
      paidAmount : toNum(invoice.paidAmount),
      dueAmount  : invoice.dueAmount !== null ? toNum(invoice.dueAmount) : null,
      items: (invoice.items ?? []).map((i: any) => ({
        ...i,
        unitPrice: toNum(i.unitPrice),
        subtotal : toNum(i.subtotal),
      })),
    };
  }

  private throwNotFound(): never {
    throw new NotFoundException({
      success: false,
      error: { code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' },
    });
  }
}
