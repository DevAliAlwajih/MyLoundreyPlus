import { query } from '../config/database.js'
import { logger } from '../config/logger.js'

// ─── OTP Store (in-memory for dev; use Redis in production) ──────────────────
const otpStore = new Map()

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ─── Send OTP via SMS ─────────────────────────────────────────────────────────
export async function sendOTP(phoneNumber) {
  const otp = generateOTP()
  const expiresAt = Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 5) * 60 * 1000

  // Store OTP (keyed by phone)
  otpStore.set(phoneNumber, {
    otp,
    expiresAt,
    attempts: 0,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
  })

  // In production: send via Twilio
  if (process.env.NODE_ENV === 'production' && process.env.TWILIO_ACCOUNT_SID) {
    try {
      const twilio = (await import('twilio')).default
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await client.messages.create({
        body: `رمز التحقق الخاص بك في مغسلتي بلس: ${otp}\nصالح لمدة ${process.env.OTP_EXPIRES_MINUTES || 5} دقائق.\nلا تشاركه مع أحد.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      })
      logger.info(`OTP أُرسل إلى ${phoneNumber}`)
    } catch (err) {
      logger.error('خطأ Twilio:', err.message)
      throw new Error('فشل إرسال رمز التحقق')
    }
  } else {
    // Development: log OTP
    logger.info(`[DEV] OTP لـ ${phoneNumber}: ${otp}`)
  }

  return { message: 'تم إرسال رمز التحقق عبر SMS', expiresInMinutes: parseInt(process.env.OTP_EXPIRES_MINUTES) || 5 }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export function verifyOTP(phoneNumber, inputOtp) {
  const record = otpStore.get(phoneNumber)

  if (!record) {
    return { valid: false, error: 'لم يتم إرسال رمز تحقق لهذا الرقم أو انتهت صلاحيته' }
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phoneNumber)
    return { valid: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' }
  }

  if (record.attempts >= record.maxAttempts) {
    otpStore.delete(phoneNumber)
    return { valid: false, error: 'تم تجاوز عدد المحاولات المسموحة' }
  }

  if (record.otp !== inputOtp) {
    record.attempts++
    const remaining = record.maxAttempts - record.attempts
    return {
      valid: false,
      error: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remaining}`,
      attemptsLeft: remaining,
    }
  }

  // Valid — clean up
  otpStore.delete(phoneNumber)
  return { valid: true }
}
