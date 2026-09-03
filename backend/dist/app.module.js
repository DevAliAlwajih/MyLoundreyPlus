"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./common/redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const laundry_module_1 = require("./modules/laundry/laundry.module");
const invoice_module_1 = require("./modules/invoice/invoice.module");
const profile_module_1 = require("./modules/profile/profile.module");
const firebase_module_1 = require("./firebase/firebase.module");
const notification_module_1 = require("./modules/notification/notification.module");
const booking_module_1 = require("./modules/booking/booking.module");
const rating_module_1 = require("./modules/rating/rating.module");
const chat_module_1 = require("./modules/chat/chat.module");
const subscription_module_1 = require("./modules/subscription/subscription.module");
const ads_module_1 = require("./modules/ads/ads.module");
const promotion_module_1 = require("./modules/promotion/promotion.module");
const support_module_1 = require("./modules/support/support.module");
const admin_module_1 = require("./modules/admin/admin.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            schedule_1.ScheduleModule.forRoot(),
            upload_module_1.UploadModule,
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            firebase_module_1.FirebaseModule,
            auth_module_1.AuthModule,
            laundry_module_1.LaundryModule,
            invoice_module_1.InvoiceModule,
            profile_module_1.ProfileModule,
            notification_module_1.NotificationModule,
            booking_module_1.BookingModule,
            rating_module_1.RatingModule,
            chat_module_1.ChatModule,
            subscription_module_1.SubscriptionModule,
            ads_module_1.AdsModule,
            promotion_module_1.PromotionModule,
            support_module_1.SupportModule,
            admin_module_1.AdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map