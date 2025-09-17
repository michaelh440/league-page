import pkg from 'pg';
const { Pool } = pkg;

// Create a connection pool
export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Camaro_1967',
  database: process.env.PGDATABASE || 'houston_fantasy_football_league',
});

// Helper query function
export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}
