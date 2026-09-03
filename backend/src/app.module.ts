import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { LaundryModule } from './modules/laundry/laundry.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ProfileModule } from './modules/profile/profile.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BookingModule } from './modules/booking/booking.module';
import { RatingModule } from './modules/rating/rating.module';
import { ChatModule } from './modules/chat/chat.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AdsModule } from './modules/ads/ads.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { SupportModule } from './modules/support/support.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath : join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    UploadModule,
    PrismaModule,
    RedisModule,
    FirebaseModule,
    AuthModule,
    LaundryModule,
    InvoiceModule,
    ProfileModule,
    NotificationModule,
    BookingModule,
    RatingModule,
    ChatModule,
    SubscriptionModule,
    AdsModule,
    PromotionModule,
    SupportModule,
    AdminModule,
  ],
})
export class AppModule {}


