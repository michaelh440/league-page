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
        }

        // Determine current week
        let currentWeek = 0;
        if (nflState.season_type === 'regular') {
          currentWeek = nflState.display_week > 1 ? nflState.display_week - 1 : 0;
        } else if (nflState.season_type === 'post') {
          currentWeek = leagueData.settings?.playoff_week_start 
            ? leagueData.settings.playoff_week_start - 1 
            : 14;
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
      powerRankData
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
      powerRankData: []
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
      
      managers.push({
        manager_id: teamData.visRoster, // Use roster_id as manager_id
        manager_name: teamData.visName || `Team ${teamData.visRoster}`,
        team_name: teamData.visName || `Team ${teamData.visRoster}`,
        team_logo: teamData.visAvatar || null
      });
    }
  }
  
  return managers;
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
      weeklyPoints: [],
      weeklyMargins: [],
      cumulativeWins: 0,
      cumulativeLosses: 0,
      cumulativePoints: 0,
      cumulativeMargin: 0
    };
  }

  const avgPointsData = [];
  const avgMarginData = [];
  const weeklyMarginsData = [];
  const standingsRankData = [];
  const powerRankData = [];

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

      // Update cumulative stats for team 1
      managerStats[managerId1].cumulativePoints += points1;
      managerStats[managerId1].cumulativeMargin += margin1;
      managerStats[managerId1].weeklyPoints.push(points1);
      managerStats[managerId1].weeklyMargins.push({ week, margin: margin1, points: points1, against: points2 });

      // Update cumulative stats for team 2
      managerStats[managerId2].cumulativePoints += points2;
      managerStats[managerId2].cumulativeMargin += margin2;
      managerStats[managerId2].weeklyPoints.push(points2);
      managerStats[managerId2].weeklyMargins.push({ week, margin: margin2, points: points2, against: points1 });

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

    // Calculate running averages and rankings for this week
    for (const m of Object.values(managerStats)) {
      if (m.weeklyPoints.length === 0) continue;
      
      const gamesPlayed = m.weeklyPoints.length;
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
      .filter(m => m.weeklyPoints.length > 0)
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
      .filter(m => m.weeklyPoints.length > 0)
      .map(m => {
        const gamesPlayed = m.weeklyPoints.length;
        const seasonAvg = m.cumulativePoints / gamesPlayed;
        
        // Rolling 3-game average
        const last3 = m.weeklyPoints.slice(-3);
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

  return { 
    avgPointsData, 
    avgMarginData, 
    weeklyMarginsData, 
    standingsRankData, 
    powerRankData 
  };
}