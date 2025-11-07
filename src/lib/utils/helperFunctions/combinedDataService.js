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
  
  // For historical years, check if we have it in database (ANY platform)
  const dbCheck = await query(`
    SELECT COUNT(*) as count
    FROM seasons s
    WHERE s.season_year = $1
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
    
    // Get all archived seasons from database (all platforms)
    const archivedQuery = await query(`
      SELECT DISTINCT s.season_year, l.platform
      FROM seasons s
      JOIN leagues l ON s.league_id = l.league_id
      ORDER BY s.season_year DESC
    `);
    
    const archivedYears = archivedQuery.rows.map(r => r.season_year);
    
    // Combine and dedupe
    const allYears = [...new Set([currentYear, ...archivedYears])].sort((a, b) => b - a);
    
    return allYears.map(year => ({
      year: year,
      isCurrent: year === currentYear,
      isArchived: archivedYears.includes(year),
      platform: archivedQuery.rows.find(r => r.season_year === year)?.platform || 'sleeper'
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
      WHERE s.season_year = $1
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

/**
 * Get team roster for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @param {string} rosterIdOrManagerId - Platform roster ID or manager ID
 * @returns {Promise<Object|null>}
 */
export async function getCombinedRoster(year, week, rosterIdOrManagerId) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    // Get roster data - joining through manager since team_id in weekly_roster is actually manager_id
    const rosterQuery = await query(`
      SELECT 
        wr.player_id,
        wr.sleeper_player_id,
        wr.player_name,
        wr.position,
        wr.lineup_slot,
        wr.is_starter,
        pfs.total_fantasy_points as points,
        pfs.nfl_team,
        t.team_name,
        m.username
      FROM weekly_roster wr
      LEFT JOIN player_fantasy_stats pfs 
        ON pfs.sleeper_player_id = wr.sleeper_player_id 
        AND pfs.season_id = wr.season_id 
        AND pfs.week = wr.week
      JOIN managers m ON wr.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = wr.season_id
      JOIN seasons s ON wr.season_id = s.season_id
      WHERE s.season_year = $1 
        AND wr.week = $2
        AND (t.platform_team_id = $3 OR m.manager_id::text = $3)
      ORDER BY 
        CASE wr.lineup_slot
          WHEN 'QB' THEN 1
          WHEN 'RB' THEN 2
          WHEN 'WR' THEN 3
          WHEN 'TE' THEN 4
          WHEN 'FLEX' THEN 5
          WHEN 'K' THEN 6
          WHEN 'DEF' THEN 7
          WHEN 'BN' THEN 8
          ELSE 9
        END,
        wr.is_starter DESC
    `, [year, week, rosterIdOrManagerId]);
    
    return {
      year: year,
      week: week,
      roster: rosterQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching roster:', error);
    return null;
  }
}

/**
 * Get all rosters for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @returns {Promise<Object|null>}
 */
export async function getCombinedAllRosters(year, week) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const rostersQuery = await query(`
      SELECT 
        t.platform_team_id as roster_id,
        t.team_name,
        m.username,
        m.logo_url,
        json_agg(
          json_build_object(
            'player_id', wr.player_id,
            'sleeper_player_id', wr.sleeper_player_id,
            'player_name', wr.player_name,
            'position', wr.position,
            'lineup_slot', wr.lineup_slot,
            'is_starter', wr.is_starter,
            'points', pfs.total_fantasy_points,
            'nfl_team', pfs.nfl_team
          ) ORDER BY 
            CASE wr.lineup_slot
              WHEN 'QB' THEN 1
              WHEN 'RB' THEN 2
              WHEN 'WR' THEN 3
              WHEN 'TE' THEN 4
              WHEN 'FLEX' THEN 5
              WHEN 'K' THEN 6
              WHEN 'DEF' THEN 7
              WHEN 'BN' THEN 8
              ELSE 9
            END
        ) as players
      FROM weekly_roster wr
      LEFT JOIN player_fantasy_stats pfs 
        ON pfs.sleeper_player_id = wr.sleeper_player_id 
        AND pfs.season_id = wr.season_id 
        AND pfs.week = wr.week
      JOIN managers m ON wr.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = wr.season_id
      JOIN seasons s ON wr.season_id = s.season_id
      WHERE s.season_year = $1 AND wr.week = $2
      GROUP BY t.platform_team_id, t.team_name, m.username, m.logo_url
      ORDER BY t.team_name
    `, [year, week]);
    
    return {
      year: year,
      week: week,
      rosters: rostersQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching all rosters:', error);
    return null;
  }
}

/**
 * Get player fantasy stats for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @param {string} position - Optional position filter (QB, RB, WR, TE, K, DEF)
 * @returns {Promise<Object|null>}
 */
export async function getCombinedPlayerStats(year, week, position = null) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const whereClause = position 
      ? `s.season_year = $1 AND pfs.week = $2 AND pfs.position = $3`
      : `s.season_year = $1 AND pfs.week = $2`;
    
    const params = position ? [year, week, position] : [year, week];
    
    const statsQuery = await query(`
      SELECT 
        pfs.player_id,
        pfs.sleeper_player_id,
        pfs.player_name,
        pfs.position,
        pfs.nfl_team,
        pfs.total_fantasy_points,
        pfs.platform
      FROM player_fantasy_stats pfs
      JOIN seasons s ON pfs.season_id = s.season_id
      WHERE ${whereClause}
      ORDER BY pfs.total_fantasy_points DESC
    `, params);
    
    return {
      year: year,
      week: week,
      position: position,
      stats: statsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

/**
 * Get top performers for a specific week
 * @param {number} year - Season year
 * @param {number} week - Week number
 * @param {number} limit - Number of players to return (default 10)
 * @returns {Promise<Object|null>}
 */
export async function getCombinedTopPerformers(year, week, limit = 10) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const performersQuery = await query(`
      SELECT 
        pfs.player_name,
        pfs.position,
        pfs.nfl_team,
        pfs.total_fantasy_points,
        t.team_name,
        m.username as owner
      FROM player_fantasy_stats pfs
      JOIN seasons s ON pfs.season_id = s.season_id
      LEFT JOIN weekly_roster wr 
        ON wr.sleeper_player_id = pfs.sleeper_player_id 
        AND wr.season_id = pfs.season_id 
        AND wr.week = pfs.week
      LEFT JOIN managers m ON wr.team_id = m.manager_id
      LEFT JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = pfs.season_id
      WHERE s.season_year = $1 AND pfs.week = $2
      ORDER BY pfs.total_fantasy_points DESC
      LIMIT $3
    `, [year, week, limit]);
    
    return {
      year: year,
      week: week,
      topPerformers: performersQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return null;
  }
}

/**
 * Get season-long player stats
 * @param {number} year - Season year
 * @param {string} position - Optional position filter
 * @returns {Promise<Object|null>}
 */
export async function getCombinedSeasonStats(year, position = null) {
  const { useDatabase } = await getDataSource(year);
  
  if (!useDatabase) {
    return null; // Let Sleeper API handle it
  }
  
  try {
    const whereClause = position 
      ? `s.season_year = $1 AND pfs.position = $2`
      : `s.season_year = $1`;
    
    const params = position ? [year, position] : [year];
    
    const statsQuery = await query(`
      SELECT 
        pfs.player_name,
        pfs.position,
        pfs.nfl_team,
        COUNT(pfs.week) as games_played,
        SUM(pfs.total_fantasy_points) as total_points,
        AVG(pfs.total_fantasy_points) as avg_points,
        MAX(pfs.total_fantasy_points) as best_week,
        MIN(pfs.total_fantasy_points) as worst_week
      FROM player_fantasy_stats pfs
      JOIN seasons s ON pfs.season_id = s.season_id
      WHERE ${whereClause}
      GROUP BY pfs.player_name, pfs.position, pfs.nfl_team
      ORDER BY total_points DESC
    `, params);
    
    return {
      year: year,
      position: position,
      seasonStats: statsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching season stats:', error);
    return null;
  }
}