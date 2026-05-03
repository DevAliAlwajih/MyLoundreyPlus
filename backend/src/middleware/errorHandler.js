import { logger } from '../config/logger.js'

// ─── Custom Error Class ───────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.data = data
    Error.captureStackTrace(this, this.constructor)
  }
}

// ─── Success Response Helper ──────────────────────────────────────────────────
export function sendSuccess(res, data = null, message = 'تمت العملية بنجاح', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  })
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
export function notFoundHandler(req, res, next) {
  next(new AppError(`المسار ${req.originalUrl} غير موجود`, 404))
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
export function errorHandler(err, req, res, next) {
  let { statusCode = 500, message, isOperational } = err

  // PostgreSQL specific errors
  if (err.code === '23505') { // unique violation
    statusCode = 409
    message = 'البيانات موجودة مسبقاً'
    isOperational = true
  } else if (err.code === '23503') { // foreign key violation
    statusCode = 400
    message = 'مرجع بيانات غير صالح'
    isOperational = true
  } else if (err.code === '22P02') { // invalid uuid
    statusCode = 400
    message = 'معرف غير صالح'
    isOperational = true
  }

  // Log non-operational errors
  if (!isOperational) {
    logger.error(`❌ خطأ غير متوقع: ${err.message}`, { stack: err.stack, url: req.originalUrl })
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? message : 'حدث خطأ داخلي في الخادم',
    ...(process.env.NODE_ENV === 'development' && !isOperational && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  })
}
