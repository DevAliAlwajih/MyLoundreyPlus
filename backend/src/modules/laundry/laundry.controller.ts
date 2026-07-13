import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LaundryService } from './laundry.service';
import { QueryLaundryDto } from './dto/query-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateItemDto, UpdateItemDto, UpdatePriceDto } from './dto/item.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from '../../upload/upload.service';
import { PrismaService } from '../../prisma/prisma.service';

// ──────────────────────────────────────────────
// 🌐 SECTION 1: Public Routes — /laundries
// ──────────────────────────────────────────────
@Controller('laundries')
export class LaundryPublicController {
  constructor(private readonly laundryService: LaundryService) {}

  /**
   * GET /api/v1/laundries
   * قائمة المغاسل مع دعم الفلترة الجغرافية والترتيب والـ Pagination
   */
  @Get()
  findAll(@Query() query: QueryLaundryDto) {
    return this.laundryService.findAll(query);
  }

  /**
   * GET /api/v1/laundries/:id
   * تفاصيل مغسلة واحدة
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.laundryService.findOne(id);
  }

  /**
   * GET /api/v1/laundries/:id/menu
   * قائمة الأصناف مجمّعة حسب القسم مع السعر الصحيح
   */
  @Get(':id/menu')
  getMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.laundryService.getMenu(id);
  }
}

// ──────────────────────────────────────────────
// 🔐 SECTION 2: Protected Routes — /my-laundry
//    يتطلب JWT + role = 'laundry'
// ──────────────────────────────────────────────
@Controller('my-laundry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('laundry')
export class LaundryOwnerController {
  constructor(
    private readonly laundryService: LaundryService,
    private readonly uploadService: UploadService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/v1/my-laundry/logo
   * رفع شعار المغسلة
   */
  @Post('logo')
  @UseInterceptors(FileInterceptor('logo', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        cb(new BadRequestException('نوع الملف غير مدعوم — يُسمح فقط بـ jpg, jpeg, png, webp'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('لم يتم إرسال أي صورة');
    const url = await this.uploadService.saveImage(file, 'laundry-logos');
    
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!laundry) throw new NotFoundException('المغسلة غير موجودة');

    await this.prisma.laundry.update({
      where  : { id: laundry.id },
      data   : { logoUrl: url },
    });
    
    return { success: true, data: { logoUrl: url } };
  }

  /**
   * DELETE /api/v1/my-laundry/logo
   * حذف شعار المغسلة
   */
  @Delete('logo')
  async deleteLogo(@Req() req: any) {
    const laundry = await this.prisma.laundry.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!laundry) throw new NotFoundException('المغسلة غير موجودة');

    await this.prisma.laundry.update({
      where  : { id: laundry.id },
      data   : { logoUrl: null },
    });
    
    return { success: true, message: 'تم حذف الشعار بنجاح', data: { logoUrl: null } };
  }

  /**
   * GET /api/v1/my-laundry
   * بيانات مغسلة صاحب الحساب
   */
  @Get()
  getMyLaundry(@Req() req: any) {
    return this.laundryService.getMyLaundry(req.user.id);
  }

  /**
   * GET /api/v1/my-laundry/reports
   * تقارير مخصصة للمغسلة
   */
  @Get('reports')
  getReports(
    @Req() req: any,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.laundryService.getReports(req.user.id, period, from, to);
  }

  /**
   * PATCH /api/v1/my-laundry
   * تحديث بيانات المغسلة
   */
  @Patch()
  updateMyLaundry(@Req() req: any, @Body() dto: UpdateLaundryDto) {
    return this.laundryService.updateMyLaundry(req.user.id, dto);
  }

  /**
   * GET /api/v1/my-laundry/menu
   * قائمة الأصناف الكاملة (تشمل غير النشط)
   */
  @Get('menu')
  getMyMenu(@Req() req: any) {
    return this.laundryService.getMyMenu(req.user.id);
  }

  // ─── Categories ───

  /**
   * POST /api/v1/my-laundry/categories
   */
  @Post('categories')
  createCategory(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.laundryService.createCategory(req.user.id, dto);
  }

  /**
   * PATCH /api/v1/my-laundry/categories/:id
   */
  @Patch('categories/:id')
  updateCategory(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.laundryService.updateCategory(req.user.id, id, dto);
  }

  /**
   * DELETE /api/v1/my-laundry/categories/:id
   */
  @Delete('categories/:id')
  deleteCategory(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.laundryService.deleteCategory(req.user.id, id);
  }

  // ─── Items ───

  /**
   * POST /api/v1/my-laundry/items
   * Body: { categoryId, nameAr, nameEn?, basePrice, sortOrder? }
   */
  @Post('items')
  createItem(@Req() req: any, @Body() dto: CreateItemDto) {
    return this.laundryService.createItem(req.user.id, dto.categoryId, dto);
  }


  /**
   * PATCH /api/v1/my-laundry/items/:id
   */
  @Patch('items/:id')
  updateItem(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.laundryService.updateItem(req.user.id, id, dto);
  }

  /**
   * DELETE /api/v1/my-laundry/items/:id
   */
  @Delete('items/:id')
  deleteItem(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.laundryService.deleteItem(req.user.id, id);
  }

  // ─── Prices ───

  /**
   * PATCH /api/v1/my-laundry/prices/:itemId
   * upsert سعر صنف للمغسلة
   */
  @Patch('prices/:itemId')
  upsertPrice(
    @Req() req: any,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdatePriceDto,
  ) {
    return this.laundryService.upsertPrice(req.user.id, itemId, dto);
  }

  // ─── Holidays ───

  /**
   * GET /api/v1/my-laundry/holidays
   */
  @Get('holidays')
  getHolidays(@Req() req: any, @Query('upcoming') upcoming?: string) {
    const isUpcoming = upcoming === 'true';
    return this.laundryService.getHolidays(req.user.id, isUpcoming);
  }

  /**
   * POST /api/v1/my-laundry/holidays
   */
  @Post('holidays')
  addHoliday(@Req() req: any, @Body() dto: CreateHolidayDto) {
    return this.laundryService.addHoliday(req.user.id, dto);
  }

  /**
   * DELETE /api/v1/my-laundry/holidays/:id
   */
  @Delete('holidays/:id')
  deleteHoliday(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.laundryService.deleteHoliday(req.user.id, id);
  }

  // ─── CRM (Customers) ───

  /**
   * GET /api/v1/my-laundry/customers
   * قائمة العملاء (مجمعة من الفواتير)
   */
  @Get('customers')
  getCustomers(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('has_debt') has_debt?: string,
  ) {
    const hasDebtBool = has_debt === 'true';
    return this.laundryService.getCustomers(req.user.id, search, from_date, to_date, hasDebtBool);
  }

  /**
   * GET /api/v1/my-laundry/customers/:customerId
   * تفاصيل العميل مع فواتيره
   */
  @Get('customers/:customerId')
  getCustomerDetail(
    @Req() req: any,
    @Param('customerId') customerId: string,
  ) {
    return this.laundryService.getCustomerDetail(req.user.id, customerId);
  }

  /**
   * POST /api/v1/my-laundry/customers/:customerId/remind
   * إرسال تذكير أو تجهيز رابط واتساب
   */
  @Post('customers/:customerId/remind')
  remindCustomer(
    @Req() req: any,
    @Param('customerId') customerId: string,
    @Body('channel') channel: 'whatsapp' | 'app' | 'both',
  ) {
    return this.laundryService.remindCustomer(req.user.id, customerId, channel);
  }
}
