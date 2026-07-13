import { OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
export declare class FirebaseService implements OnModuleInit {
    private readonly logger;
    private app;
    onModuleInit(): void;
    getApp(): admin.app.App | null;
    isReady(): boolean;
}
