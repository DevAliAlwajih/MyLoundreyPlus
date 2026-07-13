import { Module } from '@nestjs/common';
import { LaundryService } from './laundry.service';
import { LaundryPublicController, LaundryOwnerController } from './laundry.controller';
import { UploadModule } from '../../upload/upload.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [UploadModule, PrismaModule, NotificationModule],
  controllers: [LaundryPublicController, LaundryOwnerController],
  providers: [LaundryService],
  exports: [LaundryService],
})
export class LaundryModule {}
