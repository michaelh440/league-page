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
        tr.reg_season_rank,
        tr.playoff_rank,
        tr.final_rank
      FROM team_rankings tr
      CROSS JOIN latest_week lw
      JOIN managers m ON tr.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = tr.season_id
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
      JOIN teams t1 ON m.team1_id = t1.manager_id AND t1.season_id = m.season_id
      JOIN teams t2 ON m.team2_id = t2.manager_id AND t2.season_id = m.season_id
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
      JOIN managers m ON dp.manager_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = d.season_id
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
 * Get team rankings for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @returns {Promise<Object|null>}
 */
export async function getCombinedWeeklyRankings(year, week) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const rankingsQuery = await query(`
      SELECT 
        t.platform_team_id as roster_id,
        t.team_name,
        m.logo_url,
        m.username,
        tr.week,
        tr.wins,
        tr.losses,
        tr.ties,
        tr.points_for as fpts,
        tr.points_against as fpts_against,
        tr.reg_season_rank,
        tr.wow_reg_season_rank_change,
        tr.playoff_rank,
        tr.wow_playoff_rank_change,
        tr.final_rank,
        tr.is_playoff_eligible
      FROM team_rankings tr
      JOIN managers m ON tr.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = tr.season_id
      JOIN seasons s ON tr.season_id = s.season_id
      WHERE s.season_year = $1 AND tr.week = $2
      ORDER BY tr.reg_season_rank
    `, [year, week]);
    
    return {
      year: year,
      week: week,
      rankings: rankingsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching weekly rankings:', error);
    return null;
  }
}

/**
 * Get weekly scoring data
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @returns {Promise<Object|null>}
 */
export async function getCombinedWeeklyScoring(year, week) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const scoringQuery = await query(`
      SELECT 
        ws.week,
        t.platform_team_id as roster_id,
        t.team_name,
        m.username,
        ws.team_score,
        ws.bench_score
      FROM weekly_scoring ws
      JOIN managers m ON ws.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = ws.season_id
      JOIN seasons s ON ws.season_id = s.season_id
      WHERE s.season_year = $1 AND ws.week = $2
      ORDER BY ws.team_score DESC
    `, [year, week]);
    
    return {
      year: year,
      week: week,
      scores: scoringQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching weekly scoring:', error);
    return null;
  }
}

/**
 * Get playoff bracket data
 * @param {number} year - Season year
 * @returns {Promise<Object|null>}
 */
export async function getCombinedPlayoffs(year) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const playoffsQuery = await query(`
      SELECT 
        p.week,
        p.round_name,
        p.bracket,
        t1.platform_team_id as team1_roster_id,
        t1.team_name as team1_name,
        m1.username as team1_username,
        p.team1_score,
        t2.platform_team_id as team2_roster_id,
        t2.team_name as team2_name,
        m2.username as team2_username,
        p.team2_score
      FROM playoffs p
      JOIN seasons s ON p.season_id = s.season_id
      JOIN managers m1 ON p.team1_id = m1.manager_id
      JOIN teams t1 ON t1.manager_id = m1.manager_id AND t1.season_id = p.season_id
      JOIN managers m2 ON p.team2_id = m2.manager_id
      JOIN teams t2 ON t2.manager_id = m2.manager_id AND t2.season_id = p.season_id
      WHERE s.season_year = $1
      ORDER BY p.week, p.bracket, p.playoff_id
    `, [year]);
    
    return {
      year: year,
      playoffs: playoffsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching playoff data:', error);
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

/**
 * Get league info for a specific year
 * @param {number} year - Season year
 * @returns {Promise<Object|null>}
 */
export async function getCombinedLeagueInfo(year) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const leagueQuery = await query(`
      SELECT 
        l.league_name,
        l.platform,
        l.scoring_type,
        s.season_year,
        l.reg_season_length,
        l.playoff_teams
      FROM seasons s
      JOIN leagues l ON s.league_id = l.league_id
      WHERE s.season_year = $1 AND l.platform = 'sleeper'
      LIMIT 1
    `, [year]);
    
    if (leagueQuery.rows.length === 0) {
      return null;
    }
    
    return {
      year: year,
      league: leagueQuery.rows[0],
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching league info:', error);
    return null;
  }
}