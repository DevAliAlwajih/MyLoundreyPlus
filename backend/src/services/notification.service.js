import { query } from '../config/database.js'
import { getMessaging } from '../config/firebase.js'
import { getUserFCMTokens } from './device.service.js'
import { logger } from '../config/logger.js'

// ─── Notification Types ───────────────────────────────────────────────────────
export const NOTIF_TYPES = {
  INVOICE_CREATED:  'invoice_created',
  INVOICE_STATUS:   'invoice_status',
  INVOICE_READY:    'invoice_ready',
  INVOICE_COMPLETE: 'invoice_complete',
  DEBT_REMINDER:    'debt_reminder',
  SUB_EXPIRING:     'subscription_expiring',
  NEW_TICKET:       'new_ticket',
  TICKET_REPLY:     'ticket_reply',
  NEW_DEVICE:       'new_device_login',
  PROMO:            'promotion',
}

// ─── Invoice Status Labels ────────────────────────────────────────────────────
const STATUS_LABELS = {
  received:  'تم استلام ملابسك',
  washing:   'ملابسك قيد الغسيل',
  ironing:   'ملابسك قيد الكوي',
  ready:     '✅ ملابسك جاهزة للاستلام',
  completed: 'تم تسليم الملابس بنجاح',
}

// ─── Send Push Notification ───────────────────────────────────────────────────
export async function sendPushNotification(tokens, payload) {
  const messaging = getMessaging()
  if (!messaging || !tokens?.length) {
    logger.debug('Firebase غير مُهيأ أو لا توجد tokens — تخطي الإشعار')
    return
  }

  const filteredTokens = tokens.filter(Boolean)
  if (!filteredTokens.length) return

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type || 'general',
        referenceId: payload.referenceId || '',
        ...payload.extraData,
      },
      tokens: filteredTokens,
    }

    const response = await messaging.sendEachForMulticast(message)
    logger.info(`إشعارات: ${response.successCount} نجح، ${response.failureCount} فشل`)

    // Remove invalid tokens
    const invalidTokens = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success && (resp.error?.code === 'messaging/registration-token-not-registered' ||
                             resp.error?.code === 'messaging/invalid-registration-token')) {
        invalidTokens.push(filteredTokens[idx])
      }
    })
    if (invalidTokens.length > 0) {
      await query(
        'UPDATE user_devices SET fcm_token = NULL WHERE fcm_token = ANY($1::text[])',
        [invalidTokens]
      )
    }
  } catch (err) {
    logger.error('خطأ في إرسال الإشعارات:', err.message)
  }
}

// ─── Save Notification to DB ──────────────────────────────────────────────────
async function saveNotification(userId, title, body, type, referenceId = null) {
  await query(
    `INSERT INTO notifications (user_id, title, body, type, reference_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, body, type, referenceId]
  )
}

// ─── Notify User (DB + Push) ──────────────────────────────────────────────────
export async function notifyUser(userId, payload) {
  await saveNotification(userId, payload.title, payload.body, payload.type, payload.referenceId)
  const tokens = await getUserFCMTokens(userId)
  await sendPushNotification(tokens, payload)
}

// ─── Invoice Status Change Notification ───────────────────────────────────────
export async function notifyInvoiceStatusChange(invoice, newStatus, laundryName) {
  const title = STATUS_LABELS[newStatus] || 'تحديث على طلبك'
  const body = `${laundryName} — الفاتورة #${invoice.invoice_number}`

  await notifyUser(invoice.customer_id, {
    title,
    body,
    type: NOTIF_TYPES.INVOICE_STATUS,
    referenceId: invoice.id,
    extraData: { status: newStatus, invoiceNumber: invoice.invoice_number },
  })
}

// ─── New Invoice Notification ──────────────────────────────────────────────────
export async function notifyNewInvoice(invoice, laundryName) {
  await notifyUser(invoice.customer_id, {
    title: `فاتورة جديدة من ${laundryName}`,
    body: `رقم الفاتورة: ${invoice.invoice_number} — الإجمالي: ${invoice.total_amount} ريال`,
    type: NOTIF_TYPES.INVOICE_CREATED,
    referenceId: invoice.id,
  })
}

// ─── New Device Login Notification ───────────────────────────────────────────
export async function notifyNewDeviceLogin(userId, deviceInfo) {
  const primaryTokens = await getUserFCMTokens(userId)
  const payload = {
    title: '🔐 محاولة دخول من جهاز جديد',
    body: `${deviceInfo.deviceType} — ${deviceInfo.deviceOS} (${deviceInfo.deviceModel || 'غير معروف'}). إذا لم تكن أنت، يرجى التواصل مع الإدارة.`,
    type: NOTIF_TYPES.NEW_DEVICE,
    referenceId: userId,
  }
  await saveNotification(userId, payload.title, payload.body, payload.type)
  await sendPushNotification(primaryTokens, payload)
}

// ─── Subscription Expiry Notification ─────────────────────────────────────────
export async function notifySubscriptionExpiring(laundryOwnerId, laundryName, daysLeft) {
  await notifyUser(laundryOwnerId, {
    title: '⚠️ اشتراكك ينتهي قريباً',
    body: `${laundryName} — باقي ${daysLeft} يوم. جدد الآن لتجنب الانقطاع.`,
    type: NOTIF_TYPES.SUB_EXPIRING,
  })
}
