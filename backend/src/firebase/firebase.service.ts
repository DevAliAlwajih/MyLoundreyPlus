import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  onModuleInit() {
    if (!process.env.FIREBASE_PROJECT_ID) {
      this.logger.warn('⚠️ Firebase غير مُهيّأ — الإشعارات معطلة (FIREBASE_PROJECT_ID غير موجود)');
      return;
    }

    try {
      if (admin.apps.length > 0) {
        this.app = admin.apps[0]!;
      } else {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId  : process.env.FIREBASE_PROJECT_ID,
            privateKey : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      this.logger.log('✅ Firebase initialized successfully');
    } catch (err) {
      this.logger.error('Firebase initialization failed', err);
    }
  }

  getApp(): admin.app.App | null {
    return this.app;
  }

  isReady(): boolean {
    return this.app !== null;
  }
}
