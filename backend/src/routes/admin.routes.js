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

export default router
