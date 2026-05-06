import admin from 'firebase-admin'
import { initFirebase } from '../config/firebase.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import { query, withTransaction } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

// Initialize Firebase
initFirebase()
import { generateTokenPair, verifyRefreshToken } from '../services/jwt.service.js'
import { sendOTP, verifyOTP } from '../services/otp.service.js'
import {
  registerDevice,
  isDeviceActive,
  getPrimaryDevice,
  activateFirstDevice,
  getUserDevices,
} from '../services/device.service.js'
import {
  notifyNewDeviceLogin,
} from '../services/notification.service.js'
import { logger } from '../config/logger.js'

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
const DEVICE_BLOCK = parseInt(process.env.DEVICE_BLOCK_AFTER_ATTEMPTS) || 5

// In-memory login attempt tracker (use Redis in production)
const loginAttempts = new Map()

function getAttemptKey(phone, deviceId) { return `${phone}:${deviceId || 'unknown'}` }

function incrementAttempts(key) {
  const current = loginAttempts.get(key) || { count: 0, blockedAt: null }
  current.count++
  if (current.count >= DEVICE_BLOCK) {
    current.blockedAt = Date.now()
  }
  loginAttempts.set(key, current)
  return current
}

function resetAttempts(key) { loginAttempts.delete(key) }

function isBlocked(key) {
  const record = loginAttempts.get(key)
  if (!record?.blockedAt) return false
  // Block is permanent until admin resolves (or 24h auto-unblock)
  const BLOCK_DURATION = 24 * 60 * 60 * 1000
  return Date.now() - record.blockedAt < BLOCK_DURATION
}

