import { query } from '$lib/db';
import { leagueID, getLeagueData, getNflState, getLeagueTeamManagers, getLeagueRosters } from '$lib/utils/helper';

export async function load({ url, fetch }) {
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
  const teamMappingResult = await query(
    `SELECT t.team_id, t.manager_id, t.platform_team_id, m.name as manager_name
     FROM teams t
     JOIN managers m ON t.manager_id = m.manager_id
     WHERE t.season_id = $1 AND t.platform_team_id IS NOT NULL`,
    [selectedSeasonId]
  );
  const teamMapping = {};
  for (const row of teamMappingResult.rows) {
    // Map Sleeper roster_id (platform_team_id) to internal manager_id
    teamMapping[row.platform_team_id] = {
      manager_id: row.manager_id,
      manager_name: row.manager_name
    };
  }
  
  // Get running average points data
  const avgPointsResult = await query(
    `SELECT * FROM vw_manager_running_avg_points WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const avgPointsData = avgPointsResult.rows;
  
  // Get running average margin data
  const avgMarginResult = await query(
    `SELECT * FROM vw_manager_running_avg_margin WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const avgMarginData = avgMarginResult.rows;
  
  // Get weekly margins for bar chart
  const weeklyMarginsResult = await query(
    `SELECT * FROM vw_manager_weekly_margins WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const weeklyMarginsData = weeklyMarginsResult.rows;

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

  // If no data from DB and this is the active season, fetch from Sleeper API
  if ((standingsRankData.length === 0 || powerRankData.length === 0) && isActiveSeason) {
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

        // Build standings and power rank data from Sleeper matchups
        const sleeperData = buildRankingsFromSleeper(weeklyMatchups, managers, selectedSeasonId, teamMapping);
        
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

// Build standings and power rankings from Sleeper matchup data
function buildRankingsFromSleeper(weeklyMatchups, managers, seasonId, teamMapping) {
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
      cumulativeWins: 0,
      cumulativeLosses: 0,
      cumulativePoints: 0
    };
  }

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

    // Process each matchup to determine wins/losses
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

      // Update cumulative stats
      managerStats[managerId1].cumulativePoints += points1;
      managerStats[managerId2].cumulativePoints += points2;
      managerStats[managerId1].weeklyPoints.push(points1);
      managerStats[managerId2].weeklyPoints.push(points2);

      if (points1 > points2) {
        managerStats[managerId1].cumulativeWins++;
        managerStats[managerId2].cumulativeLosses++;
      } else if (points2 > points1) {
        managerStats[managerId2].cumulativeWins++;
        managerStats[managerId1].cumulativeLosses++;
      }
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

  return { standingsRankData, powerRankData };
}