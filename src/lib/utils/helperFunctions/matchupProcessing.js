// src/lib/utils/helperFunctions/matchupProcessing.js
//
// Promote a SINGLE week's staged Sleeper matchups into matchups + weekly_scoring.
//
// Replaces the process_sleeper_matchups() DB function for the data pipeline. That function
// was the source of repeated bugs: it wrote teams.team_id instead of manager_id, never
// wrote weekly_scoring, existed as two diverging overloads (the pipeline called the wrong
// one), and processed EVERY unprocessed staged week regardless of the week you selected.
//
// This is week-scoped, keys everything on manager_id (the app's convention), and uses a
// canonical team order so re-processing updates the same row instead of inserting a mirror.
import { query } from '$lib/db';

export async function processMatchupsFromStaging(season, week) {
	const seasonRes = await query(
		`SELECT season_id FROM seasons WHERE season_year = $1 AND platform = 'sleeper' LIMIT 1`,
		[season]
	);
	if (!seasonRes.rows.length) throw new Error(`Sleeper season ${season} not found`);
	const seasonId = seasonRes.rows[0].season_id;

	// Each game is two staged rows (one per team) sharing a sleeper_matchup_id.
	// Join each roster to its team/manager for THIS season; rosters that don't map are
	// left unprocessed rather than written with a null manager.
	const pairs = await query(
		`SELECT sm1.id AS id1, sm2.id AS id2, sm1.week, sm1.sleeper_matchup_id,
		        t1.manager_id AS m1, t2.manager_id AS m2,
		        sm1.points AS p1, sm2.points AS p2,
		        t1.team_name AS n1, t2.team_name AS n2
		 FROM staging_sleeper_matchups sm1
		 JOIN staging_sleeper_matchups sm2
		   ON sm2.sleeper_matchup_id = sm1.sleeper_matchup_id
		  AND sm2.week = sm1.week
		  AND sm2.season_year = sm1.season_year
		  AND sm2.roster_id > sm1.roster_id
		 JOIN teams t1 ON t1.season_id = $1 AND t1.platform_team_id = sm1.roster_id::text
		 JOIN teams t2 ON t2.season_id = $1 AND t2.platform_team_id = sm2.roster_id::text
		 WHERE sm1.season_year = $2 AND sm1.week = $3
		   AND sm1.processed = false AND sm2.processed = false
		   AND sm1.sleeper_matchup_id IS NOT NULL
		   AND sm1.points IS NOT NULL AND sm2.points IS NOT NULL`,
		[seasonId, season, week]
	);

	let processed = 0;

	for (const r of pairs.rows) {
		// Canonical order: team1 is always the lower manager_id.
		const flip = r.m1 > r.m2;
		const t1 = flip ? r.m2 : r.m1;
		const t2 = flip ? r.m1 : r.m2;
		const s1 = flip ? r.p2 : r.p1;
		const s2 = flip ? r.p1 : r.p2;
		const n1 = flip ? r.n2 : r.n1;
		const n2 = flip ? r.n1 : r.n2;

		await query(
			`INSERT INTO matchups (
				season_id, week, team1_id, team1_name, team2_id, team2_name,
				team1_score, team2_score, platform, platform_matchup_id
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'sleeper',$9)
			ON CONFLICT (season_id, week, team1_id, team2_id) DO UPDATE SET
				team1_score = EXCLUDED.team1_score,
				team2_score = EXCLUDED.team2_score,
				team1_name = EXCLUDED.team1_name,
				team2_name = EXCLUDED.team2_name,
				platform_matchup_id = EXCLUDED.platform_matchup_id`,
			[seasonId, r.week, t1, n1, t2, n2, s1, s2, String(r.sleeper_matchup_id)]
		);

		// weekly_scoring: one row per manager per week (team_id column holds manager_id)
		for (const [managerId, score] of [
			[t1, s1],
			[t2, s2]
		]) {
			await query(
				`INSERT INTO weekly_scoring (season_id, week, team_id, team_score, platform)
				 VALUES ($1,$2,$3,$4,'sleeper')
				 ON CONFLICT (season_id, week, team_id) DO UPDATE SET team_score = EXCLUDED.team_score`,
				[seasonId, r.week, managerId, score]
			);
		}

		await query(`UPDATE staging_sleeper_matchups SET processed = true WHERE id IN ($1, $2)`, [
			r.id1,
			r.id2
		]);
		processed++;
	}

	return { seasonId, week: parseInt(week), matchups: processed };
}
