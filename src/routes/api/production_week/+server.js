// src/routes/api/production_week/+server.js
// Show the ACTUAL rows that live in the production tables for a given season/week,
// so an admin can confirm what was loaded after a push. Read-only.
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
	const seasonId = url.searchParams.get('season_id');
	const week = url.searchParams.get('week');

	if (!seasonId || !week) {
		return json({ error: 'Missing required parameters: season_id, week' }, { status: 400 });
	}

	try {
		// Matchups (resolve team names defensively: stored name -> team -> manager)
		const matchups = await query(
			`SELECT
			   m.team1_id, m.team2_id, m.team1_score, m.team2_score,
			   COALESCE(NULLIF(m.team1_name,''), t1.team_name, mg1.username, 'Team ' || m.team1_id) AS team1,
			   COALESCE(NULLIF(m.team2_name,''), t2.team_name, mg2.username, 'Team ' || m.team2_id) AS team2
			 FROM matchups m
			 LEFT JOIN teams t1 ON t1.team_id = m.team1_id
			 LEFT JOIN managers mg1 ON mg1.manager_id = t1.manager_id
			 LEFT JOIN teams t2 ON t2.team_id = m.team2_id
			 LEFT JOIN managers mg2 ON mg2.manager_id = t2.manager_id
			 WHERE m.season_id = $1 AND m.week = $2
			 ORDER BY m.matchup_id`,
			[seasonId, week]
		);

		// Weekly scoring (team -> score)
		const weeklyScoring = await query(
			`SELECT
			   ws.team_id, ws.team_score,
			   COALESCE(t.team_name, mg.username, 'Team ' || ws.team_id) AS team
			 FROM weekly_scoring ws
			 LEFT JOIN teams t ON t.team_id = ws.team_id
			 LEFT JOIN managers mg ON mg.manager_id = t.manager_id
			 WHERE ws.season_id = $1 AND ws.week = $2
			 ORDER BY ws.team_score DESC NULLS LAST`,
			[seasonId, week]
		);

		// Weekly rosters. Note: the Sleeper JS promotion stores manager_id in team_id,
		// while the DB path stores the real team_id — resolve a label for both.
		const roster = await query(
			`SELECT
			   wr.team_id, wr.player_name, wr.position, wr.lineup_slot, wr.is_starter,
			   COALESCE(tt.team_name, tm.team_name, mg.username, 'Team ' || wr.team_id) AS team_label
			 FROM weekly_roster wr
			 LEFT JOIN teams tt ON tt.team_id = wr.team_id
			 LEFT JOIN teams tm ON tm.manager_id = wr.team_id AND tm.season_id = wr.season_id
			 LEFT JOIN managers mg ON mg.manager_id = wr.team_id
			 WHERE wr.season_id = $1 AND wr.week = $2
			 ORDER BY team_label, wr.is_starter DESC, wr.lineup_slot, wr.player_name`,
			[seasonId, week]
		);

		// Group roster rows by team
		const rosterByTeam = {};
		for (const r of roster.rows) {
			const key = r.team_label;
			if (!rosterByTeam[key]) rosterByTeam[key] = { team: key, starters: [], bench: [] };
			const entry = {
				player_name: r.player_name,
				position: r.position,
				lineup_slot: r.lineup_slot,
				points: null
			};
			if (r.is_starter) rosterByTeam[key].starters.push(entry);
			else rosterByTeam[key].bench.push(entry);
		}

		// Player fantasy stats (count + top scorers)
		const statsCount = await query(
			`SELECT COUNT(*)::int AS c FROM player_fantasy_stats WHERE season_id = $1 AND week = $2`,
			[seasonId, week]
		);
		const statsTop = await query(
			`SELECT player_name, position, nfl_team, total_fantasy_points
			 FROM player_fantasy_stats
			 WHERE season_id = $1 AND week = $2
			 ORDER BY total_fantasy_points DESC NULLS LAST
			 LIMIT 30`,
			[seasonId, week]
		);

		return json({
			success: true,
			week: parseInt(week),
			counts: {
				matchups: matchups.rows.length,
				weeklyScoring: weeklyScoring.rows.length,
				rosterTeams: Object.keys(rosterByTeam).length,
				rosterRows: roster.rows.length,
				playerStats: statsCount.rows[0].c
			},
			matchups: matchups.rows,
			weeklyScoring: weeklyScoring.rows,
			roster: Object.values(rosterByTeam),
			playerStats: { count: statsCount.rows[0].c, top: statsTop.rows }
		});
	} catch (error) {
		console.error('Error loading production week:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
