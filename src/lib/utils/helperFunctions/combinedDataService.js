// src/lib/utils/helperFunctions/combinedDataService.js
import { query } from '$lib/db';
import { leagueID } from '$lib/utils/leagueInfo';

/**
 * Get league data directly from Sleeper API (server-safe version)
 */
async function getLeagueDataDirect(queryLeagueID = leagueID) {
  const res = await fetch(`https://api.sleeper.app/v1/league/${queryLeagueID}`, {compress: true});
  const data = await res.json();
  
  if (res.ok) {
    return data;
  } else {
    throw new Error('Failed to fetch league data');
  }
}

/**
 * Determine if we should use database or Sleeper API
 * @param {number} requestedYear - Year being requested (null = current)
 * @returns {Promise<{useDatabase: boolean, currentYear: number}>}
 */
export async function getDataSource(requestedYear = null) {
  // Get current season from Sleeper
  const currentLeagueData = await getLeagueDataDirect(leagueID);
  const currentYear = parseInt(currentLeagueData.season);
  
  // If no year specified or requesting current year, use Sleeper API
  if (!requestedYear || requestedYear === currentYear) {
    return { useDatabase: false, currentYear };
  }
  
  // For historical years, check if we have it in database
  const dbCheck = await query(`
    SELECT COUNT(*) as count
    FROM seasons s
    JOIN leagues l ON s.league_id = l.league_id
    WHERE s.season_year = $1 AND l.platform = 'sleeper'
  `, [requestedYear]);
  
  const hasData = parseInt(dbCheck.rows[0].count) > 0;
  
  return { useDatabase: hasData, currentYear };
}

/**
 * Get league standings - uses DB for historical, Sleeper API for current
 * @param {number} year - Year to get standings for (null = current)
 * @returns {Promise<Object|null>}
 */
export async function getCombinedStandings(year = null) {
  const { useDatabase, currentYear } = await getDataSource(year);
  
  // For current season, return null to let existing Sleeper code handle it
  if (!useDatabase) {
    return null;
  }
  
  // For historical years, get from database
  try {
    const standingsQuery = await query(`
      WITH latest_week AS (
        SELECT MAX(week) as max_week 
        FROM team_rankings tr
        JOIN seasons s ON tr.season_id = s.season_id
        WHERE s.season_year = $1
      )
      SELECT 
        t.platform_team_id as roster_id,
        t.team_name,
        m.logo_url,
        m.username,
        tr.wins,
        tr.losses,
        tr.ties,
        tr.points_for as fpts,
        tr.points_against as fpts_against,
        tr.reg_season_rank
      FROM team_rankings tr
      CROSS JOIN latest_week lw
      JOIN teams t ON tr.team_id = t.team_id
      JOIN managers m ON t.manager_id = m.manager_id
      JOIN seasons s ON tr.season_id = s.season_id
      WHERE s.season_year = $1 
        AND tr.week = lw.max_week
      ORDER BY tr.reg_season_rank
    `, [year]);
    
    return {
      year: year,
      rosters: standingsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching historical standings:', error);
    return null;
  }
}

/**
 * Get matchup data for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @returns {Promise<Object|null>}
 */
export async function getCombinedMatchups(year, week) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const matchupsQuery = await query(`
      SELECT 
        m.matchup_id,
        m.week,
        t1.platform_team_id as team1_roster_id,
        t1.team_name as team1_name,
        m.team1_score,
        t2.platform_team_id as team2_roster_id,
        t2.team_name as team2_name,
        m.team2_score,
        s.season_year
      FROM matchups m
      JOIN seasons s ON m.season_id = s.season_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      WHERE s.season_year = $1 AND m.week = $2
      ORDER BY m.matchup_id
    `, [year, week]);
    
    return {
      year: year,
      week: week,
      matchups: matchupsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching historical matchups:', error);
    return null;
  }
}

/**
 * Get draft data
 * @param {number} year - Season year
 * @returns {Promise<Object|null>}
 */
export async function getCombinedDraft(year) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const draftQuery = await query(`
      SELECT 
        dp.pick_number,
        dp.round_number,
        dp.pick_in_round,
        dp.player_name,
        dp.player_nfl_team,
        t.platform_team_id as roster_id,
        m.username as picked_by,
        m.logo_url as avatar
      FROM draft_picks dp
      JOIN drafts d ON dp.draft_id = d.draft_id
      JOIN teams t ON dp.team_id = t.team_id
      JOIN managers m ON dp.manager_id = m.manager_id
      WHERE d.season_year = $1 AND d.platform = 'sleeper'
      ORDER BY dp.pick_number
    `, [year]);
    
    return {
      year: year,
      picks: draftQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching historical draft:', error);
    return null;
  }
}

/**
 * Get available seasons (both current and archived)
 * @returns {Promise<Array>}
 */
export async function getAvailableSeasons() {
  try {
    // Get current season from Sleeper
    const currentLeagueData = await getLeagueDataDirect(leagueID);
    const currentYear = parseInt(currentLeagueData.season);
    
    // Get archived seasons from database
    const archivedQuery = await query(`
      SELECT DISTINCT season_year
      FROM seasons s
      JOIN leagues l ON s.league_id = l.league_id
      WHERE l.platform = 'sleeper'
      ORDER BY season_year DESC
    `);
    
    const archivedYears = archivedQuery.rows.map(r => r.season_year);
    
    // Combine and dedupe
    const allYears = [...new Set([currentYear, ...archivedYears])].sort((a, b) => b - a);
    
    return allYears.map(year => ({
      year: year,
      isCurrent: year === currentYear,
      isArchived: archivedYears.includes(year)
    }));
  } catch (error) {
    console.error('Error fetching available seasons:', error);
    return [];
  }
}