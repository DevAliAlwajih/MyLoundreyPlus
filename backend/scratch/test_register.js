const testRegister = async () => {
  console.log('🚀 بدء اختبار التسجيل التجريبي (Fetch)...');
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: "Test User " + Date.now(),
        phone_number: "966" + Math.floor(Math.random() * 100000000),
        email: "test" + Date.now() + "@example.com",
        password: "Password123!",
        role: "laundry",
        laundry_name: "Test Laundry",
        country: "SA"
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ نجح التسجيل التجريبي:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ فشل التسجيل التجريبي:');
      console.error('Status:', response.status);
      console.error('Data:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  }
};

testRegister();
