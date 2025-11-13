import { query } from '$lib/db';

export const actions = {
	// Sync rosters/teams for a league
	syncRosters: async ({ request }) => {
		const data = await request.formData();
		const sleeperLeagueId = data.get('sleeper_league_id');
		const seasonId = data.get('season_id');
		const leagueId = data.get('league_id');

		try {
			// Fetch rosters from Sleeper API
			const response = await fetch(`https://api.sleeper.app/v1/league/${sleeperLeagueId}/rosters`);
			if (!response.ok) throw new Error('Failed to fetch rosters from Sleeper');
			
			const rosters = await response.json();

			// Fetch users to get team names
			const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${sleeperLeagueId}/users`);
			const users = await usersResponse.json();

			let syncedCount = 0;

			for (const roster of rosters) {
				const user = users.find(u => u.user_id === roster.owner_id);
				if (!user) continue;

				// First, ensure manager exists
				const managerQuery = `
					INSERT INTO managers (username, sleeper_user_id, logo_url, created_at)
					VALUES ($1, $2, $3, NOW())
					ON CONFLICT (sleeper_user_id) 
					DO UPDATE SET
						username = EXCLUDED.username,
						logo_url = EXCLUDED.logo_url
					RETURNING manager_id
				`;

				const managerResult = await query(managerQuery, [
					user.display_name,
					user.user_id,
					user.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null
				]);

				const managerId = managerResult.rows[0].manager_id;

				// Then create/update team
				const teamQuery = `
					INSERT INTO teams (
						league_id, season_id, manager_id, team_name, platform_team_id, created_at
					)
					VALUES ($1, $2, $3, $4, $5, NOW())
					ON CONFLICT (season_id, manager_id)
					DO UPDATE SET
						team_name = EXCLUDED.team_name,
						platform_team_id = EXCLUDED.platform_team_id
					RETURNING team_id
				`;

				await query(teamQuery, [
					leagueId,
					seasonId,
					managerId,
					user.metadata?.team_name || user.display_name,
					roster.roster_id
				]);

				syncedCount++;
			}

			return { success: true, message: `Synced ${syncedCount} teams successfully` };
		} catch (error) {
			console.error('Error syncing rosters:', error);
			return { success: false, error: error.message };
		}
	},

	// Sync matchups for a specific week
	syncMatchups: async ({ request }) => {
		const data = await request.formData();
		const sleeperLeagueId = data.get('sleeper_league_id');
		const week = parseInt(data.get('week'));
		const seasonId = data.get('season_id');

		try {
			// Fetch matchups from Sleeper API
			const response = await fetch(
				`https://api.sleeper.app/v1/league/${sleeperLeagueId}/matchups/${week}`
			);
			if (!response.ok) throw new Error('Failed to fetch matchups from Sleeper');
			
			const matchups = await response.json();

			// Group by matchup_id to get pairs
			const matchupPairs = {};
			for (const matchup of matchups) {
				if (!matchupPairs[matchup.matchup_id]) {
					matchupPairs[matchup.matchup_id] = [];
				}
				matchupPairs[matchup.matchup_id].push(matchup);
			}

			let syncedCount = 0;

			for (const [matchupId, teams] of Object.entries(matchupPairs)) {
				if (teams.length !== 2) continue; // Skip byes

				// Get team_ids from platform_team_id (roster_id)
				const team1Query = await query(
					'SELECT team_id FROM teams WHERE season_id = $1 AND platform_team_id = $2',
					[seasonId, teams[0].roster_id.toString()]
				);
				const team2Query = await query(
					'SELECT team_id FROM teams WHERE season_id = $1 AND platform_team_id = $2',
					[seasonId, teams[1].roster_id.toString()]
				);

				if (team1Query.rows.length === 0 || team2Query.rows.length === 0) continue;

				const team1Id = team1Query.rows[0].team_id;
				const team2Id = team2Query.rows[0].team_id;

				// Insert/update matchup
				const matchupQuery = `
					INSERT INTO matchups (
						season_id, week, team1_id, team2_id, 
						team1_score, team2_score, created_at
					)
					VALUES ($1, $2, $3, $4, $5, $6, NOW())
					ON CONFLICT (season_id, week, team1_id, team2_id)
					DO UPDATE SET
						team1_score = EXCLUDED.team1_score,
						team2_score = EXCLUDED.team2_score
				`;

				await query(matchupQuery, [
					seasonId,
					week,
					team1Id,
					team2Id,
					teams[0].points || 0,
					teams[1].points || 0
				]);

				syncedCount++;
			}

			return { success: true, message: `Synced ${syncedCount} matchups for week ${week}` };
		} catch (error) {
			console.error('Error syncing matchups:', error);
			return { success: false, error: error.message };
		}
	},

	// Full season sync
	syncFullSeason: async ({ request }) => {
		const data = await request.formData();
		const sleeperLeagueId = data.get('sleeper_league_id');
		const seasonId = data.get('season_id');
		const leagueId = data.get('league_id');

		try {
			// First sync rosters
			const rostersFormData = new FormData();
			rostersFormData.append('sleeper_league_id', sleeperLeagueId);
			rostersFormData.append('season_id', seasonId);
			rostersFormData.append('league_id', leagueId);
			
			await actions.syncRosters({ request: { formData: () => rostersFormData } });

			// Then sync matchups for weeks 1-18
			for (let week = 1; week <= 18; week++) {
				const matchupsFormData = new FormData();
				matchupsFormData.append('sleeper_league_id', sleeperLeagueId);
				matchupsFormData.append('week', week.toString());
				matchupsFormData.append('season_id', seasonId);
				
				await actions.syncMatchups({ request: { formData: () => matchupsFormData } });
			}

			return { success: true, message: 'Full season sync completed' };
		} catch (error) {
			console.error('Error syncing full season:', error);
			return { success: false, error: error.message };
		}
	}
};

