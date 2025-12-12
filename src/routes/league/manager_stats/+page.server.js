import { query } from '$lib/db';
import { leagueID, getLeagueData, getNflState, getLeagueTeamManagers, getLeagueRosters } from '$lib/utils/helper';

export async function load({ url, fetch }) {
  try {
    // Get season from query param, default to active season
    const seasonParam = url.searchParams.get('season');
    
    // Get available seasons for dropdown
    const seasonsResult = await query(`SELECT * FROM vw_available_seasons`);
    const seasons = seasonsResult.rows;
    
    // Determine which season to use
    let selectedSeasonId;
    if (seasonParam) {
      selectedSeasonId = parseInt(seasonParam);
    } else {
      // Find active season or most recent
      const activeSeason = seasons.find(s => s.is_active);
      selectedSeasonId = activeSeason ? activeSeason.season_id : seasons[0]?.season_id;
    }

    const selectedSeason = seasons.find(s => s.season_id === selectedSeasonId);
    const isActiveSeason = selectedSeason?.is_active || false;
    
    // Get managers for this season from DB
    const managersResult = await query(
      `SELECT * FROM vw_manager_season_list WHERE season_id = $1 ORDER BY manager_name`,
      [selectedSeasonId]
    );
    let managers = managersResult.rows;

    // Get manager avatars directly from managers table (as fallback for any season)
    let managerAvatars = {};
    try {
      const avatarsResult = await query(
        `SELECT manager_id, username, logo_url, platform_logo_url
         FROM managers`
      );
      for (const row of avatarsResult.rows) {
        // Determine avatar URL - prefer logo_url, fall back to platform_logo_url
        let avatar = row.logo_url || row.platform_logo_url || null;
        
        // If avatar exists but isn't a full URL, prepend Sleeper CDN
        if (avatar && !avatar.startsWith('http')) {
          avatar = `https://sleepercdn.com/avatars/${avatar}`;
        }
        
        managerAvatars[row.manager_id] = {
          manager_name: row.username,
          avatar: avatar
        };
      }
      
      // Fill in missing avatars for managers
      for (const manager of managers) {
        if (!manager.team_logo && managerAvatars[manager.manager_id]?.avatar) {
          manager.team_logo = managerAvatars[manager.manager_id].avatar;
        }
      }
    } catch (e) {
      console.error('Error fetching manager avatars:', e.message);
    }

    // Get team mapping (platform_team_id -> manager_id) for Sleeper API data
    let teamMapping = {};
    try {
      const teamMappingResult = await query(
        `SELECT team_id, manager_id, platform_team_id
         FROM teams
         WHERE season_id = $1 AND platform_team_id IS NOT NULL`,
        [selectedSeasonId]
      );
      for (const row of teamMappingResult.rows) {
        // Map Sleeper roster_id (platform_team_id) to internal manager_id
        teamMapping[row.platform_team_id] = {
          manager_id: row.manager_id
        };
      }
    } catch (e) {
      console.error('Error fetching team mapping:', e.message);
    }
    
    // Get running average points data
    let avgPointsData = [];
    try {
      const avgPointsResult = await query(
        `SELECT * FROM vw_manager_running_avg_points WHERE season_id = $1`,
        [selectedSeasonId]
      );
      avgPointsData = avgPointsResult.rows;
    } catch (e) {
      console.error('Error fetching avg points:', e.message);
    }
  
    // Get running average margin data
    let avgMarginData = [];
    try {
      const avgMarginResult = await query(
        `SELECT * FROM vw_manager_running_avg_margin WHERE season_id = $1`,
        [selectedSeasonId]
      );
      avgMarginData = avgMarginResult.rows;
    } catch (e) {
      console.error('Error fetching avg margin:', e.message);
    }
  
    // Get weekly margins for bar chart
    let weeklyMarginsData = [];
    try {
      const weeklyMarginsResult = await query(
        `SELECT * FROM vw_manager_weekly_margins WHERE season_id = $1`,
        [selectedSeasonId]
      );
      weeklyMarginsData = weeklyMarginsResult.rows;
    } catch (e) {
      console.error('Error fetching weekly margins:', e.message);
    }

    // Get weekly standings rank for line chart (with fallback)
    let standingsRankData = [];
    try {
      const standingsRankResult = await query(
        `SELECT * FROM vw_manager_weekly_standings_rank WHERE season_id = $1`,
        [selectedSeasonId]
      );
      standingsRankData = standingsRankResult.rows;
    } catch (e) {
      console.error('Error fetching standings rank:', e.message);
    }

    // Get weekly power rankings for line chart (with fallback)
    let powerRankData = [];
    try {
      const powerRankResult = await query(
        `SELECT * FROM vw_manager_weekly_power_rank WHERE season_id = $1`,
        [selectedSeasonId]
      );
      powerRankData = powerRankResult.rows;
    } catch (e) {
      console.error('Error fetching power rank:', e.message);
    }

    // Initialize season stats
    let seasonStats = null;

    // Try to calculate season stats from PostgreSQL data first
    if (weeklyMarginsData.length > 0) {
      seasonStats = await calculateSeasonStatsFromDB(weeklyMarginsData, managers, selectedSeasonId, query);
    }

    // Check if any data is missing - if so and active season, fetch from Sleeper API
    const needsSleeperData = isActiveSeason && (
      avgPointsData.length === 0 ||
      avgMarginData.length === 0 ||
      weeklyMarginsData.length === 0 ||
      standingsRankData.length === 0 ||
      powerRankData.length === 0
    );

    if (needsSleeperData) {
      try {
        const [nflState, leagueData, leagueTeamManagers, rostersData] = await Promise.all([
          getNflState(),
          getLeagueData(),
          getLeagueTeamManagers(),
          getLeagueRosters()
        ]);

        // If managers list is empty, build it from Sleeper data
        if (managers.length === 0 && leagueTeamManagers) {
          managers = buildManagersFromSleeper(leagueTeamManagers, rostersData);
          
          // Apply avatars from PostgreSQL managers table using teamMapping
          for (const manager of managers) {
            // manager.manager_id is Sleeper roster_id, map to internal manager_id
            const mapping = teamMapping[manager.manager_id];
            const internalManagerId = mapping?.manager_id || manager.manager_id;
            
            if (managerAvatars[internalManagerId]) {
              manager.team_logo = managerAvatars[internalManagerId].avatar || manager.team_logo;
              manager.manager_name = managerAvatars[internalManagerId].manager_name || manager.manager_name;
            }
          }
        }

        // Determine current week using same logic as elsewhere
        const regularSeasonLength = leagueData.settings?.playoff_week_start 
          ? leagueData.settings.playoff_week_start - 1 
          : 14;
        
        let currentWeek = 0;
        if (nflState.season_type === 'regular') {
          // Cap at end of regular season
          currentWeek = nflState.display_week > regularSeasonLength 
            ? regularSeasonLength + 1 
            : nflState.display_week;
        } else if (nflState.season_type === 'post') {
          currentWeek = regularSeasonLength + 1;
        }

        if (currentWeek > 0 && managers.length > 0) {
          // Fetch all matchups from Sleeper
          const matchupPromises = [];
          for (let week = 1; week <= currentWeek; week++) {
            matchupPromises.push(
              fetch(`https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`)
                .then(res => res.ok ? res.json() : [])
                .then(matchups => ({ week, matchups }))
                .catch(() => ({ week, matchups: [] }))
            );
          }
          const weeklyMatchups = await Promise.all(matchupPromises);

          // Build all chart data from Sleeper matchups
          const sleeperData = buildAllDataFromSleeper(weeklyMatchups, managers, selectedSeasonId, teamMapping);
          
          if (avgPointsData.length === 0) {
            avgPointsData = sleeperData.avgPointsData;
          }
          if (avgMarginData.length === 0) {
            avgMarginData = sleeperData.avgMarginData;
          }
          if (weeklyMarginsData.length === 0) {
            weeklyMarginsData = sleeperData.weeklyMarginsData;
          }
          if (standingsRankData.length === 0) {
            standingsRankData = sleeperData.standingsRankData;
          }
          if (powerRankData.length === 0) {
            powerRankData = sleeperData.powerRankData;
          }
          
          // Get additional stats from Sleeper data if not already calculated from DB
          if (!seasonStats) {
            seasonStats = sleeperData.seasonStats;
          }
        }
      } catch (e) {
        console.error('Error fetching from Sleeper API:', e.message);
      }
    }

    return {
      seasons,
      selectedSeasonId,
      managers,
      avgPointsData,
      avgMarginData,
      weeklyMarginsData,
      standingsRankData,
      powerRankData,
      seasonStats
    };
  } catch (error) {
    console.error('Manager stats load error:', error);
    // Return empty data on error so page still renders
    return {
      seasons: [],
      selectedSeasonId: null,
      managers: [],
      avgPointsData: [],
      avgMarginData: [],
      weeklyMarginsData: [],
      standingsRankData: [],
      powerRankData: [],
      seasonStats: null
    };
  }
}

