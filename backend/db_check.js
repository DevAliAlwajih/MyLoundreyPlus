import pg from 'pg';
import bcrypt from 'bcryptjs';
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

async function diagnose() {
  console.log('🔍 بدء الفحص الشامل والمباشر لقاعدة البيانات...\n');

  try {
    const client = await pool.connect();
    const dbTime = await client.query('SELECT NOW()');
    console.log('✅ الاتصال المباشر: سليم');

    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    const tableNames = tables.rows.map(t => t.table_name);
    console.log('📊 الجداول الموجودة: ' + tableNames.join(', '));

    const adminRes = await client.query('SELECT * FROM users WHERE email = $1', ['admin@mgslty.com']);
    if (adminRes.rows.length === 0) {
      console.log('❌ خطأ: مستخدم المدير غير موجود!');
    } else {
      const admin = adminRes.rows[0];
      console.log('👤 مستخدم المدير موجود (الدور: ' + admin.role + ')');
      const isMatch = await bcrypt.compare('admin123', admin.password);
      console.log('🔑 فحص كلمة المرور (admin123): ' + (isMatch ? 'صحيحة ✅' : 'خاطئة ❌'));
    }
    client.release();
  } catch (err) {
    console.error('❌ خطأ في الاتصال المباشر:', err.message);
  } finally {
    await pool.end();
  }
}

diagnose();
