import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from './notification.service';
export declare class NotificationCronService {
    private readonly prisma;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    checkUpcomingInvoices(): Promise<void>;
}
