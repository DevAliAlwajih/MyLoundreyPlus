import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function fix() {
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;');
    console.log('✅ phone_number is now nullable');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
