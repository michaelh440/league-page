// src/routes/api/draft_status/+server.js
// Return both the STAGED (unprocessed) draft/picks and the PRODUCTION draft/picks
// for a season, so the pipeline page can preview then view. Read-only.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
	const seasonId = url.searchParams.get('season_id');
	const seasonYear = url.searchParams.get('season_year');

	if (!seasonId || !seasonYear) {
		return json({ error: 'Missing required parameters: season_id, season_year' }, { status: 400 });
	}

	try {
		// --- Staged (unprocessed) ---
		const stagedDrafts = await query(
			`SELECT sleeper_draft_id, draft_type, draft_status, total_rounds,
			        draft_metadata->>'name' AS draft_name
			 FROM staging_sleeper_drafts
			 WHERE season_year = $1 AND processed = false
			 ORDER BY sleeper_draft_id`,
			[seasonYear]
		);
		const stagedPicks = await query(
			`SELECT dp.pick_number, dp.round_number, dp.pick_in_round, dp.sleeper_roster_id,
			        TRIM(COALESCE(dp.player_metadata->>'first_name','') || ' ' ||
			             COALESCE(dp.player_metadata->>'last_name','')) AS player_name,
			        dp.player_metadata->>'position' AS position,
			        dp.player_metadata->>'team' AS nfl_team,
			        COALESCE(t.team_name, mg.username, 'Roster ' || dp.sleeper_roster_id) AS team
			 FROM staging_sleeper_draft_picks dp
			 LEFT JOIN teams t ON t.platform_team_id = dp.sleeper_roster_id::text AND t.season_id = $2
			 LEFT JOIN managers mg ON mg.manager_id = t.manager_id
			 WHERE dp.season_year = $1 AND dp.processed = false
			 ORDER BY dp.pick_number`,
			[seasonYear, seasonId]
		);

		// --- Production ---
		const prodDrafts = await query(
			`SELECT draft_id, draft_name, draft_type, total_rounds, draft_status, platform_draft_id
			 FROM drafts WHERE season_id = $1 ORDER BY draft_id`,
			[seasonId]
		);
		const prodPicks = await query(
			`SELECT dp.pick_number, dp.round_number, dp.pick_in_round,
			        dp.player_name, dp.player_nfl_team AS nfl_team,
			        COALESCE(t.team_name, dp.manager_name) AS team, dp.manager_name
			 FROM draft_picks dp
			 JOIN drafts d ON dp.draft_id = d.draft_id
			 LEFT JOIN teams t ON t.team_id = dp.team_id
			 WHERE d.season_id = $1
			 ORDER BY dp.pick_number`,
			[seasonId]
		);

		return json({
			success: true,
			staging: {
				drafts: stagedDrafts.rows,
				picks: { count: stagedPicks.rows.length, list: stagedPicks.rows }
			},
			production: {
				drafts: prodDrafts.rows,
				picks: { count: prodPicks.rows.length, list: prodPicks.rows }
			}
		});
	} catch (error) {
		console.error('Error loading draft status:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
