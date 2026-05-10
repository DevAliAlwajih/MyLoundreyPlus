import { query } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function diagnose() {
  console.log('🔍 بدء الفحص الشامل لقاعدة البيانات...\n');

  try {
    // 1. فحص اتصال قاعدة البيانات
    const dbTime = await query('SELECT NOW()');
    console.log('✅ الاتصال بقاعدة البيانات: سليم (وقت السيرفر: ' + dbTime.rows[0].now + ')');

    // 2. فحص الجداول الأساسية
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = tables.rows.map(t => t.table_name);
    console.log('📊 الجداول الموجودة: ' + tableNames.join(', '));

    const requiredTables = ['users', 'laundries', 'invoices', 'subscriptions'];
    requiredTables.forEach(t => {
      if (tableNames.includes(t)) {
        console.log(`   - جدول [${t}]: موجود ✅`);
      } else {
        console.log(`   - جدول [${t}]: مفقود ❌`);
      }
    });

    // 3. فحص مستخدم المدير (admin@mgslty.com)
    const adminRes = await query('SELECT * FROM users WHERE email = $1', ['admin@mgslty.com']);
    if (adminRes.rows.length === 0) {
      console.log('\n❌ خطأ فادح: مستخدم المدير غير موجود!');
    } else {
      const admin = adminRes.rows[0];
      console.log('\n👤 بيانات المدير الحالية:');
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - الدور (Role): ${admin.role}`);
      console.log(`   - الحالة (Active): ${admin.is_active}`);
      console.log(`   - الـ Hash الخاص بالباسورد: ${admin.password.substring(0, 10)}...`);

      // اختبار كلمة المرور 'admin123' يدوياً مع الـ Hash الموجود
      const isMatch = await bcrypt.compare('admin123', admin.password);
      console.log(`   - اختبار كلمة المرور (admin123): ${isMatch ? 'متطابق ✅' : 'غير متطابق ❌'}`);
      
      if (!isMatch) {
        console.log('   ⚠️ تنبيه: كلمة المرور في قاعدة البيانات لا تتطابق مع "admin123"!');
      }
    }

    // 4. فحص الأخطاء الشائعة (Unique Constraint on email)
    const uniqueEmail = await query(`
      SELECT COUNT(*) as count, email 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    if (uniqueEmail.rows.length > 0) {
      console.log('⚠️ تحذير: هناك إيميلات مكررة في جدول المستخدمين!');
    } else {
      console.log('\n✅ لا توجد إيميلات مكررة.');
    }

  } catch (err) {
    console.error('\n❌ فشل الفحص بسبب خطأ تقني:', err.message);
  }
}

diagnose();
