import { Router } from 'express'
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

// ─── GET /api/v1/ads — Public (filtered by target audience) ───────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'guest' // customer, laundry, admin, guest
    
    let targetCondition = "target_audience = 'all'"
    if (userRole === 'customer') {
      targetCondition = "(target_audience = 'all' OR target_audience = 'customers')"
    } else if (userRole === 'laundry') {
      targetCondition = "(target_audience = 'all' OR target_audience = 'laundries')"
    }

    const result = await query(
      `SELECT * FROM ads 
       WHERE is_active = TRUE AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
       AND ${targetCondition}
       ORDER BY created_at DESC`
    )
    
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── POST /api/v1/ads/:id/view — Increment view count ─────────────────────────
router.post('/:id/view', async (req, res, next) => {
  try {
    // In production, you might want to prevent duplicate views from same IP/User
    await query('UPDATE ads SET views_count = views_count + 1 WHERE id = $1', [req.params.id])
    return sendSuccess(res, null)
  } catch (err) { next(err) }
})

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
router.use(authenticate, requireAdmin)

router.get('/admin/all', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM ads ORDER BY created_at DESC')
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { title, description, target_audience, media_urls, start_date, end_date, is_active } = req.body
    if (!title || !start_date || !end_date) throw new AppError('العنوان وتواريخ البداية والنهاية مطلوبة', 400)

    const result = await query(
      `INSERT INTO ads (title, description, target_audience, media_urls, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true)) RETURNING *`,
      [title, description, target_audience || 'all', media_urls ? JSON.stringify(media_urls) : null, start_date, end_date, is_active]
    )
    return sendSuccess(res, result.rows[0], 'تم إضافة الإعلان بنجاح', 201)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, target_audience, media_urls, start_date, end_date, is_active } = req.body
    
    const result = await query(
      `UPDATE ads SET 
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         target_audience = COALESCE($3, target_audience),
         media_urls = COALESCE($4, media_urls),
         start_date = COALESCE($5, start_date),
         end_date = COALESCE($6, end_date),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, description, target_audience, media_urls ? JSON.stringify(media_urls) : null, start_date, end_date, is_active, req.params.id]
    )
    if (!result.rows[0]) throw new AppError('الإعلان غير موجود', 404)
    return sendSuccess(res, result.rows[0], 'تم تحديث الإعلان')
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM ads WHERE id = $1', [req.params.id])
    return sendSuccess(res, null, 'تم حذف الإعلان')
  } catch (err) { next(err) }
})

export default router
