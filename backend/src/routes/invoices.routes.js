import { Router } from 'express'
import { authenticate, requireLaundry, requireCustomer } from '../middleware/auth.js'
import {
  createInvoice, getInvoices, getInvoiceById,
  updateInvoiceStatus, recordPayment, getDailyReport, rateInvoice,
} from '../controllers/invoice.controller.js'
import { query } from '../config/database.js'
import { AppError, sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

// All invoice routes require authentication
router.use(authenticate)

// Laundry-side
router.post('/',                    requireLaundry, async (req, res, next) => {
  // Attach laundry to request
  const laundryResult = await query('SELECT * FROM laundries WHERE owner_id = $1', [req.user.id])
  if (!laundryResult.rows[0]) return next(new AppError('المغسلة غير موجودة', 404))
  req.laundry = laundryResult.rows[0]
  createInvoice(req, res, next)
})

router.get('/daily-report',         requireLaundry, getDailyReport)
router.patch('/:id/status',         requireLaundry, updateInvoiceStatus)
router.post('/:id/payment',         requireLaundry, recordPayment)

// Customer-side
router.post('/:id/rate',            requireCustomer, rateInvoice)

// Shared
router.get('/',                     getInvoices)
router.get('/:id',                  getInvoiceById)

export default router
