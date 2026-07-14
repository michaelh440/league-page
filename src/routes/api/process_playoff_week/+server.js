// src/routes/api/process_playoff_week/+server.js
// Push a playoff week into production:
//  - staged matchups (staging_sleeper_playoffs) -> playoffs
//  - rosters -> playoff_roster, stats -> playoff_fantasy_stats
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { processPlayoffFromStaging } from '$lib/utils/helperFunctions/playoffArchival.js';

export async function POST({ request }) {
	try {
		const { season, week } = await request.json();
		if (!season || !week) {
			return json({ success: false, error: 'Missing required parameters: season, week' }, { status: 400 });
		}

		const seasonRes = await query(
			`SELECT season_id FROM seasons WHERE season_year = $1 AND platform = 'sleeper' LIMIT 1`,
			[season]
		);
		if (!seasonRes.rows.length) {
			return json({ success: false, error: `Sleeper season ${season} not found` }, { status: 400 });
		}
		const seasonId = seasonRes.rows[0].season_id;
		const seasonYear = parseInt(season);
		const wk = parseInt(week);

		// Promote staged playoff matchups -> playoffs (idempotent: replace the week)
		const staged = await query(
			`SELECT id, sleeper_matchup_id, team1_manager_id, team1_name, team2_manager_id, team2_name,
			        team1_score, team2_score, bracket, round_name
			 FROM staging_sleeper_playoffs
			 WHERE season_year = $1 AND week = $2 AND processed = false`,
			[seasonYear, wk]
		);

		await query(`DELETE FROM playoffs WHERE season_id = $1 AND week = $2`, [seasonId, wk]);

		let matchupsPushed = 0;
		for (const p of staged.rows) {
			const ins = await query(
				`INSERT INTO playoffs (
					season_id, week, team1_id, team1_name, team2_id, team2_name,
					team1_score, team2_score, bracket, round_name, platform, platform_matchup_id
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'sleeper',$11)
				RETURNING playoff_id`,
				[
					seasonId, wk, p.team1_manager_id, p.team1_name, p.team2_manager_id, p.team2_name,
					p.team1_score, p.team2_score, p.bracket, p.round_name, p.sleeper_matchup_id
				]
			);
			await query(
				`UPDATE staging_sleeper_playoffs SET processed = true, mapped_playoff_id = $1 WHERE id = $2`,
				[ins.rows[0].playoff_id, p.id]
			);
			matchupsPushed++;
		}

		// Rosters + stats -> playoff tables (idle teams are skipped during processing)
		const rs = await processPlayoffFromStaging(seasonYear, wk);

		const steps = [
			{ step: 'process_playoffs', records: matchupsPushed, success: true, message: `${matchupsPushed} matchup(s) into playoffs` },
			{ step: 'process_playoff_roster', records: rs.processed.rosters, success: true, message: `${rs.processed.rosters} playoff_roster rows` },
			{ step: 'process_playoff_stats', records: rs.processed.stats, success: true, message: `${rs.processed.stats} playoff_fantasy_stats rows` }
		];

		return json({ success: true, seasonId, season: seasonYear, week: wk, steps });
	} catch (error) {
		console.error('Error processing playoff week:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
