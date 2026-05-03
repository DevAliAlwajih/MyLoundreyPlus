import { Router } from 'express'
import { authenticate, requireAdmin, requireLaundry } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

// ─── GET /api/v1/subscriptions/plans — Public list of plans ───────────────────
router.get('/plans', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_sar ASC')
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/subscriptions/my-subscription — Laundry only ─────────────────
router.get('/my-subscription', authenticate, requireLaundry, async (req, res, next) => {
  try {
    const laundry = await query('SELECT id FROM laundries WHERE owner_id = $1', [req.user.id])
    if (!laundry.rows[0]) throw new AppError('المغسلة غير موجودة', 404)

    const result = await query(
      `SELECT s.*, sp.name_ar as plan_name_ar, sp.name_en as plan_name_en, sp.features
       FROM subscriptions s
       JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.laundry_id = $1 AND s.is_active = TRUE
       ORDER BY s.end_date DESC LIMIT 1`,
      [laundry.rows[0].id]
    )
    
    return sendSuccess(res, result.rows[0] || null)
  } catch (err) { next(err) }
})

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
router.use(authenticate, requireAdmin)

// Plans management
router.post('/plans', async (req, res, next) => {
  try {
    const { name_ar, name_en, duration_days, price_sar, features, is_active } = req.body
    const result = await query(
      `INSERT INTO subscription_plans (name_ar, name_en, duration_days, price_sar, features, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true)) RETURNING *`,
      [name_ar, name_en, duration_days, price_sar, features ? JSON.stringify(features) : null, is_active]
    )
    return sendSuccess(res, result.rows[0], 'تم إضافة الخطة بنجاح', 201)
  } catch (err) { next(err) }
})

router.put('/plans/:id', async (req, res, next) => {
  try {
    const { name_ar, name_en, duration_days, price_sar, features, is_active } = req.body
    const result = await query(
      `UPDATE subscription_plans SET
         name_ar = COALESCE($1, name_ar),
         name_en = COALESCE($2, name_en),
         duration_days = COALESCE($3, duration_days),
         price_sar = COALESCE($4, price_sar),
         features = COALESCE($5, features),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name_ar, name_en, duration_days, price_sar, features ? JSON.stringify(features) : null, is_active, req.params.id]
    )
    if (!result.rows[0]) throw new AppError('الخطة غير موجودة', 404)
    return sendSuccess(res, result.rows[0], 'تم تحديث الخطة')
  } catch (err) { next(err) }
})

// Subscriptions management
router.get('/all', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.*, l.name as laundry_name, u.full_name as owner_name, sp.name_ar as plan_name
       FROM subscriptions s
       JOIN laundries l ON l.id = s.laundry_id
       JOIN users u ON u.id = l.owner_id
       JOIN subscription_plans sp ON sp.id = s.plan_id
       ORDER BY s.created_at DESC`
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

router.post('/assign', async (req, res, next) => {
  try {
    const { laundry_id, plan_id, start_date, end_date, amount_paid, payment_method } = req.body
    if (!laundry_id || !plan_id || !start_date || !end_date) throw new AppError('بيانات غير مكتملة', 400)

    // Deactivate current active subscriptions for this laundry
    await query("UPDATE subscriptions SET is_active = FALSE WHERE laundry_id = $1", [laundry_id])

    const result = await query(
      `INSERT INTO subscriptions (laundry_id, plan_id, start_date, end_date, amount_paid, payment_method, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [laundry_id, plan_id, start_date, end_date, amount_paid || 0, payment_method || 'manual']
    )
    return sendSuccess(res, result.rows[0], 'تم تعيين الاشتراك بنجاح', 201)
  } catch (err) { next(err) }
})

export default router
