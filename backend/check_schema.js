import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
});

async function checkColumns() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('📋 الأعمدة الموجودة في جدول users:');
    console.log(res.rows.map(r => r.column_name).join(', '));
    client.release();
  } catch (err) {
    console.error('❌ فشل الفحص:', err.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
