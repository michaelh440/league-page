// src/routes/managers/bio/+page.server.js

import { query } from '$lib/db';

export async function load() {
  try {
    // Get managers with their championship count
    const managersResult = await query(`
      SELECT 
        m.manager_id,
        m.username,
        m.real_name,
        m.logo_url,
        m.year_joined,
        m.biography,
        m.team_alias,
        m.philosophy,
        m.favorite_team,
        m.signature_moves,
        m.strengths,
        m.weaknesses,
        COALESCE(champ_count.championships, 0) AS championships
      FROM managers m
      LEFT JOIN (
        SELECT 
          manager_id, 
          COUNT(*) AS championships
        FROM historical_rankings 
        WHERE final_rank = 1 
        GROUP BY manager_id
      ) champ_count ON champ_count.manager_id = m.manager_id
      ORDER BY m.username
    `);

    console.log('Loaded managers with championships:', managersResult.rows.length);
    
    return { 
      managers: managersResult.rows
    };
  } catch (error) {
    console.error('Error in managers bio load:', error);
    return { 
      managers: [] 
    };
  }
}