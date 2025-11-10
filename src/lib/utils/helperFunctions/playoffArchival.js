// src/lib/utils/helperFunctions/playoffArchival.js
import { query } from '$lib/db';

/**
 * Archive playoff roster and player stats data for a Sleeper season (one week at a time)
 * @param {string} leagueID - Sleeper league ID
 * @param {number} season - Season year
 * @param {number} week - Playoff week number to archive
 * @returns {Promise<Object>}
 */
export async function archivePlayoffData(leagueID, season, week) {
  console.log(`Starting playoff archive for league ${leagueID}, season ${season}, week ${week}`);
  
  try {
    // Get season_id from database
    const seasonResult = await query(`
      SELECT s.season_id, l.reg_season_length
      FROM seasons s
      JOIN leagues l ON s.league_id = l.league_id
      WHERE s.season_year = $1 AND l.platform = 'sleeper'
    `, [season]);
    
    if (seasonResult.rows.length === 0) {
      throw new Error('Season not found in database');
    }
    
    const { season_id, reg_season_length } = seasonResult.rows[0];
    
    console.log(`Archiving week ${week} as playoff data (reg_season_length: ${reg_season_length})`);
    
    // Get league roster positions
    const leagueUrl = `https://api.sleeper.app/v1/league/${leagueID}`;
    const leagueRes = await fetch(leagueUrl);
    const leagueData = await leagueRes.json();
    const rosterPositions = leagueData.roster_positions;
    
    console.log('League roster positions:', rosterPositions);
    
    // Step 1: Fetch and stage roster data
    console.log(`Fetching playoff rosters for week ${week} from Sleeper...`);
    let teamsStaged = 0;
    
    // Fetch player data once
    const playersUrl = 'https://api.sleeper.app/v1/players/nfl';
    const playersRes = await fetch(playersUrl);
    const playersData = await playersRes.json();
    console.log('Fetched player data from Sleeper');
    
    const rostersUrl = `https://api.sleeper.app/v1/league/${leagueID}/rosters`;
    const rostersRes = await fetch(rostersUrl);
    const rostersData = await rostersRes.json();
    
    // Get matchup data
    const matchupsUrl = `https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`;
    const matchupsRes = await fetch(matchupsUrl);
    const matchupsData = await matchupsRes.json();
    
    for (const roster of rostersData) {
      const matchupData = matchupsData.find(m => m.roster_id === roster.roster_id);
      
      if (!matchupData) continue;
      
      // Create position and name maps
      const playerPositions = {};
      const playerNames = {};
      if (roster.players) {
        roster.players.forEach(playerId => {
          const playerInfo = playersData[playerId];
          
          if (playerInfo) {
            playerPositions[playerId] = playerInfo.position;
            playerNames[playerId] = playerInfo.full_name || 
                                    `${playerInfo.first_name} ${playerInfo.last_name}`;
          } else if (playerId.length <= 3 && playerId === playerId.toUpperCase()) {
            playerPositions[playerId] = 'DEF';
            playerNames[playerId] = playerId;
          } else {
            console.warn(`Player ${playerId} not found in Sleeper player data`);
            playerPositions[playerId] = null;
            playerNames[playerId] = `Unknown (${playerId})`;
          }
        });
      }
      
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
        JSON.stringify({ positions: playerPositions, names: playerNames }),
        JSON.stringify(rosterPositions),
        JSON.stringify({ roster, matchup: matchupData })
      ]);
      
      teamsStaged++;
    }
    
    console.log(`Staged ${teamsStaged} team rosters`);
    
    // Step 2: Fetch player stats
    console.log(`Fetching player stats for playoff week ${week} from Sleeper...`);
    let statsStaged = 0;
    
    const statsUrl = `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`;
    const statsRes = await fetch(statsUrl);
    
    if (!statsRes.ok) {
      console.log(`No stats available for week ${week}`);
    } else {
      const statsData = await statsRes.json();
      
      for (const [playerId, stats] of Object.entries(statsData)) {
        const playerInfo = playersData[playerId];
        
        if (!playerInfo) continue;
        
        const fantasyPoints = calculateFantasyPoints(stats, 'half_ppr');
        const playerTeam = playerInfo.team || 'FA';
        
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
          playerTeam,
          JSON.stringify(stats),
          fantasyPoints,
          JSON.stringify({ playerInfo, stats })
        ]);
        
        statsStaged++;
      }
    }
    
    console.log(`Staged ${statsStaged} player stat records`);
    
    // Step 3: Process rosters
    console.log('Processing rosters into playoff_roster table...');
    let playerRecordsProcessed = 0;
    try {
      playerRecordsProcessed = await processPlayoffRostersFromStaging(season_id, season, week);
      console.log(`Successfully processed ${playerRecordsProcessed} player roster records`);
    } catch (error) {
      console.error('Error processing playoff rosters:', error);
      throw error;
    }
    
    // Step 4: Process stats
    console.log('Processing player stats into playoff_fantasy_stats table...');
    let statsProcessed = 0;
    try {
      statsProcessed = await processPlayoffStatsFromStaging(season_id, season, week);
      console.log(`Successfully processed ${statsProcessed} player stats`);
    } catch (error) {
      console.error('Error processing playoff stats:', error);
      throw error;
    }
    
    return {
      success: true,
      season: season,
      week: week,
      staged: {
        teams: teamsStaged,  // Number of team rosters staged
        stats: statsStaged   // Number of player stats staged
      },
      processed: {
        playerRecords: playerRecordsProcessed,  // Number of individual player records
        stats: statsProcessed                    // Number of player stats processed
      }
    };
    
  } catch (error) {
    console.error('Error archiving playoff data:', error);
    throw error;
  }
}

