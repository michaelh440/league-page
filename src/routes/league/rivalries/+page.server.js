// src/routes/rivalries/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // Get all teams
  const teamsRes = await query(`
    SELECT t.team_id, t.team_name, m.logo_url
    FROM teams t
    JOIN managers m ON t.manager_id = m.manager_id
    ORDER BY t.team_id
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