// ─── Generate unique short ID ──────────────────────────────────────────────────
function generateUniqueId(prefix = 'USR') {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`.substring(0, 12)
}

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const {
      full_name, phone_number, email, password, role = 'customer',
      country = 'SA', laundry_name,
    } = req.body

    const deviceId    = req.headers['x-device-id']    || uuidv4()
    const deviceType  = req.headers['x-device-type']  || 'unknown'
    const deviceOS    = req.headers['x-device-os']    || 'unknown'
    const deviceModel = req.headers['x-device-model'] || null
    const fcmToken    = req.body.fcm_token || null

    if (!full_name || !password) {
      throw new AppError('الاسم وكلمة المرور مطلوبان', 400)
    }
    if (!phone_number && !email) {
      throw new AppError('البريد الإلكتروني أو رقم الهاتف مطلوب', 400)
    }
    if (password.length < 8) {
      throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400)
    }

    // Check duplicate email
    if (email) {
      const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email])
      if (existingEmail.rows[0]) throw new AppError('البريد الإلكتروني مسجل مسبقاً', 409)
    }

    // Check duplicate phone
    if (phone_number) {
      const existingPhone = await query('SELECT id FROM users WHERE phone_number = $1', [phone_number])
      if (existingPhone.rows[0]) throw new AppError('رقم الهاتف مسجل مسبقاً', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12)

    // Generate unique ID
    let uniqueId, attempts = 0
    do {
      const prefix = role === 'customer' ? 'CUS' : role === 'laundry' ? 'LND' : 'ADM'
      uniqueId = generateUniqueId(prefix)
      const check = await query('SELECT id FROM users WHERE unique_id = $1', [uniqueId])
      if (!check.rows[0]) break
      attempts++
    } while (attempts < 5)

    // Generate QR Code
    const qrData = JSON.stringify({ uniqueId, phone: phone_number || email, type: role })
    const qrCode = await QRCode.toDataURL(qrData)

    const currencyMap = { SA: 'SAR', AE: 'AED', KW: 'KWD', YE: 'YER' }
    const currency = currencyMap[country] || 'SAR'

    // File handling
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : null
    const baseUrl = process.env.BASE_URL || `http://${req.hostname}:${process.env.PORT || 5000}`
    const avatarUrl = avatarPath ? `${baseUrl}${avatarPath}` : null

    const result = await withTransaction(async (client) => {
      // Create user — email column added
      const userResult = await client.query(
        `INSERT INTO users
         (full_name, phone_number, email, unique_id, qr_code, avatar_url, password_hash, role, is_active, is_verified, country, currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE, $9, $10)
         RETURNING id, full_name, phone_number, email, unique_id, qr_code, avatar_url, role, country, currency, created_at`,
        [full_name, phone_number || null, email || null, uniqueId, qrCode, avatarUrl, hashedPassword, role, country, currency]
      )
      const user = userResult.rows[0]

      // If laundry, create laundry record
      if (role === 'laundry' && laundry_name) {
        await client.query(
          `INSERT INTO laundries (owner_id, name, phone_number, country, logo_url, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')`,
          [user.id, laundry_name, phone_number, country, avatarUrl]
        )
      }

      // Register device (auto-activate first device, set as primary)
      await client.query(
        `INSERT INTO user_devices (id, user_id, device_type, device_os, device_model, fcm_token, is_active, is_primary, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE, NOW())`,
        [deviceId, user.id, deviceType, deviceOS, deviceModel, fcmToken]
      )

      return user
    })

    const { accessToken, refreshToken } = generateTokenPair(result.id, result.role, deviceId)

    logger.info(`✅ مستخدم جديد: ${result.email || result.phone_number} (${result.role})`)

    return sendSuccess(res, {
      user: result,
      tokens: { accessToken, refreshToken },
      deviceId,
    }, 'تم إنشاء الحساب بنجاح', 201)

  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { phone_number, email, password } = req.body

    const deviceId    = req.headers['x-device-id']    || uuidv4()
    const deviceType  = req.headers['x-device-type']  || 'unknown'
    const deviceOS    = req.headers['x-device-os']    || 'unknown'
    const deviceModel = req.headers['x-device-model'] || null
    const fcmToken    = req.body.fcm_token || null

    const identifier = email || phone_number
    if (!identifier || !password) {
      throw new AppError('البريد الإلكتروني أو رقم الهاتف وكلمة المرور مطلوبان', 400)
    }

    const attemptKey = getAttemptKey(identifier, deviceId)

    // Check if device is blocked
    if (isBlocked(attemptKey)) {
      throw new AppError(
        `تم حظر هذا الجهاز بسبب محاولات متعددة فاشلة. للدعم اتصل: ${process.env.SUPPORT_PHONE || '920000000'}`,
        403
      )
    }

    // Find user by email OR phone
    const lookupQuery = email
      ? 'SELECT id, full_name, phone_number, email, unique_id, qr_code, role, is_active, is_verified, password_hash, country, currency FROM users WHERE email = $1'
      : 'SELECT id, full_name, phone_number, email, unique_id, qr_code, role, is_active, is_verified, password_hash, country, currency FROM users WHERE phone_number = $1'
    const result = await query(lookupQuery, [identifier])
    const user = result.rows[0]

    // Wrong credentials
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      const attempt = incrementAttempts(attemptKey)
      const remaining = MAX_ATTEMPTS - attempt.count

      if (attempt.count >= DEVICE_BLOCK) {
        throw new AppError(
          `تم حظر هذا الجهاز بعد ${DEVICE_BLOCK} محاولات فاشلة. للدعم: ${process.env.SUPPORT_PHONE || '920000000'}`,
          403
        )
      }

      throw new AppError(
        `البيانات غير صحيحة. المحاولات المتبقية: ${remaining}`,
        401,
        { attemptsLeft: remaining }
      )
    }

    // Check account status
    if (!user.is_active) {
      throw new AppError('الحساب موقوف. يرجى التواصل مع الإدارة', 403)
    }

    // Check device
    const { device, isNew } = await registerDevice(user.id, {
      deviceId, deviceType, deviceOS, deviceModel, fcmToken,
    })

    let requiresApproval = false

    if (isNew) {
      // New device — notify primary device owner
      await notifyNewDeviceLogin(user.id, { deviceType, deviceOS, deviceModel })
      requiresApproval = true
      // Don't grant tokens until device is approved
      return sendSuccess(res, {
        requiresDeviceApproval: true,
        deviceId,
        message: 'تم إرسال إشعار للجهاز الأصلي للموافقة على هذا الجهاز الجديد',
      }, 'يتطلب موافقة الجهاز الافتراضي', 202)
    }

    // Existing device — check if active
    if (!device.is_active) {
      throw new AppError(
        `هذا الجهاز غير مُفعَّل. يرجى الموافقة من جهازك الافتراضي أو التواصل مع الإدارة: ${process.env.SUPPORT_PHONE || '920000000'}`,
        403
      )
    }

    // Reset attempts on success
    resetAttempts(attemptKey)

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id])

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role, deviceId)

    // Remove sensitive data
    delete user.password_hash

    logger.info(`🔐 دخول: ${user.email || user.phone_number} من ${deviceType} (${deviceOS})`)

    return sendSuccess(res, {
      user,
      tokens: { accessToken, refreshToken },
      deviceId,
    }, 'تم تسجيل الدخول بنجاح')

  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/verify-otp ─────────────────────────────────────────────
