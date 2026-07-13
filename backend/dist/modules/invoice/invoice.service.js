"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const ALLOWED_TRANSITIONS = {
    draft: ['received', 'cancelled'],
    received: ['washing', 'cancelled'],
    washing: ['ironing', 'cancelled'],
    ironing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['received'],
};
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
};
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
};
function toNum(val) {
    return val !== null && val !== undefined ? Number(val) : 0;
}
let InvoiceService = class InvoiceService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async createInvoice(laundryId, dto) {
        const isRegistered = !!(dto.customerId || dto.customerUniqueId);
        const isWalkIn = !!(dto.walkInName && dto.walkInPhone);
        if (!isRegistered && !isWalkIn) {
            if (!dto.walkInName && !isRegistered) {
                throw new common_1.BadRequestException({
                    success: false,
                    error: {
                        code: 'CUSTOMER_IDENTIFIER_REQUIRED',
                        message: 'يجب إرسال (customerId أو customerUniqueId) أو اسم عميل walk-in (walkInName على الأقل)',
                    },
                });
            }
        }
        let customerId = null;
        if (isRegistered) {
            const customer = await this.prisma.user.findFirst({
                where: dto.customerId
                    ? { id: dto.customerId }
                    : { uniqueId: dto.customerUniqueId },
                select: { id: true, isActive: true },
            });
            if (!customer) {
                throw new common_1.NotFoundException({
                    success: false,
                    error: { code: 'CUSTOMER_NOT_FOUND', message: 'العميل غير موجود' },
                });
            }
            if (!customer.isActive) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'CUSTOMER_INACTIVE', message: 'حساب العميل موقوف' },
                });
            }
            customerId = customer.id;
        }
        const laundry = await this.prisma.laundry.findUnique({
            where: { id: laundryId },
            select: {
                tax_enabled: true,
                tax_rate: true,
                urgency_enabled: true,
                urgency_fee: true,
            },
        });
        const { lines, subtotal } = await this.buildItemLines(laundryId, dto.items);
        const discount = Number(dto.discount ?? 0);
        let urgencyFee = 0;
        const hasUrgentItem = dto.items.some(i => i.processingType === 'urgent');
        if (hasUrgentItem && laundry?.urgency_enabled) {
            urgencyFee = Number(laundry.urgency_fee ?? 0);
        }
        const afterDiscount = Math.max(0, subtotal - discount);
        let taxAmount = 0;
        if (laundry?.tax_enabled && laundry.tax_rate) {
            taxAmount = Math.round(afterDiscount * (Number(laundry.tax_rate) / 100) * 100) / 100;
        }
        const totalAmount = afterDiscount + taxAmount + urgencyFee;
        const invoice = await this.prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
                data: {
                    invoiceNumber: 'TEMP',
                    laundry: { connect: { id: laundryId } },
                    customer: customerId ? { connect: { id: customerId } } : undefined,
                    paymentType: dto.paymentType,
                    subtotal,
                    discount,
                    tax_amount: taxAmount,
                    urgency_fee: urgencyFee,
                    totalAmount,
                    paidAmount: 0,
                    notes: dto.notes,
                    walk_in_name: dto.walkInName,
                    walk_in_phone: dto.walkInPhone,
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
    async findAll(laundryId, query) {
        const { status, customerId, page = 1, limit = 20 } = query;
        const where = { laundryId };
        if (status)
            where.status = status;
        if (customerId)
            where.customerId = customerId;
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
                totalAmount: toNum(inv.totalAmount),
                paidAmount: toNum(inv.paidAmount),
                dueAmount: inv.dueAmount !== null ? toNum(inv.dueAmount) : null,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(invoiceId, laundryId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, laundryId },
            select: INVOICE_DETAIL_SELECT,
        });
        if (!invoice)
            this.throwNotFound();
        return { success: true, data: this.formatDetail(invoice) };
    }
    async updateInvoice(invoiceId, laundryId, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, laundryId },
            select: { id: true, status: true, discount: true },
        });
        if (!invoice)
            this.throwNotFound();
        if (['completed', 'cancelled'].includes(invoice.status)) {
            throw new common_1.UnprocessableEntityException({
                success: false,
                error: {
                    code: 'INVOICE_CANNOT_EDIT',
                    message: `لا يمكن تعديل فاتورة بحالة ${invoice.status}`,
                },
            });
        }
        if (dto.items && dto.items.length > 0) {
            const { lines, subtotal } = await this.buildItemLines(laundryId, dto.items);
            const newDiscount = dto.discount !== undefined ? Number(dto.discount) : toNum(invoice.discount);
            const newTotal = Math.max(0, subtotal - newDiscount);
            await this.prisma.$transaction(async (tx) => {
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
                        ...(dto.paymentType && { paymentType: dto.paymentType }),
                        ...(dto.paidAmount !== undefined && { paidAmount: dto.paidAmount }),
                        ...(dto.notes !== undefined && { notes: dto.notes }),
                    },
                });
            });
        }
        else {
            await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    ...(dto.paymentType !== undefined && { paymentType: dto.paymentType }),
                    ...(dto.paidAmount !== undefined && { paidAmount: dto.paidAmount }),
                    ...(dto.discount !== undefined && { discount: dto.discount }),
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                },
            });
        }
        return this.findOne(invoiceId, laundryId);
    }
    async updateStatus(invoiceId, laundryId, changedBy, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, laundryId },
            select: { id: true, status: true },
        });
        if (!invoice)
            this.throwNotFound();
        const allowed = ALLOWED_TRANSITIONS[invoice.status] ?? [];
        if (!allowed.includes(dto.status)) {
            throw new common_1.UnprocessableEntityException({
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
                    status: dto.status,
                    ...(isCompleting && { completedAt: new Date() }),
                },
                select: INVOICE_DETAIL_SELECT,
            });
            await tx.invoiceStatusLog.create({
                data: {
                    invoiceId,
                    changedBy,
                    oldStatus: invoice.status,
                    newStatus: dto.status,
                    note: dto.note,
                },
            });
            return inv;
        });
        const fullInvoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { customerId: true, invoiceNumber: true },
        });
        if (fullInvoice) {
            this.notificationService
                .sendInvoiceStatusNotification(fullInvoice.customerId, fullInvoice.invoiceNumber, dto.status, invoiceId)
                .catch((err) => console.error('Notification error:', err));
        }
        return { success: true, data: this.formatDetail(updated) };
    }
    async getPrintData(invoiceId, laundryId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, laundryId },
            select: {
                invoiceNumber: true,
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
                createdAt: true,
                completedAt: true,
                expected_delivery_at: true,
                walk_in_name: true,
                walk_in_phone: true,
                laundry: {
                    select: { name: true, phoneNumber: true, address: true, city: true },
                },
                customer: {
                    select: { fullName: true, uniqueId: true, phoneNumber: true },
                },
                items: {
                    select: {
                        itemName: true,
                        unitPrice: true,
                        quantity: true,
                        subtotal: true,
                        service_type: true,
                        processing_type: true,
                    },
                },
            },
        });
        if (!invoice)
            this.throwNotFound();
        return {
            success: true,
            data: {
                invoiceNumber: invoice.invoiceNumber,
                createdAt: invoice.createdAt,
                completedAt: invoice.completedAt,
                expected_delivery_at: invoice.expected_delivery_at,
                status: invoice.status,
                paymentType: invoice.paymentType,
                laundry: invoice.laundry,
                customer: invoice.customer,
                walk_in_name: invoice.walk_in_name,
                walk_in_phone: invoice.walk_in_phone,
                items: invoice.items.map((i) => ({
                    itemName: i.itemName,
                    unitPrice: toNum(i.unitPrice),
                    quantity: i.quantity,
                    subtotal: toNum(i.subtotal),
                    service_type: i.service_type,
                    processing_type: i.processing_type,
                })),
                subtotal: toNum(invoice.subtotal),
                discount: toNum(invoice.discount),
                tax_amount: toNum(invoice.tax_amount),
                urgency_fee: toNum(invoice.urgency_fee),
                totalAmount: toNum(invoice.totalAmount),
                paidAmount: toNum(invoice.paidAmount),
                dueAmount: invoice.dueAmount !== null ? toNum(invoice.dueAmount) : null,
                notes: invoice.notes,
            },
        };
    }
    async findMyInvoices(customerId, query) {
        const { status, page = 1, limit = 20 } = query;
        const where = { customerId };
        if (status)
            where.status = status;
        const [invoices, total] = await this.prisma.$transaction([
            this.prisma.invoice.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    invoiceNumber: true,
                    status: true,
                    paymentType: true,
                    totalAmount: true,
                    paidAmount: true,
                    dueAmount: true,
                    createdAt: true,
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
                paidAmount: toNum(inv.paidAmount),
                dueAmount: inv.dueAmount !== null ? toNum(inv.dueAmount) : null,
            })),
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findMyInvoice(invoiceId, customerId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, customerId },
            select: {
                ...INVOICE_DETAIL_SELECT,
                laundry: {
                    select: { id: true, name: true, phoneNumber: true, logoUrl: true, city: true },
                },
            },
        });
        if (!invoice)
            this.throwNotFound();
        return { success: true, data: this.formatDetail(invoice) };
    }
    async buildItemLines(laundryId, items) {
        const lines = [];
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
                        nameAr: true,
                        nameEn: true,
                        basePrice: true,
                        washing_price: true,
                        ironing_price: true,
                        isActive: true,
                    },
                }),
            ]);
            if (!item) {
                throw new common_1.NotFoundException({
                    success: false,
                    error: {
                        code: 'ITEM_NOT_FOUND',
                        message: `الصنف غير موجود: ${itemDto.itemId}`,
                    },
                });
            }
            let unitPrice;
            if (itemDto.unitPrice !== undefined && itemDto.unitPrice !== null) {
                unitPrice = itemDto.unitPrice;
            }
            else {
                switch (itemDto.serviceType) {
                    case 'washing_only':
                        unitPrice = Number(item.washing_price ?? item.basePrice);
                        break;
                    case 'ironing_only':
                        unitPrice = Number(item.ironing_price ?? item.basePrice);
                        break;
                    case 'washing_and_ironing':
                    default:
                        unitPrice = laundryPrice?.price
                            ? Number(laundryPrice.price)
                            : Number(item.basePrice);
                        break;
                }
            }
            subtotal += unitPrice * itemDto.quantity;
            lines.push({
                itemId: itemDto.itemId,
                itemName: item.nameAr,
                item_name_ar: item.nameAr,
                item_name_en: item.nameEn,
                unitPrice,
                quantity: itemDto.quantity,
                service_type: itemDto.serviceType ?? 'washing_and_ironing',
                processing_type: itemDto.processingType ?? 'normal',
            });
        }
        return { lines, subtotal };
    }
    formatDetail(invoice) {
        return {
            ...invoice,
            subtotal: toNum(invoice.subtotal),
            discount: toNum(invoice.discount),
            tax_amount: toNum(invoice.tax_amount),
            urgency_fee: toNum(invoice.urgency_fee),
            totalAmount: toNum(invoice.totalAmount),
            paidAmount: toNum(invoice.paidAmount),
            dueAmount: invoice.dueAmount !== null ? toNum(invoice.dueAmount) : null,
            items: (invoice.items ?? []).map((i) => ({
                ...i,
                unitPrice: toNum(i.unitPrice),
                subtotal: toNum(i.subtotal),
            })),
        };
    }
    throwNotFound() {
        throw new common_1.NotFoundException({
            success: false,
            error: { code: 'INVOICE_NOT_FOUND', message: 'الفاتورة غير موجودة' },
        });
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map