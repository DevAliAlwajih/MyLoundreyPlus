import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'
import { AppError } from './errorHandler.js'

// ─── Verify Access Token ──────────────────────────────────────────────────────
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('لم يتم توفير رمز المصادقة', 401)
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AppError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 401)
      throw new AppError('رمز مصادقة غير صالح', 401)
    }

    // Load user from DB
    const result = await query(
      'SELECT id, full_name, phone_number, unique_id, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    )
    const user = result.rows[0]

    if (!user)           throw new AppError('المستخدم غير موجود', 401)
    if (!user.is_active) throw new AppError('الحساب موقوف. يرجى التواصل مع الإدارة', 403)

    // Verify device is still active (if deviceId provided)
    const deviceId = req.headers['x-device-id']
    if (deviceId && decoded.deviceId) {
      const deviceResult = await query(
        'SELECT is_active FROM user_devices WHERE id = $1 AND user_id = $2',
        [deviceId, user.id]
      )
      const device = deviceResult.rows[0]
      if (device && !device.is_active) {
        throw new AppError('تم تعطيل هذا الجهاز. يرجى التواصل مع الإدارة', 403)
      }
    }

    req.user     = user
    req.deviceId = deviceId || decoded.deviceId
    next()
  } catch (err) {
    next(err)
  }
}

// ─── Role Guards ──────────────────────────────────────────────────────────────
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('غير مصرح لك بالوصول لهذا المورد', 403))
    }
    next()
  }
}

export const requireAdmin    = requireRole('admin')
export const requireLaundry  = requireRole('laundry', 'admin')
export const requireCustomer = requireRole('customer', 'admin')

// ─── Optional Auth (for public routes that benefit from user context) ─────────
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return next()

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const result = await query('SELECT id, role, is_active FROM users WHERE id = $1', [decoded.userId])
    if (result.rows[0]?.is_active) req.user = result.rows[0]
  } catch {
    // Ignore errors for optional auth
  }
  next()
}
