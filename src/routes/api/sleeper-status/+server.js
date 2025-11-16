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
			weeklyRosters: {},
			playerStats: {},
			playoffRosters: {},
			playoffStats: {},
			stagingRosters: 0,
			stagingStats: 0,
			regularWeeksCount: 0,
			playoffWeeksCount: 0,
			totalRegularRosters: 0,
			totalRegularStats: 0,
			totalPlayoffRosters: 0,
			totalPlayoffStats: 0
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

		// Get staging table counts for this season
		const stagingRostersQuery = await query(`
			SELECT COUNT(*) as count
			FROM staging_sleeper_weekly_rosters
			WHERE season_year = $1 AND processed = false
		`, [seasonYear]);
		status.stagingRosters = parseInt(stagingRostersQuery.rows[0]?.count || 0);

		const stagingStatsQuery = await query(`
			SELECT COUNT(*) as count
			FROM staging_sleeper_player_stats
			WHERE season_year = $1 AND processed = false
		`, [seasonYear]);
		status.stagingStats = parseInt(stagingStatsQuery.rows[0]?.count || 0);

		return json(status);
	} catch (error) {
		console.error('Error getting Sleeper status:', error);
		return json({ error: error.message }, { status: 500 });
	}
}