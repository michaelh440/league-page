// src/routes/api/weekly_summary/+server.js
import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import { getSleeperPlayers } from '$lib/sleeper_players_cache';

const sql = neon(DATABASE_URL);

export async function GET({ url }) {
	console.log('🔍 weekly_summary GET request started');
	try {
		const season = url.searchParams.get('season');
		const week = url.searchParams.get('week');
		const type = url.searchParams.get('type') || 'regular';

		console.log('📊 Request params:', { season, week, type });

		if (!season || !week) {
			console.log('❌ Missing required params');
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		console.log('🔍 Fetching season_id for year:', season);
		const seasonResult = await sql`
			SELECT season_id FROM seasons WHERE season_year = ${parseInt(season)}
		`;

		console.log('✅ Season query result:', seasonResult);

		if (seasonResult.length === 0) {
			console.log('❌ Season not found');
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult[0].season_id;
		console.log('✅ Found season_id:', seasonId);

		let matchups;

		if (type === 'playoffs') {
			console.log('🏆 Querying playoffs data...');
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
				JOIN teams t1 ON p.team1_id = t1.team_id
				JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
				LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
					AND mtn1.season_year = ${parseInt(season)}
				JOIN teams t2 ON p.team2_id = t2.team_id
				JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
				LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
					AND mtn2.season_year = ${parseInt(season)}
				WHERE p.season_id = ${seasonId} 
					AND p.week = ${parseInt(week)}
					AND p.team1_score IS NOT NULL 
					AND p.team2_score IS NOT NULL
				ORDER BY p.round_name, p.playoff_id
			`;
			console.log('✅ Playoffs query completed, found', matchups.length, 'matchups');
		} else {
			console.log('📅 Querying regular season matchups...');
			console.log('   Query params: season_id =', seasonId, ', week =', week);
			
			// ORIGINAL WORKING QUERY - joins teams via manager_id
			matchups = await sql`
				SELECT 
					m.matchup_id,
					m.week,
					NULL as round_name,
					NULL as bracket,
					m.team1_id,
					COALESCE(mtn1.team_name, t1.team_name, 'Team ' || t1.platform_team_id) as team1_name,
					mgr1.manager_id as manager1_id,
					COALESCE(mgr1.real_name, mgr1.username) as manager1_name,
					m.team1_score,
					t1.platform_team_id as team1_platform_id,
					m.team2_id,
					COALESCE(mtn2.team_name, t2.team_name, 'Team ' || t2.platform_team_id) as team2_name,
					mgr2.manager_id as manager2_id,
					COALESCE(mgr2.real_name, mgr2.username) as manager2_name,
					m.team2_score,
					t2.platform_team_id as team2_platform_id,
					CASE 
						WHEN m.team1_score > m.team2_score THEN COALESCE(mtn1.team_name, t1.team_name, 'Team ' || t1.platform_team_id)
						WHEN m.team2_score > m.team1_score THEN COALESCE(mtn2.team_name, t2.team_name, 'Team ' || t2.platform_team_id)
						ELSE 'TIE'
					END as winner,
					ABS(m.team1_score - m.team2_score) as margin
				FROM matchups m
				JOIN teams t1 ON m.team1_id = t1.manager_id AND t1.season_id = ${seasonId}
				JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
				LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
					AND mtn1.season_year = ${parseInt(season)}
				JOIN teams t2 ON m.team2_id = t2.manager_id AND t2.season_id = ${seasonId}
				JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
				LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
					AND mtn2.season_year = ${parseInt(season)}
				WHERE m.season_id = ${seasonId} 
					AND m.week = ${parseInt(week)}
					AND m.team1_score IS NOT NULL 
					AND m.team2_score IS NOT NULL
				ORDER BY m.matchup_id
			`;
			console.log('✅ Matchups query completed, found', matchups.length, 'matchups');
		}

		console.log('🎮 Processing rosters for', matchups.length, 'matchups...');
		for (let i = 0; i < matchups.length; i++) {
			const matchup = matchups[i];
			console.log(`  📦 Processing matchup ${i + 1}/${matchups.length}...`);
			
			console.log(`    🔍 Fetching team1 roster (platform_id: ${matchup.team1_platform_id})`);
			matchup.team1_roster = await getTeamRosterWithPoints(
				matchup.team1_platform_id, 
				parseInt(season), 
				parseInt(week)
			);
			console.log(`    ✅ Team1 roster: ${matchup.team1_roster.length} players`);
			
			console.log(`    🔍 Fetching team2 roster (platform_id: ${matchup.team2_platform_id})`);
			matchup.team2_roster = await getTeamRosterWithPoints(
				matchup.team2_platform_id, 
				parseInt(season), 
				parseInt(week)
			);
			console.log(`    ✅ Team2 roster: ${matchup.team2_roster.length} players`);
		}

		console.log('✅ All processing complete, returning', matchups.length, 'matchups');
		return json({
			success: true,
			type: type,
			matchups: matchups
		});
	} catch (error) {
		console.error('❌ ERROR in weekly_summary:', error);
		console.error('   Error message:', error.message);
		console.error('   Error stack:', error.stack);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

async function getTeamRosterWithPoints(platformTeamId, seasonYear, week) {
	try {
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

		const playerIds = Object.keys(players_points);
		
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
		
		const missingPlayerIds = playerIds.filter(id => !playerInfoMap[id]);
		if (missingPlayerIds.length > 0) {
			const sleeperPlayers = await getSleeperPlayers(missingPlayerIds);
			Object.assign(playerInfoMap, sleeperPlayers);
		}

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