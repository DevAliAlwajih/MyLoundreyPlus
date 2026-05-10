import { query } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = 'admin@mgslty.com';
  const password = 'admin123';
  const fullName = 'مدير النظام';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // UPSERT: Create or Update if exists
    await query(
      `INSERT INTO users (full_name, email, password, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email) DO UPDATE 
       SET password = EXCLUDED.password, role = 'admin', is_active = TRUE`,
      [fullName, email, hashedPassword]
    );

    console.log('🚀 تم تحديث/إنشاء حساب المدير بنجاح!');
    console.log('📧 الإيميل: ' + email);
    console.log('🔑 الباسورد: ' + password);
  } catch (err) {
    console.error('❌ فشل إنشاء حساب المدير:', err);
  }
}

createAdmin();
