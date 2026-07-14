// src/routes/api/stage_playoff_matchups/+server.js
// Derive a playoff week's matchups from Sleeper's brackets and stage them into
// staging_sleeper_playoffs (no production writes).
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { stagePlayoffMatchups } from '$lib/utils/helperFunctions/playoffBrackets.js';

export async function POST({ request }) {
	try {
		const { season, week } = await request.json();
		if (!season || !week) {
			return json({ success: false, error: 'Missing required parameters: season, week' }, { status: 400 });
		}

		const seasonRes = await query(
			`SELECT s.season_id, l.platform_id AS sleeper_league_id
			 FROM seasons s JOIN leagues l ON s.league_id = l.league_id
			 WHERE s.season_year = $1 AND s.platform = 'sleeper' LIMIT 1`,
			[season]
		);
		if (!seasonRes.rows.length) {
			return json({ success: false, error: `Sleeper season ${season} not found` }, { status: 400 });
		}
		const { season_id, sleeper_league_id } = seasonRes.rows[0];

		const staged = await stagePlayoffMatchups(sleeper_league_id, season_id, parseInt(season), parseInt(week));

		return json({ success: true, season: parseInt(season), week: parseInt(week), staged });
	} catch (error) {
		console.error('Error staging playoff matchups:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
