import { query } from '../src/config/database.js';

async function checkAdmin() {
  try {
    const res = await query('SELECT id, email, role, is_active FROM users WHERE email = $1', ['admin@mgslty.com']);
    if (res.rows.length === 0) {
      console.log('❌ خطأ: حساب المدير غير موجود في قاعدة البيانات!');
    } else {
      console.log('✅ حساب المدير موجود:', res.rows[0]);
    }
  } catch (err) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
  }
}

checkAdmin();
