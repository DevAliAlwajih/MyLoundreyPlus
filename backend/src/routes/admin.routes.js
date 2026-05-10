import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate, requireAdmin)

// ─── GET /api/v1/admin/dashboard-stats ────────────────────────────────────────
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    // Collect various KPIs for the dashboard
    const [
      revenueResult,
      countsResult,
      recentInvoicesResult,
      laundryStatusResult
    ] = await Promise.all([
      query(`
        SELECT SUM(amount_paid) as total_revenue
        FROM subscriptions
        WHERE is_active = TRUE
      `),
      query(`
        SELECT 
          (SELECT COUNT(*) FROM laundries WHERE status = 'active') as active_laundries,
          (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
          (SELECT COUNT(*) FROM invoices WHERE DATE(created_at) = CURRENT_DATE) as today_invoices
      `),
      query(`
        SELECT i.id, i.invoice_number, i.total_amount, i.status, l.name as laundry_name
        FROM invoices i
        JOIN laundries l ON l.id = i.laundry_id
        ORDER BY i.created_at DESC LIMIT 5
      `),
      query(`
        SELECT status, COUNT(*) as count
        FROM laundries
        GROUP BY status
      `)
    ])

    return sendSuccess(res, {
      revenue: revenueResult.rows[0]?.total_revenue || 0,
      counts: countsResult.rows[0],
      recentInvoices: recentInvoicesResult.rows,
      laundryStatusDistribution: laundryStatusResult.rows
    })
  } catch (err) { next(err) }
})

// ─── Laundries Management ────────────────────────────────────────────────────
router.get('/laundries', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT l.*, u.full_name as owner_name, u.phone_number as owner_phone
      FROM laundries l
      LEFT JOIN users u ON u.id = l.owner_id
      ORDER BY l.created_at DESC
    `)
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

router.patch('/laundries/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const result = await query(
      'UPDATE laundries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    return sendSuccess(res, result.rows[0], 'تم تحديث حالة المغسلة بنجاح')
  } catch (err) { next(err) }
})

router.delete('/laundries/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM laundries WHERE id = $1', [req.params.id])
    return sendSuccess(res, null, 'تم حذف المغسلة بنجاح')
  } catch (err) { next(err) }
})

// ─── Customers Management ────────────────────────────────────────────────────
router.get('/customers', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, full_name, email, phone_number, is_active, created_at, country, currency
      FROM users WHERE role = 'customer'
      ORDER BY created_at DESC
    `)
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

router.patch('/customers/:id/status', async (req, res, next) => {
  try {
    const { is_active } = req.body
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_active, req.params.id]
    )
    return sendSuccess(res, result.rows[0], 'تم تحديث حالة المستخدم بنجاح')
  } catch (err) { next(err) }
})

router.delete('/customers/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id])
    return sendSuccess(res, null, 'تم حذف المستخدم بنجاح')
  } catch (err) { next(err) }
})

export default router
