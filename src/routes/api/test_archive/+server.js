// src/routes/api/test_archive/+server.js
import { json } from '@sveltejs/kit';
import { archiveSeasonToPostgres } from '$lib/utils/helperFunctions/historicalData.js';

export async function GET({ url }) {
  const leagueID = url.searchParams.get('league_id');
  
  if (!leagueID) {
    return json({ error: 'Missing league_id parameter' }, { status: 400 });
  }
  
  try {
    const result = await archiveSeasonToPostgres(leagueID);
    return json(result);
  } catch (error) {
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}