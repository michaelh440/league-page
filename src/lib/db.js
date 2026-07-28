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
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    // Only log the SQL text/params in dev — params can carry PII (emails, etc.) and this
    // runs on every failed query in production logs otherwise.
    if (dev) {
      console.error('Database query error:', error.message);
      console.error('Query was:', text);
      console.error('Params were:', params);
    } else {
      console.error('Database query error:', error.message);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run work against a single pooled client (the plain query() helper grabs a different
 * client per call, so BEGIN/ROLLBACK can't span separate query() calls).
 * Used to preview a destructive rebuild: BEGIN -> rebuild -> read -> ROLLBACK.
 */
export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
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