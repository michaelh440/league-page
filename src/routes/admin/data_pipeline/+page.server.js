// src/routes/admin/data_pipeline/+page.server.js
import { query } from '$lib/db';

export async function load() {
	try {
		const seasonsResult = await query(`
			SELECT
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				l.league_name,
				l.platform_id AS sleeper_league_id,
				l.reg_season_length
			FROM seasons s
			INNER JOIN leagues l ON s.league_id = l.league_id
			WHERE s.platform = 'sleeper' AND l.platform_id IS NOT NULL
			ORDER BY s.season_year DESC
		`);

		return {
			seasons: seasonsResult.rows
		};
	} catch (error) {
		console.error('Error loading data pipeline page:', error);
		return {
			seasons: [],
			error: error.message
		};
	}
}
