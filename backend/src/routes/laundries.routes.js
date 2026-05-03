import { Router } from 'express'
import { authenticate, requireLaundry, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

// ─── Helper: get laundry by owner ────────────────────────────────────────────
async function getLaundryByOwner(userId) {
  const result = await query('SELECT * FROM laundries WHERE owner_id = $1', [userId])
  if (!result.rows[0]) throw new AppError('لم يتم العثور على المغسلة', 404)
  return result.rows[0]
}

// ─── GET /api/v1/laundries — Public list (with filters) ──────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, lat, lng, sort = 'rating', status = 'active', search } = req.query
    const offset = (page - 1) * limit
    let conditions = [`l.status = 'active'`]
    let params = []
    let i = 1

    if (search) {
      conditions.push(`(l.name ILIKE $${i} OR l.city ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const orderMap = {
      rating:   'l.rating_avg DESC',
      distance: lat && lng ? `(l.latitude - ${parseFloat(lat)})^2 + (l.longitude - ${parseFloat(lng)})^2 ASC` : 'l.rating_avg DESC',
      newest:   'l.created_at DESC',
    }
    const orderBy = orderMap[sort] || orderMap.rating
    const where = `WHERE ${conditions.join(' AND ')}`

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM laundries l ${where}`, params),
      query(
        `SELECT l.id, l.name, l.city, l.country, l.latitude, l.longitude,
                l.logo_url, l.status, l.rating_avg, l.rating_count, l.working_hours, l.phone_number
         FROM laundries l ${where}
         ORDER BY ${orderBy} LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset]
      ),
    ])

    return sendSuccess(res, {
      laundries: data.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    })
  } catch (err) { next(err) }
})

// ─── GET /api/v1/laundries/me — My laundry profile ───────────────────────────
router.get('/me', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const laundry = await getLaundryByOwner(req.user.id)
    return sendSuccess(res, laundry)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/laundries/:id — Public detail ───────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT l.*, u.full_name AS owner_name
       FROM laundries l JOIN users u ON u.id = l.owner_id
       WHERE l.id = $1`,
      [req.params.id]
    )
    if (!result.rows[0]) throw new AppError('المغسلة غير موجودة', 404)
    return sendSuccess(res, result.rows[0])
  } catch (err) { next(err) }
})

// ─── PUT /api/v1/laundries/me — Update my laundry ───────────────────────────
router.put('/me', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const laundry = await getLaundryByOwner(req.user.id)
    const {
      name, phone_number, address, city, latitude, longitude,
      working_hours, logo_url, is_open,
    } = req.body

    const result = await query(
      `UPDATE laundries SET
         name           = COALESCE($1, name),
         phone_number   = COALESCE($2, phone_number),
         address        = COALESCE($3, address),
         city           = COALESCE($4, city),
         latitude       = COALESCE($5, latitude),
         longitude      = COALESCE($6, longitude),
         working_hours  = COALESCE($7, working_hours),
         logo_url       = COALESCE($8, logo_url),
         is_open        = COALESCE($9, is_open),
         updated_at     = NOW()
       WHERE id = $10 RETURNING *`,
      [name, phone_number, address, city, latitude, longitude,
       working_hours ? JSON.stringify(working_hours) : null, logo_url, is_open, laundry.id]
    )
    return sendSuccess(res, result.rows[0], 'تم تحديث بيانات المغسلة')
  } catch (err) { next(err) }
})

// ─── PATCH /api/v1/laundries/me/status — Toggle open/closed ─────────────────
router.patch('/me/status', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const laundry = await getLaundryByOwner(req.user.id)
    const result = await query(
      'UPDATE laundries SET is_open = NOT is_open, updated_at = NOW() WHERE id = $1 RETURNING id, name, is_open',
      [laundry.id]
    )
    const updated = result.rows[0]
    return sendSuccess(res, updated, updated.is_open ? 'المغسلة مفتوحة الآن' : 'تم إغلاق المغسلة')
  } catch (err) { next(err) }
})

// ─── GET /api/v1/laundries/me/customers — CRM ────────────────────────────────
router.get('/me/customers', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const laundry = await getLaundryByOwner(req.user.id)
    const result = await query(
      `SELECT u.id, u.full_name, u.phone_number, u.unique_id,
              COUNT(i.id) AS invoice_count,
              SUM(i.total_amount) AS total_spent,
              SUM(i.due_amount) AS total_debt,
              MAX(i.created_at) AS last_visit
       FROM invoices i
       JOIN users u ON u.id = i.customer_id
       WHERE i.laundry_id = $1 AND i.status != 'cancelled'
       GROUP BY u.id, u.full_name, u.phone_number, u.unique_id
       ORDER BY total_debt DESC, last_visit DESC`,
      [laundry.id]
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/v1/laundries/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query
    const offset = (page - 1) * limit
    let conditions = []
    let params = []
    let i = 1

    if (status) { conditions.push(`l.status = $${i++}`); params.push(status) }
    if (search) {
      conditions.push(`(l.name ILIKE $${i} OR u.full_name ILIKE $${i} OR l.city ILIKE $${i})`)
      params.push(`%${search}%`); i++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM laundries l JOIN users u ON u.id = l.owner_id ${where}`, params),
      query(
        `SELECT l.*, u.full_name AS owner_name, u.phone_number AS owner_phone,
                (SELECT COUNT(*) FROM invoices WHERE laundry_id = l.id) AS total_invoices,
                (SELECT end_date FROM subscriptions WHERE laundry_id = l.id AND is_active = TRUE ORDER BY end_date DESC LIMIT 1) AS subscription_end
         FROM laundries l JOIN users u ON u.id = l.owner_id
         ${where} ORDER BY l.created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset]
      ),
    ])

    return sendSuccess(res, {
      laundries: data.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) },
    })
  } catch (err) { next(err) }
})

// PATCH /api/v1/laundries/:id/status — Admin activate/suspend/ban
router.patch('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const validStatuses = ['active', 'suspended', 'banned', 'trial', 'pending']
    if (!validStatuses.includes(status)) throw new AppError('حالة غير صالحة', 400)

    const result = await query(
      'UPDATE laundries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )
    if (!result.rows[0]) throw new AppError('المغسلة غير موجودة', 404)
    return sendSuccess(res, result.rows[0], 'تم تحديث حالة المغسلة')
  } catch (err) { next(err) }
})

export default router
