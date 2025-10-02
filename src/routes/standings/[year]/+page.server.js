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
    
    // Get standings using historical_rankings and calculating record from matchups
    // Note: matchups.team1_id and team2_id are actually manager_ids, not team_ids
    const standingsResult = await query(`
      WITH manager_records AS (
        SELECT 
          m.manager_id,
          -- Calculate wins
          COUNT(CASE 
            WHEN (mat.team1_id = m.manager_id AND mat.team1_score > mat.team2_score) 
              OR (mat.team2_id = m.manager_id AND mat.team2_score > mat.team1_score) 
            THEN 1 
          END) as wins,
          -- Calculate losses
          COUNT(CASE 
            WHEN (mat.team1_id = m.manager_id AND mat.team1_score < mat.team2_score) 
              OR (mat.team2_id = m.manager_id AND mat.team2_score < mat.team1_score) 
            THEN 1 
          END) as losses,
          -- Calculate ties
          COUNT(CASE 
            WHEN (mat.team1_id = m.manager_id OR mat.team2_id = m.manager_id) 
              AND mat.team1_score = mat.team2_score 
            THEN 1 
          END) as ties,
          -- Calculate points for (using weekly_scoring)
          COALESCE(SUM(ws.team_score), 0) as points_for,
          -- Calculate points against
          COALESCE(SUM(
            CASE 
              WHEN mat.team1_id = m.manager_id THEN mat.team2_score
              WHEN mat.team2_id = m.manager_id THEN mat.team1_score
            END
          ), 0) as points_against
        FROM managers m
        JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = $2
        LEFT JOIN weekly_scoring ws ON ws.team_id = t.team_id
        LEFT JOIN matchups mat ON mat.season_id = $2
          AND (mat.team1_id = m.manager_id OR mat.team2_id = m.manager_id)
          AND mat.team1_score IS NOT NULL 
          AND mat.team2_score IS NOT NULL
        GROUP BY m.manager_id
      )
      SELECT 
        hr.regular_season_rank as rank,
        hr.final_rank,
        hr.playoff_status,
        m.manager_id,
        COALESCE(mtn.team_name, m.team_alias, m.username) as manager_name,
        COALESCE(mtn.logo_url, m.logo_url) as logo_url,
        COALESCE(mr.wins, 0) as wins,
        COALESCE(mr.losses, 0) as losses,
        COALESCE(mr.ties, 0) as ties,
        COALESCE(mr.points_for, 0) as points_for,
        COALESCE(mr.points_against, 0) as points_against
        
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
        AND mtn.season_year = $1
      LEFT JOIN manager_records mr ON mr.manager_id = m.manager_id
        
      WHERE hr.season_year = $1
      ORDER BY hr.regular_season_rank
    `, [year, seasonId]);
    
    // Get available years for dropdown (exclude current/incomplete seasons)
    const yearsResult = await query(`
      SELECT DISTINCT season_year 
      FROM historical_rankings
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