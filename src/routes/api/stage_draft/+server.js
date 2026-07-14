// src/routes/api/stage_draft/+server.js
// Fetch a season's completed draft + picks from the Sleeper API into the staging
// tables (staging_sleeper_drafts, staging_sleeper_draft_picks). No production writes.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const seasonYear = parseInt(body.season);
		let sleeperLeagueId = body.sleeperLeagueId;

		if (!seasonYear) {
			return json({ success: false, error: 'Missing required parameter: season' }, { status: 400 });
		}

		// Resolve the Sleeper league id from the season if not provided
		if (!sleeperLeagueId) {
			const s = await query(
				`SELECT l.platform_id FROM seasons s JOIN leagues l ON s.league_id = l.league_id
				 WHERE s.season_year = $1 AND s.platform = 'sleeper' LIMIT 1`,
				[seasonYear]
			);
			if (!s.rows.length || !s.rows[0].platform_id) {
				return json({ success: false, error: `No Sleeper league found for ${seasonYear}` }, { status: 400 });
			}
			sleeperLeagueId = s.rows[0].platform_id;
		}

		const draftsRes = await fetch(`https://api.sleeper.app/v1/league/${sleeperLeagueId}/drafts`);
		if (!draftsRes.ok) throw new Error(`Failed to fetch drafts from Sleeper: ${draftsRes.status}`);
		const drafts = await draftsRes.json();

		let draftsStaged = 0;
		let picksStaged = 0;

		for (const draft of drafts) {
			if (draft.status !== 'complete') continue;
			if (parseInt(draft.season) !== seasonYear) continue;

			await query(
				`INSERT INTO staging_sleeper_drafts (
					sleeper_draft_id, sleeper_league_id, season_year, draft_type,
					draft_status, total_rounds, draft_metadata, raw_data, processed
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
				ON CONFLICT (sleeper_draft_id, season_year) DO UPDATE SET
					draft_type = EXCLUDED.draft_type,
					draft_status = EXCLUDED.draft_status,
					total_rounds = EXCLUDED.total_rounds,
					draft_metadata = EXCLUDED.draft_metadata,
					raw_data = EXCLUDED.raw_data,
					processed = false`,
				[
					draft.draft_id,
					sleeperLeagueId,
					seasonYear,
					draft.type,
					draft.status,
					draft.settings?.rounds || 15,
					JSON.stringify(draft.metadata || {}),
					JSON.stringify(draft)
				]
			);
			draftsStaged++;

			const picksRes = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
			if (!picksRes.ok) continue;
			const picks = await picksRes.json();

			for (const pick of picks) {
				await query(
					`INSERT INTO staging_sleeper_draft_picks (
						sleeper_draft_id, pick_number, round_number, pick_in_round,
						sleeper_user_id, sleeper_roster_id, player_id, player_metadata,
						season_year, raw_data, processed
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
					ON CONFLICT (sleeper_draft_id, pick_number, season_year) DO UPDATE SET
						round_number = EXCLUDED.round_number,
						pick_in_round = EXCLUDED.pick_in_round,
						sleeper_user_id = EXCLUDED.sleeper_user_id,
						sleeper_roster_id = EXCLUDED.sleeper_roster_id,
						player_id = EXCLUDED.player_id,
						player_metadata = EXCLUDED.player_metadata,
						raw_data = EXCLUDED.raw_data,
						processed = false`,
					[
						draft.draft_id,
						pick.pick_no,
						pick.round,
						pick.draft_slot,
						pick.picked_by || '',
						pick.roster_id,
						pick.player_id,
						JSON.stringify(pick.metadata || {}),
						seasonYear,
						JSON.stringify(pick)
					]
				);
				picksStaged++;
			}
		}

		return json({
			success: true,
			message: `Staged ${draftsStaged} draft(s) with ${picksStaged} picks for ${seasonYear}`,
			draftsStaged,
			picksStaged
		});
	} catch (error) {
		console.error('Error staging draft:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