export async function verifyOtp(req, res, next) {
  try {
    const { phone_number, otp } = req.body
    const deviceId = req.headers['x-device-id']

    if (!phone_number || !otp) throw new AppError('رقم الهاتف ورمز OTP مطلوبان', 400)

    const result = verifyOTP(phone_number, otp)
    if (!result.valid) {
      throw new AppError(result.error, 400, { attemptsLeft: result.attemptsLeft })
    }

    // Mark user as verified
    const userResult = await query(
      `UPDATE users SET is_verified = TRUE WHERE phone_number = $1
       RETURNING id, full_name, phone_number, role, unique_id, country, currency`,
      [phone_number]
    )
    const user = userResult.rows[0]
    if (!user) throw new AppError('المستخدم غير موجود', 404)

    // Activate device if first time
    if (deviceId) await activateFirstDevice(user.id, deviceId)

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role, deviceId)

    logger.info(`✅ تحقق OTP: ${phone_number}`)

    return sendSuccess(res, { user, accessToken, refreshToken, deviceId }, 'تم التحقق بنجاح')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/send-otp ───────────────────────────────────────────────
export async function requestOTP(req, res, next) {
  try {
    const { phone_number } = req.body
    if (!phone_number) throw new AppError('رقم الهاتف مطلوب', 400)

    // Verify user exists
    const userResult = await query('SELECT id FROM users WHERE phone_number = $1', [phone_number])
    if (!userResult.rows[0]) throw new AppError('رقم الهاتف غير مسجل', 404)

    const result = await sendOTP(phone_number)
    return sendSuccess(res, result, 'تم إرسال رمز التحقق')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/reset-password ─────────────────────────────────────────
export async function resetPassword(req, res, next) {
  try {
    const { phone_number, otp, new_password, confirm_password } = req.body

    if (!phone_number || !otp || !new_password) {
      throw new AppError('جميع الحقول مطلوبة', 400)
    }
    if (new_password !== confirm_password) {
      throw new AppError('كلمة المرور الجديدة وتأكيدها غير متطابقتان', 400)
    }
    if (new_password.length < 8) {
      throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400)
    }

    // Verify OTP
    const otpResult = verifyOTP(phone_number, otp)
    if (!otpResult.valid) throw new AppError(otpResult.error, 400)

    // Update password
    const hashedPassword = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12)
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE phone_number = $2 RETURNING id',
      [hashedPassword, phone_number]
    )
    if (!result.rows[0]) throw new AppError('رقم الهاتف غير مسجل', 404)

    // Clear all login blocks for this phone
    for (const [key] of loginAttempts) {
      if (key.startsWith(phone_number)) loginAttempts.delete(key)
    }

    logger.info(`🔑 إعادة تعيين كلمة المرور: ${phone_number}`)
    return sendSuccess(res, null, 'تم تغيير كلمة المرور بنجاح')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/change-password ────────────────────────────────────────
export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password, confirm_password } = req.body
    const userId = req.user.id

    if (!current_password || !new_password) {
      throw new AppError('كلمة المرور الحالية والجديدة مطلوبتان', 400)
    }
    if (new_password !== confirm_password) {
      throw new AppError('كلمة المرور الجديدة وتأكيدها غير متطابقتان', 400)
    }
    if (new_password.length < 8) {
      throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400)
    }

    // Verify current password
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId])
    const user = userResult.rows[0]
    if (!user) throw new AppError('المستخدم غير موجود', 404)

    const isMatch = await bcrypt.compare(current_password, user.password_hash)
    if (!isMatch) throw new AppError('كلمة المرور الحالية غير صحيحة', 400)

    // Hash and update
    const hashedPassword = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12)
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId])

    logger.info(`🔑 تغيير كلمة المرور: ${userId}`)
    return sendSuccess(res, null, 'تم تغيير كلمة المرور بنجاح')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
