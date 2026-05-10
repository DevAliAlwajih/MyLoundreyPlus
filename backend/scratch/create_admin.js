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

async function createAdmin() {
  const email = 'admin@mgslty.com';
  const password = 'admin123';
  const fullName = 'مدير النظام';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const client = await pool.connect();
    
    await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, unique_id, is_verified)
       VALUES ($1, $2, $3, 'admin', TRUE, 'ADMIN_001', TRUE)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, 
           role = 'admin', 
           is_active = TRUE,
           unique_id = COALESCE(users.unique_id, 'ADMIN_001')`,
      [fullName, email, hashedPassword]
    );

    const check = await client.query('SELECT email, role, is_active FROM users WHERE email = $1', [email]);
    console.log('🧐 فحص أخير للبيانات في DB:', check.rows[0]);

    if (check.rows[0].role === 'admin') {
      console.log('🚀 تم تحديث/إنشاء حساب المدير بنجاح!');
    } else {
      console.log('⚠️ تحذير: الرتبة الحالية هي ' + check.rows[0].role + ' وليست admin!');
    }
    
    client.release();
  } catch (err) {
    console.error('❌ فشل إنشاء حساب المدير:', err.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
