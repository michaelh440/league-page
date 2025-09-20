// Add this to your database helper functions (e.g., src/lib/utils/database.js)

import { dev } from '$app/environment';
import pkg from 'pg';
const { Pool } = pkg;

// Your database connection (adjust as needed for your setup)
const pool = new Pool({
  connectionString: dev ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL,
  ssl: !dev ? { rejectUnauthorized: false } : false
});

/**
 * Get all champions from the database
 * @returns {Promise<Array>} Array of champion objects with manager info
 */
export async function getChampions() {
  try {
    const query = `
      SELECT 
        hr.season_year,
        hr.manager_id,
        hr.final_rank,
        m.manager_name,
        m.sleeper_user_id,
        m.avatar_url
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      WHERE hr.final_rank = 1
      ORDER BY hr.season_year DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching champions:', error);
    throw error;
  }
}

/**
 * Get champions with win counts (for managers with multiple championships)
 * @returns {Promise<Array>} Array of champion objects with win counts
 */
export async function getChampionsWithCounts() {
  try {
    const query = `
      SELECT 
        hr.season_year,
        hr.manager_id,
        hr.final_rank,
        m.manager_name,
        m.sleeper_user_id,
        m.avatar_url,
        COUNT(*) OVER (PARTITION BY hr.manager_id) as championship_count
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      WHERE hr.final_rank = 1
      ORDER BY hr.season_year DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching champions with counts:', error);
    throw error;
  }
}

/**
 * Get the most recent champion
 * @returns {Promise<Object|null>} Most recent champion object
 */
export async function getCurrentChampion() {
  try {
    const query = `
      SELECT 
        hr.season_year,
        hr.manager_id,
        hr.final_rank,
        m.manager_name,
        m.sleeper_user_id,
        m.avatar_url
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      WHERE hr.final_rank = 1
      ORDER BY hr.season_year DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching current champion:', error);
    throw error;
  }
}