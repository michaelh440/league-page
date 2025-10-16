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
    `SELECT season_id FROM seasons s 
     JOIN leagues l ON s.league_id = l.league_id 
     WHERE l.platform_id = $1 AND s.season_year = $2 AND l.platform = 'sleeper'`,
    [leagueID, season]
  );
  
  if (existingCheck.rows.length > 0) {
    console.log(`Season ${season} already archived`);
    return { alreadyArchived: true, season };
  }
  
  // Archive the season (we'll add this next)
  return { success: true, season, message: 'Archive function ready - implementation next' };
}