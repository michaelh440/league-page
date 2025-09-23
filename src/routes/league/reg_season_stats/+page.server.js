/*import { query } from '$lib/db';

export async function load() {
  const highestGame   = (await query(`SELECT * FROM vw_reg_season_highest_game`)).rows;
  const lowestGame    = (await query(`SELECT * FROM vw_reg_season_lowest_game`)).rows;
  const highestSeason = (await query(`SELECT * FROM vw_reg_season_highest_season`)).rows;
  const lowestSeason  = (await query(`SELECT * FROM vw_reg_season_lowest_season`)).rows;
  const blowout       = (await query(`SELECT * FROM vw_reg_season_largest_blowout`)).rows;
  const nailbiter     = (await query(`SELECT * FROM vw_reg_season_closest_nailbiter`)).rows;
  const winPct        = (await query(`SELECT * FROM vw_reg_season_win_pct`)).rows;

  return {
    highestGame,
    lowestGame,
    highestSeason,
    lowestSeason,
    blowout,
    nailbiter,
    winPct
  };
}*/

// src/routes/league/reg_season_stats/+page.server.js - Debug connection
import { query } from '$lib/db';

export async function load() {
  try {
    console.log('=== DATABASE CONNECTION DEBUG ===');
    
    // Check what database we're actually connected to
    const dbInfo = await query(`
      SELECT 
        current_database() as database_name,
        current_schema() as schema_name,
        current_user as user_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `);
    console.log('Database connection info:', dbInfo.rows[0]);
    
    // Check if the view exists in the current schema
    const viewCheck = await query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname LIKE '%highest_game%'
    `);
    console.log('Views containing "highest_game":', viewCheck.rows);
    
    // Check all views in current schema
    const allViews = await query(`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE schemaname = current_schema()
      ORDER BY viewname
    `);
    console.log('All views in current schema:', allViews.rows);
    
    // Check if the view exists in the public schema specifically
    const publicViewCheck = await query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public' AND viewname = 'vw_reg_season_highest_game'
    `);
    console.log('vw_reg_season_highest_game in public schema:', publicViewCheck.rows);
    
    // Try to access the view with explicit schema
    try {
      const explicitSchemaQuery = await query(`SELECT COUNT(*) FROM public.vw_reg_season_highest_game`);
      console.log('Explicit public schema access works:', explicitSchemaQuery.rows[0]);
    } catch (error) {
      console.log('Explicit public schema access failed:', error.message);
    }
    
    // Check search_path
    const searchPath = await query(`SHOW search_path`);
    console.log('Current search_path:', searchPath.rows[0]);
    
    return {
      debug: 'Check Vercel logs for connection details',
      dbInfo: dbInfo.rows[0],
      viewCheck: viewCheck.rows,
      allViews: allViews.rows
    };
    
  } catch (error) {
    console.error('Debug error:', error);
    return {
      error: error.message
    };
  }
}