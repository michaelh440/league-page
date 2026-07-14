// src/routes/api/process_staging_week/+server.js
// Push staged Sleeper data for a given season/week from the staging_sleeper_* tables
// into the production tables. Combines the DB promotion function (users -> managers,
// rosters -> teams, matchups -> matchups + weekly_scoring) with the JS promotion for
// weekly rosters and player stats.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { processRostersAndStatsFromStaging } from '$lib/utils/helperFunctions/rosterStatsArchival.js';

export async function POST({ request }) {
	try {
		const { season, week } = await request.json();

		if (!season || !week) {
			return json(
				{ success: false, error: 'Missing required parameters: season, week' },
				{ status: 400 }
			);
		}

		// Resolve season_id
		const seasonResult = await query(
			`SELECT season_id FROM seasons WHERE season_year = $1 AND platform = 'sleeper' LIMIT 1`,
			[season]
		);

		if (seasonResult.rows.length === 0) {
			return json(
				{ success: false, error: `Sleeper season ${season} not found in database` },
				{ status: 400 }
			);
		}

		const seasonId = seasonResult.rows[0].season_id;

		// Step 0: Map staged Sleeper users to managers by sleeper_user_id.
		// process_sleeper_rosters() reads staging_sleeper_users.mapped_manager_id to
		// assign each team's manager, but nothing else populates it — so fill it here
		// from managers.sleeper_user_id (the existing source of truth).
		const mapResult = await query(
			`UPDATE staging_sleeper_users ssu
			 SET mapped_manager_id = m.manager_id
			 FROM managers m
			 WHERE m.sleeper_user_id = ssu.sleeper_user_id
			   AND ssu.processed = false
			   AND (ssu.mapped_manager_id IS NULL OR ssu.mapped_manager_id <> m.manager_id)`,
			[]
		);

		// Warn (don't fail) if any unprocessed staged users still have no manager match
		const unmatched = await query(
			`SELECT COUNT(*)::int AS c
			 FROM staging_sleeper_users ssu
			 WHERE ssu.processed = false
			   AND NOT EXISTS (SELECT 1 FROM managers m WHERE m.sleeper_user_id = ssu.sleeper_user_id)`,
			[]
		);

		// Step 1: DB promotion — users -> managers, rosters -> teams, matchups -> matchups + weekly_scoring
		const dbResult = await query(`SELECT * FROM process_sleeper_week($1, $2)`, [seasonId, week]);
		const dbSteps = dbResult.rows.map((r) => ({
			step: r.step,
			records: r.records_processed,
			success: r.success,
			message: r.message
		}));

		// Step 2: JS promotion — weekly rosters -> weekly_roster, player stats -> player_fantasy_stats
		const jsResult = await processRostersAndStatsFromStaging(parseInt(season), parseInt(week));

		const steps = [
			{
				step: 'map_users_to_managers',
				records: mapResult.rowCount,
				success: unmatched.rows[0].c === 0,
				message:
					`${mapResult.rowCount} user(s) mapped by sleeper_user_id` +
					(unmatched.rows[0].c > 0 ? ` · ⚠️ ${unmatched.rows[0].c} still unmatched` : '')
			},
			...dbSteps,
			{
				step: 'process_weekly_rosters',
				records: jsResult.processed.rosters,
				success: true,
				message: `${jsResult.processed.rosters} weekly_roster rows`
			},
			{
				step: 'process_player_stats',
				records: jsResult.processed.stats,
				success: true,
				message: `${jsResult.processed.stats} player_fantasy_stats rows`
			}
		];

		return json({
			success: true,
			seasonId,
			season: parseInt(season),
			week: parseInt(week),
			steps
		});
	} catch (error) {
		console.error('Error processing staging week:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
