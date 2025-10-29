import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

export async function GET({ locals }) {
	try {
		const sql = neon(DATABASE_URL);
		
		const seasons = await sql`
			SELECT 
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				l.league_name,
				COUNT(t.team_id) as team_count
			FROM seasons s
			JOIN leagues l ON s.league_id = l.league_id
			LEFT JOIN teams t ON s.season_id = t.season_id
			GROUP BY s.season_id, s.league_id, s.season_year, s.is_active, s.platform, l.league_name
			ORDER BY s.season_year DESC, l.league_name
		`;

		return json(seasons);
	} catch (error) {
		console.error('Error fetching seasons:', error);
		return json(
			{ error: 'Failed to fetch seasons' },
			{ status: 500 }
		);
	}
}

export async function POST({ request, locals }) {
	try {
		const body = await request.json();
		const { league_id, season_year, platform, platform_league_id, is_active, teams } = body;

		// Validate input
		if (!league_id || !season_year || !platform || !teams || teams.length === 0) {
			return json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Validate managers are unique
		const managerIds = teams.map(t => t.manager_id);
		if (new Set(managerIds).size !== managerIds.length) {
			return json(
				{ error: 'Duplicate managers detected' },
				{ status: 400 }
			);
		}

		const sql = neon(DATABASE_URL);

		// Check if season already exists
		const existingSeasons = await sql`
			SELECT season_id 
			FROM seasons 
			WHERE league_id = ${league_id} 
			AND season_year = ${season_year}
		`;

		if (existingSeasons.length > 0) {
			return json(
				{ error: `Season ${season_year} already exists for this league` },
				{ status: 409 }
			);
		}

		// If setting as active, deactivate other seasons for this league
		if (is_active) {
			await sql`
				UPDATE seasons 
				SET is_active = false 
				WHERE league_id = ${league_id}
			`;
		}

		// Create the season
		const [newSeason] = await sql`
			INSERT INTO seasons (league_id, season_year, is_active, platform)
			VALUES (${league_id}, ${season_year}, ${is_active}, ${platform})
			RETURNING season_id, league_id, season_year, is_active, platform, created_at
		`;

		const season_id = newSeason.season_id;

		// Create teams for each manager
		const createdTeams = [];
		for (const team of teams) {
			const [createdTeam] = await sql`
				INSERT INTO teams (
					league_id, 
					season_id, 
					manager_id, 
					team_name, 
					platform_team_id
				)
				VALUES (
					${league_id},
					${season_id},
					${team.manager_id},
					${team.team_name},
					${platform_league_id || null}
				)
				RETURNING team_id, league_id, season_id, manager_id, team_name, created_at
			`;

			createdTeams.push(createdTeam);

			// Create entry in manager_team_names
			await sql`
				INSERT INTO manager_team_names (
					manager_id,
					season_year,
					team_name,
					logo_url
				)
				VALUES (
					${team.manager_id},
					${season_year},
					${team.team_name},
					${team.logo_url || null}
				)
				ON CONFLICT (manager_id, season_year) 
				DO UPDATE SET 
					team_name = EXCLUDED.team_name,
					logo_url = EXCLUDED.logo_url
			`;
		}

		// Initialize team_rankings for week 0 (pre-season)
		for (const team of createdTeams) {
			await sql`
				INSERT INTO team_rankings (
					season_id,
					week,
					team_id,
					reg_season_rank,
					wins,
					losses,
					ties,
					points_for,
					points_against,
					is_playoff_eligible
				)
				VALUES (
					${season_id},
					0,
					${team.team_id},
					0,
					0,
					0,
					0,
					0,
					0,
					false
				)
			`;
		}

		return json({
			success: true,
			season_id: season_id,
			season: newSeason,
			teams: createdTeams,
			message: `Successfully created season ${season_year} with ${teams.length} teams`
		}, { status: 201 });

	} catch (error) {
		console.error('Error creating season:', error);
		
		// Handle unique constraint violations
		if (error.code === '23505') {
			return json(
				{ error: 'Season already exists or duplicate team assignment' },
				{ status: 409 }
			);
		}

		return json(
			{ error: error.message || 'Failed to create season' },
			{ status: 500 }
		);
	}
}