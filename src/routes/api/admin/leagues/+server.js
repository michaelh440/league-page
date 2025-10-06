import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * GET /api/admin/leagues
 * Returns all leagues in the system
 */
export async function GET({ locals }) {
	// Optional: Add authentication check
	// if (!locals.user || !locals.user.isAdmin) {
	//   return json({ error: 'Unauthorized' }, { status: 401 });
	// }

	try {
		const sql = neon(DATABASE_URL);
		
		const leagues = await sql`
			SELECT 
				league_id,
				platform_id,
				platform,
				league_name,
				commissioner_id,
				max_teams,
				reg_season_length,
				scoring_type,
				league_year,
				created_at
			FROM leagues
			ORDER BY league_year DESC, league_name
		`;

		return json(leagues);
	} catch (error) {
		console.error('Error fetching leagues:', error);
		return json(
			{ error: 'Failed to fetch leagues' },
			{ status: 500 }
		);
	}
}