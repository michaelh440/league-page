// src/routes/api/playoff_status/+server.js
// Staged (unprocessed) playoff rosters/stats for a week + the production playoff rows
// (playoffs, playoff_roster, playoff_fantasy_stats). Read-only.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { getPlayoffMatchups } from '$lib/utils/helperFunctions/playoffBrackets.js';

function buildLineup(row) {
	const swp = row.starters_with_positions;
	const bwp = row.bench_with_positions;
	if (Array.isArray(swp) && swp.length && swp[0] && swp[0].player_id) {
		const starters = swp.map((p) => ({
			name: p.player_name || p.player_id,
			pos: p.position || '?',
			slot: p.lineup_slot || p.position || 'FLEX'
		}));
		const bench = Array.isArray(bwp)
			? bwp.filter((p) => p && p.player_id).map((p) => ({ name: p.player_name || p.player_id, pos: p.position || '?', slot: 'BN' }))
			: [];
		return { starters, bench };
	}
	const positions = swp?.positions || {};
	const names = swp?.names || {};
	const starterIds = Array.isArray(row.starters) ? row.starters : [];
	const allIds = Array.isArray(row.players) ? row.players : [];
	const BENCH = ['BN', 'TAXI', 'IR'];
	const norm = (s) => (['WRRB_FLEX', 'REC_FLEX', 'SUPER_FLEX', 'FLEX'].includes(s) ? 'FLEX' : s);
	const startingSlots = (Array.isArray(bwp) ? bwp : []).filter((s) => !BENCH.includes(s));
	const starters = starterIds.map((id, i) => ({
		name: names[id] || id,
		pos: positions[id] || '?',
		slot: norm(startingSlots[i]) || positions[id] || 'FLEX'
	}));
	const bench = allIds.filter((id) => !starterIds.includes(id)).map((id) => ({ name: names[id] || id, pos: positions[id] || '?', slot: 'BN' }));
	return { starters, bench };
}

export async function GET({ url }) {
	const seasonId = url.searchParams.get('season_id');
	const seasonYear = url.searchParams.get('season_year');
	const week = url.searchParams.get('week');
	if (!seasonId || !seasonYear || !week) {
		return json({ error: 'Missing required parameters: season_id, season_year, week' }, { status: 400 });
	}

	try {
		// Derive the week's playoff matchups from Sleeper brackets (shown in the preview,
		// same data that the push writes to the playoffs table).
		let matchups = [];
		try {
			const lg = await query(
				`SELECT l.platform_id FROM seasons s JOIN leagues l ON s.league_id = l.league_id WHERE s.season_id = $1`,
				[seasonId]
			);
			if (lg.rows[0]?.platform_id) {
				matchups = await getPlayoffMatchups(lg.rows[0].platform_id, parseInt(seasonId), parseInt(week));
			}
		} catch (e) {
			console.warn('Could not derive playoff matchups for preview:', e.message);
		}

		// team labels
		const teamRows = await query(
			`SELECT t.platform_team_id, COALESCE(t.team_name, mg.real_name, mg.username) AS team
			 FROM teams t LEFT JOIN managers mg ON mg.manager_id = t.manager_id WHERE t.season_id = $1`,
			[seasonId]
		);
		const teamByRoster = {};
		for (const r of teamRows.rows) teamByRoster[String(r.platform_team_id)] = r.team;

		// --- staged rosters ---
		const wr = await query(
			`SELECT roster_id, starters, players, starters_with_positions, bench_with_positions
			 FROM staging_sleeper_weekly_rosters
			 WHERE season_year = $1 AND week = $2 AND processed = false
			   AND (raw_data->'matchup'->>'matchup_id') IS NOT NULL
			 ORDER BY roster_id`,
			[seasonYear, week]
		);
		const stagedRosters = wr.rows.map((row) => {
			const l = buildLineup(row);
			return { roster_id: row.roster_id, team: teamByRoster[String(row.roster_id)] || `Roster ${row.roster_id}`, starters: l.starters, bench: l.bench };
		});
		const stagedStatsCount = await query(
			`SELECT COUNT(*)::int c FROM staging_sleeper_player_stats WHERE season_year = $1 AND week = $2 AND processed = false`,
			[seasonYear, week]
		);
		const stagedStatsTop = await query(
			`SELECT player_name, position, team, fantasy_points_half_ppr FROM staging_sleeper_player_stats
			 WHERE season_year = $1 AND week = $2 AND processed = false ORDER BY fantasy_points_half_ppr DESC NULLS LAST LIMIT 20`,
			[seasonYear, week]
		);

		// --- production playoffs (matchups) ---
		const playoffs = await query(
			`SELECT bracket, round_name, team1_name, team2_name, team1_score, team2_score
			 FROM playoffs WHERE season_id = $1 AND week = $2
			 ORDER BY (bracket = 'Championship') DESC, round_name`,
			[seasonId, week]
		);

		// --- production playoff_roster ---
		const pr = await query(
			`SELECT wr.team_id, wr.player_name, wr.position, wr.lineup_slot, wr.is_starter,
			        COALESCE(tt.team_name, tm.team_name, mg.real_name, mg.username, 'Team ' || wr.team_id) AS team_label
			 FROM playoff_roster wr
			 LEFT JOIN teams tt ON tt.team_id = wr.team_id
			 LEFT JOIN teams tm ON tm.manager_id = wr.team_id AND tm.season_id = wr.season_id
			 LEFT JOIN managers mg ON mg.manager_id = wr.team_id
			 WHERE wr.season_id = $1 AND wr.week = $2
			 ORDER BY team_label, wr.is_starter DESC, wr.lineup_slot`,
			[seasonId, week]
		);
		const rosterByTeam = {};
		for (const r of pr.rows) {
			if (!rosterByTeam[r.team_label]) rosterByTeam[r.team_label] = { team: r.team_label, starters: [], bench: [] };
			const e = { player_name: r.player_name, position: r.position, lineup_slot: r.lineup_slot };
			(r.is_starter ? rosterByTeam[r.team_label].starters : rosterByTeam[r.team_label].bench).push(e);
		}

		const pfsCount = await query(`SELECT COUNT(*)::int c FROM playoff_fantasy_stats WHERE season_id = $1 AND week = $2`, [seasonId, week]);
		const pfsTop = await query(
			`SELECT player_name, position, nfl_team, total_fantasy_points FROM playoff_fantasy_stats
			 WHERE season_id = $1 AND week = $2 ORDER BY total_fantasy_points DESC NULLS LAST LIMIT 20`,
			[seasonId, week]
		);

		return json({
			success: true,
			week: parseInt(week),
			staging: {
				matchups,
				rosters: stagedRosters,
				playerStats: { count: stagedStatsCount.rows[0].c, top: stagedStatsTop.rows }
			},
			production: {
				playoffs: playoffs.rows,
				roster: Object.values(rosterByTeam),
				playerStats: { count: pfsCount.rows[0].c, top: pfsTop.rows }
			}
		});
	} catch (error) {
		console.error('Error loading playoff status:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
