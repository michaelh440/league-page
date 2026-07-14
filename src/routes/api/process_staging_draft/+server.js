// src/routes/api/process_staging_draft/+server.js
// Promote staged draft + picks (staging_sleeper_drafts / staging_sleeper_draft_picks)
// into the production drafts / draft_picks tables for a season.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function POST({ request }) {
	try {
		const { season } = await request.json();
		if (!season) {
			return json({ success: false, error: 'Missing required parameter: season' }, { status: 400 });
		}

		const seasonRes = await query(
			`SELECT season_id, season_year FROM seasons WHERE season_year = $1 AND platform = 'sleeper' LIMIT 1`,
			[season]
		);
		if (!seasonRes.rows.length) {
			return json({ success: false, error: `Sleeper season ${season} not found` }, { status: 400 });
		}
		const { season_id: seasonId, season_year: seasonYear } = seasonRes.rows[0];

		const stagedDrafts = await query(
			`SELECT id, sleeper_draft_id, draft_type, total_rounds, draft_metadata->>'name' AS draft_name
			 FROM staging_sleeper_drafts WHERE season_year = $1 AND processed = false`,
			[seasonYear]
		);

		let draftsProcessed = 0;
		let picksProcessed = 0;
		let picksSkipped = 0;
		let participantsProcessed = 0;

		for (const sd of stagedDrafts.rows) {
			// Find-or-create the production draft row
			let draftDbId;
			const byPlatform = await query(
				`SELECT draft_id FROM drafts WHERE season_id = $1 AND platform_draft_id = $2 LIMIT 1`,
				[seasonId, sd.sleeper_draft_id]
			);
			const bySeason = byPlatform.rows.length
				? byPlatform
				: await query(
						`SELECT draft_id FROM drafts WHERE season_id = $1 AND platform = 'sleeper' ORDER BY draft_id LIMIT 1`,
						[seasonId]
					);

			if (bySeason.rows.length) {
				draftDbId = bySeason.rows[0].draft_id;
				await query(
					`UPDATE drafts SET platform_draft_id = $1,
					        draft_name = COALESCE(draft_name, $2),
					        draft_type = COALESCE($3, draft_type),
					        total_rounds = COALESCE($4, total_rounds)
					 WHERE draft_id = $5`,
					[sd.sleeper_draft_id, sd.draft_name, sd.draft_type, sd.total_rounds, draftDbId]
				);
			} else {
				const ins = await query(
					`INSERT INTO drafts (season_id, season_year, draft_name, draft_type, total_rounds, draft_status, platform, platform_draft_id)
					 VALUES ($1, $2, $3, $4, $5, 'completed', 'sleeper', $6)
					 RETURNING draft_id`,
					[seasonId, seasonYear, sd.draft_name || 'Draft', sd.draft_type, sd.total_rounds || 15, sd.sleeper_draft_id]
				);
				draftDbId = ins.rows[0].draft_id;
			}

			// Promote picks for this draft
			const picks = await query(
				`SELECT dp.id, dp.pick_number, dp.round_number, dp.pick_in_round, dp.sleeper_roster_id,
				        TRIM(COALESCE(dp.player_metadata->>'first_name','') || ' ' ||
				             COALESCE(dp.player_metadata->>'last_name','')) AS player_name,
				        dp.player_metadata->>'team' AS nfl_team,
				        t.team_id, t.manager_id, mg.username
				 FROM staging_sleeper_draft_picks dp
				 LEFT JOIN teams t ON t.platform_team_id = dp.sleeper_roster_id::text AND t.season_id = $1
				 LEFT JOIN managers mg ON mg.manager_id = t.manager_id
				 WHERE dp.sleeper_draft_id = $2 AND dp.season_year = $3 AND dp.processed = false
				 ORDER BY dp.pick_number`,
				[seasonId, sd.sleeper_draft_id, seasonYear]
			);

			for (const p of picks.rows) {
				if (!p.team_id || !p.manager_id) {
					picksSkipped++;
					continue; // draft_picks requires team_id / manager_id
				}
				await query(
					`INSERT INTO draft_picks (
						draft_id, pick_number, round_number, pick_in_round,
						manager_id, team_id, player_name, manager_name, player_nfl_team, platform_pick_id
					) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
					ON CONFLICT (draft_id, pick_number) DO UPDATE SET
						round_number = EXCLUDED.round_number,
						pick_in_round = EXCLUDED.pick_in_round,
						manager_id = EXCLUDED.manager_id,
						team_id = EXCLUDED.team_id,
						player_name = EXCLUDED.player_name,
						manager_name = EXCLUDED.manager_name,
						player_nfl_team = EXCLUDED.player_nfl_team`,
					[
						draftDbId,
						p.pick_number,
						p.round_number,
						p.pick_in_round,
						p.manager_id,
						p.team_id,
						p.player_name || 'Unknown Player',
						p.username || 'Unknown',
						p.nfl_team || 'FA',
						`${sd.sleeper_draft_id}-${p.pick_number}`
					]
				);
				await query(`UPDATE staging_sleeper_draft_picks SET processed = true, mapped_pick_id = $1 WHERE id = $2`, [
					draftDbId,
					p.id
				]);
				picksProcessed++;
			}

			// Rebuild draft participants (the draft order that drives the draft-board columns)
			// from the round-1 picks: each roster's round-1 pick_in_round is its draft slot.
			await query(`DELETE FROM draft_participants WHERE draft_id = $1`, [draftDbId]);
			const partRes = await query(
				`INSERT INTO draft_participants (draft_id, manager_id, team_id, draft_position)
				 SELECT draft_id, manager_id, team_id, pick_in_round
				 FROM draft_picks
				 WHERE draft_id = $1 AND round_number = 1
				 ORDER BY pick_in_round`,
				[draftDbId]
			);
			participantsProcessed += partRes.rowCount;

			await query(`UPDATE staging_sleeper_drafts SET processed = true, mapped_draft_id = $1 WHERE id = $2`, [
				draftDbId,
				sd.id
			]);
			draftsProcessed++;
		}

		const steps = [
			{ step: 'process_drafts', records: draftsProcessed, success: true, message: `${draftsProcessed} draft(s)` },
			{
				step: 'process_draft_picks',
				records: picksProcessed,
				success: true,
				message: `${picksProcessed} pick(s)` + (picksSkipped ? ` · ${picksSkipped} skipped (roster not mapped to a team)` : '')
			},
			{
				step: 'process_draft_participants',
				records: participantsProcessed,
				success: true,
				message: `${participantsProcessed} participant(s) (draft order)`
			}
		];

		return json({ success: true, seasonId, season: parseInt(season), steps });
	} catch (error) {
		console.error('Error processing staged draft:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
