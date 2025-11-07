// src/lib/utils/helperFunctions/rosterStatsArchival.js
import { query } from '$lib/db';

/**
 * Archive roster and player stats data for a Sleeper season
 * @param {string} leagueID - Sleeper league ID
 * @param {number} season - Season year
 * @returns {Promise<Object>}
 */
export async function archiveRostersAndStats(leagueID, season) {
  console.log(`Starting roster and stats archive for league ${leagueID}, season ${season}`);
  
  try {
    // Get season_id from database
    const seasonResult = await query(`
      SELECT s.season_id, l.reg_season_length, l.playoff_teams
      FROM seasons s
      JOIN leagues l ON s.league_id = l.league_id
      WHERE s.season_year = $1 AND l.platform = 'sleeper'
    `, [season]);
    
    if (seasonResult.rows.length === 0) {
      throw new Error('Season not found in database');
    }
    
    const { season_id, reg_season_length } = seasonResult.rows[0];
    const totalWeeks = reg_season_length + 3; // Regular season + 3 playoff weeks
    
    // Step 1: Fetch and stage roster data for all weeks
    console.log('Fetching rosters from Sleeper...');
    let rostersStaged = 0;
    
    for (let week = 1; week <= totalWeeks; week++) {
      const rostersUrl = `https://api.sleeper.app/v1/league/${leagueID}/rosters`;
      const rostersRes = await fetch(rostersUrl);
      const rostersData = await rostersRes.json();
      
      // Also get matchup data to determine starters/bench for this week
      const matchupsUrl = `https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`;
      const matchupsRes = await fetch(matchupsUrl);
      const matchupsData = await matchupsRes.json();
      
      for (const roster of rostersData) {
        const matchupData = matchupsData.find(m => m.roster_id === roster.roster_id);
        
        if (!matchupData) continue; // Skip if no matchup data for this week
        
        // Insert into staging table
        await query(`
          INSERT INTO staging_sleeper_weekly_rosters (
            sleeper_league_id,
            roster_id,
            season_year,
            week,
            starters,
            players,
            starters_with_positions,
            bench_with_positions,
            raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (sleeper_league_id, roster_id, season_year, week) 
          DO UPDATE SET
            starters = EXCLUDED.starters,
            players = EXCLUDED.players,
            starters_with_positions = EXCLUDED.starters_with_positions,
            bench_with_positions = EXCLUDED.bench_with_positions,
            raw_data = EXCLUDED.raw_data,
            processed = false
        `, [
          leagueID,
          roster.roster_id,
          season,
          week,
          JSON.stringify(matchupData.starters || []),
          JSON.stringify(roster.players || []),
          JSON.stringify(matchupData.starters_points || {}),
          JSON.stringify({}), // We'll calculate bench separately if needed
          JSON.stringify({ roster, matchup: matchupData })
        ]);
        
        rostersStaged++;
      }
    }
    
    console.log(`Staged ${rostersStaged} roster records`);
    
    // Step 2: Fetch player stats from Sleeper
    console.log('Fetching player stats from Sleeper...');
    let statsStaged = 0;
    
    for (let week = 1; week <= totalWeeks; week++) {
      // Sleeper's stats endpoint
      const statsUrl = `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`;
      const statsRes = await fetch(statsUrl);
      
      if (!statsRes.ok) {
        console.log(`No stats available for week ${week}`);
        continue;
      }
      
      const statsData = await statsRes.json();
      
      // Get player info from Sleeper
      const playersUrl = 'https://api.sleeper.app/v1/players/nfl';
      const playersRes = await fetch(playersUrl);
      const playersData = await playersRes.json();
      
      // Process each player's stats
      for (const [playerId, stats] of Object.entries(statsData)) {
        const playerInfo = playersData[playerId];
        
        if (!playerInfo) continue;
        
        // Calculate fantasy points (half PPR)
        const fantasyPoints = calculateFantasyPoints(stats, 'half_ppr');
        
        await query(`
          INSERT INTO staging_sleeper_player_stats (
            sleeper_player_id,
            season_year,
            week,
            player_name,
            position,
            team,
            stats,
            fantasy_points_half_ppr,
            raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (sleeper_player_id, season_year, week)
          DO UPDATE SET
            player_name = EXCLUDED.player_name,
            position = EXCLUDED.position,
            team = EXCLUDED.team,
            stats = EXCLUDED.stats,
            fantasy_points_half_ppr = EXCLUDED.fantasy_points_half_ppr,
            raw_data = EXCLUDED.raw_data,
            processed = false
        `, [
          playerId,
          season,
          week,
          playerInfo.full_name || playerInfo.first_name + ' ' + playerInfo.last_name,
          playerInfo.position,
          playerInfo.team,
          JSON.stringify(stats),
          fantasyPoints,
          JSON.stringify({ playerInfo, stats })
        ]);
        
        statsStaged++;
      }
    }
    
    console.log(`Staged ${statsStaged} player stat records`);
    
    // Step 3: Process staged rosters into main tables
    console.log('Processing rosters into main tables...');
    const rostersProcessed = await processRostersFromStaging(season_id, season);
    
    // Step 4: Process staged stats into main tables
    console.log('Processing player stats into main tables...');
    const statsProcessed = await processStatsFromStaging(season_id, season);
    
    return {
      success: true,
      season: season,
      staged: {
        rosters: rostersStaged,
        stats: statsStaged
      },
      processed: {
        rosters: rostersProcessed,
        stats: statsProcessed
      }
    };
    
  } catch (error) {
    console.error('Error archiving rosters and stats:', error);
    throw error;
  }
}

