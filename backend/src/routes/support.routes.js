import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate)

// ─── POST /api/v1/support/tickets ─────────────────────────────────────────────
router.post('/tickets', async (req, res, next) => {
  try {
    const { subject, message, priority = 'low' } = req.body
    if (!subject || !message) throw new AppError('الموضوع والرسالة مطلوبان', 400)

    const result = await query(
      `INSERT INTO support_tickets (user_id, subject, priority)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, subject, priority]
    )
    
    const ticket = result.rows[0]
    
    // Insert initial message
    await query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message)
       VALUES ($1, $2, $3)`,
      [ticket.id, req.user.id, message]
    )

    return sendSuccess(res, ticket, 'تم إنشاء تذكرة الدعم بنجاح', 201)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/support/tickets/me ───────────────────────────────────────────
router.get('/tickets/me', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user.id]
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── GET /api/v1/support/tickets/:id/messages ─────────────────────────────────
router.get('/tickets/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    // Verify ownership or admin
    if (req.user.role !== 'admin') {
      const ticket = await query('SELECT user_id FROM support_tickets WHERE id = $1', [id])
      if (ticket.rows[0]?.user_id !== req.user.id) throw new AppError('غير مصرح', 403)
    }

    const result = await query(
      `SELECT tm.*, u.full_name as sender_name, u.role as sender_role
       FROM ticket_messages tm
       JOIN users u ON u.id = tm.sender_id
       WHERE tm.ticket_id = $1 ORDER BY tm.created_at ASC`,
      [id]
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

// ─── POST /api/v1/support/tickets/:id/messages ────────────────────────────────
router.post('/tickets/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { message } = req.body
    if (!message) throw new AppError('الرسالة مطلوبة', 400)

    // Verify ownership or admin
    if (req.user.role !== 'admin') {
      const ticket = await query('SELECT user_id, status FROM support_tickets WHERE id = $1', [id])
      if (!ticket.rows[0]) throw new AppError('التذكرة غير موجودة', 404)
      if (ticket.rows[0].user_id !== req.user.id) throw new AppError('غير مصرح', 403)
      if (ticket.rows[0].status === 'closed') throw new AppError('التذكرة مغلقة ولا يمكن الرد عليها', 400)
    }

    const result = await query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, req.user.id, message]
    )

    // Update ticket updated_at
    await query('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [id])

    return sendSuccess(res, result.rows[0], 'تم إرسال الرد بنجاح')
  } catch (err) { next(err) }
})

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

router.get('/tickets', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query
    let where = ''
    let params = []
    if (status) { where = 'WHERE st.status = $1'; params.push(status) }

    const result = await query(
      `SELECT st.*, u.full_name as user_name, u.phone_number, u.role as user_role
       FROM support_tickets st JOIN users u ON u.id = st.user_id
       ${where} ORDER BY st.updated_at DESC`,
      params
    )
    return sendSuccess(res, result.rows)
  } catch (err) { next(err) }
})

router.patch('/tickets/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      throw new AppError('حالة غير صالحة', 400)
    }

    const result = await query(
      'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    if (!result.rows[0]) throw new AppError('التذكرة غير موجودة', 404)
    return sendSuccess(res, result.rows[0], 'تم تحديث حالة التذكرة')
  } catch (err) { next(err) }
})

export default router
