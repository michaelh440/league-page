// src/routes/api/admin/stats/active_leagues/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET() {
	try {
		// Get all seasons with their basic stats
		const result = await query(`
			SELECT 
				l.league_id,
				l.league_name,
				l.platform,
				COUNT(DISTINCT s.season_id) AS season_count,
				COUNT(DISTINCT t.team_id)   AS team_count,
				COUNT(DISTINCT t.manager_id) AS manager_count,
				(
					SELECT COUNT(*)
					FROM matchups m
					JOIN seasons s2 ON s2.season_id = m.season_id
					WHERE s2.league_id = l.league_id
				) AS matchup_count,
				(
					SELECT COUNT(*)
					FROM weekly_roster wr
					JOIN seasons s2 ON s2.season_id = wr.season_id
					WHERE s2.league_id = l.league_id
				) AS roster_count,
				(
					SELECT COUNT(*)
					FROM player_fantasy_stats pfs
					JOIN seasons s2 ON s2.season_id = pfs.season_id
					WHERE s2.league_id = l.league_id
				) AS stats_count,
				(
					SELECT MAX(m.week)
					FROM matchups m
					JOIN seasons s2 ON s2.season_id = m.season_id
					WHERE s2.league_id = l.league_id
				) AS latest_week
				FROM leagues l
				LEFT JOIN seasons s ON s.league_id = l.league_id
				LEFT JOIN teams t   ON t.season_id = s.season_id
				GROUP BY l.league_id, l.league_name, l.platform
				ORDER BY l.league_id;

		`);

		return json({
			success: true,
			seasons: result.rows
		});
	} catch (error) {
		console.error('Error fetching active seasons stats:', error);
		return json({
			success: false,
			error: error.message
		}, { status: 500 });
	}
}