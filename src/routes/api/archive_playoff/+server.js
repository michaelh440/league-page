// src/routes/api/archive_playoff/+server.js
import { json } from '@sveltejs/kit';
import { archivePlayoffData } from '$lib/utils/helperFunctions/playoffArchival.js';

export async function GET({ url }) {
  try {
    const leagueId = url.searchParams.get('league_id');
    const season = parseInt(url.searchParams.get('season'));
    const week = parseInt(url.searchParams.get('week'));
    
    if (!leagueId || !season || !week) {
      return json({
        success: false,
        error: 'Missing required parameters: league_id, season, and week'
      }, { status: 400 });
    }
    
    const result = await archivePlayoffData(leagueId, season, week);
    return json(result);
    
  } catch (error) {
    console.error('Playoff archive error:', error);
    return json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}