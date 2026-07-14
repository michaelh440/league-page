// src/routes/api/process_playoff_week/+server.js
// Push a playoff week into production:
//  - matchups  -> playoffs (bracket = Championship/Consolation + round_name)
//  - rosters   -> playoff_roster
//  - stats     -> playoff_fantasy_stats
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { processPlayoffFromStaging } from '$lib/utils/helperFunctions/playoffArchival.js';
import { getPlayoffMatchups } from '$lib/utils/helperFunctions/playoffBrackets.js';

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
		const { season_id: seasonId, sleeper_league_id: leagueId } = seasonRes.rows[0];

		// Derive this week's playoff matchups from Sleeper's brackets
		const playoffRows = await getPlayoffMatchups(leagueId, seasonId, week);

		// Replace this week's playoff matchups (idempotent re-push)
		await query(`DELETE FROM playoffs WHERE season_id = $1 AND week = $2`, [seasonId, week]);
		for (const p of playoffRows) {
			await query(
				`INSERT INTO playoffs (
					season_id, week, team1_id, team1_name, team2_id, team2_name,
					team1_score, team2_score, bracket, round_name, platform, platform_matchup_id
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'sleeper',$11)`,
				[
					seasonId, week, p.team1_id, p.team1_name, p.team2_id, p.team2_name,
					p.team1_score, p.team2_score, p.bracket, p.round_name, p.platform_matchup_id
				]
			);
		}

		// Rosters + stats -> playoff tables (idle teams are skipped during processing)
		const rs = await processPlayoffFromStaging(parseInt(season), parseInt(week));

		const steps = [
			{ step: 'process_playoffs', records: playoffRows.length, success: true, message: `${playoffRows.length} matchup(s) into playoffs` },
			{ step: 'process_playoff_roster', records: rs.processed.rosters, success: true, message: `${rs.processed.rosters} playoff_roster rows` },
			{ step: 'process_playoff_stats', records: rs.processed.stats, success: true, message: `${rs.processed.stats} playoff_fantasy_stats rows` }
		];

		return json({ success: true, seasonId, season: parseInt(season), week: parseInt(week), steps, playoffs: playoffRows });
	} catch (error) {
		console.error('Error processing playoff week:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
