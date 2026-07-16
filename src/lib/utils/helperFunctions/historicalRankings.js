// src/lib/utils/helperFunctions/historicalRankings.js
//
// Build the FINAL, end-of-season historical_rankings record for one season.
//
//   regular_season_rank <- team_rankings.reg_season_rank at the last REGULAR week
//   final_rank          <- derived from the playoffs bracket placement games
//   playoff_status      <- championship | consolation | missed
//
// team_rankings is the live week-by-week table; historical_rankings is written once a
// season is complete. compute...() is a dry run (used for the preview); populate...()
// writes and is re-runnable (it replaces the season's rows).
import { query } from '$lib/db';

// 'Championship' -> 1, '3rd Place' -> 3, '5th Place' -> 5 ...
// Semi Final / Quarter Final return null (they don't decide a final placement).
function placementBase(roundName) {
	if (!roundName) return null;
	if (/^championship$/i.test(roundName.trim())) return 1;
	const m = roundName.trim().match(/^(\d+)\s*(?:st|nd|rd|th)\s+place$/i);
	return m ? parseInt(m[1], 10) : null;
}

/**
 * Dry run — compute what would be written, without touching the table.
 */
export async function computeHistoricalRankings(season) {
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
		`SELECT tr.team_id AS manager_id, tr.reg_season_rank, tr.week,
		        tr.wins, tr.losses, tr.ties, tr.points_for,
		        COALESCE(mtn.team_name, m.username) AS manager_name
		 FROM team_rankings tr
		 JOIN managers m ON m.manager_id = tr.team_id
		 LEFT JOIN manager_team_names mtn
		        ON mtn.manager_id = tr.team_id AND mtn.season_year = $3
		 WHERE tr.season_id = $1
		   AND tr.week = (SELECT MAX(week) FROM team_rankings WHERE season_id = $1 AND week <= $2)`,
		[seasonId, regLen, seasonYear]
	);
	if (!tr.rows.length) {
		throw new Error(`No team_rankings found for ${seasonYear} — push the regular season weeks first`);
	}
	const regWeek = tr.rows[0].week;
	const regRank = new Map(tr.rows.map((r) => [r.manager_id, r.reg_season_rank]));
	const info = new Map(tr.rows.map((r) => [r.manager_id, r]));

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

	const placementGames = finalRank.size / 2;

	// --- teams with no placement game rank after the bracket, by regular season rank ---
	const maxAssigned = finalRank.size ? Math.max(...finalRank.values()) : 0;
	const leftover = [...regRank.keys()]
		.filter((m) => !finalRank.has(m))
		.sort((a, b) => regRank.get(a) - regRank.get(b));
	let next = maxAssigned + 1;
	for (const m of leftover) finalRank.set(m, next++);

	const rows = [...regRank.keys()].map((managerId) => {
		const bracket = bracketOf.get(managerId);
		const i = info.get(managerId);
		return {
			manager_id: managerId,
			manager_name: i?.manager_name ?? `Manager ${managerId}`,
			regular_season_rank: regRank.get(managerId),
			final_rank: finalRank.get(managerId) ?? null,
			playoff_status: bracket
				? bracket === 'Championship'
					? 'championship'
					: 'consolation'
				: 'missed',
			wins: i?.wins,
			losses: i?.losses,
			ties: i?.ties,
			points_for: i?.points_for
		};
	});
	rows.sort((a, b) => (a.final_rank ?? 999) - (b.final_rank ?? 999));

	return {
		seasonYear,
		regularSeasonWeek: regWeek,
		placementGames,
		rows,
		warning:
			placementGames === 0
				? 'No playoff placement games found — final_rank falls back to regular-season order and everyone is marked "missed". Push the playoff weeks first.'
				: null
	};
}

/**
 * What's currently stored for the season (so the preview can show before/after).
 */
export async function getCurrentHistoricalRankings(seasonYear) {
	const r = await query(
		`SELECT hr.manager_id,
		        COALESCE(mtn.team_name, m.username) AS manager_name,
		        hr.regular_season_rank, hr.final_rank, hr.playoff_status
		 FROM historical_rankings hr
		 JOIN managers m ON m.manager_id = hr.manager_id
		 LEFT JOIN manager_team_names mtn
		        ON mtn.manager_id = hr.manager_id AND mtn.season_year = hr.season_year
		 WHERE hr.season_year = $1
		 ORDER BY hr.final_rank NULLS LAST, hr.regular_season_rank`,
		[seasonYear]
	);
	return r.rows;
}

/**
 * Write the season's rows. Re-runnable: replaces what's there.
 */
export async function populateHistoricalRankings(season) {
	const computed = await computeHistoricalRankings(season);

	await query(`DELETE FROM historical_rankings WHERE season_year = $1`, [computed.seasonYear]);

	for (const r of computed.rows) {
		await query(
			`INSERT INTO historical_rankings (manager_id, season_year, regular_season_rank, final_rank, playoff_status)
			 VALUES ($1, $2, $3, $4, $5)`,
			[r.manager_id, computed.seasonYear, r.regular_season_rank, r.final_rank, r.playoff_status]
		);
	}

	return { ...computed, managers: computed.rows.length };
}
