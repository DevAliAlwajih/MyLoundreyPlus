import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import { testConnection } from './config/database.js'
import { logger } from './config/logger.js'
import { globalRateLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Routes
import authRoutes         from './routes/auth.routes.js'
import usersRoutes        from './routes/users.routes.js'
import laundriesRoutes    from './routes/laundries.routes.js'
import invoicesRoutes     from './routes/invoices.routes.js'
import categoriesRoutes   from './routes/categories.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import supportRoutes      from './routes/support.routes.js'
import adsRoutes          from './routes/ads.routes.js'
import subscriptionsRoutes from './routes/subscriptions.routes.js'
import devicesRoutes      from './routes/devices.routes.js'
import adminRoutes        from './routes/admin.routes.js'

const app = express()
const PORT = process.env.PORT || 5000

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}))

app.use(cors({
  origin: [
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:3000',
    process.env.FRONTEND_APP_URL   || 'http://localhost:8081',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-Device-Type', 'X-Device-OS'],
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }))
app.use(globalRateLimiter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'مغسلتي بلس API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1'

app.use(`${API}/auth`,          authRoutes)
app.use(`${API}/users`,         usersRoutes)
app.use(`${API}/laundries`,     laundriesRoutes)
app.use(`${API}/invoices`,      invoicesRoutes)
app.use(`${API}/categories`,    categoriesRoutes)
app.use(`${API}/notifications`, notificationsRoutes)
app.use(`${API}/support`,       supportRoutes)
app.use(`${API}/ads`,           adsRoutes)
app.use(`${API}/subscriptions`, subscriptionsRoutes)
app.use(`${API}/devices`,       devicesRoutes)
app.use(`${API}/admin`,         adminRoutes)

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await testConnection()
    app.listen(PORT, () => {
      logger.info(`🚀 مغسلتي بلس API تعمل على المنفذ ${PORT}`)
      logger.info(`📖 البيئة: ${process.env.NODE_ENV}`)
      logger.info(`🌐 Health: http://localhost:${PORT}/health`)
    })
  } catch (err) {
    logger.error('❌ فشل تشغيل الخادم:', err.message)
    process.exit(1)
  }
}

startServer()

export default app