/**
 * Process rosters from staging into weekly_roster table
 */
async function processRostersFromStaging(season_id, season_year) {
  let processedCount = 0;
  
  // Get unprocessed roster records
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_weekly_rosters
    WHERE season_year = $1 AND processed = false
    ORDER BY week, roster_id
  `, [season_year]);
  
  // Get roster to team mapping
  const teamMapping = await query(`
    SELECT t.team_id, t.platform_team_id, t.manager_id
    FROM teams t
    WHERE t.season_id = $1
  `, [season_id]);
  
  const rosterMap = {};
  for (const team of teamMapping.rows) {
    rosterMap[team.platform_team_id] = { team_id: team.team_id, manager_id: team.manager_id };
  }
  
  for (const record of stagingRecords.rows) {
    const teamInfo = rosterMap[record.roster_id];
    if (!teamInfo) {
      console.log(`No team found for roster_id ${record.roster_id}`);
      continue;
    }
    
    const starters = JSON.parse(record.starters);
    const allPlayers = JSON.parse(record.players);
    
    // Insert starters
    for (const playerId of starters) {
      await query(`
        INSERT INTO weekly_roster (
          season_id,
          week,
          team_id,
          player_id,
          sleeper_player_id,
          player_name,
          position,
          lineup_slot,
          is_starter,
          platform
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (season_id, week, team_id, sleeper_player_id)
        DO UPDATE SET
          is_starter = EXCLUDED.is_starter,
          lineup_slot = EXCLUDED.lineup_slot
      `, [
        season_id,
        record.week,
        teamInfo.manager_id, // weekly_roster.team_id stores manager_id
        null, // player_id (we'll populate this later if needed)
        playerId,
        'Unknown', // We'll update with actual name from stats
        'FLEX', // Position placeholder
        'FLEX',
        true,
        'sleeper'
      ]);
      processedCount++;
    }
    
    // Insert bench players
    const benchPlayers = allPlayers.filter(p => !starters.includes(p));
    for (const playerId of benchPlayers) {
      await query(`
        INSERT INTO weekly_roster (
          season_id,
          week,
          team_id,
          player_id,
          sleeper_player_id,
          player_name,
          position,
          lineup_slot,
          is_starter,
          platform
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (season_id, week, team_id, sleeper_player_id)
        DO UPDATE SET
          is_starter = EXCLUDED.is_starter,
          lineup_slot = EXCLUDED.lineup_slot
      `, [
        season_id,
        record.week,
        teamInfo.manager_id,
        null,
        playerId,
        'Unknown',
        'BN',
        'BN',
        false,
        'sleeper'
      ]);
      processedCount++;
    }
    
    // Mark as processed
    await query(`
      UPDATE staging_sleeper_weekly_rosters
      SET processed = true
      WHERE id = $1
    `, [record.id]);
  }
  
  return processedCount;
}

/**
 * Process player stats from staging into player_fantasy_stats table
 */
async function processStatsFromStaging(season_id, season_year) {
  let processedCount = 0;
  
  // Get unprocessed stat records
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_player_stats
    WHERE season_year = $1 AND processed = false
    ORDER BY week, sleeper_player_id
  `, [season_year]);
  
  for (const record of stagingRecords.rows) {
    await query(`
      INSERT INTO player_fantasy_stats (
        season_id,
        week,
        sleeper_player_id,
        player_name,
        position,
        nfl_team,
        total_fantasy_points,
        platform
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (season_id, week, sleeper_player_id)
      DO UPDATE SET
        player_name = EXCLUDED.player_name,
        position = EXCLUDED.position,
        nfl_team = EXCLUDED.nfl_team,
        total_fantasy_points = EXCLUDED.total_fantasy_points
    `, [
      season_id,
      record.week,
      record.sleeper_player_id,
      record.player_name,
      record.position,
      record.team,
      record.fantasy_points_half_ppr,
      'sleeper'
    ]);
    
    processedCount++;
    
    // Mark as processed
    await query(`
      UPDATE staging_sleeper_player_stats
      SET processed = true
      WHERE id = $1
    `, [record.id]);
  }
  
  // Update weekly_roster with player names and positions from stats
  await query(`
    UPDATE weekly_roster wr
    SET 
      player_name = pfs.player_name,
      position = pfs.position
    FROM player_fantasy_stats pfs
    WHERE wr.season_id = $1
      AND wr.sleeper_player_id = pfs.sleeper_player_id
      AND wr.week = pfs.week
      AND wr.season_id = pfs.season_id
  `, [season_id]);
  
  return processedCount;
}

/**
 * Calculate fantasy points from Sleeper stats
 */
function calculateFantasyPoints(stats, scoringType = 'half_ppr') {
  let points = 0;
  
  // Passing
  points += (stats.pass_yd || 0) * 0.04;
  points += (stats.pass_td || 0) * 4;
  points += (stats.pass_int || 0) * -2;
  points += (stats.pass_2pt || 0) * 2;
  
  // Rushing
  points += (stats.rush_yd || 0) * 0.1;
  points += (stats.rush_td || 0) * 6;
  points += (stats.rush_2pt || 0) * 2;
  
  // Receiving
  points += (stats.rec_yd || 0) * 0.1;
  points += (stats.rec_td || 0) * 6;
  points += (stats.rec_2pt || 0) * 2;
  
  // PPR scoring
  if (scoringType === 'ppr') {
    points += (stats.rec || 0) * 1;
  } else if (scoringType === 'half_ppr') {
    points += (stats.rec || 0) * 0.5;
  }
  
  // Fumbles
  points += (stats.fum_lost || 0) * -2;
  
  return Math.round(points * 100) / 100;
}