// src/routes/admin/disputed_championship/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get all seasons with championship info
		const seasonsQuery = `
			SELECT 
				s.season_id,
				s.season_year,
				s.is_active,
				s.platform,
				s.disputed_championship,
				l.league_name,
				hr.manager_id,
				hr.final_rank,
				m.username,
				m.real_name,
				m.logo_url
			FROM seasons s
			LEFT JOIN leagues l ON s.league_id = l.league_id
			LEFT JOIN historical_rankings hr ON hr.season_year = s.season_year AND hr.final_rank = 1
			LEFT JOIN managers m ON hr.manager_id = m.manager_id
			ORDER BY s.season_year DESC
		`;
		
		const seasonsResult = await query(seasonsQuery);
		
		// Get stats
		const statsQuery = `
			SELECT 
				COUNT(*) as total_seasons,
				COUNT(*) FILTER (WHERE disputed_championship = true) as disputed_count,
				MIN(season_year) as first_season,
				MAX(season_year) as latest_season
			FROM seasons
		`;
		
		const statsResult = await query(statsQuery);
		
		return {
			seasons: seasonsResult.rows,
			stats: statsResult.rows[0]
		};
	} catch (error) {
		console.error('Error loading disputed championships:', error);
		return {
			seasons: [],
			stats: {},
			error: error.message
		};
	}
};

export const actions = {
	// Toggle disputed status for a season
	toggleDisputed: async ({ request }) => {
		try {
			const data = await request.formData();
			const seasonId = data.get('season_id');
			const currentStatus = data.get('current_status') === 'true';
			
			// Toggle the disputed_championship status
			const updateQuery = `
				UPDATE seasons
				SET disputed_championship = $1
				WHERE season_id = $2
				RETURNING season_year, disputed_championship
			`;
			
			const result = await query(updateQuery, [!currentStatus, seasonId]);
			
			if (result.rows.length > 0) {
				const { season_year, disputed_championship } = result.rows[0];
				return {
					success: true,
					message: disputed_championship 
						? `${season_year} championship marked as disputed`
						: `${season_year} championship restored`
				};
			}
			
			return fail(404, {
				success: false,
				error: 'Season not found'
			});
		} catch (error) {
			console.error('Error toggling disputed status:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Bulk update disputed status
	bulkUpdate: async ({ request }) => {
		try {
			const data = await request.formData();
			const seasonIds = data.getAll('season_ids');
			const action = data.get('action'); // 'dispute' or 'restore'
			
			if (seasonIds.length === 0) {
				return fail(400, {
					success: false,
					error: 'No seasons selected'
				});
			}
			
			const newStatus = action === 'dispute';
			
			// Update all selected seasons
			const updateQuery = `
				UPDATE seasons
				SET disputed_championship = $1
				WHERE season_id = ANY($2::int[])
				RETURNING season_id
			`;
			
			const result = await query(updateQuery, [newStatus, seasonIds.map(Number)]);
			
			return {
				success: true,
				message: `${result.rowCount} season(s) ${newStatus ? 'marked as disputed' : 'restored'}`
			};
		} catch (error) {
			console.error('Error in bulk update:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};