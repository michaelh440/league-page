// src/routes/admin/sleeper/+page.server.js
import { query } from '$lib/db';

export async function load() {
	try {
		// Get all seasons with Sleeper data
		const seasonsQuery = `
			SELECT 
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				l.league_name,
				l.platform_id as sleeper_league_id
			FROM seasons s
			INNER JOIN leagues l ON s.league_id = l.league_id
			WHERE s.platform = 'sleeper' OR l.platform_id IS NOT NULL
			ORDER BY s.season_year DESC
		`;
		const seasonsResult = await query(seasonsQuery);

		// Get overall statistics
		const statsQuery = `
			SELECT 
				COUNT(DISTINCT s.season_id) as total_seasons,
				(SELECT COUNT(*) FROM weekly_roster WHERE season_id IN (
					SELECT season_id FROM seasons WHERE platform = 'sleeper'
				)) as total_rosters,
				(SELECT COUNT(*) FROM player_fantasy_stats WHERE season_id IN (
					SELECT season_id FROM seasons WHERE platform = 'sleeper'
				)) as total_stats,
				(SELECT MAX(created_at) FROM weekly_roster WHERE season_id IN (
					SELECT season_id FROM seasons WHERE platform = 'sleeper'
				)) as last_update
			FROM seasons s
			WHERE s.platform = 'sleeper'
		`;
		const statsResult = await query(statsQuery);

		return {
			seasons: seasonsResult.rows,
			stats: statsResult.rows[0] || {
				total_seasons: 0,
				total_rosters: 0,
				total_stats: 0,
				last_update: null
			}
		};
	} catch (error) {
		console.error('Error loading Sleeper integration page:', error);
		return {
			seasons: [],
			stats: {
				total_seasons: 0,
				total_rosters: 0,
				total_stats: 0,
				last_update: null
			},
			error: error.message
		};
	}
}