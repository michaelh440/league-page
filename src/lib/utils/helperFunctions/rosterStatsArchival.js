// src/lib/utils/helperFunctions/rosterStatsArchival.js
import { query } from '$lib/db';

/**
 * Archive roster and player stats data for a Sleeper season (one week at a time)
 * @param {string} leagueID - Sleeper league ID
 * @param {number} season - Season year
 * @param {number} week - Week number to archive
 * @returns {Promise<Object>}
 */
export async function archiveRostersAndStats(leagueID, season, week) {
  console.log(`Starting roster and stats archive for league ${leagueID}, season ${season}, week ${week}`);
  
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
    
    const { season_id } = seasonResult.rows[0];
    
    // Get league roster positions to know the lineup structure
    const leagueUrl = `https://api.sleeper.app/v1/league/${leagueID}`;
    const leagueRes = await fetch(leagueUrl);
    const leagueData = await leagueRes.json();
    const rosterPositions = leagueData.roster_positions; // Array like ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF']
    
    console.log('League roster positions:', rosterPositions);
    
    // Step 1: Fetch and stage roster data for this week
    console.log(`Fetching rosters for week ${week} from Sleeper...`);
    let rostersStaged = 0;
    
    // Fetch player data once for the whole week
    const playersUrl = 'https://api.sleeper.app/v1/players/nfl';
    const playersRes = await fetch(playersUrl);
    const playersData = await playersRes.json();
    console.log('Fetched player data from Sleeper');
    
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
      
      // Create position and name maps from player IDs using the already-fetched player data
      const playerPositions = {};
      const playerNames = {};
      if (roster.players) {
        roster.players.forEach(playerId => {
          const playerInfo = playersData[playerId];
          
          if (playerInfo) {
            // Regular player
            playerPositions[playerId] = playerInfo.position;
            playerNames[playerId] = playerInfo.full_name || 
                                    `${playerInfo.first_name} ${playerInfo.last_name}`;
          } else if (playerId.length <= 3 && playerId === playerId.toUpperCase()) {
            // This looks like a defense team abbreviation (MIA, PIT, etc.)
            playerPositions[playerId] = 'DEF';
            playerNames[playerId] = playerId; // Use team abbreviation as name for now
          } else {
            // Unknown player - log warning but continue
            console.warn(`Player ${playerId} not found in Sleeper player data`);
            playerPositions[playerId] = null;
            playerNames[playerId] = `Unknown (${playerId})`;
          }
        });
      }
      
      // Insert into staging table with roster positions
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
        JSON.stringify({ positions: playerPositions, names: playerNames }), // Player positions AND names
        JSON.stringify(rosterPositions), // League's lineup slot structure
        JSON.stringify({ roster, matchup: matchupData })
      ]);
      
      rostersStaged++;
    }
    
    console.log(`Staged ${rostersStaged} roster records`);
    
    // Step 2: Fetch player stats from Sleeper for this week
    console.log(`Fetching player stats for week ${week} from Sleeper...`);
    let statsStaged = 0;
    
    // Sleeper's stats endpoint
    const statsUrl = `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`;
    const statsRes = await fetch(statsUrl);
    
    if (!statsRes.ok) {
      console.log(`No stats available for week ${week}`);
    } else {
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
    let rostersProcessed = 0;
    try {
      rostersProcessed = await processRostersFromStaging(season_id, season, week);
      console.log(`Successfully processed ${rostersProcessed} rosters`);
    } catch (error) {
      console.error('Error processing rosters:', error);
      throw error;
    }
    
    // Step 4: Process staged stats into main tables
    console.log('Processing player stats into main tables...');
    let statsProcessed = 0;
    try {
      statsProcessed = await processStatsFromStaging(season_id, season, week);
      console.log(`Successfully processed ${statsProcessed} stats`);
    } catch (error) {
      console.error('Error processing stats:', error);
      throw error;
    }
    
    return {
      success: true,
      season: season,
      week: week,
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
async function processRostersFromStaging(season_id, season_year, week) {
  let processedCount = 0;
  
  console.log(`Processing rosters for season_id=${season_id}, year=${season_year}, week=${week}`);
  
  // Get unprocessed roster records for this week
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_weekly_rosters
    WHERE season_year = $1 AND week = $2 AND processed = false
    ORDER BY roster_id
  `, [season_year, week]);
  
  console.log(`Found ${stagingRecords.rows.length} unprocessed roster records`);
  
  // Get roster to team mapping
  const teamMapping = await query(`
    SELECT t.team_id, t.platform_team_id, t.manager_id
    FROM teams t
    WHERE t.season_id = $1
  `, [season_id]);
  
  console.log(`Found ${teamMapping.rows.length} teams for mapping`);
  
  const rosterMap = {};
  for (const team of teamMapping.rows) {
    rosterMap[team.platform_team_id] = { team_id: team.team_id, manager_id: team.manager_id };
  }
  
  console.log('Roster map:', rosterMap);
  
  for (const record of stagingRecords.rows) {
    const teamInfo = rosterMap[record.roster_id];
    if (!teamInfo) {
      console.log(`No team found for roster_id ${record.roster_id}`);
      continue;
    }
    
    console.log(`Processing roster_id ${record.roster_id} for team ${teamInfo.manager_id}`);
    
    // Data from database is already parsed (JSONB returns objects, not strings)
    const starters = Array.isArray(record.starters) ? record.starters : JSON.parse(record.starters);
    const allPlayers = Array.isArray(record.players) ? record.players : JSON.parse(record.players);
    const playerData = record.starters_with_positions || {}; // Contains positions and names
    const playerPositions = playerData.positions || {};
    const playerNames = playerData.names || {};
    const leagueSlots = record.bench_with_positions || []; // League lineup structure from roster_positions
    
    console.log(`  Starters: ${starters.length}, All players: ${allPlayers.length}`);
    console.log(`  League slots:`, leagueSlots);
    
    // Map each starter to its lineup slot based on order
    const slotAssignments = {};
    starters.forEach((playerId, index) => {
      const lineupSlot = leagueSlots[index];
      // Handle special Sleeper slot names
      let normalizedSlot = lineupSlot;
      if (lineupSlot === 'WRRB_FLEX') normalizedSlot = 'FLEX';
      if (lineupSlot === 'REC_FLEX') normalizedSlot = 'FLEX';
      if (lineupSlot === 'SUPER_FLEX') normalizedSlot = 'FLEX';
      
      slotAssignments[playerId] = normalizedSlot || 'FLEX';
    });
    
    // Insert starters
    for (const playerId of starters) {
      const playerPosition = playerPositions[playerId]; // Actual NFL position (QB, RB, WR, etc.)
      const playerName = playerNames[playerId] || 'Unknown Player'; // Actual player name
      const lineupSlot = slotAssignments[playerId] || playerPosition || 'FLEX'; // Use assigned slot or fallback
      
      // Skip if position is null (player not found)
      if (!playerPosition) {
        console.warn(`Skipping starter ${playerId} - no position found`);
        continue;
      }
      
      // Check if already exists
      const existing = await query(`
        SELECT 1 FROM weekly_roster
        WHERE season_id = $1 AND week = $2 AND team_id = $3 AND sleeper_player_id = $4
      `, [season_id, record.week, teamInfo.manager_id, playerId]);
      
      if (existing.rows.length > 0) {
        // Update existing
        await query(`
          UPDATE weekly_roster
          SET is_starter = $1, lineup_slot = $2, position = $3
          WHERE season_id = $4 AND week = $5 AND team_id = $6 AND sleeper_player_id = $7
        `, [true, lineupSlot, playerPosition, season_id, record.week, teamInfo.manager_id, playerId]);
      } else {
        // Insert new
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
        `, [
          season_id,
          record.week,
          teamInfo.manager_id,
          null,
          playerId,
          playerName, // Actual player name from Sleeper
          playerPosition, // Actual NFL position
          lineupSlot, // Fantasy lineup slot (QB, RB, WR, TE, FLEX, K, DEF)
          true,
          'sleeper'
        ]);
      }
      processedCount++;
    }
    
    // Insert bench players
    const benchPlayers = allPlayers.filter(p => !starters.includes(p));
    for (const playerId of benchPlayers) {
      const playerPosition = playerPositions[playerId]; // Actual NFL position
      const playerName = playerNames[playerId] || 'Unknown Player'; // Actual player name
      
      // Skip if position is null (player not found)
      if (!playerPosition) {
        console.warn(`Skipping bench player ${playerId} - no position found`);
        continue;
      }
      
      // Check if already exists
      const existing = await query(`
        SELECT 1 FROM weekly_roster
        WHERE season_id = $1 AND week = $2 AND team_id = $3 AND sleeper_player_id = $4
      `, [season_id, record.week, teamInfo.manager_id, playerId]);
      
      if (existing.rows.length > 0) {
        // Update existing
        await query(`
          UPDATE weekly_roster
          SET is_starter = $1, lineup_slot = $2, position = $3
          WHERE season_id = $4 AND week = $5 AND team_id = $6 AND sleeper_player_id = $7
        `, [false, 'BN', playerPosition, season_id, record.week, teamInfo.manager_id, playerId]);
      } else {
        // Insert new
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
        `, [
          season_id,
          record.week,
          teamInfo.manager_id,
          null,
          playerId,
          playerName, // Actual player name from Sleeper
          playerPosition, // Actual NFL position
          'BN', // Fantasy lineup slot - on bench
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
 * Process player stats from staging into player_fantasy_stats table
 */
async function processStatsFromStaging(season_id, season_year, week) {
  let processedCount = 0;
  
  // Get unprocessed stat records for this week
  const stagingRecords = await query(`
    SELECT * FROM staging_sleeper_player_stats
    WHERE season_year = $1 AND week = $2 AND processed = false
    ORDER BY sleeper_player_id
  `, [season_year, week]);
  
  for (const record of stagingRecords.rows) {
    // Check if already exists
    const existing = await query(`
      SELECT 1 FROM player_fantasy_stats
      WHERE season_id = $1 AND week = $2 AND sleeper_player_id = $3
    `, [season_id, record.week, record.sleeper_player_id]);
    
    if (existing.rows.length > 0) {
      // Update existing
      await query(`
        UPDATE player_fantasy_stats
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
      // Insert new
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