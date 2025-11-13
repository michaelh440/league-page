// src/routes/admin/leagues/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get all leagues with stats
		const leaguesQuery = `
			SELECT 
				l.league_id,
				l.platform_id,
				l.platform,
				l.league_name,
				l.commissioner_id,
				l.max_teams,
				l.reg_season_length,
				l.scoring_type,
				l.league_year,
				l.created_at,
				m.username as commissioner_name,
				m.real_name as commissioner_real_name,
				COUNT(DISTINCT s.season_id) as season_count,
				COUNT(DISTINCT s.season_id) FILTER (WHERE s.is_active = true) as active_season_count,
				COUNT(DISTINCT t.team_id) as total_teams
			FROM leagues l
			LEFT JOIN managers m ON l.commissioner_id = m.manager_id
			LEFT JOIN seasons s ON l.league_id = s.league_id
			LEFT JOIN teams t ON l.league_id = t.league_id
			GROUP BY l.league_id, l.platform_id, l.platform, l.league_name, 
			         l.commissioner_id, l.max_teams, l.reg_season_length, 
			         l.scoring_type, l.league_year, l.created_at,
			         m.username, m.real_name
			ORDER BY l.league_year DESC, l.league_name
		`;
		
		const leaguesResult = await query(leaguesQuery);
		
		// Get all managers for commissioner dropdown
		const managersQuery = `
			SELECT manager_id, username, real_name
			FROM managers
			ORDER BY username
		`;
		
		const managersResult = await query(managersQuery);
		
		// Get stats
		const statsQuery = `
			SELECT 
				COUNT(*) as total_leagues,
				COUNT(DISTINCT platform) as platforms_count,
				SUM(max_teams) as total_team_slots,
				AVG(reg_season_length) as avg_season_length
			FROM leagues
		`;
		
		const statsResult = await query(statsQuery);
		
		return {
			leagues: leaguesResult.rows,
			managers: managersResult.rows,
			stats: statsResult.rows[0]
		};
	} catch (error) {
		console.error('Error loading leagues:', error);
		return {
			leagues: [],
			managers: [],
			stats: {},
			error: error.message
		};
	}
};

export const actions = {
	// Add new league
	add: async ({ request }) => {
		try {
			const data = await request.formData();
			const platformId = data.get('platform_id');
			const platform = data.get('platform');
			const leagueName = data.get('league_name');
			const commissionerId = data.get('commissioner_id') || null;
			const maxTeams = data.get('max_teams');
			const regSeasonLength = data.get('reg_season_length');
			const scoringType = data.get('scoring_type');
			const leagueYear = data.get('league_year');
			
			// Check if platform_id already exists
			const checkQuery = `
				SELECT league_id FROM leagues 
				WHERE platform_id = $1 AND platform = $2
			`;
			const checkResult = await query(checkQuery, [platformId, platform]);
			
			if (checkResult.rows.length > 0) {
				return fail(400, {
					success: false,
					error: `A league with platform ID "${platformId}" already exists on ${platform}`
				});
			}
			
			// Insert new league
			const insertQuery = `
				INSERT INTO leagues 
				(platform_id, platform, league_name, commissioner_id, max_teams, 
				 reg_season_length, scoring_type, league_year, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
				RETURNING league_id
			`;
			
			const result = await query(insertQuery, [
				platformId, platform, leagueName, commissionerId, maxTeams,
				regSeasonLength, scoringType, leagueYear
			]);
			
			return {
				success: true,
				message: `League "${leagueName}" created successfully`,
				league_id: result.rows[0].league_id
			};
		} catch (error) {
			console.error('Error adding league:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Update existing league
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueId = data.get('league_id');
			const platformId = data.get('platform_id');
			const platform = data.get('platform');
			const leagueName = data.get('league_name');
			const commissionerId = data.get('commissioner_id') || null;
			const maxTeams = data.get('max_teams');
			const regSeasonLength = data.get('reg_season_length');
			const scoringType = data.get('scoring_type');
			const leagueYear = data.get('league_year');
			
			// Update league
			const updateQuery = `
				UPDATE leagues
				SET platform_id = $1,
				    platform = $2,
				    league_name = $3,
				    commissioner_id = $4,
				    max_teams = $5,
				    reg_season_length = $6,
				    scoring_type = $7,
				    league_year = $8
				WHERE league_id = $9
			`;
			
			await query(updateQuery, [
				platformId, platform, leagueName, commissionerId, maxTeams,
				regSeasonLength, scoringType, leagueYear, leagueId
			]);
			
			return {
				success: true,
				message: 'League updated successfully'
			};
		} catch (error) {
			console.error('Error updating league:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Delete league
	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueId = data.get('league_id');
			
			// Check if league has associated data
			const checkQuery = `
				SELECT 
					(SELECT COUNT(*) FROM seasons WHERE league_id = $1) as season_count,
					(SELECT COUNT(*) FROM teams WHERE league_id = $1) as team_count
			`;
			const checkResult = await query(checkQuery, [leagueId]);
			const counts = checkResult.rows[0];
			
			if (counts.season_count > 0 || counts.team_count > 0) {
				return fail(400, {
					success: false,
					error: `Cannot delete league with ${counts.season_count} seasons and ${counts.team_count} teams. Delete associated data first.`
				});
			}
			
			await query('DELETE FROM leagues WHERE league_id = $1', [leagueId]);
			
			return {
				success: true,
				message: 'League deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting league:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};