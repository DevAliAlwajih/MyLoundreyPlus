import { create } from 'zustand';
import api from '../lib/axios';

export interface WorkingHour {
  day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  isOpen: boolean;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

export interface LaundryHoliday {
  id: string;
  date: string;
  reason: string | null;
}

export interface LaundryProfile {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  phoneNumber: string;
  logoUrl: string | null;
  country: string;
  city: string;
  address: string;
  addressAr: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  workingHours: WorkingHour[];
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionExpiresAt: string;
  tax_enabled: boolean;
  tax_rate: number | null;
  urgency_enabled: boolean;
  urgency_fee: number | null;
}

export interface DeliveryReminderPrefs {
  enabled: boolean;
  hoursEnabled: boolean;
  hours: number;
  daysEnabled: boolean;
  days: number;
}

export interface NotificationPrefs {
  newBooking: boolean;
  invoiceStatus: boolean;
  paymentReceived: boolean;
  systemAlerts: boolean;
  deliveryReminder?: DeliveryReminderPrefs;
}

export interface SubscriptionInfo {
  planName: string;
  planNameAr: string;
  status: 'trial' | 'active' | 'expired';
  startDate: string;
  expiresAt: string;
  daysRemaining: number;
  features: string[];
}

interface LaundryStore {
  profile: LaundryProfile | null;
  setProfile: (profile: LaundryProfile | null) => void;
  notificationPrefs: NotificationPrefs | null;
  subscription: SubscriptionInfo | null;
  fetchNotificationPrefs: () => Promise<void>;
  updateNotificationPrefs: (prefs: NotificationPrefs) => Promise<void>;
  fetchSubscription: () => Promise<void>;
}

import { 
  saveReminderPrefsLocally, 
  loadReminderPrefsLocally, 
  cancelAllDeliveryReminders 
} from '../services/deliveryReminderService';

export const useLaundryStore = create<LaundryStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  notificationPrefs: {
    newBooking: true,
    invoiceStatus: true,
    paymentReceived: true,
    systemAlerts: true,
    deliveryReminder: {
      enabled: false,
      hoursEnabled: true,
      hours: 5,
      daysEnabled: true,
      days: 1,
    },
  },
  subscription: null,

  fetchNotificationPrefs: async () => {
    // 1. استرجاع الإعدادات المحفوظة محلياً بشكل فوري
    const cachedReminder = await loadReminderPrefsLocally();
    if (cachedReminder) {
      set((state) => ({
        notificationPrefs: {
          ...(state.notificationPrefs || {
            newBooking: true,
            invoiceStatus: true,
            paymentReceived: true,
            systemAlerts: true,
          }),
          deliveryReminder: cachedReminder,
        },
      }));
    }

    // 2. المزامنة مع الخادم
    try {
      const response = await api.get('/profile/notifications');
      const data = response.data?.data;
      if (data) {
        const reminderPrefs: DeliveryReminderPrefs = {
          enabled: data.deliveryReminder?.enabled ?? cachedReminder?.enabled ?? false,
          hoursEnabled: data.deliveryReminder?.hoursEnabled ?? cachedReminder?.hoursEnabled ?? true,
          hours: data.deliveryReminder?.hours ?? cachedReminder?.hours ?? 5,
          daysEnabled: data.deliveryReminder?.daysEnabled ?? cachedReminder?.daysEnabled ?? true,
          days: data.deliveryReminder?.days ?? cachedReminder?.days ?? 1,
        };

        await saveReminderPrefsLocally(reminderPrefs);

        set({
          notificationPrefs: {
            newBooking: data.newBooking ?? true,
            invoiceStatus: data.invoiceStatus ?? true,
            paymentReceived: data.paymentReceived ?? true,
            systemAlerts: data.systemAlerts ?? true,
            deliveryReminder: reminderPrefs,
          },
        });
      }
    } catch (error) {
      console.warn('Could not fetch notification preferences', error);
    }
  },

  updateNotificationPrefs: async (prefs: NotificationPrefs) => {
    try {
      // Optimistic update
      set({ notificationPrefs: prefs });

      if (prefs.deliveryReminder) {
        await saveReminderPrefsLocally(prefs.deliveryReminder);
        if (!prefs.deliveryReminder.enabled) {
          await cancelAllDeliveryReminders();
        }
      }

      const response = await api.patch('/profile/notifications', prefs);
      if (response?.data?.data) {
        set({ notificationPrefs: response.data.data });
      }
    } catch (error) {
      console.warn('Could not update notification preferences', error);
      throw error;
    }
  },

  fetchSubscription: async () => {
    try {
      const response = await api.get('/subscriptions/my');
      set({ subscription: response.data?.data });
    } catch (error) {
      // Fallback mock data for demo since backend might not have this fully implemented yet
      set({
        subscription: {
          planName: 'الخطة الشهرية',
          planNameAr: 'الخطة الشهرية',
          status: 'active',
          startDate: '2024-01-01',
          expiresAt: '2024-12-31',
          daysRemaining: 190,
          features: ['إدارة لا محدودة', 'تقارير يومية', 'دعم فني'],
        }
      });
    }
  },
}));
