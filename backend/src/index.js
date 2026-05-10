import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'

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
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_ADMIN_URL || 'http://localhost:3000',
      process.env.FRONTEND_APP_URL   || 'http://localhost:8081',
    ],
    methods: ['GET', 'POST']
  }
})

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`)
  socket.on('disconnect', () => logger.info(`🔌 Socket disconnected: ${socket.id}`))
})

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static('public/uploads'))

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

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1'
app.use(`${API}/auth`,          authRoutes)
app.use(`${API}/admin`,         adminRoutes)
// ... other routes ...

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await testConnection()
    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 مغسلتي بلس API تعمل على المنفذ ${PORT} (0.0.0.0)`)
      logger.info(`🔌 Real-time (Socket.io) enabled`)
    })
  } catch (err) {
    logger.error('❌ فشل تشغيل الخادم:', err.message)
    process.exit(1)
  }
}

startServer()
export default app
