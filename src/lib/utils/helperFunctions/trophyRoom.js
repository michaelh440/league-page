// src/lib/utils/helperFunctions/trophyRoom.js
//
// Builds the data the Awards podium component (src/lib/Awards_old/Awards.svelte) needs,
// entirely from the database. The original component is Sleeper-centric: it keys the
// podium and the leagueTeamManagers map by a "rosterID" that it assumes is stable across
// every season. This league spans Yahoo (2015-2023) and Sleeper (2024+), whose platform
// ids differ, so we use `manager_id` as the stable key across all seasons.
//
// Shapes produced (must match what Awards.svelte and its helpers consume):
//   awardsData    -> [{ year, champion, second, third, divisions:[{name, rosterID}], toilet }]
//                    where champion/second/third/toilet/rosterID are manager_ids.
//   teamManagers  -> { currentSeason, teamManagersMap: { [year]: { [managerId]:
//                        { team: { name, avatar }, managers: [managerId] } } } }
//
// getNestedTeamNamesFromTeamManagers looks each rosterID up in BOTH its own season and
// the current season, so every manager that appears in any podium must also be present in
// the current-season map — otherwise the component throws.
import { query } from '$lib/db';

export async function getTrophyRoomData() {
	const rows = (
		await query(`
			SELECT hr.season_year,
			       hr.manager_id,
			       hr.final_rank,
			       hr.regular_season_rank,
			       COALESCE(mtn.team_name, m.username) AS team_name,
			       COALESCE(mtn.logo_url, m.logo_url)  AS avatar
			FROM historical_rankings hr
			JOIN managers m ON m.manager_id = hr.manager_id
			LEFT JOIN manager_team_names mtn
			       ON mtn.manager_id = hr.manager_id
			      AND mtn.season_year = hr.season_year
			ORDER BY hr.season_year, hr.final_rank
		`)
	).rows;

	// teamManagersMap[year][managerId] = { team: {name, avatar}, managers: [managerId] }
	const teamManagersMap = {};
	const latest = new Map(); // managerId -> most recent { name, avatar }, for the current-season backfill
	let currentSeason = 0;

	for (const r of rows) {
		if (r.season_year > currentSeason) currentSeason = r.season_year;
		if (!teamManagersMap[r.season_year]) teamManagersMap[r.season_year] = {};
		teamManagersMap[r.season_year][r.manager_id] = {
			team: { name: r.team_name, avatar: r.avatar },
			managers: [r.manager_id]
		};
		latest.set(r.manager_id, { name: r.team_name, avatar: r.avatar });
	}

	// Ensure every manager exists in the current-season map (see note above).
	if (!teamManagersMap[currentSeason]) teamManagersMap[currentSeason] = {};
	for (const [managerId, info] of latest) {
		if (!teamManagersMap[currentSeason][managerId]) {
			teamManagersMap[currentSeason][managerId] = {
				team: { name: info.name, avatar: info.avatar },
				managers: [managerId]
			};
		}
	}

	// One podium per season, from final_rank.
	const byYear = new Map();
	for (const r of rows) {
		if (!byYear.has(r.season_year)) byYear.set(r.season_year, []);
		byYear.get(r.season_year).push(r);
	}

	const awardsData = [];
	for (const [year, ranks] of [...byYear.entries()].sort((a, b) => b[0] - a[0])) {
		const managerAtRank = (rank) => ranks.find((x) => x.final_rank === rank)?.manager_id ?? null;
		const worstRank = Math.max(...ranks.map((x) => x.final_rank));
		const regSeasonChamp = ranks.find((x) => x.regular_season_rank === 1);

		awardsData.push({
			year,
			champion: managerAtRank(1),
			second: managerAtRank(2),
			third: managerAtRank(3),
			// The league has no divisions; surface the regular-season champion in that slot
			// (Awards.svelte labels a division with no `name` as "Regular Season Champion").
			divisions: regSeasonChamp ? [{ name: null, rosterID: regSeasonChamp.manager_id }] : [],
			toilet: managerAtRank(worstRank)
		});
	}

	return {
		awardsData,
		teamManagersData: { currentSeason, teamManagersMap }
	};
}
