// src/routes/api/weekly_summary/+server.js
import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import { getSleeperPlayers } from '$lib/sleeper_players_cache';

const sql = neon(DATABASE_URL);

export async function GET({ url }) {
	try {
		const season = url.searchParams.get('season');
		const week = url.searchParams.get('week');
		const type = url.searchParams.get('type') || 'regular';

		if (!season || !week) {
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		// Get season_id
		const seasonResult = await sql`
			SELECT season_id FROM seasons WHERE season_year = ${parseInt(season)}
		`;

		if (seasonResult.length === 0) {
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult[0].season_id;

		let matchups;

		if (type === 'playoffs') {
			// Query the playoffs table
			matchups = await sql`
				SELECT 
					p.playoff_id as matchup_id,
					p.week,
					p.round_name,
					p.bracket,
					p.team1_id,
					COALESCE(mtn1.team_name, t1.team_name, 'Team ' || t1.platform_team_id) as team1_name,
					mgr1.manager_id as manager1_id,
					COALESCE(mgr1.real_name, mgr1.username) as manager1_name,
					p.team1_score,
					t1.platform_team_id as team1_platform_id,
					p.team2_id,
					COALESCE(mtn2.team_name, t2.team_name, 'Team ' || t2.platform_team_id) as team2_name,
					mgr2.manager_id as manager2_id,
					COALESCE(mgr2.real_name, mgr2.username) as manager2_name,
					p.team2_score,
					t2.platform_team_id as team2_platform_id,
					CASE 
						WHEN p.team1_score > p.team2_score THEN COALESCE(mtn1.team_name, t1.team_name, 'Team ' || t1.platform_team_id)
						WHEN p.team2_score > p.team1_score THEN COALESCE(mtn2.team_name, t2.team_name, 'Team ' || t2.platform_team_id)
						ELSE 'TIE'
					END as winner,
					ABS(p.team1_score - p.team2_score) as margin
				FROM playoffs p
				JOIN teams t1 ON p.team1_id = t1.team_id AND t1.season_id = ${seasonId}
				JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
				LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
					AND mtn1.season_year = ${parseInt(season)}
				JOIN teams t2 ON p.team2_id = t2.team_id AND t2.season_id = ${seasonId}
				JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
				LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
					AND mtn2.season_year = ${parseInt(season)}
				WHERE p.season_id = ${seasonId} 
					AND p.week = ${parseInt(week)}
					AND p.team1_score IS NOT NULL 
					AND p.team2_score IS NOT NULL
				ORDER BY p.round_name, p.playoff_id
			`;
		} else {
			// Query the regular season matchups table  
			matchups = await sql`
				SELECT 
					m.matchup_id,
					m.week,
					NULL as round_name,
					NULL as bracket,
					m.team1_id,
					COALESCE(mtn1.team_name, t1.team_name, 'Team ' || m.team1_id) as team1_name,
					COALESCE(mgr1.manager_id, m.team1_id) as manager1_id,
					COALESCE(mgr1.real_name, mgr1.username, 'Manager ' || m.team1_id) as manager1_name,
					m.team1_score,
					COALESCE(t1.platform_team_id, m.team1_id::text) as team1_platform_id,
					m.team2_id,
					COALESCE(mtn2.team_name, t2.team_name, 'Team ' || m.team2_id) as team2_name,
					COALESCE(mgr2.manager_id, m.team2_id) as manager2_id,
					COALESCE(mgr2.real_name, mgr2.username, 'Manager ' || m.team2_id) as manager2_name,
					m.team2_score,
					COALESCE(t2.platform_team_id, m.team2_id::text) as team2_platform_id,
					CASE 
						WHEN m.team1_score > m.team2_score THEN COALESCE(mtn1.team_name, t1.team_name, 'Team ' || m.team1_id)
						WHEN m.team2_score > m.team1_score THEN COALESCE(mtn2.team_name, t2.team_name, 'Team ' || m.team2_id)
						ELSE 'TIE'
					END as winner,
					ABS(m.team1_score - m.team2_score) as margin
				FROM matchups m
				LEFT JOIN teams t1 ON m.team1_id = t1.manager_id AND t1.season_id = ${seasonId}
				LEFT JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
				LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
					AND mtn1.season_year = ${parseInt(season)}
				LEFT JOIN teams t2 ON m.team2_id = t2.manager_id AND t2.season_id = ${seasonId}
				LEFT JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
				LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
					AND mtn2.season_year = ${parseInt(season)}
				WHERE m.season_id = ${seasonId} 
					AND m.week = ${parseInt(week)}
					AND m.team1_score IS NOT NULL 
					AND m.team2_score IS NOT NULL
				ORDER BY m.matchup_id
			`;
		}

		// For each matchup, get roster details with fantasy points
		for (let matchup of matchups) {
			// Get team1 roster
			matchup.team1_roster = await getTeamRosterWithPoints(
				matchup.team1_platform_id, 
				parseInt(season), 
				parseInt(week)
			);
			
			// Get team2 roster
			matchup.team2_roster = await getTeamRosterWithPoints(
				matchup.team2_platform_id, 
				parseInt(season), 
				parseInt(week)
			);
		}

		return json({
			success: true,
			type: type,
			matchups: matchups
		});
	} catch (error) {
		console.error('Error fetching weekly summary:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

async function getTeamRosterWithPoints(platformTeamId, seasonYear, week) {
	try {
		// Get matchup data which has players_points, starters, and starters_points
		const matchupData = await sql`
			SELECT 
				starters,
				players_points,
				starters_points
			FROM staging_sleeper_matchups
			WHERE roster_id = ${parseInt(platformTeamId)}
				AND season_year = ${seasonYear}
				AND week = ${week}
			LIMIT 1
		`;

		if (matchupData.length === 0) {
			return [];
		}

		const { starters, players_points, starters_points } = matchupData[0];
		
		if (!players_points) {
			return [];
		}

		// Get player IDs
		const playerIds = Object.keys(players_points);
		
		// Try to get player info from nfl_players first
		const playerInfoMap = {};
		if (playerIds.length > 0) {
			const playerInfos = await sql`
				SELECT sleeper_player_id, player_name, position
				FROM nfl_players
				WHERE sleeper_player_id = ANY(${playerIds})
			`;
			
			playerInfos.forEach(p => {
				playerInfoMap[p.sleeper_player_id] = {
					player_name: p.player_name,
					position: p.position
				};
			});
		}
		
		// For any players not found in database, fetch from Sleeper API
		const missingPlayerIds = playerIds.filter(id => !playerInfoMap[id]);
		if (missingPlayerIds.length > 0) {
			const sleeperPlayers = await getSleeperPlayers(missingPlayerIds);
			Object.assign(playerInfoMap, sleeperPlayers);
		}

		// Convert players_points JSONB to array of player data
		const roster = [];
		const startersArray = starters ? (Array.isArray(starters) ? starters : []) : [];

		for (const [playerId, points] of Object.entries(players_points)) {
			const isStarter = startersArray.includes(playerId);
			const playerInfo = playerInfoMap[playerId];
			
			roster.push({
				player_id: playerId,
				player_name: playerInfo?.player_name || `Player ${playerId}`,
				position: playerInfo?.position || 'FLEX',
				points: parseFloat(points) || 0,
				is_starter: isStarter
			});
		}

		// Sort: starters first (by points desc), then bench (by points desc)
		roster.sort((a, b) => {
			if (a.is_starter && !b.is_starter) return -1;
			if (!a.is_starter && b.is_starter) return 1;
			return b.points - a.points;
		});

		return roster;
	} catch (error) {
		console.error('Error fetching team roster with points:', error);
		return [];
	}
}