// src/lib/utils/helperFunctions/historicalRankings.js
//
// Populate historical_rankings (the FINAL, end-of-season record) for one season.
//
//   regular_season_rank <- team_rankings.reg_season_rank at the last REGULAR week
//   final_rank          <- derived from the playoffs bracket placement games
//   playoff_status      <- championship | consolation | missed
//
// team_rankings is the live week-by-week table; historical_rankings is written once a
// season is complete. Re-runnable: it replaces the season's rows.
import { query } from '$lib/db';

// 'Championship' -> 1, '3rd Place' -> 3, '5th Place' -> 5 ...
// Semi Final / Quarter Final return null (they don't decide a final placement).
function placementBase(roundName) {
	if (!roundName) return null;
	if (/^championship$/i.test(roundName.trim())) return 1;
	const m = roundName.trim().match(/^(\d+)\s*(?:st|nd|rd|th)\s+place$/i);
	return m ? parseInt(m[1], 10) : null;
}

export async function populateHistoricalRankings(season) {
	const s = await query(
		`SELECT s.season_id, s.season_year, l.reg_season_length
		 FROM seasons s JOIN leagues l ON s.league_id = l.league_id
		 WHERE s.season_year = $1 AND s.platform = 'sleeper' LIMIT 1`,
		[season]
	);
	if (!s.rows.length) throw new Error(`Sleeper season ${season} not found`);
	const { season_id: seasonId, season_year: seasonYear, reg_season_length: regLen } = s.rows[0];

	// --- regular season rank: team_rankings at the last regular week ---
	const tr = await query(
		`SELECT tr.team_id AS manager_id, tr.reg_season_rank, tr.week
		 FROM team_rankings tr
		 WHERE tr.season_id = $1
		   AND tr.week = (SELECT MAX(week) FROM team_rankings WHERE season_id = $1 AND week <= $2)`,
		[seasonId, regLen]
	);
	if (!tr.rows.length) {
		throw new Error(`No team_rankings found for ${seasonYear} — push the regular season weeks first`);
	}
	const regWeek = tr.rows[0].week;
	const regRank = new Map(tr.rows.map((r) => [r.manager_id, r.reg_season_rank]));

	// --- final rank + bracket from the playoffs ---
	const pf = await query(
		`SELECT bracket, round_name, team1_id, team1_score, team2_id, team2_score
		 FROM playoffs WHERE season_id = $1`,
		[seasonId]
	);

	const finalRank = new Map();
	const bracketOf = new Map();

	for (const g of pf.rows) {
		// Any playoff appearance determines championship vs consolation
		if (g.team1_id != null) bracketOf.set(g.team1_id, g.bracket);
		if (g.team2_id != null) bracketOf.set(g.team2_id, g.bracket);

		const base = placementBase(g.round_name);
		if (base == null) continue; // semi finals don't decide placement

		const a = Number(g.team1_score);
		const b = Number(g.team2_score);
		const winner = a >= b ? g.team1_id : g.team2_id;
		const loser = a >= b ? g.team2_id : g.team1_id;
		finalRank.set(winner, base);
		finalRank.set(loser, base + 1);
	}

	const placementGames = [...finalRank.keys()].length / 2;

	// --- teams with no placement game rank after the bracket, by regular season rank ---
	const maxAssigned = finalRank.size ? Math.max(...finalRank.values()) : 0;
	const leftover = [...regRank.keys()]
		.filter((m) => !finalRank.has(m))
		.sort((a, b) => regRank.get(a) - regRank.get(b));
	let next = maxAssigned + 1;
	for (const m of leftover) finalRank.set(m, next++);

	// --- write (replace the season's rows so this is re-runnable) ---
	await query(`DELETE FROM historical_rankings WHERE season_year = $1`, [seasonYear]);

	let written = 0;
	for (const [managerId, rsRank] of regRank) {
		const bracket = bracketOf.get(managerId);
		const status = bracket
			? bracket === 'Championship'
				? 'championship'
				: 'consolation'
			: 'missed';

		await query(
			`INSERT INTO historical_rankings (manager_id, season_year, regular_season_rank, final_rank, playoff_status)
			 VALUES ($1, $2, $3, $4, $5)`,
			[managerId, seasonYear, rsRank, finalRank.get(managerId) ?? null, status]
		);
		written++;
	}

	return {
		seasonYear,
		managers: written,
		regularSeasonWeek: regWeek,
		placementGames,
		warning:
			placementGames === 0
				? 'No playoff placement games found — final_rank fell back to regular-season order and everyone is marked "missed". Push the playoff weeks first.'
				: null
	};
}
