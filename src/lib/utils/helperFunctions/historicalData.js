// src/lib/utils/helperFunctions/historicalData.js
import { query } from '$lib/db';

/**
 * Archive a complete Sleeper season to Postgres
 */
export async function archiveSeasonToPostgres(leagueID) {
  console.log(`Starting archive for league ${leagueID}`);
  
  // Fetch league data from Sleeper
  const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${leagueID}`);
  const leagueData = await leagueRes.json();
  
  if (leagueData.status !== 'complete') {
    throw new Error('Season must be complete before archiving');
  }
  
  const season = parseInt(leagueData.season);
  console.log(`Archiving season ${season}`);
  
  // Check if already archived
  const existingCheck = await query(
    `SELECT season_id, league_id FROM seasons s 
     JOIN leagues l ON s.league_id = l.league_id 
     WHERE l.platform_id = $1 AND s.season_year = $2 AND l.platform = 'sleeper'`,
    [leagueID, season]
  );
  
  if (existingCheck.rows.length === 0) {
    return { error: 'League not found in database. Please run full archive first.' };
  }
  
  const seasonId = existingCheck.rows[0].season_id;
  const dbLeagueId = existingCheck.rows[0].league_id;
  
  // Archive draft
  await archiveDraft(leagueID, dbLeagueId, seasonId, season);
  
  return { success: true, season, message: 'Draft archived successfully' };
}

async function archiveDraft(leagueID, dbLeagueId, seasonId, season) {
  console.log('Fetching drafts...');
  
  // Get drafts for this league
  const draftsRes = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/drafts`);
  const drafts = await draftsRes.json();
  
  for (const draft of drafts) {
    if (draft.status !== 'complete') continue;
    
    console.log(`Processing draft ${draft.draft_id}`);
    
    // Get draft picks
    const picksRes = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
    const picks = await picksRes.json();
    
    // Insert draft record
    const draftResult = await query(`
      INSERT INTO drafts (
        season_id, season_year, draft_name, draft_type,
        total_rounds, draft_status, platform, platform_draft_id
      )
      VALUES ($1, $2, $3, $4, $5, 'completed', 'sleeper', $6)
      ON CONFLICT DO NOTHING
      RETURNING draft_id
    `, [
      seasonId,
      season,
      draft.metadata?.name || 'Draft',
      draft.type,
      draft.settings.rounds,
      draft.draft_id
    ]);
    
    if (draftResult.rows.length === 0) {
      console.log('Draft already exists, skipping...');
      continue;
    }
    
    const draftDbId = draftResult.rows[0].draft_id;
    console.log(`Created draft record with ID ${draftDbId}`);
    
    // Insert picks
    for (const pick of picks) {
      // Get manager_id and team_id from roster
      const rosterInfo = await query(`
        SELECT t.team_id, t.manager_id, m.username
        FROM teams t
        JOIN managers m ON t.manager_id = m.manager_id
        WHERE t.platform_team_id = $1 AND t.season_id = $2
      `, [pick.roster_id.toString(), seasonId]);
      
      if (rosterInfo.rows.length === 0) {
        console.log(`Roster ${pick.roster_id} not found, skipping pick`);
        continue;
      }
      
      const { team_id, manager_id, username } = rosterInfo.rows[0];
      
      const playerName = pick.metadata?.first_name && pick.metadata?.last_name
        ? `${pick.metadata.first_name} ${pick.metadata.last_name}`
        : 'Unknown Player';
      
      await query(`
        INSERT INTO draft_picks (
          draft_id, pick_number, round_number, pick_in_round,
          manager_id, team_id, player_name, manager_name, player_nfl_team
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (draft_id, pick_number) DO NOTHING
      `, [
        draftDbId,
        pick.pick_no,
        pick.round,
        pick.draft_slot,
        manager_id,
        team_id,
        playerName,
        username,
        pick.metadata?.team || 'FA'
      ]);
    }
    
    console.log(`Archived ${picks.length} picks`);
  }
}