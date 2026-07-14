// src/lib/utils/helperFunctions/playoffBrackets.js
// Derive a playoff week's matchups (teams, scores, bracket, round_name) from Sleeper's
// winners_bracket / losers_bracket. Shared by the playoff preview and the playoff push
// so both show identical data.
import { query } from '$lib/db';

function nThPlace(n) {
	const s = n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
	return `${n}${s} Place`;
}

// Resolve a bracket team ref (roster_id, or {w:m}/{l:m} pointer) to a roster_id.
function resolveTeam(ref, byMatch) {
	if (ref == null) return null;
	if (typeof ref === 'number') return ref;
	if (ref.w != null) return byMatch[ref.w]?.w ?? null;
	if (ref.l != null) return byMatch[ref.l]?.l ?? null;
	return null;
}

// round_name matching the existing playoffs-table wording. loserOffset shifts consolation
// placements past the championship-bracket teams (e.g. losers p=1 -> 5th place when 4 teams
// are in the championship bracket).
function roundName(r, maxRound, p, isLosers, loserOffset) {
	const fromEnd = maxRound - r; // 0 = final round
	if (fromEnd === 0) {
		if (isLosers) return p != null ? nThPlace(p + loserOffset) : 'Toilet Bowl';
		if (p == null || p === 1) return 'Championship';
		return nThPlace(p);
	}
	if (fromEnd === 1) return 'Semi Final';
	if (fromEnd === 2) return 'Quarter Final';
	return `Round ${r}`;
}

/**
 * @returns {Promise<Array>} playoff matchup rows for the week:
 *   { team1_id, team1_name, team2_id, team2_name, team1_score, team2_score,
 *     bracket: 'Championship'|'Consolation', round_name, platform_matchup_id }
 */
export async function getPlayoffMatchups(leagueId, seasonId, week) {
	const [winnersRes, losersRes, leagueRes, matchupsRes] = await Promise.all([
		fetch(`https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`),
		fetch(`https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`),
		fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
		fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`)
	]);
	const winners = await winnersRes.json();
	const losers = await losersRes.json();
	const leagueData = await leagueRes.json();
	const matchups = await matchupsRes.json();

	const playoffsStart = parseInt(leagueData.settings.playoff_week_start);
	const year = parseInt(leagueData.season);
	let playoffType = year > 2019 ? parseInt(leagueData.settings.playoff_round_type ?? 0) : 0;
	if (year === 2020 && playoffType === 1) playoffType++;
	const weeksPerRound = playoffType === 2 ? 2 : 1;

	// points this week
	const pointsByRoster = {};
	for (const m of matchups) pointsByRoster[m.roster_id] = m.points;

	// championship-bracket size (round-1 winners entrants) -> consolation place offset
	const champEntrants = new Set();
	for (const b of Array.isArray(winners) ? winners : []) {
		if (b.r === 1) {
			if (typeof b.t1 === 'number') champEntrants.add(b.t1);
			if (typeof b.t2 === 'number') champEntrants.add(b.t2);
		}
	}
	const loserOffset = champEntrants.size;

	// team resolution — playoffs (like matchups) key team1_id/team2_id on manager_id
	const teamRows = await query(
		`SELECT t.platform_team_id, t.manager_id, COALESCE(t.team_name, mg.real_name, mg.username) AS team_name
		 FROM teams t LEFT JOIN managers mg ON mg.manager_id = t.manager_id WHERE t.season_id = $1`,
		[seasonId]
	);
	const teamByRoster = {};
	for (const t of teamRows.rows) teamByRoster[String(t.platform_team_id)] = t;

	const rows = [];
	for (const [bracketData, isLosers, label] of [
		[winners, false, 'Championship'],
		[losers, true, 'Consolation']
	]) {
		if (!Array.isArray(bracketData) || !bracketData.length) continue;
		const byMatch = {};
		for (const b of bracketData) byMatch[b.m] = b;
		const maxRound = Math.max(...bracketData.map((b) => b.r));

		for (const b of bracketData) {
			const startWeek = playoffsStart + (b.r - 1) * weeksPerRound;
			const endWeek = startWeek + weeksPerRound - 1;
			if (week < startWeek || week > endWeek) continue;

			const r1 = resolveTeam(b.t1, byMatch);
			const r2 = resolveTeam(b.t2, byMatch);
			if (r1 == null || r2 == null) continue; // bye / unresolved

			const t1 = teamByRoster[String(r1)];
			const t2 = teamByRoster[String(r2)];
			if (!t1 || !t2 || t1.manager_id === t2.manager_id) continue;

			rows.push({
				team1_id: t1.manager_id,
				team1_name: t1.team_name,
				team2_id: t2.manager_id,
				team2_name: t2.team_name,
				team1_score: pointsByRoster[r1] ?? null,
				team2_score: pointsByRoster[r2] ?? null,
				bracket: label,
				round_name: roundName(b.r, maxRound, b.p, isLosers, loserOffset),
				platform_matchup_id: String(b.m)
			});
		}
	}
	return rows;
}

/**
 * Derive the week's playoff matchups from Sleeper's brackets and stage them into
 * staging_sleeper_playoffs (one row per bracket game). Returns the count staged.
 */
export async function stagePlayoffMatchups(leagueId, seasonId, seasonYear, week) {
	const rows = await getPlayoffMatchups(leagueId, seasonId, week);
	for (const r of rows) {
		await query(
			`INSERT INTO staging_sleeper_playoffs (
				sleeper_league_id, season_year, week, sleeper_matchup_id,
				team1_manager_id, team1_name, team2_manager_id, team2_name,
				team1_score, team2_score, bracket, round_name, processed
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)
			ON CONFLICT (season_year, week, bracket, sleeper_matchup_id) DO UPDATE SET
				team1_manager_id = EXCLUDED.team1_manager_id,
				team1_name = EXCLUDED.team1_name,
				team2_manager_id = EXCLUDED.team2_manager_id,
				team2_name = EXCLUDED.team2_name,
				team1_score = EXCLUDED.team1_score,
				team2_score = EXCLUDED.team2_score,
				bracket = EXCLUDED.bracket,
				round_name = EXCLUDED.round_name,
				processed = false`,
			[
				leagueId, seasonYear, week, r.platform_matchup_id,
				r.team1_id, r.team1_name, r.team2_id, r.team2_name,
				r.team1_score, r.team2_score, r.bracket, r.round_name
			]
		);
	}
	return rows.length;
}