export async function refreshToken(req, res, next) {
  try {
    const { refresh_token } = req.body
    if (!refresh_token) throw new AppError('Refresh token مطلوب', 400)

    let decoded
    try {
      decoded = verifyRefreshToken(refresh_token)
    } catch {
      throw new AppError('Refresh token غير صالح أو منتهي', 401)
    }

    const result = await query(
      'SELECT id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    )
    const user = result.rows[0]
    if (!user || !user.is_active) throw new AppError('الحساب غير نشط', 401)

    const tokens = generateTokenPair(user.id, user.role, decoded.deviceId)
    return sendSuccess(res, tokens, 'تم تجديد الرمز بنجاح')
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const result = await query(
      `SELECT id, full_name, phone_number, unique_id, qr_code, avatar_url,
              role, is_active, is_verified, country, currency, last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    const devices = await getUserDevices(req.user.id)
    return sendSuccess(res, { ...result.rows[0], devices })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
// ─── POST /api/v1/auth/google ────────────────────────────────────────────────
export async function googleLogin(req, res, next) {
  try {
    const { token } = req.body
    const deviceId = req.headers['x-device-id'] || uuidv4()

    if (!token) throw new AppError('Google token مطلوب', 400)

    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(token)
    } catch (err) {
      logger.error('❌ Google Token Verification Failed:', err.message)
      throw new AppError('فشل التحقق من هوية جوجل. يرجى المحاولة مرة أخرى', 400)
    }

    const { email, name, picture, uid } = decodedToken

    // Check if user exists
    let result = await query('SELECT id, full_name, email, role, is_active FROM users WHERE email = $1', [email])
    let user = result.rows[0]

    if (!user) {
      // Register new user from Google
      const uniqueId = generateUniqueId('GUS')
      // Generate placeholder phone to satisfy unique constraints if needed, though we dropped NOT NULL
      const phonePlaceholder = `G-${uid.substring(0, 10)}`
      
      const insertResult = await query(
        `INSERT INTO users (full_name, email, unique_id, avatar_url, role, is_active, is_verified, phone_number)
         VALUES ($1, $2, $3, $4, 'customer', TRUE, TRUE, $5)
         RETURNING id, full_name, email, role, is_active`,
        [name || email.split('@')[0], email, uniqueId, picture, phonePlaceholder]
      )
      user = insertResult.rows[0]
      logger.info(`🆕 مستخدم جديد عبر جوجل: ${email}`)
    }

    if (!user.is_active) throw new AppError('الحساب موقوف. يرجى التواصل مع الإدارة', 403)

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role, deviceId)

    return sendSuccess(res, {
      user,
      tokens: { accessToken, refreshToken },
      deviceId,
    }, 'تم تسجيل الدخول بواسطة Google بنجاح')
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const deviceId = req.deviceId
    if (deviceId) {
      // Clear FCM token on logout
      await query(
        'UPDATE user_devices SET fcm_token = NULL WHERE id = $1 AND user_id = $2',
        [deviceId, req.user.id]
      )
    }
    return sendSuccess(res, null, 'تم تسجيل الخروج بنجاح')
  } catch (err) {
    next(err)
  }
}
