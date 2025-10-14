// +page.server.js - SvelteKit loader for historical standings
import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const year = params.year ? parseInt(params.year) : 2023;
  
  try {
    // Get season_id for the selected year - handle multiple seasons per year
    const seasonResult = await query(`
      SELECT season_id 
      FROM seasons 
      WHERE season_year = $1
      ORDER BY season_id DESC
      LIMIT 1
    `, [year]);
    
    if (seasonResult.rows.length === 0) {
      throw error(404, `Season ${year} not found`);
    }
    
    const seasonId = seasonResult.rows[0].season_id;
    
    // Get standings - FIX: weekly_scoring.team_id is actually manager_id!
    const standingsResult = await query(`
      WITH season_wins_losses AS (
        -- Get wins/losses from matchups for this season
        SELECT 
          manager_id,
          SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN result = -1 THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as ties,
          SUM(score_against) as points_against
        FROM (
          -- Team 1 perspective
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
          
          -- Team 2 perspective
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
        ) all_matchups
        GROUP BY manager_id
      ),
      season_points AS (
        -- Get points for from weekly_scoring - JOIN ON MANAGER_ID not team_id!
        SELECT 
          ws.team_id as manager_id,
          COALESCE(SUM(ws.team_score), 0) as points_for
        FROM weekly_scoring ws
        WHERE ws.season_id = $2
        GROUP BY ws.team_id
      )
      SELECT 
        hr.regular_season_rank as rank,
        hr.final_rank,
        -- Determine playoff status based on regular season rank
        CASE 
          WHEN hr.regular_season_rank <= 4 THEN 'playoffs'
          WHEN hr.regular_season_rank <= 8 THEN 'consolation'
          ELSE 'missed'
        END as playoff_status,
        m.manager_id,
        COALESCE(mtn.team_name, m.team_alias, m.username) as manager_name,
        COALESCE(mtn.logo_url, m.logo_url, 'https://via.placeholder.com/48') as logo_url,
        COALESCE(wl.wins, 0) as wins,
        COALESCE(wl.losses, 0) as losses,
        COALESCE(wl.ties, 0) as ties,
        COALESCE(sp.points_for, 0)::numeric(10,2) as points_for,
        COALESCE(wl.points_against, 0)::numeric(10,2) as points_against
        
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
        AND mtn.season_year = $1
      LEFT JOIN season_wins_losses wl ON wl.manager_id = m.manager_id
      LEFT JOIN season_points sp ON sp.manager_id = m.manager_id
        
      WHERE hr.season_year = $1
      ORDER BY hr.regular_season_rank
    `, [year, seasonId]);
    
    // Get available years for dropdown - INCLUDING 2024
    const yearsResult = await query(`
      SELECT DISTINCT season_year 
      FROM seasons
      WHERE season_year IS NOT NULL
      ORDER BY season_year DESC
    `);
    
    const availableYears = yearsResult.rows.map(row => row.season_year);
    
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