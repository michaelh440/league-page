// src/routes/admin/teams/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get all teams with related info
		const teamsQuery = `
			SELECT 
				t.team_id,
				t.league_id,
				t.season_id,
				t.manager_id,
				t.team_name,
				t.platform_team_id,
				t.created_at,
				l.league_name,
				l.platform as league_platform,
				s.season_year,
				s.is_active as season_is_active,
				m.username as manager_username,
				m.real_name as manager_real_name,
				m.logo_url as manager_logo,
				COUNT(DISTINCT wr.player_id) as player_count,
				(
					SELECT COUNT(DISTINCT week) 
					FROM matchups 
					WHERE team1_id = t.team_id OR team2_id = t.team_id
				) as matchup_count
			FROM teams t
			LEFT JOIN leagues l ON t.league_id = l.league_id
			LEFT JOIN seasons s ON t.season_id = s.season_id
			LEFT JOIN managers m ON t.manager_id = m.manager_id
			LEFT JOIN weekly_roster wr ON t.team_id = wr.team_id
			GROUP BY t.team_id, t.league_id, t.season_id, t.manager_id, t.team_name, 
			         t.platform_team_id, t.created_at, l.league_name, l.platform,
			         s.season_year, s.is_active, m.username, m.real_name, m.logo_url
			ORDER BY s.season_year DESC, t.team_name
		`;
		
		const teamsResult = await query(teamsQuery);
		
		// Get all leagues for dropdown
		const leaguesQuery = `
			SELECT league_id, league_name, platform
			FROM leagues
			ORDER BY league_name
		`;
		
		const leaguesResult = await query(leaguesQuery);
		
		// Get all seasons for dropdown
		const seasonsQuery = `
			SELECT s.season_id, s.season_year, s.league_id, l.league_name,
				CONCAT(s.season_year, ' - ', l.league_name) as season_display
			FROM seasons s
			JOIN leagues l ON s.league_id = l.league_id
			ORDER BY s.season_year DESC, l.league_name
		`;
		
		const seasonsResult = await query(seasonsQuery);
		
		// Get all managers for dropdown
		const managersQuery = `
			SELECT manager_id, username, real_name
			FROM managers
			ORDER BY username
		`;
		
		const managersResult = await query(managersQuery);
		
		// Get stats
		const statsQuery = `
			SELECT 
				COUNT(*) as total_teams,
				COUNT(DISTINCT league_id) as leagues_count,
				COUNT(DISTINCT season_id) as seasons_count,
				COUNT(DISTINCT manager_id) as managers_count
			FROM teams
		`;
		
		const statsResult = await query(statsQuery);
		
		return {
			teams: teamsResult.rows,
			leagues: leaguesResult.rows,
			seasons: seasonsResult.rows,
			managers: managersResult.rows,
			stats: statsResult.rows[0]
		};
	} catch (error) {
		console.error('Error loading teams:', error);
		return {
			teams: [],
			leagues: [],
			seasons: [],
			managers: [],
			stats: {},
			error: error.message
		};
	}
};

export const actions = {
	// Add new team
	add: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueId = data.get('league_id');
			const seasonId = data.get('season_id');
			const managerId = data.get('manager_id');
			const teamName = data.get('team_name');
			const platformTeamId = data.get('platform_team_id') || null;
			
			// Verify season belongs to league
			const seasonCheck = await query(
				'SELECT league_id FROM seasons WHERE season_id = $1',
				[seasonId]
			);
			
			if (seasonCheck.rows.length === 0) {
				return fail(400, {
					success: false,
					error: 'Invalid season selected'
				});
			}
			
			if (seasonCheck.rows[0].league_id !== parseInt(leagueId)) {
				return fail(400, {
					success: false,
					error: 'Season does not belong to selected league'
				});
			}
			
			// Check if team already exists for this manager/season
			const teamCheck = await query(
				'SELECT team_id FROM teams WHERE manager_id = $1 AND season_id = $2',
				[managerId, seasonId]
			);
			
			if (teamCheck.rows.length > 0) {
				return fail(400, {
					success: false,
					error: 'Manager already has a team in this season'
				});
			}
			
			// Insert new team
			const insertQuery = `
				INSERT INTO teams 
				(league_id, season_id, manager_id, team_name, platform_team_id, created_at)
				VALUES ($1, $2, $3, $4, $5, NOW())
				RETURNING team_id
			`;
			
			const result = await query(insertQuery, [
				leagueId, seasonId, managerId, teamName, platformTeamId
			]);
			
			return {
				success: true,
				message: `Team "${teamName}" created successfully`,
				team_id: result.rows[0].team_id
			};
		} catch (error) {
			console.error('Error adding team:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Update existing team
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const teamId = data.get('team_id');
			const leagueId = data.get('league_id');
			const seasonId = data.get('season_id');
			const managerId = data.get('manager_id');
			const teamName = data.get('team_name');
			const platformTeamId = data.get('platform_team_id') || null;
			
			// Verify season belongs to league
			const seasonCheck = await query(
				'SELECT league_id FROM seasons WHERE season_id = $1',
				[seasonId]
			);
			
			if (seasonCheck.rows.length === 0) {
				return fail(400, {
					success: false,
					error: 'Invalid season selected'
				});
			}
			
			if (seasonCheck.rows[0].league_id !== parseInt(leagueId)) {
				return fail(400, {
					success: false,
					error: 'Season does not belong to selected league'
				});
			}
			
			// Update team
			const updateQuery = `
				UPDATE teams
				SET league_id = $1,
				    season_id = $2,
				    manager_id = $3,
				    team_name = $4,
				    platform_team_id = $5
				WHERE team_id = $6
			`;
			
			await query(updateQuery, [
				leagueId, seasonId, managerId, teamName, platformTeamId, teamId
			]);
			
			return {
				success: true,
				message: 'Team updated successfully'
			};
		} catch (error) {
			console.error('Error updating team:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Delete team
	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const teamId = data.get('team_id');
			
			// Check if team has associated data
			const checkQuery = `
				SELECT 
					(SELECT COUNT(*) FROM weekly_roster WHERE team_id = $1) as roster_count,
					(SELECT COUNT(*) FROM matchups WHERE team1_id = $1 OR team2_id = $1) as matchup_count
			`;
			const checkResult = await query(checkQuery, [teamId]);
			const counts = checkResult.rows[0];
			
			if (counts.roster_count > 0 || counts.matchup_count > 0) {
				return fail(400, {
					success: false,
					error: `Cannot delete team with ${counts.roster_count} roster entries and ${counts.matchup_count} matchups. Delete associated data first.`
				});
			}
			
			await query('DELETE FROM teams WHERE team_id = $1', [teamId]);
			
			return {
				success: true,
				message: 'Team deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting team:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};