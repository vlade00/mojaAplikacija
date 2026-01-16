import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Kreiraj connection pool za bazu koristeći DATABASE_URL iz .env fajla
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maksimalan broj konekcija
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test konekcija
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper funkcija za SQL upite
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};




