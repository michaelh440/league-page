import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * GET /api/admin/seasons/[seasonId]
 * Returns detailed information for a specific season
 */
export async function GET({ params, locals }) {
	const { seasonId } = params;

	try {
		const sql = neon(DATABASE_URL);
		
		// Get season details
		const [season] = await sql`
			SELECT 
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				l.league_name,
				l.platform_id,
				l.scoring_type,
				l.reg_season_length,
				l.max_teams
			FROM seasons s
			JOIN leagues l ON s.league_id = l.league_id
			WHERE s.season_id = ${seasonId}
		`;

		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}

		// Get teams for this season
		const teams = await sql`
			SELECT 
				t.team_id,
				t.team_name,
				t.manager_id,
				m.username,
				m.real_name,
				m.logo_url,
				mtn.team_name as season_team_name,
				mtn.logo_url as season_logo_url
			FROM teams t
			JOIN managers m ON t.manager_id = m.manager_id
			LEFT JOIN manager_team_names mtn 
				ON mtn.manager_id = m.manager_id 
				AND mtn.season_year = ${season.season_year}
			WHERE t.season_id = ${seasonId}
			ORDER BY m.username
		`;

		return json({
			...season,
			teams
		});
	} catch (error) {
		console.error('Error fetching season details:', error);
		return json(
			{ error: 'Failed to fetch season details' },
			{ status: 500 }
		);
	}
}

/**
 * PATCH /api/admin/seasons/[seasonId]
 * Updates a season's status (activate/deactivate)
 */
export async function PATCH({ params, request, locals }) {
	// Optional: Add authentication check
	// if (!locals.user || !locals.user.isAdmin) {
	//   return json({ error: 'Unauthorized' }, { status: 401 });
	// }

	const { seasonId } = params;

	try {
		const body = await request.json();
		const { is_active } = body;

		if (typeof is_active !== 'boolean') {
			return json(
				{ error: 'is_active must be a boolean' },
				{ status: 400 }
			);
		}

		const sql = neon(DATABASE_URL);

		// Get the season's league_id first
		const [season] = await sql`
			SELECT league_id, season_year 
			FROM seasons 
			WHERE season_id = ${seasonId}
		`;

		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}

		// If activating, deactivate all other seasons in the same league
		if (is_active) {
			await sql`
				UPDATE seasons 
				SET is_active = false 
				WHERE league_id = ${season.league_id} 
				AND season_id != ${seasonId}
			`;
		}

		// Update the season
		const [updatedSeason] = await sql`
			UPDATE seasons 
			SET is_active = ${is_active}
			WHERE season_id = ${seasonId}
			RETURNING season_id, league_id, season_year, is_active, platform
		`;

		return json({
			success: true,
			season: updatedSeason,
			message: `Season ${is_active ? 'activated' : 'deactivated'} successfully`
		});
	} catch (error) {
		console.error('Error updating season:', error);
		return json(
			{ error: error.message || 'Failed to update season' },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/admin/seasons/[seasonId]
 * Deletes a season if it has no associated data
 */
export async function DELETE({ params, locals }) {
	// Optional: Add authentication check
	// if (!locals.user || !locals.user.isAdmin) {
	//   return json({ error: 'Unauthorized' }, { status: 401 });
	// }

	const { seasonId } = params;

	try {
		const sql = neon(DATABASE_URL);

		// Check if season has any data (matchups, drafts, etc.)
		const [dataCheck] = await sql`
			SELECT 
				(SELECT COUNT(*) FROM matchups WHERE season_id = ${seasonId}) as matchup_count,
				(SELECT COUNT(*) FROM drafts WHERE season_id = ${seasonId}) as draft_count,
				(SELECT COUNT(*) FROM playoffs WHERE season_id = ${seasonId}) as playoff_count
		`;

		if (dataCheck.matchup_count > 0 || dataCheck.draft_count > 0 || dataCheck.playoff_count > 0) {
			return json(
				{ 
					error: 'Cannot delete season with existing data',
					details: {
						matchups: dataCheck.matchup_count,
						drafts: dataCheck.draft_count,
						playoffs: dataCheck.playoff_count
					}
				},
				{ status: 409 }
			);
		}

		// Delete the season (cascade will handle teams and team_rankings)
		await sql`
			DELETE FROM seasons 
			WHERE season_id = ${seasonId}
		`;

		return json({
			success: true,
			message: 'Season deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting season:', error);
		return json(
			{ error: error.message || 'Failed to delete season' },
			{ status: 500 }
		);
	}
}