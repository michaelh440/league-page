// src/routes/admin/pipeline_step_2/+page.server.js
import { query } from '$lib/db';

export async function load() {
	try {
		const seasonsResult = await query(`
			SELECT
				s.season_id,
				s.season_year,
				s.is_active,
				l.league_name,
				l.reg_season_length
			FROM seasons s
			INNER JOIN leagues l ON s.league_id = l.league_id
			WHERE s.platform = 'sleeper' AND l.platform_id IS NOT NULL
			ORDER BY s.season_year DESC
		`);

		return { seasons: seasonsResult.rows };
	} catch (error) {
		console.error('Error loading pipeline step 2 page:', error);
		return { seasons: [], error: error.message };
	}
}
