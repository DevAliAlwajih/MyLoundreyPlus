import { query, withTransaction } from '../config/database.js'
import { logger } from '../config/logger.js'
import { AppError } from '../middleware/errorHandler.js'

// ─── Register or retrieve device on login ────────────────────────────────────
export async function registerDevice(userId, deviceInfo) {
  const { deviceId, deviceType, deviceOS, deviceModel, fcmToken } = deviceInfo

  // Check if device already exists
  const existing = await query(
    'SELECT * FROM user_devices WHERE id = $1 AND user_id = $2',
    [deviceId, userId]
  )

  if (existing.rows[0]) {
    // Update last login & FCM token
    await query(
      `UPDATE user_devices
       SET last_login_at = NOW(), fcm_token = COALESCE($1, fcm_token), updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [fcmToken, deviceId, userId]
    )
    return { device: existing.rows[0], isNew: false }
  }

  // New device — insert it (initially inactive, requires approval)
  const result = await query(
    `INSERT INTO user_devices
     (id, user_id, device_type, device_os, device_model, fcm_token, is_active, is_primary, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, FALSE, NOW())
     RETURNING *`,
    [deviceId, userId, deviceType, deviceOS, deviceModel, fcmToken]
  )

  return { device: result.rows[0], isNew: true }
}

// ─── Check if device is approved ─────────────────────────────────────────────
export async function isDeviceActive(deviceId, userId) {
  const result = await query(
    'SELECT is_active FROM user_devices WHERE id = $1 AND user_id = $2',
    [deviceId, userId]
  )
  return result.rows[0]?.is_active ?? false
}

// ─── Get user's primary device ────────────────────────────────────────────────
export async function getPrimaryDevice(userId) {
  const result = await query(
    'SELECT * FROM user_devices WHERE user_id = $1 AND is_primary = TRUE AND is_active = TRUE LIMIT 1',
    [userId]
  )
  return result.rows[0] || null
}

// ─── Get all devices for a user ───────────────────────────────────────────────
export async function getUserDevices(userId) {
  const result = await query(
    `SELECT id, device_type, device_os, device_model, is_active, is_primary, last_login_at, created_at
     FROM user_devices WHERE user_id = $1 ORDER BY is_primary DESC, last_login_at DESC`,
    [userId]
  )
  return result.rows
}

// ─── Activate / Deactivate device ────────────────────────────────────────────
export async function setDeviceStatus(deviceId, userId, isActive) {
  const result = await query(
    `UPDATE user_devices SET is_active = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [isActive, deviceId, userId]
  )
  if (!result.rows[0]) throw new AppError('الجهاز غير موجود', 404)
  return result.rows[0]
}

// ─── Set primary device ───────────────────────────────────────────────────────
export async function setPrimaryDevice(deviceId, userId) {
  return withTransaction(async (client) => {
    // Remove primary from all devices
    await client.query(
      'UPDATE user_devices SET is_primary = FALSE WHERE user_id = $1',
      [userId]
    )
    // Set new primary (must be active)
    const result = await client.query(
      `UPDATE user_devices SET is_primary = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_active = TRUE RETURNING *`,
      [deviceId, userId]
    )
    if (!result.rows[0]) throw new AppError('لا يمكن تعيين جهاز غير نشط كجهاز افتراضي', 400)
    return result.rows[0]
  })
}

// ─── Auto-activate first device ──────────────────────────────────────────────
export async function activateFirstDevice(userId, deviceId) {
  return withTransaction(async (client) => {
    await client.query(
      `UPDATE user_devices SET is_active = TRUE, is_primary = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [deviceId, userId]
    )
  })
}

// ─── Get all FCM tokens for a user (for notifications) ────────────────────────
export async function getUserFCMTokens(userId) {
  const result = await query(
    'SELECT fcm_token FROM user_devices WHERE user_id = $1 AND is_active = TRUE AND fcm_token IS NOT NULL',
    [userId]
  )
  return result.rows.map(r => r.fcm_token)
}
