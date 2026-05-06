import pg from 'pg'
import { logger } from './logger.js'

const { Pool } = pg

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'maghsalati_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err.message)
})

// ─── Test Connection ──────────────────────────────────────────────────────────
export async function testConnection() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT NOW() as time, version() as version')
    logger.info(`✅ PostgreSQL متصل — ${result.rows[0].time}`)

    // ─── Auto Migrations (One-time fixes) ─────────────────
    // 1. Make phone_number nullable
    await client.query('ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;')
    // 2. Ensure email column exists (just in case)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
          ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
        END IF;
      END $$;
    `)
    logger.info('🛠️ تم فحص وتحديث هيكل قاعدة البيانات بنجاح')
  } catch (err) {
    logger.error('❌ فشل تحديث هيكل قاعدة البيانات:', err.message)
  } finally {
    client.release()
  }
}

// ─── Query Helper ─────────────────────────────────────────────────────────────
export async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      logger.warn(`استعلام بطيء (${duration}ms): ${text.substring(0, 80)}`)
    }
    return result
  } catch (err) {
    logger.error(`خطأ في الاستعلام: ${err.message}\nSQL: ${text}`)
    throw err
  }
}

// ─── Transaction Helper ───────────────────────────────────────────────────────
export async function withTransaction(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export default pool
