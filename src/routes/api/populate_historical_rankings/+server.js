// src/routes/api/populate_historical_rankings/+server.js
// Populate the FINAL historical_rankings record for a completed season from
// team_rankings (regular season rank) + the playoffs bracket (final rank / status).
import { json } from '@sveltejs/kit';
import { populateHistoricalRankings } from '$lib/utils/helperFunctions/historicalRankings.js';

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
