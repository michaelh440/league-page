import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * GET /api/admin/managers
 * Returns all managers in the system
 */
export async function GET({ locals }) {
	// Optional: Add authentication check
	// if (!locals.user || !locals.user.isAdmin) {
	//   return json({ error: 'Unauthorized' }, { status: 401 });
	// }

	try {
		const sql = neon(DATABASE_URL);
		
		const managers = await sql`
			SELECT 
				manager_id,
				username,
				email,
				real_name,
				team_alias,
				logo_url,
				year_joined,
				created_at
			FROM managers
			ORDER BY username
		`;

		return json(managers);
	} catch (error) {
		console.error('Error fetching managers:', error);
		return json(
			{ error: 'Failed to fetch managers' },
			{ status: 500 }
		);
	}
}