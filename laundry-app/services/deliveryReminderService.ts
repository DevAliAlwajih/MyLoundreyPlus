import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/axios';
import { DeliveryReminderPrefs } from '../stores/laundryStore';
import { Invoice } from '../hooks/useInvoices';

const STORAGE_KEY = 'delivery_reminder_prefs_v1';

// Helper to safely load expo-notifications without crashing in Expo Go on Android (SDK 53+)
export const getExpoNotifications = async () => {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo && Platform.OS === 'android') {
    return null;
  }
  try {
    return await import('expo-notifications');
  } catch (err) {
    console.warn('[deliveryReminderService] Failed to load expo-notifications:', err);
    return null;
  }
};

/**
 * إعداد قنوات التنبيه في أندرويد
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;
  try {
    const Notifications = await getExpoNotifications();
    if (!Notifications) return;

    await Notifications.setNotificationChannelAsync('delivery_reminders', {
      name: 'تنبيهات مواعيد التسليم',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'الإشعارات العامة',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
      sound: 'default',
    });
  } catch (err) {
    console.warn('[deliveryReminderService] Channel setup error:', err);
  }
};

/**
 * طلب صلاحيات الإشعارات وتسجيل الرمز في الخادم
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    await setupNotificationChannels();
    const Notifications = await getExpoNotifications();
    if (!Notifications) {
      // In Expo Go android, allow user flow to continue
      return true;
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const response = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      status = response.status;
    }

    if (status === 'granted') {
      // مزامنة رمز الجهاز مع الخادم
      try {
        const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        if (!isExpoGo) {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          if (tokenData?.data) {
            await api.patch('/profile/device-token', { fcmToken: tokenData.data }).catch(() => {});
          }
        }
      } catch (tokenErr) {
        console.warn('[deliveryReminderService] Push token error:', tokenErr);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.warn('[deliveryReminderService] Permission request failed:', error);
    return false;
  }
};

/**
 * إلغاء جميع التنبيهات المجدولة محلياً لمواعيد التسليم
 */
export const cancelAllDeliveryReminders = async () => {
  try {
    const Notifications = await getExpoNotifications();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.identifier.startsWith('delivery_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (err) {
    console.warn('[deliveryReminderService] Error cancelling reminders:', err);
  }
};

/**
 * جدولة تنبيهات لمجموعة فواتير بناءً على الإعدادات
 */
export const syncInvoicesReminders = async (
  invoices: Invoice[],
  prefs: DeliveryReminderPrefs | undefined
) => {
  // إذا كان التنبيه معطلاً كلياً: نلغي كل التنبيهات ونخرج فوراً
  if (!prefs || !prefs.enabled) {
    await cancelAllDeliveryReminders();
    return;
  }

  try {
    const Notifications = await getExpoNotifications();
    if (!Notifications) return;

    // إلغاء المجدول أولاً لتجنب التكرار
    await cancelAllDeliveryReminders();

    const now = Date.now();
    const activeInvoices = invoices.filter(
      (inv) =>
        inv.status !== 'completed' &&
        inv.status !== 'cancelled' &&
        inv.status !== 'draft' &&
        inv.expectedDeliveryAt
    );

    for (const inv of activeInvoices) {
      const deliveryTime = new Date(inv.expectedDeliveryAt!).getTime();
      if (isNaN(deliveryTime)) continue;

      // 1. تنبيه الساعات
      if (prefs.hoursEnabled && prefs.hours > 0) {
        const triggerTimeHours = deliveryTime - prefs.hours * 60 * 60 * 1000;
        if (triggerTimeHours > now) {
          const secondsFromNow = Math.floor((triggerTimeHours - now) / 1000);
          if (secondsFromNow > 5) {
            await Notifications.scheduleNotificationAsync({
              identifier: `delivery_reminder_hours_${inv.id}`,
              content: {
                title: 'اقتراب موعد التسليم ⏰',
                body: `تذكير: الفاتورة #${inv.invoiceNumber} موعد تسليمها بعد ${prefs.hours} ${
                  prefs.hours > 1 && prefs.hours < 11 ? 'ساعات' : 'ساعة'
                }.`,
                data: { invoiceId: inv.id, type: 'delivery_reminder' },
                sound: 'default',
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsFromNow,
              },
            });
          }
        }
      }

      // 2. تنبيه الأيام
      if (prefs.daysEnabled && prefs.days > 0) {
        const triggerTimeDays = deliveryTime - prefs.days * 24 * 60 * 60 * 1000;
        if (triggerTimeDays > now) {
          const secondsFromNow = Math.floor((triggerTimeDays - now) / 1000);
          if (secondsFromNow > 5) {
            await Notifications.scheduleNotificationAsync({
              identifier: `delivery_reminder_days_${inv.id}`,
              content: {
                title: 'اقتراب موعد التسليم ⏰',
                body: `تذكير: الفاتورة #${inv.invoiceNumber} موعد تسليمها بعد ${prefs.days} ${
                  prefs.days > 1 && prefs.days < 11 ? 'أيام' : 'يوم'
                }.`,
                data: { invoiceId: inv.id, type: 'delivery_reminder' },
                sound: 'default',
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: secondsFromNow,
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[deliveryReminderService] Error syncing invoice reminders:', err);
  }
};

/**
 * حفظ الإعدادات محلياً في SecureStore
 */
export const saveReminderPrefsLocally = async (prefs: DeliveryReminderPrefs) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[deliveryReminderService] Error saving prefs locally:', e);
  }
};

/**
 * قراءة الإعدادات المحفوظة محلياً
 */
export const loadReminderPrefsLocally = async (): Promise<DeliveryReminderPrefs | null> => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[deliveryReminderService] Error loading prefs locally:', e);
    return null;
  }
};

/**
 * إرسال إشعار تجريبي فوري
 */
export const sendTestDeliveryNotification = async (hours: number, days: number, hoursOnly = false) => {
  await setupNotificationChannels();
  const Notifications = await getExpoNotifications();
  if (!Notifications) {
    throw new Error('NOTIFICATIONS_UNAVAILABLE');
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('PERMISSION_NOT_GRANTED');
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'اقتراب موعد التسليم ⏰',
      body: hoursOnly
        ? `تذكير تجريبي: الفاتورة #1042 موعد تسليمها بعد ${hours} ساعات.`
        : `تذكير تجريبي: الفاتورة #1042 موعد تسليمها بعد ${days} يوم.`,
      sound: 'default',
    },
    trigger: null,
  });
};
