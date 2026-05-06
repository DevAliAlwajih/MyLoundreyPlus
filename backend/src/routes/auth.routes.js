import { Router } from 'express'
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.js'
import { authenticate } from '../middleware/auth.js'
import {
  register, login, verifyOtp, requestOTP, googleLogin,
  resetPassword, changePassword, refreshToken, getMe, logout,
} from '../controllers/auth.controller.js'

import { upload } from '../middleware/upload.js'

const router = Router()

// Public routes
router.post('/register',        upload.single('avatar'), register)
router.post('/login',           authRateLimiter, login)
router.post('/google',          googleLogin)
router.post('/send-otp',        otpRateLimiter, requestOTP)
router.post('/verify-otp',      verifyOtp)
router.post('/reset-password',  resetPassword)
router.post('/refresh',         refreshToken)

// Protected routes
router.get('/me',               authenticate, getMe)
router.post('/change-password', authenticate, changePassword)
router.post('/logout',          authenticate, logout)

export default router
