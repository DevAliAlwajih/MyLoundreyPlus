import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'
import {
  getUserDevices, setDeviceStatus, setPrimaryDevice,
} from '../services/device.service.js'

const router = Router()

// GET /api/v1/users/by-unique-id/:uniqueId — For QR scanner (Laundry app)
router.get('/by-unique-id/:uniqueId', authenticate, async (req, res, next) => {
  try {
    const { uniqueId } = req.params
    const result = await query(
      `SELECT id, full_name, phone_number, email, unique_id, qr_code, role, country
       FROM users WHERE unique_id = $1 AND role = 'customer'`,
      [uniqueId]
    )
    if (!result.rows[0]) throw new AppError('العميل غير موجود', 404)
    return sendSuccess(res, result.rows[0])
  } catch (err) { next(err) }
})

// GET /api/v1/users/:id/devices — Admin or self
router.get('/:id/devices', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new AppError('غير مصرح', 403)
    }
    const devices = await getUserDevices(id)
    return sendSuccess(res, devices)
  } catch (err) { next(err) }
})

// PATCH /api/v1/users/:id/devices/:deviceId — Activate/Deactivate
router.patch('/:id/devices/:deviceId', authenticate, async (req, res, next) => {
  try {
    const { id, deviceId } = req.params
    const { is_active } = req.body
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new AppError('غير مصرح', 403)
    }
    const device = await setDeviceStatus(deviceId, id, is_active)
    return sendSuccess(res, device, is_active ? 'تم تفعيل الجهاز' : 'تم إلغاء تفعيل الجهاز')
  } catch (err) { next(err) }
})

// PATCH /api/v1/users/:id/devices/:deviceId/set-primary
router.patch('/:id/devices/:deviceId/set-primary', authenticate, async (req, res, next) => {
  try {
    const { id, deviceId } = req.params
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new AppError('غير مصرح', 403)
    }
    const device = await setPrimaryDevice(deviceId, id)
    return sendSuccess(res, device, 'تم تعيين الجهاز الافتراضي')
  } catch (err) { next(err) }
})

// GET /api/v1/users (Admin only)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query
    const offset = (page - 1) * limit
    let conditions = []
    let params = []
    let i = 1

    if (role) { conditions.push(`role = $${i++}`); params.push(role) }
    if (search) {
      conditions.push(`(full_name ILIKE $${i} OR phone_number ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM users ${where}`, params),
      query(
        `SELECT id, full_name, phone_number, unique_id, role, is_active, is_verified, country, currency, last_login_at, created_at
         FROM users ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset]
      ),
    ])

    return sendSuccess(res, {
      users: data.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    })
  } catch (err) { next(err) }
})

// PATCH /api/v1/users/:id/status (Admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { is_active } = req.body
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, is_active',
      [is_active, id]
    )
    if (!result.rows[0]) throw new AppError('المستخدم غير موجود', 404)
    return sendSuccess(res, result.rows[0], is_active ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب')
  } catch (err) { next(err) }
})

// DELETE /api/v1/users/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    await query('DELETE FROM users WHERE id = $1 AND role != \'admin\'', [id])
    return sendSuccess(res, null, 'تم حذف المستخدم')
  } catch (err) { next(err) }
})

export default router
