import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, InvoiceItemLineDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { NotificationService } from '../notification/notification.service';

// ─── State Machine ─────────────────────────────────
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft:     ['received', 'cancelled'],   // مسودة → قيد التجهيز أو ملغي
  received:  ['completed', 'cancelled'],  // قيد التجهيز → تم التسليم أو ملغي
  completed: [],
  cancelled: [],
  // حالات قديمة للتوافقية مع بيانات موجودة
  washing:   ['completed', 'cancelled'],
  ironing:   ['completed', 'cancelled'],
  ready:     ['completed', 'cancelled'],
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
  is_edited: true,
  walk_in_name: true,
  walk_in_phone: true,
  customerId: true,
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
          status: dto.status || 'received',
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

    const [invoices, total, localProfiles] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: INVOICE_LIST_SELECT,
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.laundryCustomerProfile.findMany({ where: { laundryId } }),
    ]);

    const profileByCustomerId = new Map<string, any>();
    const profileByPhone = new Map<string, any>();

    for (const p of localProfiles) {
      if (p.customerId) profileByCustomerId.set(p.customerId, p);
      if (p.phone) profileByPhone.set(p.phone, p);
    }

    return {
      success: true,
      data: invoices.map((inv) => {
        const lp = inv.customerId
          ? profileByCustomerId.get(inv.customerId)
          : (inv.walk_in_phone ? profileByPhone.get(inv.walk_in_phone) : null);

        const customerName = lp?.localName || inv.customer?.fullName || inv.walk_in_name || '';
        const customerPhone = lp?.localPhone || inv.customer?.phoneNumber || inv.walk_in_phone || '';

        return {
          ...inv,
          customerName,
          customerPhone,
          totalAmount : toNum(inv.totalAmount),
          paidAmount  : toNum(inv.paidAmount),
          dueAmount   : inv.dueAmount !== null ? toNum(inv.dueAmount) : null,
        };
      }),
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
  async updateInvoice(invoiceId: string, laundryId: string, editorId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, laundryId },
      select: { id: true, status: true, discount: true, totalAmount: true, customerId: true, paymentType: true },
    });
    if (!invoice) this.throwNotFound();

    const isCompleted = invoice.status === 'completed';
    const isDeferred = invoice.paymentType === 'deferred';
    const oldTotal = Number(invoice.totalAmount);

    let newTotal = oldTotal;
    let subtotal = 0;
    let lines = [];
    const newDiscount = dto.discount !== undefined ? Number(dto.discount) : toNum(invoice.discount);

    if (dto.items && dto.items.length > 0) {
      const buildRes = await this.buildItemLines(laundryId, dto.items);
      lines = buildRes.lines;
      subtotal = buildRes.subtotal;
      
      // In a real scenario we might re-calculate tax/urgency. 
      // For simplicity, we just adjust total based on items and discount here.
      // Assuming tax and urgency are unchanged or not included in this simple calculation
      const invoiceFull = await this.prisma.invoice.findUnique({where: {id: invoiceId}, select: {tax_amount: true, urgency_fee: true}});
      newTotal = Math.max(0, subtotal - newDiscount) + Number(invoiceFull?.tax_amount || 0) + Number(invoiceFull?.urgency_fee || 0);
    } else {
      newTotal = Math.max(0, oldTotal + toNum(invoice.discount) - newDiscount); // Adjust total if only discount changes
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Audit Log Snapshot
      const beforeSnapshot = await tx.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
      await tx.invoiceEditLog.create({
        data: {
          invoice_id: invoiceId,
          edited_by: editorId,
          edit_reason: dto.editReason || 'User edited invoice',
          changes_snapshot: JSON.parse(JSON.stringify(beforeSnapshot)),
        },
      });

      // 2. Adjust Commission if Completed
      if (isCompleted && newTotal !== oldTotal) {
        const laundry = await tx.laundry.findUnique({
          where: { id: laundryId },
          select: { billing_type: true, commission_rate: true },
        });

        if (laundry && laundry.billing_type === 'commission') {
          // 2.1 Fetch the last charge transaction (safely skipping refunds thanks to the 'type' field)
          const lastChargeTx = await tx.commissionTransaction.findFirst({
            where: { invoice_id: invoiceId, type: 'charge' },
            orderBy: { created_at: 'desc' },
          });

          if (lastChargeTx) {
            // 2.2 Revert the previous commission (Refund)
            if (Number(lastChargeTx.commission_amount) > 0) {
              const refundAmount = Number(lastChargeTx.commission_amount);
              const [refundedLaundry] = await tx.$queryRaw<{ balance: any }[]>(
                Prisma.sql`
                  UPDATE laundries
                  SET balance = balance + ${refundAmount}::numeric
                  WHERE id = ${laundryId}::uuid
                  RETURNING balance
                `
              );
              
              await tx.commissionTransaction.create({
                data: {
                  laundry_id: laundryId,
                  invoice_id: invoiceId,
                  invoice_total: Number(lastChargeTx.invoice_total),
                  commission_rate: Number(lastChargeTx.commission_rate),
                  commission_amount: -refundAmount, // Negative to indicate refund
                  balance_after: Number(refundedLaundry.balance),
                  type: 'refund',
                },
              });
            }

            // 2.3 Calculate and apply the new commission (Charge)
            let rate = laundry.commission_rate ? Number(laundry.commission_rate) : null;
            if (rate === null) {
              const defaultRateSetting = await tx.app_settings.findUnique({
                where: { key: 'default_commission_rate' },
              });
              rate = defaultRateSetting && defaultRateSetting.value ? Number(defaultRateSetting.value) : 10;
            }

            const newCommissionAmount = Number((newTotal * (rate / 100)).toFixed(2));
            
            if (newCommissionAmount > 0) {
              const [chargedLaundry] = await tx.$queryRaw<{ balance: any }[]>(
                Prisma.sql`
                  UPDATE laundries
                  SET balance = balance - ${newCommissionAmount}::numeric
                  WHERE id = ${laundryId}::uuid
                  RETURNING balance
                `
              );

              await tx.commissionTransaction.create({
                data: {
                  laundry_id: laundryId,
                  invoice_id: invoiceId,
                  invoice_total: newTotal,
                  commission_rate: rate,
                  commission_amount: newCommissionAmount,
                  balance_after: Number(chargedLaundry.balance),
                  type: 'charge',
                },
              });
            }
          }
        }
      }

      // 3. Update Invoice Data
      if (dto.items && dto.items.length > 0) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId } });
        await tx.invoiceItem.createMany({
          data: lines.map((l) => ({ ...l, invoiceId })),
        });
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal,
            discount: newDiscount,
            totalAmount: newTotal,
            is_edited: true,
            ...(dto.paymentType && { paymentType: dto.paymentType as any }),
            ...(dto.paidAmount !== undefined && { paidAmount: dto.paidAmount }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
            ...(dto.expectedDeliveryAt !== undefined && { expected_delivery_at: dto.expectedDeliveryAt }),
            ...(dto.walkInLocation !== undefined && { walk_in_location: dto.walkInLocation }),
            ...(dto.createdAt !== undefined && { createdAt: dto.createdAt }),
          },
        });
      } else {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            totalAmount: newTotal,
            is_edited: true,
            ...(dto.paymentType !== undefined && { paymentType: dto.paymentType as any }),
            ...(dto.paidAmount  !== undefined && { paidAmount: dto.paidAmount }),
            ...(dto.discount    !== undefined && { discount: newDiscount }),
            ...(dto.walkInLocation !== undefined && { walk_in_location: dto.walkInLocation }),
            ...(dto.createdAt !== undefined && { createdAt: dto.createdAt }),
          },
        });
      }
    });
    
    // إرسال إشعار لصاحب المغسلة بتعديل الفاتورة
    const invoiceInfo = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { invoiceNumber: true }
    });
    if (invoiceInfo) {
      this.notificationService.sendToLaundryOwner(
        laundryId,
        'تم تعديل الفاتورة ✏️',
        `تم تعديل بيانات الفاتورة رقم ${invoiceInfo.invoiceNumber}`,
        { type: 'invoice_updated', referenceId: invoiceId }
      ).catch(err => console.error('Notification error:', err));
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
      select: { id: true, status: true, totalAmount: true },
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

      // ─── منطق العمولة (Commission Logic) ───
      if (isCompleting) {
        const laundry = await tx.laundry.findUnique({
          where: { id: laundryId },
          select: { billing_type: true, trial_commission_ends_at: true, commission_rate: true },
        });

        if (laundry && laundry.billing_type === 'commission') {
          const now = new Date();
          const trialEnds = laundry.trial_commission_ends_at;

          // التحقق من انتهاء الفترة التجريبية (إن وجدت)
          if (!trialEnds || trialEnds < now) {
            // حماية من الخصم المزدوج
            const existingTx = await tx.commissionTransaction.findFirst({
              where: { invoice_id: invoiceId },
            });

            if (!existingTx) {
              // تحديد نسبة العمولة
              let rate = laundry.commission_rate ? Number(laundry.commission_rate) : null;
              if (rate === null) {
                const defaultRateSetting = await tx.app_settings.findUnique({
                  where: { key: 'default_commission_rate' },
                });
                if (defaultRateSetting && defaultRateSetting.value) {
                  rate = Number(defaultRateSetting.value);
                } else {
                  rate = 10;
                  Logger.warn('default_commission_rate not found in app_settings. Using fallback 10%', 'InvoiceService');
                }
              }

              const invoiceTotal = Number(invoice.totalAmount);
              const commissionAmount = Number((invoiceTotal * (rate / 100)).toFixed(2));

              if (commissionAmount > 0) {
                // الخصم الذري لـ balance
                const [updatedLaundry] = await tx.$queryRaw<{ balance: any }[]>(
                  Prisma.sql`
                    UPDATE laundries
                    SET balance = balance - ${commissionAmount}::numeric
                    WHERE id = ${laundryId}::uuid
                    RETURNING balance
                  `
                );
                const balanceAfter = Number(updatedLaundry.balance);

                // تسجيل المعاملة
                await tx.commissionTransaction.create({
                  data: {
                    laundry_id: laundryId,
                    invoice_id: invoiceId,
                    invoice_total: invoiceTotal,
                    commission_rate: rate,
                    commission_amount: commissionAmount,
                    balance_after: balanceAfter,
                  },
                });
              }
            }
          }
        }
      }

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
        
      // إرسال إشعارات لصاحب المغسلة بناءً على الحالة
      if (dto.status === 'completed') {
        this.notificationService.sendToLaundryOwner(
          laundryId,
          'فاتورة مسلمة ✅',
          `تم تسليم الفاتورة رقم ${fullInvoice.invoiceNumber} بنجاح`,
          { type: 'invoice_completed', referenceId: invoiceId }
        ).catch(err => console.error('Notification error:', err));
      } else if (dto.status === 'cancelled') {
        this.notificationService.sendToLaundryOwner(
          laundryId,
          'تم إلغاء فاتورة ❌',
          `تم إلغاء الفاتورة رقم ${fullInvoice.invoiceNumber}`,
          { type: 'invoice_cancelled', referenceId: invoiceId }
        ).catch(err => console.error('Notification error:', err));
      }
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
    const customerName = invoice.customer?.fullName || invoice.walk_in_name || '';
    const customerPhone = invoice.customer?.phoneNumber || invoice.walk_in_phone || '';

    return {
      ...invoice,
      customerName,
      customerPhone,
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
