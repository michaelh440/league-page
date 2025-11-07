// src/routes/api/archive_rosters_stats/+server.js
import { json } from '@sveltejs/kit';
import { archiveRostersAndStats } from '$lib/utils/helperFunctions/rosterStatsArchival.js';

export async function GET({ url }) {
  const leagueID = url.searchParams.get('league_id');
  const season = url.searchParams.get('season');
  
  if (!leagueID || !season) {
    return json({ 
      error: 'Missing required parameters: league_id and season' 
    }, { status: 400 });
  }
  
  try {
    const result = await archiveRostersAndStats(leagueID, parseInt(season));
    return json(result);
  } catch (error) {
    console.error('Error in archive_rosters_stats endpoint:', error);
    return json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}