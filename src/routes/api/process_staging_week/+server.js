// src/routes/api/process_staging_week/+server.js
// Push staged Sleeper data for a given season/week from the staging_sleeper_* tables
// into the production tables. Combines the DB promotion function (users -> managers,
// rosters -> teams, matchups -> matchups + weekly_scoring) with the JS promotion for
// weekly rosters and player stats.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { processRostersAndStatsFromStaging } from '$lib/utils/helperFunctions/rosterStatsArchival.js';
import { processMatchupsFromStaging } from '$lib/utils/helperFunctions/matchupProcessing.js';

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

		// Step 1: season-level promotion — users -> managers/team names, rosters -> teams.
		// (These are inherently season-scoped, so they stay as DB functions.)
		const usersRes = await query(`SELECT * FROM process_sleeper_users()`);
		const rostersRes = await query(`SELECT * FROM process_sleeper_rosters()`);
		const dbSteps = [
			{
				step: 'process_users',
				records: usersRes.rows[0]?.records_processed ?? 0,
				success: usersRes.rows[0]?.success ?? false,
				message: usersRes.rows[0]?.message ?? ''
			},
			{
				step: 'process_rosters',
				records: rostersRes.rows[0]?.records_processed ?? 0,
				success: rostersRes.rows[0]?.success ?? false,
				message: rostersRes.rows[0]?.message ?? ''
			}
		];

		// Step 1b: matchups -> matchups + weekly_scoring for THIS week only.
		// Handled in JS (not process_sleeper_matchups) so it's week-scoped and keys on manager_id.
		const matchupRes = await processMatchupsFromStaging(parseInt(season), parseInt(week));
		dbSteps.push({
			step: 'process_matchups',
			records: matchupRes.matchups,
			success: true,
			message: `${matchupRes.matchups} matchup(s) -> matchups + weekly_scoring (week ${matchupRes.week})`
		});

		// Step 2: JS promotion — weekly rosters -> weekly_roster, player stats -> player_fantasy_stats
		const jsResult = await processRostersAndStatsFromStaging(parseInt(season), parseInt(week));

		// Step 3: rebuild per-week regular-season standings (team_rankings) from matchups
		const rankRes = await query(`SELECT rebuild_reg_season_team_rankings($1) AS weeks`, [seasonId]);

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
			},
			{
				step: 'rebuild_team_rankings',
				records: rankRes.rows[0].weeks,
				success: true,
				message: `standings rebuilt through ${rankRes.rows[0].weeks} week(s)`
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
