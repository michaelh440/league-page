// src/routes/admin/managers/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get all managers with stats
		const managersQuery = `
			SELECT 
				m.manager_id,
				m.username,
				m.email,
				m.real_name,
				m.team_alias,
				m.logo_url,
				m.platform_logo_url,
				m.contact_method,
				m.philosophy,
				m.favorite_team,
				m.signature_moves,
				m.strengths,
				m.weaknesses,
				m.biography,
				m.year_joined,
				m.sleeper_user_id,
				m.created_at,
				COUNT(DISTINCT t.team_id) as team_count,
				COUNT(DISTINCT mtn.season_year) as seasons_played,
				COUNT(DISTINCT hr.season_year) FILTER (WHERE hr.final_rank = 1) as championship_count,
				ARRAY_AGG(DISTINCT hr.season_year ORDER BY hr.season_year DESC) FILTER (WHERE hr.final_rank = 1) as championship_years
			FROM managers m
			LEFT JOIN teams t ON m.manager_id = t.manager_id
			LEFT JOIN manager_team_names mtn ON m.manager_id = mtn.manager_id
			LEFT JOIN historical_rankings hr ON m.manager_id = hr.manager_id
			GROUP BY m.manager_id, m.username, m.email, m.real_name, m.team_alias, 
			         m.logo_url, m.platform_logo_url, m.contact_method, m.philosophy, 
			         m.favorite_team, m.signature_moves, m.strengths, m.weaknesses, 
			         m.biography, m.year_joined, m.sleeper_user_id, m.created_at
			ORDER BY m.username
		`;
		
		const managersResult = await query(managersQuery);
		
		// Get stats
		const statsQuery = `
			SELECT 
				COUNT(*) as total_managers,
				COUNT(*) FILTER (WHERE year_joined IS NOT NULL) as managers_with_join_year,
				MIN(year_joined) as earliest_join_year,
				MAX(year_joined) as latest_join_year
			FROM managers
		`;
		
		const statsResult = await query(statsQuery);
		
		return {
			managers: managersResult.rows,
			stats: statsResult.rows[0]
		};
	} catch (error) {
		console.error('Error loading managers:', error);
		return {
			managers: [],
			stats: {},
			error: error.message
		};
	}
};

export const actions = {
	// Add new manager
	add: async ({ request }) => {
		try {
			const data = await request.formData();
			const username = data.get('username');
			const email = data.get('email');
			const realName = data.get('real_name') || null;
			const teamAlias = data.get('team_alias') || null;
			const logoUrl = data.get('logo_url') || null;
			const contactMethod = data.get('contact_method') || null;
			const philosophy = data.get('philosophy') || null;
			const favoriteTeam = data.get('favorite_team') || null;
			const signatureMoves = data.get('signature_moves') || null;
			const strengths = data.get('strengths') || null;
			const weaknesses = data.get('weaknesses') || null;
			const biography = data.get('biography') || null;
			const yearJoined = data.get('year_joined') || null;
			const sleeperUserId = data.get('sleeper_user_id') || null;
			
			// Check if username already exists
			const checkQuery = `SELECT manager_id FROM managers WHERE username = $1`;
			const checkResult = await query(checkQuery, [username]);
			
			if (checkResult.rows.length > 0) {
				return fail(400, {
					success: false,
					error: `A manager with username "${username}" already exists`
				});
			}
			
			// Check if email already exists
			const emailCheckQuery = `SELECT manager_id FROM managers WHERE email = $1`;
			const emailCheckResult = await query(emailCheckQuery, [email]);
			
			if (emailCheckResult.rows.length > 0) {
				return fail(400, {
					success: false,
					error: `A manager with email "${email}" already exists`
				});
			}
			
			// Insert new manager
			const insertQuery = `
				INSERT INTO managers 
				(username, email, real_name, team_alias, logo_url, contact_method, 
				 philosophy, favorite_team, signature_moves, strengths, weaknesses, 
				 biography, year_joined, sleeper_user_id, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
				RETURNING manager_id
			`;
			
			const result = await query(insertQuery, [
				username, email, realName, teamAlias, logoUrl, contactMethod,
				philosophy, favoriteTeam, signatureMoves, strengths, weaknesses,
				biography, yearJoined, sleeperUserId
			]);
			
			return {
				success: true,
				message: `Manager "${username}" created successfully`,
				manager_id: result.rows[0].manager_id
			};
		} catch (error) {
			console.error('Error adding manager:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Update existing manager
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const managerId = data.get('manager_id');
			const username = data.get('username');
			const email = data.get('email');
			const realName = data.get('real_name') || null;
			const teamAlias = data.get('team_alias') || null;
			const logoUrl = data.get('logo_url') || null;
			const contactMethod = data.get('contact_method') || null;
			const philosophy = data.get('philosophy') || null;
			const favoriteTeam = data.get('favorite_team') || null;
			const signatureMoves = data.get('signature_moves') || null;
			const strengths = data.get('strengths') || null;
			const weaknesses = data.get('weaknesses') || null;
			const biography = data.get('biography') || null;
			const yearJoined = data.get('year_joined') || null;
			const sleeperUserId = data.get('sleeper_user_id') || null;
			
			// Update manager
			const updateQuery = `
				UPDATE managers
				SET username = $1,
				    email = $2,
				    real_name = $3,
				    team_alias = $4,
				    logo_url = $5,
				    contact_method = $6,
				    philosophy = $7,
				    favorite_team = $8,
				    signature_moves = $9,
				    strengths = $10,
				    weaknesses = $11,
				    biography = $12,
				    year_joined = $13,
				    sleeper_user_id = $14
				WHERE manager_id = $15
			`;
			
			await query(updateQuery, [
				username, email, realName, teamAlias, logoUrl, contactMethod,
				philosophy, favoriteTeam, signatureMoves, strengths, weaknesses,
				biography, yearJoined, sleeperUserId, managerId
			]);
			
			return {
				success: true,
				message: 'Manager updated successfully'
			};
		} catch (error) {
			console.error('Error updating manager:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Delete manager
	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const managerId = data.get('manager_id');
			
			// Check if manager has associated data
			const checkQuery = `
				SELECT 
					(SELECT COUNT(*) FROM teams WHERE manager_id = $1) as team_count,
					(SELECT COUNT(*) FROM manager_team_names WHERE manager_id = $1) as team_name_count,
					(SELECT COUNT(*) FROM leagues WHERE commissioner_id = $1) as commissioner_count
			`;
			const checkResult = await query(checkQuery, [managerId]);
			const counts = checkResult.rows[0];
			
			if (counts.team_count > 0 || counts.team_name_count > 0 || counts.commissioner_count > 0) {
				return fail(400, {
					success: false,
					error: `Cannot delete manager with ${counts.team_count} teams, ${counts.team_name_count} team names, and ${counts.commissioner_count} leagues as commissioner. Delete associated data first.`
				});
			}
			
			await query('DELETE FROM managers WHERE manager_id = $1', [managerId]);
			
			return {
				success: true,
				message: 'Manager deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting manager:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};