// src/routes/api/test_combined/+server.js
import { json } from '@sveltejs/kit';
import { getCombinedStandings, getCombinedDraft, getAvailableSeasons } from '$lib/utils/helperFunctions/combinedDataService.js';

export async function GET({ url }) {
  const year = url.searchParams.get('year');
  const type = url.searchParams.get('type') || 'standings';
  
  try {
    let result;
    
    if (type === 'seasons') {
      result = await getAvailableSeasons();
    } else if (type === 'standings') {
      result = await getCombinedStandings(year ? parseInt(year) : null);
    } else if (type === 'draft') {
      result = await getCombinedDraft(year ? parseInt(year) : null);
    }
    
    return json(result);
  } catch (error) {
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}