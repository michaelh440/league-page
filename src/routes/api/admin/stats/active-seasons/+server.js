// src/routes/api/admin/stats/active_seasons/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET() {
	try {
		// Get all seasons with their basic stats
		const result = await query(`
			SELECT 
				s.season_id,
				s.season_year,
				s.league_name,
				s.platform,
				COUNT(DISTINCT t.team_id) as team_count,
				COUNT(DISTINCT t.manager_id) as manager_count,
				(
					SELECT COUNT(*) 
					FROM matchups m 
					WHERE m.season_id = s.season_id
				) as matchup_count,
				(
					SELECT COUNT(*) 
					FROM weekly_roster wr 
					WHERE wr.season_id = s.season_id
				) as roster_count,
				(
					SELECT COUNT(*) 
					FROM player_fantasy_stats pfs 
					WHERE pfs.season_id = s.season_id
				) as stats_count,
				(
					SELECT MAX(week)
					FROM matchups m
					WHERE m.season_id = s.season_id
				) as latest_week
			FROM seasons s
			LEFT JOIN teams t ON s.season_id = t.season_id
			GROUP BY s.season_id, s.season_year, s.league_name, s.platform
			ORDER BY s.season_year DESC
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