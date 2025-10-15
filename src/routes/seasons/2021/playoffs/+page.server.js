// src/routes/seasons/2021/playoffs/+page.server.js
import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const year = params.year ? parseInt(params.year) : 2021;
  
  try {
    // Pull playoff matchups with logos
    const result = await query(`
      SELECT 
        p.week,
        p.round_name,
        p.bracket,
        mt1.team_name AS team1,
        mt1.logo_url AS team1_logo,
        p.team1_score AS score1,
        mt2.team_name AS team2,
        mt2.logo_url AS team2_logo,
        p.team2_score AS score2
      FROM playoffs p
      JOIN seasons s ON p.season_id = s.season_id
      JOIN manager_team_names mt1 
        ON p.team1_id = mt1.manager_id 
        AND s.season_year = mt1.season_year
      JOIN manager_team_names mt2 
        ON p.team2_id = mt2.manager_id 
        AND s.season_year = mt2.season_year
      WHERE s.season_year = $1
      ORDER BY 
        CASE WHEN p.bracket = 'Championship' THEN 0 ELSE 1 END,
        p.week ASC, 
        p.playoff_id ASC
    `, [year]);

    if (result.rows.length === 0) {
      throw error(404, `No playoff data found for ${year}`);
    }

    // Structure into championship/consolation brackets
    const bracketData = {
      championship: { week15: [], week16: [] },
      consolation: { week15: [], week16: [] }
    };

    // Determine which weeks are playoffs (usually 15 and 16, but could vary)
    const weeks = [...new Set(result.rows.map(r => r.week))].sort();
    const firstWeek = weeks[0];
    const secondWeek = weeks[1] || firstWeek + 1;

    result.rows.forEach((row) => {
      const weekKey = row.week === firstWeek ? 'week15' : 'week16';
      const isChamp = row.bracket === 'Championship';
      
      const game = {
        label: row.round_name || 'Playoff Game',
        team1: row.team1,
        team1_logo: row.team1_logo,
        score1: parseFloat(row.score1) || 0,  // Convert to number
        team2: row.team2,
        team2_logo: row.team2_logo,
        score2: parseFloat(row.score2) || 0   // Convert to number
      };

      if (isChamp) {
        bracketData.championship[weekKey].push(game);
      } else {
        bracketData.consolation[weekKey].push(game);
      }
    });

    return {
      season: year,
      ...bracketData
    };
    
  } catch (err) {
    console.error('Error loading playoff data:', err);
    throw error(500, `Failed to load playoff data for ${year}`);
  }
}