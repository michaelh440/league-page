// src/routes/api/staging_preview/+server.js
// Show the ACTUAL unprocessed items sitting in the staging tables for a season/week,
// so an admin can review exactly what will be pushed into production. Read-only.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

// Reconstruct a readable starters/bench lineup from a staged weekly-roster row.
// The row shape varies by which stager wrote it:
//  - archive path: starters_with_positions = { positions:{id:pos}, names:{id:name} }
//  - adapter path: starters_with_positions = [ { player_id, player_name, position, lineup_slot } ]
function buildLineup(row) {
	const swp = row.starters_with_positions;
	const bwp = row.bench_with_positions;

	// Adapter (array of player objects)
	if (Array.isArray(swp) && swp.length && swp[0] && swp[0].player_id) {
		const starters = swp.map((p) => ({
			name: p.player_name || p.player_id,
			pos: p.position || '?',
			slot: p.lineup_slot || p.position || 'FLEX'
		}));
		const bench = Array.isArray(bwp)
			? bwp
					.filter((p) => p && p.player_id)
					.map((p) => ({ name: p.player_name || p.player_id, pos: p.position || '?', slot: 'BN' }))
			: [];
		return { starters, bench };
	}

	// Archive (positions/names maps + starters/players id arrays). Assign each starter its
	// lineup slot from the league's roster_positions order (QB, RB, RB, WR, WR, TE, FLEX,
	// K, DEF, ...) — NOT the player's own position — so there's exactly one FLEX, etc.
	const positions = swp?.positions || {};
	const names = swp?.names || {};
	const starterIds = Array.isArray(row.starters) ? row.starters : [];
	const allIds = Array.isArray(row.players) ? row.players : [];
	const BENCH_SLOTS = ['BN', 'TAXI', 'IR'];
	const normalizeSlot = (s) =>
		['WRRB_FLEX', 'REC_FLEX', 'SUPER_FLEX', 'FLEX'].includes(s) ? 'FLEX' : s;
	const startingSlots = (Array.isArray(bwp) ? bwp : []).filter((s) => !BENCH_SLOTS.includes(s));
	const starters = starterIds.map((id, i) => ({
		name: names[id] || id,
		pos: positions[id] || '?',
		slot: normalizeSlot(startingSlots[i]) || positions[id] || 'FLEX'
	}));
	const bench = allIds
		.filter((id) => !starterIds.includes(id))
		.map((id) => ({ name: names[id] || id, pos: positions[id] || '?', slot: 'BN' }));
	return { starters, bench };
}

