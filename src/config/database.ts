import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bookmark_manager',
  max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('Unexpected database pool error:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(`Query executed in ${duration}ms | rows: ${result.rowCount}`);
  return result;
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export const database = {
  query,
  getClient,
  pool,
};

export default database;