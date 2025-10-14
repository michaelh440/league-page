// src/routes/managers/rivalries/+page.server.js
import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('managerId');

  // Get all managers for dropdown
  const managersRes = await query(`
    SELECT 
      m.manager_id,
      COALESCE(m.real_name, m.username) as name,
      m.logo_url
    FROM managers m
    ORDER BY name
  `);

  const managers = managersRes.rows;

  // If no manager selected, return early
  if (!managerId) {
    return {
      managers,
      managerId: null,
      rivalries: []
    };
  }

  // Get rivalries for selected manager
  const rivalriesRes = await query(`
    SELECT *
    FROM vw_rivalries
    WHERE scope = 'all_time'
      AND (team1_id = $1 OR team2_id = $1)
  `, [managerId]);

  return {
    managers,
    managerId: parseInt(managerId),
    rivalries: rivalriesRes.rows
  };
}