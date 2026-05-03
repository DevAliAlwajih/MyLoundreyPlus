import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate)

// ─── GET /api/v1/notifications ────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query
    const offset = (page - 1) * limit
    
    let whereClause = 'user_id = $1'
    let params = [req.user.id]
    
    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = FALSE'
    }

    const [count, data] = await Promise.all([
      query(`SELECT COUNT(*) FROM notifications WHERE ${whereClause}`, params),
      query(
        `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [...params, limit, offset]
      )
    ])

    return sendSuccess(res, {
      notifications: data.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) }
    })
  } catch (err) { next(err) }
})

// ─── PATCH /api/v1/notifications/:id/read ─────────────────────────────────────
router.patch('/:id/read', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    return sendSuccess(res, null, 'تم تحديد الإشعار كمقروء')
  } catch (err) { next(err) }
})

// ─── PATCH /api/v1/notifications/read-all ─────────────────────────────────────
router.patch('/read-all', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    )
    return sendSuccess(res, null, 'تم تحديد جميع الإشعارات كمقروءة')
  } catch (err) { next(err) }
})

// ─── GET /api/v1/notifications/unread-count ───────────────────────────────────
router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    )
    return sendSuccess(res, { count: parseInt(result.rows[0].count) })
  } catch (err) { next(err) }
})

export default router
