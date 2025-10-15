// src/routes/api/test_db/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET() {
  try {
    // Test basic connection
    const timeResult = await query('SELECT NOW() as current_time');
    
    // Test your actual tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    
    // Count records in key tables
    const managerCount = await query('SELECT COUNT(*) as count FROM managers');
    const leagueCount = await query('SELECT COUNT(*) as count FROM leagues');
    
    return json({ 
      success: true,
      connected_at: timeResult.rows[0].current_time,
      tables: tablesResult.rows.map(r => r.table_name),
      counts: {
        managers: parseInt(managerCount.rows[0].count),
        leagues: parseInt(leagueCount.rows[0].count)
      }
    });
  } catch (error) {
    return json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}