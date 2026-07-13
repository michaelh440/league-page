
//Comment out below when not Connecting to Local Postgress
/*import pkg from 'pg';
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
}*/


//Uncomment below for Connecting to Neon
/*import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  //ssl: {
   // rejectUnauthorized: false
  //}
});


console.log('DATABASE_URL:', process.env.DATABASE_URL);


export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
 

}*/


// src/lib/db.js - Simple Neon connection without search_path options
import pg from 'pg';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// SvelteKit/Vite does NOT copy .env into process.env for the dev server, so
// process.env.DATABASE_URL is undefined locally (which pg reports as
// "SASL: ... client password must be a string"). Read it through $env, which
// loads .env in dev and reads process.env in production (e.g. Vercel).
const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  // Neon requires SSL in every environment (connection string uses sslmode=require).
  ssl: { rejectUnauthorized: false }
  // NO search_path options - Neon pooled connections don't support this
});

// Log connection details (only in development)
if (dev) {
  console.log('DATABASE_URL:', connectionString ? 'Set' : 'NOT SET');
  console.log('Environment:', dev ? 'Development' : 'Production');
}

export async function query(text, params) {
  const client = await pool.connect();
  try {
    console.log('Executing query:', text.substring(0, 100) + '...');
    const result = await client.query(text, params);
    console.log('Query successful, rows returned:', result.rows.length);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query was:', text);
    console.error('Params were:', params);
    throw error;
  } finally {
    client.release();
  }
}

// Test connection function
export async function testConnection() {
  try {
    const result = await query('SELECT current_database(), current_schema(), version()');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}