export async function GET({ url }) {
	const seasonYear = url.searchParams.get('season_year');
	const seasonId = url.searchParams.get('season_id');
	const week = url.searchParams.get('week');

	if (!seasonYear || !seasonId || !week) {
		return json(
			{ error: 'Missing required parameters: season_year, season_id, week' },
			{ status: 400 }
		);
	}

	try {
		// roster_id -> team name for this season (teams.platform_team_id is the Sleeper roster id)
		const teamRows = await query(
			`SELECT t.platform_team_id, COALESCE(t.team_name, mg.real_name, mg.username) AS team
			 FROM teams t LEFT JOIN managers mg ON mg.manager_id = t.manager_id
			 WHERE t.season_id = $1`,
			[seasonId]
		);
		const teamByRoster = {};
		for (const r of teamRows.rows) teamByRoster[String(r.platform_team_id)] = r.team;

		// Matchups (one staged row per team; pair them by sleeper_matchup_id)
		const matchups = await query(
			`SELECT roster_id, sleeper_matchup_id, points
			 FROM staging_sleeper_matchups
			 WHERE season_year = $1 AND week = $2 AND processed = false
			 ORDER BY sleeper_matchup_id, roster_id`,
			[seasonYear, week]
		);
		const pairs = {};
		for (const row of matchups.rows) {
			const key = row.sleeper_matchup_id ?? `solo_${row.roster_id}`;
			if (!pairs[key]) pairs[key] = { matchupId: row.sleeper_matchup_id, teams: [] };
			pairs[key].teams.push({
				roster_id: row.roster_id,
				team: teamByRoster[String(row.roster_id)] || `Roster ${row.roster_id}`,
				points: row.points
			});
		}

		// Weekly rosters (reconstruct lineups)
		const wr = await query(
			`SELECT roster_id, starters, players, starters_with_positions, bench_with_positions
			 FROM staging_sleeper_weekly_rosters
			 WHERE season_year = $1 AND week = $2 AND processed = false
			 ORDER BY roster_id`,
			[seasonYear, week]
		);
		const rosters = wr.rows.map((row) => {
			const lineup = buildLineup(row);
			return {
				roster_id: row.roster_id,
				team: teamByRoster[String(row.roster_id)] || `Roster ${row.roster_id}`,
				starters: lineup.starters,
				bench: lineup.bench
			};
		});

		// Player stats (count + top scorers)
		const statsCount = await query(
			`SELECT COUNT(*)::int AS c FROM staging_sleeper_player_stats
			 WHERE season_year = $1 AND week = $2 AND processed = false`,
			[seasonYear, week]
		);
		const statsTop = await query(
			`SELECT player_name, position, team, fantasy_points_half_ppr
			 FROM staging_sleeper_player_stats
			 WHERE season_year = $1 AND week = $2 AND processed = false
			 ORDER BY fantasy_points_half_ppr DESC NULLS LAST
			 LIMIT 20`,
			[seasonYear, week]
		);

		// Season-level staging that push() promotes globally (users -> managers, rosters -> teams).
		// A user is a problem only if NO manager has its sleeper_user_id — those won't map to
		// a manager on push. (mapped_manager_id gets filled from managers.sleeper_user_id at push.)
		const usersTotal = await query(
			`SELECT COUNT(*)::int AS c FROM staging_sleeper_users WHERE season_year = $1 AND processed = false`,
			[seasonYear]
		);
		const unmatchedUsers = await query(
			`SELECT ssu.username, ssu.display_name, ssu.sleeper_user_id
			 FROM staging_sleeper_users ssu
			 WHERE ssu.season_year = $1 AND ssu.processed = false
			   AND NOT EXISTS (SELECT 1 FROM managers m WHERE m.sleeper_user_id = ssu.sleeper_user_id)
			 ORDER BY ssu.username`,
			[seasonYear]
		);
		const rostersMeta = await query(
			`SELECT COUNT(*)::int AS total FROM staging_sleeper_rosters
			 WHERE season_year = $1 AND processed = false`,
			[seasonYear]
		);

		// Current production counts for the overview
		const prod = await query(
			`SELECT
			   (SELECT COUNT(*)::int FROM matchups WHERE season_id = $1 AND week = $2) AS matchups,
			   (SELECT COUNT(*)::int FROM weekly_scoring WHERE season_id = $1 AND week = $2) AS weekly_scoring,
			   (SELECT COUNT(*)::int FROM weekly_roster WHERE season_id = $1 AND week = $2) AS weekly_roster,
			   (SELECT COUNT(*)::int FROM player_fantasy_stats WHERE season_id = $1 AND week = $2) AS player_stats`,
			[seasonId, week]
		);

		return json({
			success: true,
			week: parseInt(week),
			staging: {
				matchups: Object.values(pairs),
				rosters,
				playerStats: { count: statsCount.rows[0].c, top: statsTop.rows },
				seasonLevel: {
					users: {
						total: usersTotal.rows[0].c,
						unmatched: unmatchedUsers.rows.length,
						unmatchedList: unmatchedUsers.rows
					},
					rosters: rostersMeta.rows[0]
				}
			},
			production: prod.rows[0]
		});
	} catch (error) {
		console.error('Error building staging preview:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
