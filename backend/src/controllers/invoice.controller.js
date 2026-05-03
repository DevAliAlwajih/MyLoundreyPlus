import { query, withTransaction } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'
import {
  notifyInvoiceStatusChange,
  notifyNewInvoice,
} from '../services/notification.service.js'
import { logger } from '../config/logger.js'

// ─── Invoice State Machine ────────────────────────────────────────────────────
// States can only move FORWARD
const STATE_TRANSITIONS = {
  draft:     ['received'],
  received:  ['washing'],
  washing:   ['ironing'],
  ironing:   ['ready'],
  ready:     ['completed'],
  completed: [],           // Terminal state
  cancelled: [],           // Terminal state
}

function canTransition(from, to) {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false
}

// ─── POST /api/v1/invoices ────────────────────────────────────────────────────
export async function createInvoice(req, res, next) {
  try {
    const {
      customer_identifier, // uniqueId or phone
      items, // [{ item_id, item_name, unit_price, quantity }]
      payment_type = 'cash',
      notes,
      discount = 0,
    } = req.body

    const laundryId = req.laundry?.id

    // Resolve customer
    const customerResult = await query(
      `SELECT id, full_name, phone_number FROM users
       WHERE (unique_id = $1 OR phone_number = $1) AND role = 'customer' AND is_active = TRUE`,
      [customer_identifier]
    )
    const customer = customerResult.rows[0]
    if (!customer) throw new AppError('العميل غير موجود أو رقمه غير صحيح', 404)

    if (!items?.length) throw new AppError('يجب إضافة صنف واحد على الأقل', 400)

    // Validate items and calculate total
    let subtotal = 0
    const validatedItems = []

    for (const item of items) {
      if (!item.item_name || !item.unit_price || !item.quantity) {
        throw new AppError('بيانات الأصناف غير مكتملة', 400)
      }
      if (item.quantity < 1) throw new AppError('الكمية يجب أن تكون 1 على الأقل', 400)
      if (item.unit_price < 0) throw new AppError('السعر لا يمكن أن يكون سالباً', 400)

      const lineTotal = item.unit_price * item.quantity
      subtotal += lineTotal
      validatedItems.push({ ...item, subtotal: lineTotal })
    }

    const totalAmount = Math.max(0, subtotal - (discount || 0))
    const paidAmount = payment_type === 'deferred' ? 0 : totalAmount

    const invoice = await withTransaction(async (client) => {
      // Create invoice
      const invResult = await client.query(
        `INSERT INTO invoices
         (laundry_id, customer_id, status, payment_type, subtotal, discount, total_amount, paid_amount, notes)
         VALUES ($1, $2, 'received', $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [laundryId, customer.id, payment_type, subtotal, discount, totalAmount, paidAmount, notes]
      )
      const inv = invResult.rows[0]

      // Insert items
      for (const item of validatedItems) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, item_id, item_name, unit_price, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [inv.id, item.item_id || null, item.item_name, item.unit_price, item.quantity]
        )
      }

      return inv
    })

    // Get laundry name for notification
    const laundryResult = await query('SELECT name FROM laundries WHERE id = $1', [laundryId])
    const laundryName = laundryResult.rows[0]?.name || 'المغسلة'

    // Notify customer
    await notifyNewInvoice(invoice, laundryName)

    logger.info(`🧾 فاتورة جديدة: ${invoice.invoice_number} — ${customer.phone_number}`)

    return sendSuccess(res, invoice, 'تم إنشاء الفاتورة بنجاح', 201)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/v1/invoices ─────────────────────────────────────────────────────
export async function getInvoices(req, res, next) {
  try {
    const { page = 1, limit = 20, status, payment_type, customer_id } = req.query
    const offset = (page - 1) * limit

    let conditions = []
    let params = []
    let paramIdx = 1

    // Role-based filtering
    if (req.user.role === 'laundry') {
      const laundryResult = await query('SELECT id FROM laundries WHERE owner_id = $1', [req.user.id])
      if (!laundryResult.rows[0]) throw new AppError('لم يتم العثور على المغسلة', 404)
      conditions.push(`i.laundry_id = $${paramIdx++}`)
      params.push(laundryResult.rows[0].id)
    } else if (req.user.role === 'customer') {
      conditions.push(`i.customer_id = $${paramIdx++}`)
      params.push(req.user.id)
    }

    if (status) { conditions.push(`i.status = $${paramIdx++}`); params.push(status) }
    if (payment_type) { conditions.push(`i.payment_type = $${paramIdx++}`); params.push(payment_type) }
    if (customer_id && req.user.role !== 'customer') { conditions.push(`i.customer_id = $${paramIdx++}`); params.push(customer_id) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM invoices i ${where}`, params),
      query(
        `SELECT i.*, u.full_name AS customer_name, u.phone_number AS customer_phone,
                u.unique_id AS customer_unique_id, l.name AS laundry_name
         FROM invoices i
         JOIN users u ON u.id = i.customer_id
         JOIN laundries l ON l.id = i.laundry_id
         ${where}
         ORDER BY i.created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...params, limit, offset]
      ),
    ])

    return sendSuccess(res, {
      invoices: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/v1/invoices/:id ──────────────────────────────────────────────────
export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params

    const [invoiceResult, itemsResult, logResult] = await Promise.all([
      query(
        `SELECT i.*, u.full_name AS customer_name, u.phone_number AS customer_phone,
                u.unique_id AS customer_unique_id, u.qr_code AS customer_qr,
                l.name AS laundry_name, l.phone_number AS laundry_phone
         FROM invoices i
         JOIN users u ON u.id = i.customer_id
         JOIN laundries l ON l.id = i.laundry_id
         WHERE i.id = $1`,
        [id]
      ),
      query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at', [id]),
      query(
        `SELECT isl.*, u.full_name AS changed_by_name
         FROM invoice_status_log isl
         JOIN users u ON u.id = isl.changed_by
         WHERE isl.invoice_id = $1 ORDER BY isl.changed_at DESC`,
        [id]
      ),
    ])

    const invoice = invoiceResult.rows[0]
    if (!invoice) throw new AppError('الفاتورة غير موجودة', 404)

    // Authorization check
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      throw new AppError('غير مصرح لك بعرض هذه الفاتورة', 403)
    }

    return sendSuccess(res, {
      ...invoice,
      items: itemsResult.rows,
      statusLog: logResult.rows,
    })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /api/v1/invoices/:id/status ────────────────────────────────────────
export async function updateInvoiceStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status, note } = req.body

    if (!status) throw new AppError('الحالة الجديدة مطلوبة', 400)

    // Get current invoice
    const invResult = await query(
      `SELECT i.*, l.name AS laundry_name, l.owner_id
       FROM invoices i JOIN laundries l ON l.id = i.laundry_id
       WHERE i.id = $1`,
      [id]
    )
    const invoice = invResult.rows[0]
    if (!invoice) throw new AppError('الفاتورة غير موجودة', 404)

    // Ownership check (laundry must own this invoice)
    if (req.user.role === 'laundry' && invoice.owner_id !== req.user.id) {
      throw new AppError('غير مصرح لك بتعديل هذه الفاتورة', 403)
    }

    // State machine validation
    if (!canTransition(invoice.status, status)) {
      throw new AppError(
        `لا يمكن الانتقال من "${invoice.status}" إلى "${status}". الانتقالات المسموحة: ${STATE_TRANSITIONS[invoice.status]?.join(', ') || 'لا يوجد'}`,
        400
      )
    }

    // Update status
    const updatedResult = await query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )
    const updated = updatedResult.rows[0]

    // Log the change
    await query(
      `INSERT INTO invoice_status_log (invoice_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user.id, invoice.status, status, note]
    )

    // Notify customer
    await notifyInvoiceStatusChange(updated, status, invoice.laundry_name)

    logger.info(`📋 تغيير حالة فاتورة ${invoice.invoice_number}: ${invoice.status} → ${status}`)

    return sendSuccess(res, updated, 'تم تحديث حالة الفاتورة')
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/invoices/:id/payment ────────────────────────────────────────
export async function recordPayment(req, res, next) {
  try {
    const { id } = req.params
    const { amount, payment_type } = req.body

    const invResult = await query('SELECT * FROM invoices WHERE id = $1', [id])
    const invoice = invResult.rows[0]
    if (!invoice) throw new AppError('الفاتورة غير موجودة', 404)

    if (amount <= 0) throw new AppError('المبلغ يجب أن يكون أكبر من صفر', 400)
    if (invoice.paid_amount + amount > invoice.total_amount) {
      throw new AppError('المبلغ المدفوع يتجاوز إجمالي الفاتورة', 400)
    }

    const updated = await query(
      `UPDATE invoices SET paid_amount = paid_amount + $1, payment_type = COALESCE($2, payment_type)
       WHERE id = $3 RETURNING *`,
      [amount, payment_type, id]
    )

    return sendSuccess(res, updated.rows[0], 'تم تسجيل الدفع بنجاح')
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/v1/invoices/laundry/daily-report ───────────────────────────────
export async function getDailyReport(req, res, next) {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query

    const laundryResult = await query('SELECT id FROM laundries WHERE owner_id = $1', [req.user.id])
    if (!laundryResult.rows[0]) throw new AppError('المغسلة غير موجودة', 404)
    const laundryId = laundryResult.rows[0].id

    const [summary, topItems] = await Promise.all([
      query(
        `SELECT * FROM v_daily_laundry_summary WHERE laundry_id = $1 AND report_date = $2::date`,
        [laundryId, date]
      ),
      query(
        `SELECT ii.item_name, SUM(ii.quantity) AS total_qty, SUM(ii.subtotal) AS total_revenue
         FROM invoice_items ii
         JOIN invoices i ON i.id = ii.invoice_id
         WHERE i.laundry_id = $1 AND DATE(i.created_at) = $2::date AND i.status != 'cancelled'
         GROUP BY ii.item_name ORDER BY total_qty DESC LIMIT 5`,
        [laundryId, date]
      ),
    ])

    return sendSuccess(res, {
      date,
      summary: summary.rows[0] || { total_invoices: 0, total_revenue: 0, cash_total: 0, card_total: 0, deferred_total: 0, total_due: 0 },
      topItems: topItems.rows,
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/v1/invoices/:id/rate ───────────────────────────────────────────
export async function rateInvoice(req, res, next) {
  try {
    const { id } = req.params
    const { stars, comment } = req.body

    if (!stars || stars < 1 || stars > 5) throw new AppError('التقييم يجب أن يكون بين 1 و 5 نجوم', 400)

    // Verify invoice is completed and belongs to this customer
    const invResult = await query(
      'SELECT * FROM invoices WHERE id = $1 AND customer_id = $2 AND status = \'completed\'',
      [id, req.user.id]
    )
    const invoice = invResult.rows[0]
    if (!invoice) throw new AppError('لا يمكن تقييم هذه الفاتورة — يجب أن تكون مكتملة أولاً', 400)

    // Check for existing rating
    const existingRating = await query('SELECT id FROM ratings WHERE invoice_id = $1', [id])
    if (existingRating.rows[0]) throw new AppError('تم تقييم هذه الفاتورة مسبقاً', 409)

    const ratingResult = await query(
      `INSERT INTO ratings (invoice_id, customer_id, laundry_id, stars, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.user.id, invoice.laundry_id, stars, comment]
    )

    return sendSuccess(res, ratingResult.rows[0], 'شكراً على تقييمك', 201)
  } catch (err) {
    next(err)
  }
}
