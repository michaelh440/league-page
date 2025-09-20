// src/routes/league/rivalries/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // Get unique managers instead of all teams
  const teamsRes = await query(`
    SELECT DISTINCT 
      m.manager_id as team_id,  -- Use manager_id as the identifier
      m.username as team_name,  -- Use current username as display name
      m.logo_url
    FROM managers m
    WHERE m.manager_id IN (
      SELECT DISTINCT manager_id 
      FROM historical_rankings  -- Only managers who actually played
    )
    ORDER BY m.manager_id
  `);

  const teams = teamsRes.rows;

  // Get rivalry stats (all time for grid)
  const rivalriesRes = await query(`
    SELECT *
    FROM vw_rivalries
    WHERE scope = 'all_time'
  `);

  return {
    teams,
    rivalries: rivalriesRes.rows
  };
}