async function getDataStatus(seasonId, sleeperLeagueId) {
	const status = {
		seasonStaging: {},
		seasonProduction: {},
		weeklyStaging: {},
		weeklyProduction: {}
	};

	try {
		// Season-level data status
		
		// Teams - staging
		const teamsStaging = await query(
			`SELECT COUNT(*) as count FROM sleeper_rosters_staging WHERE league_id = $1`,
			[sleeperLeagueId]
		);
		status.seasonStaging.teams = parseInt(teamsStaging.rows[0]?.count || 0);

		// Teams - production
		const teamsProd = await query(
			`SELECT COUNT(*) as count FROM teams WHERE season_id = $1`,
			[seasonId]
		);
		status.seasonProduction.teams = parseInt(teamsProd.rows[0]?.count || 0);

		// League data - staging
		const leagueStaging = await query(
			`SELECT COUNT(*) as count FROM sleeper_league_staging WHERE league_id = $1`,
			[sleeperLeagueId]
		);
		status.seasonStaging.league = parseInt(leagueStaging.rows[0]?.count || 0);

		// Drafts - staging
		const draftsStaging = await query(
			`SELECT COUNT(*) as count FROM sleeper_drafts_staging WHERE league_id = $1`,
			[sleeperLeagueId]
		);
		status.seasonStaging.drafts = parseInt(draftsStaging.rows[0]?.count || 0);

		// Draft picks - staging
		const draftPicksStaging = await query(
			`SELECT COUNT(*) as count FROM sleeper_draft_picks_staging WHERE league_id = $1`,
			[sleeperLeagueId]
		);
		status.seasonStaging.draftPicks = parseInt(draftPicksStaging.rows[0]?.count || 0);

		// Users/Managers - staging
		const usersStaging = await query(
			`SELECT COUNT(*) as count FROM sleeper_users_staging WHERE league_id = $1`,
			[sleeperLeagueId]
		);
		status.seasonStaging.users = parseInt(usersStaging.rows[0]?.count || 0);

		// Users/Managers - production
		const managersProd = await query(
			`SELECT COUNT(DISTINCT m.manager_id) as count 
			 FROM managers m 
			 INNER JOIN teams t ON m.manager_id = t.manager_id 
			 WHERE t.season_id = $1`,
			[seasonId]
		);
		status.seasonProduction.managers = parseInt(managersProd.rows[0]?.count || 0);

		// Weekly data status (weeks 1-18)
		for (let week = 1; week <= 18; week++) {
			// Matchups - staging
			const matchupsStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_matchups_staging 
				 WHERE league_id = $1 AND week = $2`,
				[sleeperLeagueId, week]
			);
			if (!status.weeklyStaging.matchups) status.weeklyStaging.matchups = {};
			status.weeklyStaging.matchups[week] = parseInt(matchupsStaging.rows[0]?.count || 0);

			// Matchups - production
			const matchupsProd = await query(
				`SELECT COUNT(*) as count FROM matchups 
				 WHERE season_id = $1 AND week = $2`,
				[seasonId, week]
			);
			if (!status.weeklyProduction.matchups) status.weeklyProduction.matchups = {};
			status.weeklyProduction.matchups[week] = parseInt(matchupsProd.rows[0]?.count || 0);

			// Rosters - staging
			const rostersStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_rosters_staging 
				 WHERE league_id = $1`,
				[sleeperLeagueId]
			);
			if (!status.weeklyStaging.rosters) status.weeklyStaging.rosters = {};
			status.weeklyStaging.rosters[week] = parseInt(rostersStaging.rows[0]?.count || 0);

			// Weekly roster - production
			const weeklyRosterProd = await query(
				`SELECT COUNT(*) as count FROM weekly_roster 
				 WHERE season_id = $1 AND week = $2`,
				[seasonId, week]
			);
			if (!status.weeklyProduction.rosters) status.weeklyProduction.rosters = {};
			status.weeklyProduction.rosters[week] = parseInt(weeklyRosterProd.rows[0]?.count || 0);

			// Player stats - staging
			const statsStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_player_stats_staging 
				 WHERE season = $1 AND week = $2`,
				[sleeperLeagueId.substring(0, 4), week] // Assuming league ID contains year
			);
			if (!status.weeklyStaging.playerStats) status.weeklyStaging.playerStats = {};
			status.weeklyStaging.playerStats[week] = parseInt(statsStaging.rows[0]?.count || 0);

			// Playoffs - staging (typically weeks 15-18)
			if (week >= 15) {
				const playoffsStaging = await query(
					`SELECT COUNT(*) as count FROM sleeper_playoffs_staging 
					 WHERE league_id = $1 AND week = $2`,
					[sleeperLeagueId, week]
				);
				if (!status.weeklyStaging.playoffs) status.weeklyStaging.playoffs = {};
				status.weeklyStaging.playoffs[week] = parseInt(playoffsStaging.rows[0]?.count || 0);
			}
		}

	} catch (error) {
		console.error('Error getting data status:', error);
	}

	return status;
}

export async function load() {
	try {
		// Get ALL seasons with their league info and data counts
		const seasonsQuery = `
			SELECT 
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				l.league_name,
				l.platform_id as sleeper_league_id,
				COUNT(DISTINCT t.team_id) as team_count,
				COUNT(DISTINCT ma.matchup_id) as matchup_count
			FROM seasons s
			INNER JOIN leagues l ON s.league_id = l.league_id
			LEFT JOIN teams t ON s.season_id = t.season_id
			LEFT JOIN matchups ma ON s.season_id = ma.season_id
			GROUP BY s.season_id, s.league_id, s.season_year, s.is_active, 
			         s.platform, l.league_name, l.platform_id
			ORDER BY s.season_year DESC, l.league_name
		`;
		const seasonsResult = await query(seasonsQuery);

		// Get sync statistics for ALL Sleeper data
		const statsQuery = `
			SELECT 
				COUNT(DISTINCT m.manager_id) as total_managers,
				COUNT(DISTINCT t.team_id) as total_teams,
				COUNT(DISTINCT ma.matchup_id) as total_matchups,
				MAX(ma.created_at) as last_sync
			FROM managers m
			LEFT JOIN teams t ON m.manager_id = t.manager_id
			LEFT JOIN matchups ma ON t.team_id = ma.team1_id OR t.team_id = ma.team2_id
			WHERE m.sleeper_user_id IS NOT NULL
		`;
		const statsResult = await query(statsQuery);

		console.log('Total seasons found:', seasonsResult.rows.length);

		return {
			seasons: seasonsResult.rows,
			stats: statsResult.rows[0] || {
				total_managers: 0,
				total_teams: 0,
				total_matchups: 0,
				last_sync: null
			}
		};
	} catch (error) {
		console.error('Error loading Sleeper data:', error);
		return {
			seasons: [],
			stats: {
				total_managers: 0,
				total_teams: 0,
				total_matchups: 0,
				last_sync: null
			},
			error: error.message
		};
	}
}