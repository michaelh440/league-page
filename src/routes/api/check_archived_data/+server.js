// src/routes/api/check_archived_data/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
  const season = url.searchParams.get('season') || 2024;
  
  try {
    // Check what data we have for this season
    const leagueInfo = await query(`
      SELECT l.league_id, l.league_name, l.platform, l.league_year, l.scoring_type
      FROM leagues l
      WHERE l.league_year = $1 AND l.platform = 'sleeper'
    `, [season]);
    
    const teamCount = await query(`
      SELECT COUNT(*) as count
      FROM teams t
      JOIN seasons s ON t.season_id = s.season_id
      WHERE s.season_year = $1
    `, [season]);
    
    const matchupCount = await query(`
      SELECT COUNT(*) as count
      FROM matchups m
      JOIN seasons s ON m.season_id = s.season_id
      WHERE s.season_year = $1
    `, [season]);
    
    const draftCount = await query(`
      SELECT COUNT(*) as count
      FROM draft_picks dp
      JOIN drafts d ON dp.draft_id = d.draft_id
      WHERE d.season_year = $1
    `, [season]);
    
    return json({
      season,
      league: leagueInfo.rows[0] || null,
      counts: {
        teams: parseInt(teamCount.rows[0].count),
        matchups: parseInt(matchupCount.rows[0].count),
        draftPicks: parseInt(draftCount.rows[0].count)
      }
    });
  } catch (error) {
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