// Build managers list from Sleeper data
function buildManagersFromSleeper(leagueTeamManagers, rostersData) {
  const managers = [];
  const rosters = rostersData?.rosters || [];
  
  for (const visKey in leagueTeamManagers) {
    const teamData = leagueTeamManagers[visKey];
    if (teamData && teamData.visRoster) {
      // Find the roster to get owner_id
      const roster = rosters.find(r => r.roster_id === teamData.visRoster);
      
      // Format avatar URL - Sleeper avatars are stored as IDs and need full URL
      let avatarUrl = null;
      if (teamData.visAvatar) {
        // If it's already a full URL, use it directly
        if (teamData.visAvatar.startsWith('http')) {
          avatarUrl = teamData.visAvatar;
        } else {
          // Convert Sleeper avatar ID to full URL
          avatarUrl = `https://sleepercdn.com/avatars/${teamData.visAvatar}`;
        }
      }
      
      managers.push({
        manager_id: teamData.visRoster, // Use roster_id as manager_id
        manager_name: teamData.visName || `Team ${teamData.visRoster}`,
        team_name: teamData.visName || `Team ${teamData.visRoster}`,
        team_logo: avatarUrl
      });
    }
  }
  
  return managers;
}

// Calculate season stats from PostgreSQL weekly margins data
async function calculateSeasonStatsFromDB(weeklyMarginsData, managers, seasonId, queryFn) {
  // Build manager stats from the weekly data
  const managerStats = {};
  const allWeeklyScores = {}; // {week: [{managerId, points}]}

  // Initialize managers
  for (const manager of managers) {
    managerStats[manager.manager_id] = {
      manager_id: manager.manager_id,
      manager_name: manager.manager_name,
      team_name: manager.team_name,
      team_logo: manager.team_logo,
      weeklyScores: [],
      cumulativeWins: 0,
      cumulativeLosses: 0,
      cumulativePoints: 0,
      cumulativeBenchPoints: 0,
      headToHead: {}
    };
  }

  // Process each matchup record
  for (const row of weeklyMarginsData) {
    const managerId = row.manager_id;
    if (!managerStats[managerId]) continue;

    const points = parseFloat(row.points_scored) || 0;
    const against = parseFloat(row.points_against) || 0;
    const margin = parseFloat(row.margin) || 0;
    const result = row.result;
    const week = row.week;

    // Add to weekly scores
    managerStats[managerId].weeklyScores.push({
      week,
      points,
      against,
      margin,
      result
    });

    // Update cumulative stats
    managerStats[managerId].cumulativePoints += points;
    if (result === 'W') {
      managerStats[managerId].cumulativeWins++;
    } else if (result === 'L') {
      managerStats[managerId].cumulativeLosses++;
    }

    // Track all scores by week for luck calculation
    if (!allWeeklyScores[week]) {
      allWeeklyScores[week] = [];
    }
    allWeeklyScores[week].push({ managerId, points });
  }

  // Build head-to-head from matching weeks
  const matchupsByWeek = {};
  for (const row of weeklyMarginsData) {
    const week = row.week;
    if (!matchupsByWeek[week]) {
      matchupsByWeek[week] = [];
    }
    matchupsByWeek[week].push(row);
  }

  // Find opponents by matching points_scored to points_against
  for (const week in matchupsByWeek) {
    const weekMatchups = matchupsByWeek[week];
    for (const row of weekMatchups) {
      const opponent = weekMatchups.find(m => 
        m.manager_id !== row.manager_id && 
        Math.abs(parseFloat(m.points_scored) - parseFloat(row.points_against)) < 0.01
      );
      
      if (opponent && managerStats[row.manager_id] && managerStats[opponent.manager_id]) {
        const myId = row.manager_id;
        const oppId = opponent.manager_id;
        
        if (!managerStats[myId].headToHead[oppId]) {
          managerStats[myId].headToHead[oppId] = { 
            wins: 0, losses: 0, ties: 0, 
            pointsFor: 0, pointsAgainst: 0 
          };
        }
        
        managerStats[myId].headToHead[oppId].pointsFor += parseFloat(row.points_scored) || 0;
        managerStats[myId].headToHead[oppId].pointsAgainst += parseFloat(row.points_against) || 0;
        
        if (row.result === 'W') {
          managerStats[myId].headToHead[oppId].wins++;
        } else if (row.result === 'L') {
          managerStats[myId].headToHead[oppId].losses++;
        } else {
          managerStats[myId].headToHead[oppId].ties++;
        }
      }
    }
  }

  // Calculate bench points from PostgreSQL
  let hasBenchData = false;
  try {
    // Query to get total roster points vs starter points per team per week
    const benchPointsQuery = `
      WITH roster_points AS (
        -- Regular season roster points
        SELECT 
          wr.season_id,
          wr.week,
          t.manager_id,
          wr.is_starter,
          COALESCE(pfs.total_fantasy_points, 0) as player_points
        FROM weekly_roster wr
        JOIN teams t ON wr.team_id = t.team_id
        LEFT JOIN player_fantasy_stats pfs ON wr.player_id = pfs.player_id 
          AND wr.season_id = pfs.season_id 
          AND wr.week = pfs.week
        WHERE wr.season_id = $1
        
        UNION ALL
        
        -- Playoff roster points
        SELECT 
          pr.season_id,
          pr.week,
          t.manager_id,
          pr.is_starter,
          COALESCE(plfs.total_fantasy_points, 0) as player_points
        FROM playoff_roster pr
        JOIN teams t ON pr.team_id = t.team_id
        LEFT JOIN playoff_fantasy_stats plfs ON pr.player_id = plfs.player_id 
          AND pr.season_id = plfs.season_id 
          AND pr.week = plfs.week
        WHERE pr.season_id = $1
      )
      SELECT 
        manager_id,
        week,
        SUM(CASE WHEN is_starter = false THEN player_points ELSE 0 END) as bench_points,
        SUM(player_points) as total_points
      FROM roster_points
      GROUP BY manager_id, week
      ORDER BY manager_id, week
    `;
    
    const benchResult = await queryFn(benchPointsQuery, [seasonId]);
    
    if (benchResult.rows.length > 0) {
      hasBenchData = true;
      
      // Aggregate bench points per manager
      for (const row of benchResult.rows) {
        const managerId = row.manager_id;
        if (managerStats[managerId]) {
          managerStats[managerId].cumulativeBenchPoints += parseFloat(row.bench_points) || 0;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching bench points from DB:', e.message);
  }

  // Convert allWeeklyScores to array format
  const weeklyScoresArray = Object.entries(allWeeklyScores).map(([week, scores]) => ({
    week: parseInt(week),
    scores
  }));

  // Use shared calculation function
  return calculateSeasonStatsShared(managerStats, weeklyScoresArray, hasBenchData);
}

// Build all chart data from Sleeper matchup data
function buildAllDataFromSleeper(weeklyMatchups, managers, seasonId, teamMapping) {
  // Track cumulative stats per manager (keyed by internal manager_id)
  const managerStats = {};
  
  // Create reverse lookup: Sleeper roster_id -> internal manager_id
  const rosterToManager = {};
  for (const [platformId, mapping] of Object.entries(teamMapping)) {
    rosterToManager[parseInt(platformId)] = mapping.manager_id;
  }
  
  // Initialize all managers from DB
  for (const manager of managers) {
    managerStats[manager.manager_id] = {
      manager_id: manager.manager_id,
      manager_name: manager.manager_name,
      team_name: manager.team_name,
      team_logo: manager.team_logo,
      weeklyScores: [], // {week, points, against, margin, result, benchPoints, optimalPoints}
      cumulativeWins: 0,
      cumulativeLosses: 0,
      cumulativePoints: 0,
      cumulativeMargin: 0,
      cumulativeBenchPoints: 0,
      headToHead: {} // {opponentId: {wins, losses, pointsFor, pointsAgainst}}
    };
  }

  const avgPointsData = [];
  const avgMarginData = [];
  const weeklyMarginsData = [];
  const standingsRankData = [];
  const powerRankData = [];

  // Track all weekly scores for luck calculation
  const allWeeklyScores = []; // {week, managerId, points}

  // Process each week
  for (const { week, matchups } of weeklyMatchups.sort((a, b) => a.week - b.week)) {
    if (!matchups || matchups.length === 0) continue;

    // Group matchups by matchup_id to find opponents
    const matchupGroups = {};
    for (const m of matchups) {
      if (m.matchup_id === null || m.matchup_id === undefined) continue;
      if (!matchupGroups[m.matchup_id]) {
        matchupGroups[m.matchup_id] = [];
      }
      matchupGroups[m.matchup_id].push(m);
    }

    // Collect all scores this week for luck calculation
    const weekScores = [];

    // Process each matchup to determine wins/losses and margins
    for (const matchupId in matchupGroups) {
      const teams = matchupGroups[matchupId];
      if (teams.length !== 2) continue;

      const [team1, team2] = teams;
      
      // Map Sleeper roster_id to internal manager_id
      const managerId1 = rosterToManager[team1.roster_id];
      const managerId2 = rosterToManager[team2.roster_id];
      
      // Skip if we can't find the manager mapping
      if (!managerId1 || !managerId2) continue;
      if (!managerStats[managerId1] || !managerStats[managerId2]) continue;

      const points1 = team1.points || 0;
      const points2 = team2.points || 0;
      const margin1 = points1 - points2;
      const margin2 = points2 - points1;

      // Calculate bench points (total player points - starter points)
      let benchPoints1 = 0;
      let benchPoints2 = 0;
      
      if (team1.players_points && team1.starters) {
        const totalPoints1 = Object.values(team1.players_points).reduce((sum, p) => sum + (p || 0), 0);
        benchPoints1 = totalPoints1 - points1;
      }
      if (team2.players_points && team2.starters) {
        const totalPoints2 = Object.values(team2.players_points).reduce((sum, p) => sum + (p || 0), 0);
        benchPoints2 = totalPoints2 - points2;
      }

      // Determine win/loss
      let result1, result2;
      if (points1 > points2) {
        managerStats[managerId1].cumulativeWins++;
        managerStats[managerId2].cumulativeLosses++;
        result1 = 'W';
        result2 = 'L';
      } else if (points2 > points1) {
        managerStats[managerId2].cumulativeWins++;
        managerStats[managerId1].cumulativeLosses++;
        result1 = 'L';
        result2 = 'W';
      } else {
        result1 = 'T';
        result2 = 'T';
      }

      // Update cumulative stats for team 1
      managerStats[managerId1].cumulativePoints += points1;
      managerStats[managerId1].cumulativeMargin += margin1;
      managerStats[managerId1].cumulativeBenchPoints += benchPoints1;
      managerStats[managerId1].weeklyScores.push({
        week, points: points1, against: points2, margin: margin1, result: result1, benchPoints: benchPoints1
      });

      // Update cumulative stats for team 2
      managerStats[managerId2].cumulativePoints += points2;
      managerStats[managerId2].cumulativeMargin += margin2;
      managerStats[managerId2].cumulativeBenchPoints += benchPoints2;
      managerStats[managerId2].weeklyScores.push({
        week, points: points2, against: points1, margin: margin2, result: result2, benchPoints: benchPoints2
      });

      // Track head-to-head
      if (!managerStats[managerId1].headToHead[managerId2]) {
        managerStats[managerId1].headToHead[managerId2] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
      }
      if (!managerStats[managerId2].headToHead[managerId1]) {
        managerStats[managerId2].headToHead[managerId1] = { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 };
      }
      
      managerStats[managerId1].headToHead[managerId2].pointsFor += points1;
      managerStats[managerId1].headToHead[managerId2].pointsAgainst += points2;
      managerStats[managerId2].headToHead[managerId1].pointsFor += points2;
      managerStats[managerId2].headToHead[managerId1].pointsAgainst += points1;
      
      if (result1 === 'W') {
        managerStats[managerId1].headToHead[managerId2].wins++;
        managerStats[managerId2].headToHead[managerId1].losses++;
      } else if (result1 === 'L') {
        managerStats[managerId1].headToHead[managerId2].losses++;
        managerStats[managerId2].headToHead[managerId1].wins++;
      } else {
        managerStats[managerId1].headToHead[managerId2].ties++;
        managerStats[managerId2].headToHead[managerId1].ties++;
      }

      // Collect week scores for luck calculation
      weekScores.push({ managerId: managerId1, points: points1 });
      weekScores.push({ managerId: managerId2, points: points2 });

      // Add weekly margins data
      const m1 = managerStats[managerId1];
      const m2 = managerStats[managerId2];
      
      weeklyMarginsData.push({
        season_id: seasonId,
        week,
        game_type: 'regular',
        manager_id: managerId1,
        manager_name: m1.manager_name,
        team_name: m1.team_name,
        team_logo: m1.team_logo,
        points_scored: Math.round(points1 * 100) / 100,
        points_against: Math.round(points2 * 100) / 100,
        margin: Math.round(margin1 * 100) / 100,
        result: result1
      });

      weeklyMarginsData.push({
        season_id: seasonId,
        week,
        game_type: 'regular',
        manager_id: managerId2,
        manager_name: m2.manager_name,
        team_name: m2.team_name,
        team_logo: m2.team_logo,
        points_scored: Math.round(points2 * 100) / 100,
        points_against: Math.round(points1 * 100) / 100,
        margin: Math.round(margin2 * 100) / 100,
        result: result2
      });
    }

    // Store week scores for luck calculation
    allWeeklyScores.push({ week, scores: weekScores });

    // Calculate running averages and rankings for this week
    for (const m of Object.values(managerStats)) {
      if (m.weeklyScores.length === 0) continue;
      
      const gamesPlayed = m.weeklyScores.length;
      const runningAvgPoints = m.cumulativePoints / gamesPlayed;
      const runningAvgMargin = m.cumulativeMargin / gamesPlayed;

      // Add running average points data
      avgPointsData.push({
        season_id: seasonId,
        week,
        game_type: 'regular',
        manager_id: m.manager_id,
        manager_name: m.manager_name,
        team_name: m.team_name,
        team_logo: m.team_logo,
        running_avg_points_reg: Math.round(runningAvgPoints * 100) / 100,
        running_avg_points_all: Math.round(runningAvgPoints * 100) / 100
      });

      // Add running average margin data
      avgMarginData.push({
        season_id: seasonId,
        week,
        game_type: 'regular',
        manager_id: m.manager_id,
        manager_name: m.manager_name,
        team_name: m.team_name,
        team_logo: m.team_logo,
        running_avg_margin_reg: Math.round(runningAvgMargin * 100) / 100,
        running_avg_margin_all: Math.round(runningAvgMargin * 100) / 100
      });
    }

    // Calculate standings rank for this week
    const weekStandings = Object.values(managerStats)
      .filter(m => m.weeklyScores.length > 0)
      .map(m => ({
        season_id: seasonId,
        week,
        game_type: 'regular',
        manager_id: m.manager_id,
        manager_name: m.manager_name,
        team_name: m.team_name,
        team_logo: m.team_logo,
        cumulative_wins: m.cumulativeWins,
        cumulative_losses: m.cumulativeLosses,
        cumulative_points: Math.round(m.cumulativePoints * 100) / 100
      }))
      .sort((a, b) => {
        if (b.cumulative_wins !== a.cumulative_wins) {
          return b.cumulative_wins - a.cumulative_wins;
        }
        return b.cumulative_points - a.cumulative_points;
      });

    weekStandings.forEach((standing, index) => {
      standing.standings_rank = index + 1;
      standingsRankData.push(standing);
    });

    // Calculate power rank for this week
    const weekPower = Object.values(managerStats)
      .filter(m => m.weeklyScores.length > 0)
      .map(m => {
        const gamesPlayed = m.weeklyScores.length;
        const seasonAvg = m.cumulativePoints / gamesPlayed;
        
        // Rolling 3-game average
        const last3 = m.weeklyScores.slice(-3).map(s => s.points);
        const rolling3Avg = last3.reduce((sum, p) => sum + p, 0) / last3.length;
        
        // Power score: 60% recent, 40% season
        const powerScore = gamesPlayed >= 3 
          ? (rolling3Avg * 0.6) + (seasonAvg * 0.4)
          : seasonAvg;

        return {
          season_id: seasonId,
          week,
          game_type: 'regular',
          manager_id: m.manager_id,
          manager_name: m.manager_name,
          team_name: m.team_name,
          team_logo: m.team_logo,
          rolling_avg_3wk: Math.round(rolling3Avg * 100) / 100,
          season_avg: Math.round(seasonAvg * 100) / 100,
          power_score: Math.round(powerScore * 100) / 100
        };
      })
      .sort((a, b) => b.power_score - a.power_score);

    weekPower.forEach((power, index) => {
      power.power_rank = index + 1;
      powerRankData.push(power);
    });
  }

  // Calculate season stats (with bench data available from Sleeper)
  const seasonStats = calculateSeasonStatsShared(managerStats, allWeeklyScores, true);

  return { 
    avgPointsData, 
    avgMarginData, 
    weeklyMarginsData, 
    standingsRankData, 
    powerRankData,
    seasonStats
  };
}

// Calculate all season summary stats (shared between DB and Sleeper sources)
// hasBenchData: true if bench points data is available (Sleeper only)
function calculateSeasonStatsShared(managerStats, allWeeklyScores, hasBenchData) {
  const stats = {
    highScores: [],      // Highest single-week scores
    lowScores: [],       // Lowest single-week scores
    consistency: [],     // Most consistent (lowest std dev)
    boomBust: [],        // Most boom-or-bust (highest std dev)
    avgPoints: [],       // Average points per week
    luck: [],            // Luckiest teams
    benchPoints: [],     // Most points left on bench
    rivalries: []        // Biggest rivalries
  };

  // Process each manager's stats
  for (const m of Object.values(managerStats)) {
    if (m.weeklyScores.length === 0) continue;

    const scores = m.weeklyScores.map(s => s.points);
    const gamesPlayed = scores.length;
    const totalPoints = scores.reduce((sum, p) => sum + p, 0);
    const avgPoints = totalPoints / gamesPlayed;
    
    // Calculate standard deviation
    const variance = scores.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / gamesPlayed;
    const stdDev = Math.sqrt(variance);

    // Find high and low scores (filter out 0s for low score - unplayed weeks)
    const highScore = Math.max(...scores);
    const playedScores = scores.filter(s => s > 0);
    const lowScore = playedScores.length > 0 ? Math.min(...playedScores) : 0;
    const highWeek = m.weeklyScores.find(s => s.points === highScore)?.week;
    const lowWeek = m.weeklyScores.find(s => s.points === lowScore && s.points > 0)?.week;

    // Add to high/low scores
    stats.highScores.push({
      manager_id: m.manager_id,
      manager_name: m.manager_name,
      team_name: m.team_name,
      team_logo: m.team_logo,
      score: Math.round(highScore * 100) / 100,
      week: highWeek
    });

    // Only add to low scores if there's a valid played game
    if (lowScore > 0) {
      stats.lowScores.push({
        manager_id: m.manager_id,
        manager_name: m.manager_name,
        team_name: m.team_name,
        team_logo: m.team_logo,
        score: Math.round(lowScore * 100) / 100,
        week: lowWeek
      });
    }

    // Consistency stats
    stats.consistency.push({
      manager_id: m.manager_id,
      manager_name: m.manager_name,
      team_name: m.team_name,
      team_logo: m.team_logo,
      std_dev: Math.round(stdDev * 100) / 100,
      avg_points: Math.round(avgPoints * 100) / 100,
      high: Math.round(highScore * 100) / 100,
      low: Math.round(lowScore * 100) / 100
    });

    // Boom-bust is same data, just sorted differently
    stats.boomBust.push({
      manager_id: m.manager_id,
      manager_name: m.manager_name,
      team_name: m.team_name,
      team_logo: m.team_logo,
      std_dev: Math.round(stdDev * 100) / 100,
      avg_points: Math.round(avgPoints * 100) / 100,
      high: Math.round(highScore * 100) / 100,
      low: Math.round(lowScore * 100) / 100
    });

    // Average points
    stats.avgPoints.push({
      manager_id: m.manager_id,
      manager_name: m.manager_name,
      team_name: m.team_name,
      team_logo: m.team_logo,
      avg_points: Math.round(avgPoints * 100) / 100,
      total_points: Math.round(totalPoints * 100) / 100,
      games_played: gamesPlayed
    });

    // Bench points (only available from Sleeper API)
    if (hasBenchData && m.cumulativeBenchPoints !== undefined) {
      stats.benchPoints.push({
        manager_id: m.manager_id,
        manager_name: m.manager_name,
        team_name: m.team_name,
        team_logo: m.team_logo,
        total_bench_points: Math.round(m.cumulativeBenchPoints * 100) / 100,
        avg_bench_points: Math.round((m.cumulativeBenchPoints / gamesPlayed) * 100) / 100,
        games_played: gamesPlayed
      });
    }

    // Calculate expected wins for luck calculation
    let expectedWins = 0;
    for (const weekData of allWeeklyScores) {
      const myScore = weekData.scores.find(s => s.managerId === m.manager_id);
      if (!myScore) continue;
      
      // Count how many teams this manager would have beaten this week
      const otherScores = weekData.scores.filter(s => s.managerId !== m.manager_id);
      const winsThisWeek = otherScores.filter(s => myScore.points > s.points).length;
      expectedWins += winsThisWeek / otherScores.length;
    }

    const actualWins = m.cumulativeWins;
    const luckFactor = actualWins - expectedWins;

    stats.luck.push({
      manager_id: m.manager_id,
      manager_name: m.manager_name,
      team_name: m.team_name,
      team_logo: m.team_logo,
      actual_wins: actualWins,
      expected_wins: Math.round(expectedWins * 100) / 100,
      luck_factor: Math.round(luckFactor * 100) / 100,
      wins: m.cumulativeWins,
      losses: m.cumulativeLosses
    });
  }

  // Build rivalries from head-to-head records
  const rivalryPairs = {};
  for (const m of Object.values(managerStats)) {
    for (const [oppId, h2h] of Object.entries(m.headToHead)) {
      const pairKey = [m.manager_id, parseInt(oppId)].sort().join('-');
      if (!rivalryPairs[pairKey]) {
        const opponent = managerStats[oppId];
        rivalryPairs[pairKey] = {
          manager1_id: m.manager_id,
          manager1_name: m.manager_name,
          manager1_logo: m.team_logo,
          manager2_id: parseInt(oppId),
          manager2_name: opponent?.manager_name || 'Unknown',
          manager2_logo: opponent?.team_logo || null,
          games: h2h.wins + h2h.losses + h2h.ties,
          manager1_wins: h2h.wins,
          manager2_wins: h2h.losses,
          ties: h2h.ties,
          total_points: h2h.pointsFor + h2h.pointsAgainst,
          avg_combined_score: 0
        };
      }
    }
  }

  // Calculate average combined score and determine "biggest" rivalries
  for (const rivalry of Object.values(rivalryPairs)) {
    if (rivalry.games > 0) {
      rivalry.avg_combined_score = Math.round((rivalry.total_points / rivalry.games) * 100) / 100;
    }
    stats.rivalries.push(rivalry);
  }

  // Sort all stats
  stats.highScores.sort((a, b) => b.score - a.score);
  stats.lowScores.sort((a, b) => a.score - b.score);
  stats.consistency.sort((a, b) => a.std_dev - b.std_dev); // Lower is more consistent
  stats.boomBust.sort((a, b) => b.std_dev - a.std_dev); // Higher is more boom-bust
  stats.avgPoints.sort((a, b) => b.avg_points - a.avg_points);
  stats.luck.sort((a, b) => b.luck_factor - a.luck_factor); // Higher is luckier
  if (hasBenchData) {
    stats.benchPoints.sort((a, b) => b.total_bench_points - a.total_bench_points);
  }
  stats.rivalries.sort((a, b) => b.games - a.games || b.avg_combined_score - a.avg_combined_score);

  return stats;
}