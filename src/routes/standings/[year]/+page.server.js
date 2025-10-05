// +page.server.js - SvelteKit loader for historical standings
import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const year = params.year ? parseInt(params.year) : 2023;
  
  try {
    // Get season_id for the selected year
    const seasonResult = await query(`
      SELECT season_id 
      FROM seasons 
      WHERE season_year = $1
    `, [year]);
    
    if (seasonResult.rows.length === 0) {
      throw error(404, `Season ${year} not found`);
    }
    
    const seasonId = seasonResult.rows[0].season_id;
    
    // DEBUG: First let's see what's in matchups for this season
    const debugMatchups = await query(`
      SELECT season_id, COUNT(*) as matchup_count
      FROM matchups
      WHERE season_id = $1
      GROUP BY season_id
    `, [seasonId]);
    console.log('Matchups for season', year, ':', debugMatchups.rows);
    
    // Get standings using historical_rankings and calculating record from matchups
    const standingsResult = await query(`
      WITH season_matchups AS (
        -- First, get all matchups for THIS season only
        SELECT 
          team1_id as manager_id,
          team1_score as score_for,
          team2_score as score_against,
          CASE 
            WHEN team1_score > team2_score THEN 1
            WHEN team1_score < team2_score THEN -1
            ELSE 0
          END as result
        FROM matchups
        WHERE season_id = $2
          AND team1_score IS NOT NULL
          AND team2_score IS NOT NULL
        
        UNION ALL
        
        SELECT 
          team2_id as manager_id,
          team2_score as score_for,
          team1_score as score_against,
          CASE 
            WHEN team2_score > team1_score THEN 1
            WHEN team2_score < team1_score THEN -1
            ELSE 0
          END as result
        FROM matchups
        WHERE season_id = $2
          AND team1_score IS NOT NULL
          AND team2_score IS NOT NULL
      ),
      manager_records AS (
        -- CRITICAL: Start with teams table filtered by season, not managers table
        SELECT 
          t.manager_id,
          -- Calculate wins from matchups for THIS season only
          COUNT(CASE WHEN sm.result = 1 THEN 1 END) as wins,
          -- Calculate losses from matchups for THIS season only
          COUNT(CASE WHEN sm.result = -1 THEN 1 END) as losses,
          -- Calculate ties from matchups for THIS season only
          COUNT(CASE WHEN sm.result = 0 THEN 1 END) as ties,
          -- Calculate points for from weekly_scoring for THIS season only
          COALESCE(SUM(ws.team_score), 0) as points_for,
          -- Calculate points against from matchups for THIS season only
          COALESCE(SUM(sm.score_against), 0) as points_against
        FROM teams t
        LEFT JOIN season_matchups sm ON sm.manager_id = t.manager_id
        LEFT JOIN weekly_scoring ws ON ws.team_id = t.team_id AND ws.season_id = $2
        WHERE t.season_id = $2
        GROUP BY t.manager_id
      )
      SELECT 
        hr.regular_season_rank as rank,
        hr.final_rank,
        hr.playoff_status,
        m.manager_id,
        COALESCE(mtn.team_name, m.team_alias, m.username) as manager_name,
        COALESCE(mtn.logo_url, m.logo_url, 'https://via.placeholder.com/48') as logo_url,
        COALESCE(mr.wins, 0) as wins,
        COALESCE(mr.losses, 0) as losses,
        COALESCE(mr.ties, 0) as ties,
        COALESCE(mr.points_for, 0)::numeric(10,2) as points_for,
        COALESCE(mr.points_against, 0)::numeric(10,2) as points_against
        
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
        AND mtn.season_year = $1
      LEFT JOIN manager_records mr ON mr.manager_id = m.manager_id
        
      WHERE hr.season_year = $1
      ORDER BY hr.regular_season_rank
    `, [year, seasonId]);
    
    // Get available years for dropdown
    const yearsResult = await query(`
      SELECT DISTINCT season_year 
      FROM historical_rankings
      ORDER BY season_year DESC
    `);
    
    const availableYears = yearsResult.rows.map(row => row.season_year);
    
    // Debug logging
    console.log('Standings data for year', year, ':', standingsResult.rows);
    
    return {
      year,
      standings: standingsResult.rows,
      availableYears
    };
    
  } catch (err) {
    console.error('Error loading standings:', err);
    throw error(500, 'Failed to load standings data');
  }
}