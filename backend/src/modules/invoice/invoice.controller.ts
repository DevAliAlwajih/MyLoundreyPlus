import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// ────────────────────────────────────────────────────
// 🔐 SECTION 1: صاحب المغسلة — /invoices
// ────────────────────────────────────────────────────
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('laundry')
export class InvoiceLaundryController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /** POST /api/v1/invoices — إنشاء فاتورة جديدة */
  @Post()
  create(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.createInvoice(req.user.laundryId ?? req.user.id, dto);
  }

  /** GET /api/v1/invoices — قائمة الفواتير */
  @Get()
  findAll(@Req() req: any, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(req.user.laundryId ?? req.user.id, query);
  }

  /** GET /api/v1/invoices/:id — تفاصيل فاتورة */
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoiceService.findOne(id, req.user.laundryId ?? req.user.id);
  }

  /** PATCH /api/v1/invoices/:id — تعديل الفاتورة */
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.updateInvoice(id, req.user.laundryId ?? req.user.id, dto);
  }

  /** PATCH /api/v1/invoices/:id/status — State Machine */
  @Patch(':id/status')
  updateStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoiceService.updateStatus(
      id,
      req.user.laundryId ?? req.user.id,
      req.user.id,
      dto,
    );
  }

  /** GET /api/v1/invoices/:id/print — بيانات الطباعة */
  @Get(':id/print')
  getPrintData(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoiceService.getPrintData(id, req.user.laundryId ?? req.user.id);
  }
}

// ────────────────────────────────────────────────────
// 🔐 SECTION 2: العميل — /my-invoices
// ────────────────────────────────────────────────────
@Controller('my-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('customer')
export class InvoiceCustomerController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /** GET /api/v1/my-invoices — سجل الفواتير */
  @Get()
  findMyInvoices(@Req() req: any, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findMyInvoices(req.user.id, query);
  }

  /** GET /api/v1/my-invoices/:id — تفاصيل فاتورة */
  @Get(':id')
  findMyInvoice(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoiceService.findMyInvoice(id, req.user.id);
  }
}
