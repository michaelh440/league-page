// src/routes/api/test_combined/+server.js
import { json } from '@sveltejs/kit';
import { 
  getCombinedStandings, 
  getCombinedDraft, 
  getAvailableSeasons,
  getCombinedMatchups,
  getCombinedWeeklyRankings,
  getCombinedWeeklyScoring,
  getCombinedPlayoffs,
  getCombinedLeagueInfo,
  getCombinedRoster,
  getCombinedAllRosters,
  getCombinedPlayerStats,
  getCombinedTopPerformers,
  getCombinedSeasonStats
} from '$lib/utils/helperFunctions/combinedDataService.js';

export async function GET({ url }) {
  const year = url.searchParams.get('year');
  const week = url.searchParams.get('week');
  const type = url.searchParams.get('type') || 'standings';
  const rosterId = url.searchParams.get('roster_id');
  const position = url.searchParams.get('position');
  const limit = url.searchParams.get('limit');
  
  try {
    let result;
    
    switch (type) {
      // Original endpoints
      case 'seasons':
        result = await getAvailableSeasons();
        break;
        
      case 'standings':
        result = await getCombinedStandings(year ? parseInt(year) : null);
        break;
        
      case 'draft':
        result = await getCombinedDraft(year ? parseInt(year) : null);
        break;
        
      case 'matchups':
        if (!week) {
          return json({ error: 'week parameter required for matchups' }, { status: 400 });
        }
        result = await getCombinedMatchups(year ? parseInt(year) : null, parseInt(week));
        break;
        
      case 'rankings':
        if (!week) {
          return json({ error: 'week parameter required for rankings' }, { status: 400 });
        }
        result = await getCombinedWeeklyRankings(year ? parseInt(year) : null, parseInt(week));
        break;
        
      case 'scoring':
        if (!week) {
          return json({ error: 'week parameter required for scoring' }, { status: 400 });
        }
        result = await getCombinedWeeklyScoring(year ? parseInt(year) : null, parseInt(week));
        break;
        
      case 'playoffs':
        result = await getCombinedPlayoffs(year ? parseInt(year) : null);
        break;
        
      case 'league':
        result = await getCombinedLeagueInfo(year ? parseInt(year) : null);
        break;
        
      // New roster and player stats endpoints
      case 'roster':
        if (!week) {
          return json({ error: 'week parameter required for roster' }, { status: 400 });
        }
        if (!rosterId) {
          return json({ error: 'roster_id parameter required for roster' }, { status: 400 });
        }
        result = await getCombinedRoster(
          year ? parseInt(year) : null, 
          parseInt(week), 
          rosterId
        );
        break;
        
      case 'all_rosters':
        if (!week) {
          return json({ error: 'week parameter required for all_rosters' }, { status: 400 });
        }
        result = await getCombinedAllRosters(
          year ? parseInt(year) : null, 
          parseInt(week)
        );
        break;
        
      case 'player_stats':
        if (!week) {
          return json({ error: 'week parameter required for player_stats' }, { status: 400 });
        }
        result = await getCombinedPlayerStats(
          year ? parseInt(year) : null, 
          parseInt(week),
          position || null
        );
        break;
        
      case 'top_performers':
        if (!week) {
          return json({ error: 'week parameter required for top_performers' }, { status: 400 });
        }
        result = await getCombinedTopPerformers(
          year ? parseInt(year) : null, 
          parseInt(week),
          limit ? parseInt(limit) : 10
        );
        break;
        
      case 'season_stats':
        result = await getCombinedSeasonStats(
          year ? parseInt(year) : null,
          position || null
        );
        break;
        
      default:
        return json({ 
          error: 'Invalid type parameter',
          validTypes: [
            'seasons', 'standings', 'draft', 'matchups', 'rankings', 
            'scoring', 'playoffs', 'league', 'roster', 'all_rosters',
            'player_stats', 'top_performers', 'season_stats'
          ]
        }, { status: 400 });
    }
    
    // If result is null, it means the data should come from Sleeper API
    if (result === null) {
      return json({ 
        message: 'Data for this year should be fetched from Sleeper API',
        year: year,
        type: type
      });
    }
    
    return json(result);
  } catch (error) {
    console.error('Error in test_combined endpoint:', error);
    return json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}