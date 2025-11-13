// src/routes/admin/sleeper_data/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get sync status/history
		const syncHistoryQuery = `
			SELECT 
				'leagues' as table_name,
				COUNT(*) as record_count,
				MAX(created_at) as last_sync
			FROM leagues WHERE platform = 'sleeper'
			UNION ALL
			SELECT 
				'seasons' as table_name,
				COUNT(*) as record_count,
				MAX(created_at) as last_sync
			FROM seasons WHERE platform = 'sleeper'
			UNION ALL
			SELECT 
				'teams' as table_name,
				COUNT(*) as record_count,
				MAX(created_at) as last_sync
			FROM teams
			UNION ALL
			SELECT 
				'matchups' as table_name,
				COUNT(*) as record_count,
				MAX(created_at) as last_sync
			FROM matchups WHERE platform = 'sleeper'
			UNION ALL
			SELECT 
				'weekly_roster' as table_name,
				COUNT(*) as record_count,
				MAX(created_at) as last_sync
			FROM weekly_roster
			ORDER BY table_name
		`;
		
		const syncHistoryResult = await query(syncHistoryQuery);
		
		// Get active Sleeper leagues
		const leaguesQuery = `
			SELECT 
				l.league_id,
				l.platform_id,
				l.league_name,
				l.league_year,
				COUNT(DISTINCT s.season_id) as season_count,
				COUNT(DISTINCT t.team_id) as team_count,
				MAX(s.is_active) as has_active_season
			FROM leagues l
			LEFT JOIN seasons s ON l.league_id = s.league_id
			LEFT JOIN teams t ON l.league_id = t.league_id
			WHERE l.platform = 'sleeper'
			GROUP BY l.league_id, l.platform_id, l.league_name, l.league_year
			ORDER BY l.league_year DESC
		`;
		
		const leaguesResult = await query(leaguesQuery);
		
		// Get staging table counts (if they exist)
		let stagingCounts = {
			staging_sleeper_matchups: 0,
			staging_sleeper_rosters: 0
		};
		
		try {
			const stagingMatchupsCount = await query('SELECT COUNT(*) as count FROM staging_sleeper_matchups');
			stagingCounts.staging_sleeper_matchups = stagingMatchupsCount.rows[0].count;
		} catch (e) {
			// Table might not exist
		}
		
		try {
			const stagingRostersCount = await query('SELECT COUNT(*) as count FROM staging_sleeper_rosters');
			stagingCounts.staging_sleeper_rosters = stagingRostersCount.rows[0].count;
		} catch (e) {
			// Table might not exist
		}
		
		// Get recent activity
		const recentActivityQuery = `
			SELECT 
				'matchup' as activity_type,
				week,
				season_id,
				created_at,
				CONCAT('Week ', week, ' matchups loaded') as description
			FROM matchups
			WHERE platform = 'sleeper'
			ORDER BY created_at DESC
			LIMIT 10
		`;
		
		const recentActivityResult = await query(recentActivityQuery);
		
		return {
			syncHistory: syncHistoryResult.rows,
			leagues: leaguesResult.rows,
			stagingCounts,
			recentActivity: recentActivityResult.rows
		};
	} catch (error) {
		console.error('Error loading Sleeper data:', error);
		return {
			syncHistory: [],
			leagues: [],
			stagingCounts: {},
			recentActivity: [],
			error: error.message
		};
	}
};

export const actions = {
	// Sync league data
	syncLeague: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueId = data.get('league_id');
			
			// This would typically call your Sleeper sync functions
			// For now, just return success
			return {
				success: true,
				message: `League sync initiated for league ${leagueId}. This is a placeholder - implement actual Sleeper API sync logic.`
			};
		} catch (error) {
			console.error('Error syncing league:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Sync specific week
	syncWeek: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueId = data.get('league_id');
			const seasonId = data.get('season_id');
			const week = data.get('week');
			
			// This would typically call your Sleeper sync functions
			return {
				success: true,
				message: `Week ${week} sync initiated. This is a placeholder - implement actual Sleeper API sync logic.`
			};
		} catch (error) {
			console.error('Error syncing week:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Clear staging data
	clearStaging: async ({ request }) => {
		try {
			const data = await request.formData();
			const tableName = data.get('table_name');
			
			if (tableName === 'staging_sleeper_matchups') {
				await query('DELETE FROM staging_sleeper_matchups');
				return {
					success: true,
					message: 'Staging matchups cleared successfully'
				};
			} else if (tableName === 'staging_sleeper_rosters') {
				await query('DELETE FROM staging_sleeper_rosters');
				return {
					success: true,
					message: 'Staging rosters cleared successfully'
				};
			} else {
				return fail(400, {
					success: false,
					error: 'Invalid table name'
				});
			}
		} catch (error) {
			console.error('Error clearing staging:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Process staging data
	processStaging: async ({ request }) => {
		try {
			const data = await request.formData();
			const tableName = data.get('table_name');
			
			// This would typically call your data processing functions
			return {
				success: true,
				message: `Processing ${tableName}. This is a placeholder - implement actual processing logic.`
			};
		} catch (error) {
			console.error('Error processing staging:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};