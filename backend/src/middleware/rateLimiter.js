import rateLimit from 'express-rate-limit'
import { AppError } from './errorHandler.js'

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً' },
  skip: (req) => req.path === '/health',
})

// ─── Auth Rate Limiter (login / OTP) ─────────────────────────────────────────
// Per IP: max 10 attempts per 15 minutes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':' + (req.body?.phone_number || ''),
  handler: (req, res, next) => {
    next(new AppError(
      `تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة بعد 15 دقيقة أو التواصل مع الإدارة: ${process.env.SUPPORT_PHONE || '920000000'}`,
      429
    ))
  },
})

// ─── OTP Rate Limiter ─────────────────────────────────────────────────────────
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.phone_number || req.ip,
  handler: (req, res, next) => {
    next(new AppError('تم إرسال عدد كبير من رسائل التحقق. يرجى الانتظار 10 دقائق', 429))
  },
})