/**
 * Process rosters from staging into playoff_roster table
 */
async function processPlayoffRostersFromStaging(season_id, season_year, week) {
  let processedCount = 0;
  
  const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  
  console.log(`Processing playoff rosters for season_id=${season_id}, year=${season_year}, week=${week}`);
  
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_weekly_rosters
    WHERE season_year = $1 AND week = $2 AND processed = false
    ORDER BY roster_id
  `, [season_year, week]);
  
  console.log(`Found ${stagingRecords.rows.length} unprocessed playoff roster records for week ${week}`);
  
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
    
    const starters = Array.isArray(record.starters) ? record.starters : JSON.parse(record.starters);
    const allPlayers = Array.isArray(record.players) ? record.players : JSON.parse(record.players);
    
    const playerData = record.starters_with_positions || {};
    let playerPositions = {};
    let playerNames = {};
    
    if (playerData.positions && playerData.names) {
      playerPositions = playerData.positions;
      playerNames = playerData.names;
    } else {
      playerPositions = playerData;
      playerNames = {};
    }
    
    const leagueSlots = record.bench_with_positions || [];
    
    const slotAssignments = {};
    starters.forEach((playerId, index) => {
      const lineupSlot = leagueSlots[index];
      let normalizedSlot = lineupSlot;
      if (lineupSlot === 'WRRB_FLEX') normalizedSlot = 'FLEX';
      if (lineupSlot === 'REC_FLEX') normalizedSlot = 'FLEX';
      if (lineupSlot === 'SUPER_FLEX') normalizedSlot = 'FLEX';
      
      slotAssignments[playerId] = normalizedSlot || 'FLEX';
    });
    
    // Insert starters
    for (const playerId of starters) {
      const playerPosition = playerPositions[playerId];
      const playerName = playerNames[playerId] || 'Unknown Player';
      const lineupSlot = slotAssignments[playerId] || playerPosition || 'FLEX';
      
      if (!playerPosition) {
        console.warn(`Skipping playoff starter ${playerId} - no position found`);
        continue;
      }
      
      if (!validPositions.includes(playerPosition)) {
        console.warn(`Skipping playoff starter ${playerId} (${playerName}) - invalid position: ${playerPosition}`);
        continue;
      }
      
      const existing = await query(`
        SELECT 1 FROM playoff_roster
        WHERE season_id = $1 AND week = $2 AND team_id = $3 AND sleeper_player_id = $4
      `, [season_id, record.week, teamInfo.manager_id, playerId]);
      
      if (existing.rows.length > 0) {
        await query(`
          UPDATE playoff_roster
          SET is_starter = $1, lineup_slot = $2, position = $3, player_name = $4
          WHERE season_id = $5 AND week = $6 AND team_id = $7 AND sleeper_player_id = $8
        `, [true, lineupSlot, playerPosition, playerName, season_id, record.week, teamInfo.manager_id, playerId]);
      } else {
        await query(`
          INSERT INTO playoff_roster (
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
        `, [
          season_id,
          record.week,
          teamInfo.manager_id,
          null,
          playerId,
          playerName,
          playerPosition,
          lineupSlot,
          true,
          'sleeper'
        ]);
      }
      processedCount++;
    }
    
    // Insert bench players
    const benchPlayers = allPlayers.filter(p => !starters.includes(p));
    for (const playerId of benchPlayers) {
      const playerPosition = playerPositions[playerId];
      const playerName = playerNames[playerId] || 'Unknown Player';
      
      if (!playerPosition) {
        console.warn(`Skipping playoff bench player ${playerId} - no position found`);
        continue;
      }
      
      if (!validPositions.includes(playerPosition)) {
        console.warn(`Skipping playoff bench player ${playerId} (${playerName}) - invalid position: ${playerPosition}`);
        continue;
      }
      
      const existing = await query(`
        SELECT 1 FROM playoff_roster
        WHERE season_id = $1 AND week = $2 AND team_id = $3 AND sleeper_player_id = $4
      `, [season_id, record.week, teamInfo.manager_id, playerId]);
      
      if (existing.rows.length > 0) {
        await query(`
          UPDATE playoff_roster
          SET is_starter = $1, lineup_slot = $2, position = $3, player_name = $4
          WHERE season_id = $5 AND week = $6 AND team_id = $7 AND sleeper_player_id = $8
        `, [false, 'BN', playerPosition, playerName, season_id, record.week, teamInfo.manager_id, playerId]);
      } else {
        await query(`
          INSERT INTO playoff_roster (
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
        `, [
          season_id,
          record.week,
          teamInfo.manager_id,
          null,
          playerId,
          playerName,
          playerPosition,
          'BN',
          false,
          'sleeper'
        ]);
      }
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
 * Process player stats from staging into playoff_fantasy_stats table
 */
async function processPlayoffStatsFromStaging(season_id, season_year, week) {
  let processedCount = 0;
  let skippedCount = 0;
  
  const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  
  console.log(`Processing playoff stats for season_id=${season_id}, year=${season_year}, week=${week}`);
  
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_player_stats
    WHERE season_year = $1 AND week = $2 AND processed = false
    ORDER BY sleeper_player_id
  `, [season_year, week]);
  
  console.log(`Found ${stagingRecords.rows.length} unprocessed playoff stat records for week ${week}`);
  
  for (const record of stagingRecords.rows) {
    if (!record.position) {
      console.warn(`Skipping player ${record.sleeper_player_id} (${record.player_name}) - no position found`);
      skippedCount++;
      continue;
    }
    
    if (!validPositions.includes(record.position)) {
      console.warn(`Skipping player ${record.sleeper_player_id} (${record.player_name}) - invalid position: ${record.position}`);
      skippedCount++;
      continue;
    }
    
    const existing = await query(`
      SELECT 1 FROM playoff_fantasy_stats
      WHERE season_id = $1 AND week = $2 AND sleeper_player_id = $3
    `, [season_id, record.week, record.sleeper_player_id]);
    
    if (existing.rows.length > 0) {
      await query(`
        UPDATE playoff_fantasy_stats
        SET 
          player_name = $1,
          position = $2,
          nfl_team = $3,
          total_fantasy_points = $4
        WHERE season_id = $5 AND week = $6 AND sleeper_player_id = $7
      `, [
        record.player_name,
        record.position,
        record.team,
        record.fantasy_points_half_ppr,
        season_id,
        record.week,
        record.sleeper_player_id
      ]);
    } else {
      await query(`
        INSERT INTO playoff_fantasy_stats (
          season_id,
          week,
          sleeper_player_id,
          player_name,
          position,
          nfl_team,
          total_fantasy_points,
          platform
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
    }
    
    processedCount++;
    
    await query(`
      UPDATE staging_sleeper_player_stats
      SET processed = true
      WHERE id = $1
    `, [record.id]);
  }
  
  console.log(`Processed ${processedCount} playoff stats, skipped ${skippedCount} invalid positions`);
  
  // Update playoff_roster with player names
  await query(`
    UPDATE playoff_roster pr
    SET 
      player_name = pfs.player_name,
      position = pfs.position
    FROM playoff_fantasy_stats pfs
    WHERE pr.season_id = $1
      AND pr.week = $2
      AND pr.sleeper_player_id = pfs.sleeper_player_id
      AND pr.season_id = pfs.season_id
  `, [season_id, week]);
  
  return processedCount;
}

/**
 * Calculate fantasy points from Sleeper stats
 */
function calculateFantasyPoints(stats, scoringType = 'half_ppr') {
  let points = 0;
  
  points += (stats.pass_yd || 0) * 0.04;
  points += (stats.pass_td || 0) * 4;
  points += (stats.pass_int || 0) * -2;
  points += (stats.pass_2pt || 0) * 2;
  
  points += (stats.rush_yd || 0) * 0.1;
  points += (stats.rush_td || 0) * 6;
  points += (stats.rush_2pt || 0) * 2;
  
  points += (stats.rec_yd || 0) * 0.1;
  points += (stats.rec_td || 0) * 6;
  points += (stats.rec_2pt || 0) * 2;
  
  if (scoringType === 'ppr') {
    points += (stats.rec || 0) * 1;
  } else if (scoringType === 'half_ppr') {
    points += (stats.rec || 0) * 0.5;
  }
  
  points += (stats.fum_lost || 0) * -2;
  
  return Math.round(points * 100) * 100;
}