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
  
  // Check if already archived - use explicit column references
  const existingCheck = await query(
    `SELECT s.season_id, s.league_id 
     FROM seasons s 
     INNER JOIN leagues l ON s.league_id = l.league_id 
     WHERE l.platform_id = $1 
       AND s.season_year = $2 
       AND l.platform = 'sleeper'`,
    [leagueID, season]
  );
  
  if (existingCheck.rows.length === 0) {
    return { error: 'League not found in database. Please run full archive first.' };
  }
  
  const seasonId = existingCheck.rows[0].season_id;
  const dbLeagueId = existingCheck.rows[0].league_id;
  
  console.log(`Found season_id: ${seasonId}, league_id: ${dbLeagueId}`);
  
  // Archive draft
  await archiveDraft(leagueID, dbLeagueId, seasonId, season);
  
  return { success: true, season, message: 'Draft archived successfully' };
}

async function archiveDraft(leagueID, dbLeagueId, seasonId, season) {
  console.log('Fetching drafts from Sleeper API...');
  
  // Get drafts for this league
  const draftsRes = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/drafts`);
  const drafts = await draftsRes.json();
  
  console.log(`Found ${drafts.length} draft(s)`);
  
  for (const draft of drafts) {
    if (draft.status !== 'complete') {
      console.log(`Draft ${draft.draft_id} is not complete, skipping...`);
      continue;
    }
    
    console.log(`Processing draft ${draft.draft_id}`);
    
    // Get draft picks
    const picksRes = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
    const picks = await picksRes.json();
    
    console.log(`Found ${picks.length} picks in draft`);
    
    // Check if draft already exists by platform_draft_id
    const existingDraft = await query(`
      SELECT draft_id FROM drafts 
      WHERE platform_draft_id = $1 AND platform = 'sleeper'
    `, [draft.draft_id]);
    
    let draftDbId;
    
    if (existingDraft.rows.length > 0) {
      draftDbId = existingDraft.rows[0].draft_id;
      console.log(`Draft already exists with ID ${draftDbId}, will update picks...`);
    } else {
      // Insert new draft record
      const draftResult = await query(`
        INSERT INTO drafts (
          season_id, season_year, draft_name, draft_type,
          total_rounds, draft_status, platform, platform_draft_id
        )
        VALUES ($1, $2, $3, $4, $5, 'completed', 'sleeper', $6)
        RETURNING draft_id
      `, [
        seasonId,
        season,
        draft.metadata?.name || 'Draft',
        draft.type,
        draft.settings.rounds,
        draft.draft_id
      ]);
      
      draftDbId = draftResult.rows[0].draft_id;
      console.log(`Created new draft record with ID ${draftDbId}`);
    }
    
    // Insert picks
    let successCount = 0;
    let skipCount = 0;
    
    for (const pick of picks) {
      // Get manager_id and team_id from roster
      const rosterInfo = await query(`
        SELECT t.team_id, t.manager_id, m.username
        FROM teams t
        INNER JOIN managers m ON t.manager_id = m.manager_id
        WHERE t.platform_team_id = $1 
          AND t.season_id = $2
      `, [pick.roster_id.toString(), seasonId]);
      
      if (rosterInfo.rows.length === 0) {
        console.log(`Roster ${pick.roster_id} not found for pick ${pick.pick_no}, skipping`);
        skipCount++;
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
      
      successCount++;
    }
    
    console.log(`Archived ${successCount} picks successfully, skipped ${skipCount}`);
  }
}