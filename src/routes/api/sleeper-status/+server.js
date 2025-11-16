// src/routes/api/sleeper-status/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
	const seasonId = url.searchParams.get('season_id');
	const seasonYear = url.searchParams.get('season_year');

	if (!seasonId || !seasonYear) {
		return json({ error: 'Missing season_id or season_year' }, { status: 400 });
	}

	try {
		const status = {
			// Weekly production data
			weeklyRosters: {},
			playerStats: {},
			matchups: {},
			playoffRosters: {},
			playoffStats: {},
			playoffs: {},
			
			// Staging data by week
			stagingByWeek: {
				rosters: {},
				stats: {},
				matchups: {}
			},
			
			// Season-level data
			seasonData: {
				teams: 0,
				managers: 0,
				draftPicks: 0,
				hasLeagueData: false
			},
			
			// Totals for staging
			stagingRosters: 0,
			stagingStats: 0,
			stagingMatchups: 0,
			
			// Summary counts
			regularWeeksCount: 0,
			playoffWeeksCount: 0,
			totalRegularRosters: 0,
			totalRegularStats: 0,
			totalRegularMatchups: 0,
			totalPlayoffRosters: 0,
			totalPlayoffStats: 0,
			totalPlayoffs: 0
		};

		// Get regular season roster data by week
		const weeklyRostersQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM weekly_roster
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of weeklyRostersQuery.rows) {
			status.weeklyRosters[row.week] = parseInt(row.count);
			if (row.week < 15) {
				status.regularWeeksCount++;
				status.totalRegularRosters += parseInt(row.count);
			}
		}

		// Get regular season player stats by week
		const playerStatsQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM player_fantasy_stats
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of playerStatsQuery.rows) {
			status.playerStats[row.week] = parseInt(row.count);
			if (row.week < 15) {
				status.totalRegularStats += parseInt(row.count);
			}
		}

		// Get matchups by week (regular season)
		const matchupsQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM matchups
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of matchupsQuery.rows) {
			status.matchups[row.week] = parseInt(row.count);
			if (row.week < 15) {
				status.totalRegularMatchups += parseInt(row.count);
			}
		}

		// Get playoff roster data by week
		const playoffRostersQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM playoff_roster
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of playoffRostersQuery.rows) {
			status.playoffRosters[row.week] = parseInt(row.count);
			status.playoffWeeksCount++;
			status.totalPlayoffRosters += parseInt(row.count);
		}

		// Get playoff stats by week
		const playoffStatsQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM playoff_fantasy_stats
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of playoffStatsQuery.rows) {
			status.playoffStats[row.week] = parseInt(row.count);
			status.totalPlayoffStats += parseInt(row.count);
		}

		// Get playoffs table data by week (playoff bracket structure)
		const playoffsQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM playoffs
			WHERE season_id = $1
			GROUP BY week
			ORDER BY week
		`, [seasonId]);

		for (const row of playoffsQuery.rows) {
			status.playoffs[row.week] = parseInt(row.count);
			status.totalPlayoffs += parseInt(row.count);
		}

		// Get season-level data

		// Teams
		const teamsQuery = await query(`
			SELECT COUNT(*) as count
			FROM teams
			WHERE season_id = $1
		`, [seasonId]);
		status.seasonData.teams = parseInt(teamsQuery.rows[0]?.count || 0);

		// Managers (unique managers for this season)
		const managersQuery = await query(`
			SELECT COUNT(DISTINCT manager_id) as count
			FROM teams
			WHERE season_id = $1
		`, [seasonId]);
		status.seasonData.managers = parseInt(managersQuery.rows[0]?.count || 0);

		// Draft picks
		const draftPicksQuery = await query(`
			SELECT COUNT(*) as count
			FROM draft_picks dp
			JOIN drafts d ON dp.draft_id = d.draft_id
			WHERE d.season_year = $1
		`, [seasonYear]);
		status.seasonData.draftPicks = parseInt(draftPicksQuery.rows[0]?.count || 0);

		// League data (just check if league exists for this season)
		const leagueQuery = await query(`
			SELECT league_id
			FROM seasons
			WHERE season_id = $1
		`, [seasonId]);
		status.seasonData.hasLeagueData = leagueQuery.rows.length > 0;

		// Get staging table counts for this season

		// Rosters
		const stagingRostersQuery = await query(`
			SELECT COUNT(*) as count
			FROM staging_sleeper_weekly_rosters
			WHERE season_year = $1 AND processed = false
		`, [seasonYear]);
		status.stagingRosters = parseInt(stagingRostersQuery.rows[0]?.count || 0);

		// Stats
		const stagingStatsQuery = await query(`
			SELECT COUNT(*) as count
			FROM staging_sleeper_player_stats
			WHERE season_year = $1 AND processed = false
		`, [seasonYear]);
		status.stagingStats = parseInt(stagingStatsQuery.rows[0]?.count || 0);

		// Matchups
		const stagingMatchupsQuery = await query(`
			SELECT COUNT(*) as count
			FROM staging_sleeper_matchups
			WHERE season_year = $1 AND processed = false
		`, [seasonYear]);
		status.stagingMatchups = parseInt(stagingMatchupsQuery.rows[0]?.count || 0);

		// Get staging data BY WEEK

		// Rosters by week
		const stagingRostersByWeekQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM staging_sleeper_weekly_rosters
			WHERE season_year = $1 AND processed = false
			GROUP BY week
			ORDER BY week
		`, [seasonYear]);

		for (const row of stagingRostersByWeekQuery.rows) {
			status.stagingByWeek.rosters[row.week] = parseInt(row.count);
		}

		// Stats by week
		const stagingStatsByWeekQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM staging_sleeper_player_stats
			WHERE season_year = $1 AND processed = false
			GROUP BY week
			ORDER BY week
		`, [seasonYear]);

		for (const row of stagingStatsByWeekQuery.rows) {
			status.stagingByWeek.stats[row.week] = parseInt(row.count);
		}

		// Matchups by week
		const stagingMatchupsByWeekQuery = await query(`
			SELECT week, COUNT(*) as count
			FROM staging_sleeper_matchups
			WHERE season_year = $1 AND processed = false
			GROUP BY week
			ORDER BY week
		`, [seasonYear]);

		for (const row of stagingMatchupsByWeekQuery.rows) {
			status.stagingByWeek.matchups[row.week] = parseInt(row.count);
		}

		return json(status);
	} catch (error) {
		console.error('Error getting Sleeper status:', error);
		return json({ error: error.message }, { status: 500 });
	}
}