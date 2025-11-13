import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
	const seasonId = url.searchParams.get('season_id');
	const sleeperLeagueId = url.searchParams.get('sleeper_league_id');

	if (!seasonId || !sleeperLeagueId) {
		return json({ error: 'Missing required parameters' }, { status: 400 });
	}

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
		status.weeklyStaging.matchups = {};
		status.weeklyProduction.matchups = {};
		status.weeklyStaging.rosters = {};
		status.weeklyProduction.rosters = {};
		status.weeklyStaging.playerStats = {};
		status.weeklyStaging.playoffs = {};

		for (let week = 1; week <= 18; week++) {
			// Matchups - staging
			const matchupsStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_matchups_staging 
				 WHERE league_id = $1 AND week = $2`,
				[sleeperLeagueId, week]
			);
			status.weeklyStaging.matchups[week] = parseInt(matchupsStaging.rows[0]?.count || 0);

			// Matchups - production
			const matchupsProd = await query(
				`SELECT COUNT(*) as count FROM matchups 
				 WHERE season_id = $1 AND week = $2`,
				[seasonId, week]
			);
			status.weeklyProduction.matchups[week] = parseInt(matchupsProd.rows[0]?.count || 0);

			// Rosters - staging (assuming this is per-league not per-week)
			const rostersStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_rosters_staging 
				 WHERE league_id = $1`,
				[sleeperLeagueId]
			);
			status.weeklyStaging.rosters[week] = parseInt(rostersStaging.rows[0]?.count || 0);

			// Weekly roster - production
			const weeklyRosterProd = await query(
				`SELECT COUNT(*) as count FROM weekly_roster 
				 WHERE season_id = $1 AND week = $2`,
				[seasonId, week]
			);
			status.weeklyProduction.rosters[week] = parseInt(weeklyRosterProd.rows[0]?.count || 0);

			// Player stats - staging
			const year = sleeperLeagueId.substring(0, 4); // Assuming league ID starts with year
			const statsStaging = await query(
				`SELECT COUNT(*) as count FROM sleeper_player_stats_staging 
				 WHERE season = $1 AND week = $2`,
				[year, week]
			);
			status.weeklyStaging.playerStats[week] = parseInt(statsStaging.rows[0]?.count || 0);

			// Playoffs - staging (typically weeks 15-18)
			if (week >= 15) {
				const playoffsStaging = await query(
					`SELECT COUNT(*) as count FROM sleeper_playoffs_staging 
					 WHERE league_id = $1 AND week = $2`,
					[sleeperLeagueId, week]
				);
				status.weeklyStaging.playoffs[week] = parseInt(playoffsStaging.rows[0]?.count || 0);
			}
		}

		return json(status);

	} catch (error) {
		console.error('Error getting data status:', error);
		return json({ error: error.message }, { status: 500 });
	}
}