// src/routes/api/populate_historical_rankings/+server.js
//
// GET  ?season=YYYY  -> PREVIEW: compute what would be written + what's currently stored.
// POST { season }    -> WRITE: replace the season's historical_rankings rows.
import { json } from '@sveltejs/kit';
import {
	computeHistoricalRankings,
	getCurrentHistoricalRankings,
	populateHistoricalRankings
} from '$lib/utils/helperFunctions/historicalRankings.js';

export async function GET({ url }) {
	try {
		const season = url.searchParams.get('season');
		if (!season) {
			return json({ success: false, error: 'Missing required parameter: season' }, { status: 400 });
		}

		const computed = await computeHistoricalRankings(parseInt(season));
		const current = await getCurrentHistoricalRankings(computed.seasonYear);

		return json({ success: true, ...computed, current });
	} catch (error) {
		console.error('Error previewing historical rankings:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const { season } = await request.json();
		if (!season) {
			return json({ success: false, error: 'Missing required parameter: season' }, { status: 400 });
		}

		const result = await populateHistoricalRankings(parseInt(season));
		return json({ success: true, ...result });
	} catch (error) {
		console.error('Error populating historical rankings:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
