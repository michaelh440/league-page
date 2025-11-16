import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function GET({ url }) {
	try {
		const season = url.searchParams.get('season');
		const week = url.searchParams.get('week');

		if (!season || !week) {
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		const weekNum = parseInt(week);
		const seasonYear = parseInt(season);

		// Get season_id
		const seasonResult = await query(
			`SELECT season_id FROM seasons WHERE season_year = $1`,
			[seasonYear]
		);

		if (seasonResult.rows.length === 0) {
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult.rows[0].season_id;

		// 1. Get current standings (ONLY up to and including this week)
		// This represents what the standings would have been at that point in time
		const standings = await query(`
			WITH team_records AS (
				SELECT 
					t.team_id,
					t.manager_id,
					COALESCE(mtn.team_name, t.team_name) as team_name,
					COALESCE(mtn.logo_url, m.logo_url) as logo_url,
					m.username as manager_name,
					-- Count wins (only through this week)
					COUNT(CASE 
						WHEN (m1.team1_id = t.team_id AND m1.team1_score > m1.team2_score) 
							OR (m1.team2_id = t.team_id AND m1.team2_score > m1.team1_score) 
						THEN 1 
					END) as wins,
					-- Count losses
					COUNT(CASE 
						WHEN (m1.team1_id = t.team_id AND m1.team1_score < m1.team2_score) 
							OR (m1.team2_id = t.team_id AND m1.team2_score < m1.team1_score) 
						THEN 1 
					END) as losses,
					-- Count ties
					COUNT(CASE 
						WHEN (m1.team1_id = t.team_id OR m1.team2_id = t.team_id) 
							AND m1.team1_score = m1.team2_score 
						THEN 1 
					END) as ties,
					-- Points for
					COALESCE(SUM(ws.team_score), 0) as points_for,
					-- Points against
					COALESCE(SUM(
						CASE 
							WHEN m1.team1_id = t.team_id THEN m1.team2_score
							WHEN m1.team2_id = t.team_id THEN m1.team1_score
						END
					), 0) as points_against
				FROM teams t
				JOIN managers m ON t.manager_id = m.manager_id
				LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
					AND mtn.season_year = $1
				LEFT JOIN matchups m1 ON (m1.team1_id = t.team_id OR m1.team2_id = t.team_id)
					AND m1.season_id = $2
					AND m1.week <= $3  -- KEY: Only through this week
					AND m1.team1_score IS NOT NULL 
					AND m1.team2_score IS NOT NULL
				LEFT JOIN weekly_scoring ws ON ws.team_id = t.team_id 
					AND ws.season_id = $2
					AND ws.week <= $3  -- KEY: Only through this week
				WHERE t.season_id = $2
				GROUP BY t.team_id, t.manager_id, t.team_name, m.username, m.logo_url, mtn.team_name, mtn.logo_url
			)
			SELECT 
				*,
				RANK() OVER (ORDER BY wins DESC, points_for DESC) as rank
			FROM team_records
			ORDER BY rank
		`, [seasonYear, seasonId, weekNum]);

		// 2. Get previous summaries - ONLY from earlier weeks/seasons
		// Include previous weeks from THIS season and ALL previous seasons
		const previousSummaries = await query(`
			SELECT 
				s.season_year,
				ws.week,
				ws.summary_text,
				ws.generated_at
			FROM weekly_summaries ws
			JOIN seasons s ON ws.season_id = s.season_id
			WHERE (
				-- Previous weeks in current season
				(ws.season_id = $1 AND ws.week < $2)
				OR
				-- Any week from previous seasons
				(s.season_year < $3)
			)
			ORDER BY s.season_year DESC, ws.week DESC
			LIMIT 10  -- Get last 10 summaries for context
		`, [seasonId, weekNum, seasonYear]);

		// 3. Get streaks - ONLY calculated through this week
		// The manager_streaks table should already have historical data per week
		const streaks = await query(`
			SELECT 
				ms.manager_id,
				m.username as manager_name,
				COALESCE(mtn.team_name, t.team_name) as team_name,
				ms.streak_scope,
				ms.current_streak_type,
				ms.current_streak_length,
				ms.current_streak_start_week,
				ms.longest_win_streak,
				ms.longest_lose_streak,
				ms.total_wins,
				ms.total_losses,
				ms.total_ties
			FROM manager_streaks ms
			JOIN managers m ON ms.manager_id = m.manager_id
			LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
			LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id 
				AND mtn.season_year = $1
			WHERE ms.season_id = $2
				AND ms.week = $3  -- Exact week snapshot
				AND ms.streak_scope = 'regular_season'
			ORDER BY ms.current_streak_length DESC
		`, [seasonYear, seasonId, weekNum]);

		// 4. Get matchups for THIS specific week with rivalry data
		// Rivalry data can include ALL history up to this point
		const matchups = await query(`
			SELECT 
				m.matchup_id,
				m.week,
				m.team1_id,
				m.team2_id,
				COALESCE(mtn1.team_name, t1.team_name) as team1_name,
				COALESCE(mtn2.team_name, t2.team_name) as team2_name,
				mgr1.username as team1_manager,
				mgr2.username as team2_manager,
				m.team1_score,
				m.team2_score,
				-- Historical head-to-head BEFORE or INCLUDING this week
				(
					SELECT COUNT(*) 
					FROM matchups h2h 
					WHERE (
						(h2h.team1_id = m.team1_id AND h2h.team2_id = m.team2_id)
						OR (h2h.team1_id = m.team2_id AND h2h.team2_id = m.team1_id)
					)
					AND (
						-- Previous seasons
						h2h.season_id IN (SELECT season_id FROM seasons WHERE season_year < $1)
						OR
						-- Earlier weeks this season
						(h2h.season_id = $2 AND h2h.week < $3)
					)
					AND h2h.team1_score IS NOT NULL
					AND h2h.team2_score IS NOT NULL
				) as h2h_games,
				-- Team1 wins in history
				(
					SELECT COUNT(*) 
					FROM matchups h2h 
					WHERE (
						(h2h.team1_id = m.team1_id AND h2h.team2_id = m.team2_id AND h2h.team1_score > h2h.team2_score)
						OR (h2h.team2_id = m.team1_id AND h2h.team1_id = m.team2_id AND h2h.team2_score > h2h.team1_score)
					)
					AND (
						h2h.season_id IN (SELECT season_id FROM seasons WHERE season_year < $1)
						OR (h2h.season_id = $2 AND h2h.week < $3)
					)
				) as team1_h2h_wins,
				-- Team2 wins in history
				(
					SELECT COUNT(*) 
					FROM matchups h2h 
					WHERE (
						(h2h.team1_id = m.team2_id AND h2h.team2_id = m.team1_id AND h2h.team1_score > h2h.team2_score)
						OR (h2h.team2_id = m.team2_id AND h2h.team1_id = m.team1_id AND h2h.team2_score > h2h.team1_score)
					)
					AND (
						h2h.season_id IN (SELECT season_id FROM seasons WHERE season_year < $1)
						OR (h2h.season_id = $2 AND h2h.week < $3)
					)
				) as team2_h2h_wins
			FROM matchups m
			JOIN teams t1 ON m.team1_id = t1.team_id
			JOIN teams t2 ON m.team2_id = t2.team_id
			JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
			JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
			LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
				AND mtn1.season_year = $1
			LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
				AND mtn2.season_year = $1
			WHERE m.season_id = $2
				AND m.week = $3
			ORDER BY m.matchup_id
		`, [seasonYear, seasonId, weekNum]);

		// 5. Get roster data for THIS week
		const rosterData = await query(`
			WITH starters AS (
				SELECT 
					wr.team_id,
					wr.player_id,
					wr.player_name,
					wr.position,
					wr.lineup_slot,
					pfs.total_fantasy_points,
					'starter' as role
				FROM weekly_roster wr
				LEFT JOIN player_fantasy_stats pfs ON pfs.player_id = wr.player_id
					AND pfs.season_id = $1
					AND pfs.week = $2
				WHERE wr.season_id = $1
					AND wr.week = $2
					AND wr.is_starter = true
			),
			bench AS (
				SELECT 
					wr.team_id,
					wr.player_id,
					wr.player_name,
					wr.position,
					wr.lineup_slot,
					pfs.total_fantasy_points,
					'bench' as role
				FROM weekly_roster wr
				LEFT JOIN player_fantasy_stats pfs ON pfs.player_id = wr.player_id
					AND pfs.season_id = $1
					AND pfs.week = $2
				WHERE wr.season_id = $1
					AND wr.week = $2
					AND wr.is_starter = false
			),
			combined AS (
				SELECT * FROM starters
				UNION ALL
				SELECT * FROM bench
			)
			SELECT 
				t.team_id,
				COALESCE(mtn.team_name, t.team_name) as team_name,
				m.username as manager_name,
				json_agg(
					json_build_object(
						'player_id', c.player_id,
						'player_name', c.player_name,
						'position', c.position,
						'lineup_slot', c.lineup_slot,
						'points', c.total_fantasy_points,
						'role', c.role
					) ORDER BY c.role, c.total_fantasy_points DESC NULLS LAST
				) as roster,
				SUM(CASE WHEN c.role = 'starter' THEN COALESCE(c.total_fantasy_points, 0) ELSE 0 END) as starter_points,
				SUM(CASE WHEN c.role = 'bench' THEN COALESCE(c.total_fantasy_points, 0) ELSE 0 END) as bench_points,
				MAX(CASE WHEN c.role = 'bench' THEN COALESCE(c.total_fantasy_points, 0) ELSE 0 END) as highest_bench_points,
				MIN(CASE WHEN c.role = 'starter' THEN COALESCE(c.total_fantasy_points, 0) ELSE NULL END) as lowest_starter_points
			FROM teams t
			JOIN managers m ON t.manager_id = m.manager_id
			LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
				AND mtn.season_year = $3
			LEFT JOIN combined c ON c.team_id = t.team_id
			WHERE t.season_id = $1
			GROUP BY t.team_id, t.team_name, m.username, mtn.team_name
			ORDER BY t.team_id
		`, [seasonId, weekNum, seasonYear]);

		// 6. Get bench blunders for THIS week
		const benchAnalysis = await query(`
			WITH bench_players AS (
				SELECT 
					wr.team_id,
					t.manager_id,
					COALESCE(mtn.team_name, t.team_name) as team_name,
					m.username as manager_name,
					wr.player_name,
					wr.position,
					pfs.total_fantasy_points as bench_points
				FROM weekly_roster wr
				JOIN teams t ON wr.team_id = t.team_id
				JOIN managers m ON t.manager_id = m.manager_id
				LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
					AND mtn.season_year = $3
				LEFT JOIN player_fantasy_stats pfs ON pfs.player_id = wr.player_id
					AND pfs.season_id = $1
					AND pfs.week = $2
				WHERE wr.season_id = $1
					AND wr.week = $2
					AND wr.is_starter = false
					AND pfs.total_fantasy_points > 15
			),
			starter_players AS (
				SELECT 
					wr.team_id,
					wr.position,
					wr.player_name,
					pfs.total_fantasy_points as starter_points
				FROM weekly_roster wr
				LEFT JOIN player_fantasy_stats pfs ON pfs.player_id = wr.player_id
					AND pfs.season_id = $1
					AND pfs.week = $2
				WHERE wr.season_id = $1
					AND wr.week = $2
					AND wr.is_starter = true
			)
			SELECT 
				bp.team_id,
				bp.team_name,
				bp.manager_name,
				bp.player_name as benched_player,
				bp.position,
				bp.bench_points,
				sp.player_name as started_player,
				sp.starter_points,
				(bp.bench_points - sp.starter_points) as points_left_on_bench
			FROM bench_players bp
			LEFT JOIN starter_players sp ON sp.team_id = bp.team_id 
				AND sp.position = bp.position
				AND sp.starter_points < bp.bench_points
			WHERE sp.player_name IS NOT NULL
			ORDER BY points_left_on_bench DESC
		`, [seasonId, weekNum, seasonYear]);

		// 7. Get all-time career stats up to this point in time
		const careerStats = await query(`
			WITH historical_games AS (
				SELECT 
					t.manager_id,
					CASE 
						WHEN (m.team1_id = t.team_id AND m.team1_score > m.team2_score) 
							OR (m.team2_id = t.team_id AND m.team2_score > m.team1_score) 
						THEN 1 ELSE 0 
					END as is_win,
					CASE 
						WHEN (m.team1_id = t.team_id AND m.team1_score < m.team2_score) 
							OR (m.team2_id = t.team_id AND m.team2_score < m.team1_score) 
						THEN 1 ELSE 0 
					END as is_loss
				FROM matchups m
				JOIN teams t ON (m.team1_id = t.team_id OR m.team2_id = t.team_id)
				JOIN seasons s ON m.season_id = s.season_id
				WHERE (
					-- All previous seasons
					s.season_year < $1
					OR
					-- Current season up to this week
					(s.season_year = $1 AND m.week <= $2)
				)
				AND m.team1_score IS NOT NULL 
				AND m.team2_score IS NOT NULL
			)
			SELECT 
				m.manager_id,
				m.username as manager_name,
				COALESCE(mtn.team_name, t.team_name) as current_team_name,
				SUM(hg.is_win) as career_wins,
				SUM(hg.is_loss) as career_losses,
				CASE 
					WHEN SUM(hg.is_win) + SUM(hg.is_loss) > 0 
					THEN ROUND((SUM(hg.is_win)::NUMERIC / (SUM(hg.is_win) + SUM(hg.is_loss))) * 100, 1)
					ELSE 0 
				END as career_win_pct
			FROM managers m
			LEFT JOIN historical_games hg ON hg.manager_id = m.manager_id
			LEFT JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = $3
			LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
				AND mtn.season_year = $1
			GROUP BY m.manager_id, m.username, t.team_name, mtn.team_name
			ORDER BY career_wins DESC
		`, [seasonYear, weekNum, seasonId]);

		return json({
			success: true,
			context: {
				standings: standings.rows,
				previousSummaries: previousSummaries.rows,
				streaks: streaks.rows,
				matchups: matchups.rows,
				rosterData: rosterData.rows,
				benchAnalysis: benchAnalysis.rows,
				careerStats: careerStats.rows,
				seasonYear: seasonYear,
				week: weekNum,
				// Add metadata about temporal scope
				temporalScope: {
					targetSeason: seasonYear,
					targetWeek: weekNum,
					dataIncludesUpTo: `${seasonYear} Week ${weekNum}`,
					note: 'All data filtered to only include information available at this point in time'
				}
			}
		});

	} catch (error) {
		console.error('Error fetching summary context:', error);
		return json({ 
			success: false, 
			error: error.message 
		}, { status: 500 });
	}
}