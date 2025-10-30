// src/routes/managers/streaks/+page.server.js
import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('managerId');

  // Always get the list of managers for the dropdown
  const managers = (await query(`
    SELECT manager_id, username as name, logo_url 
    FROM managers 
    ORDER BY username
  `)).rows;

  // If no manager selected, return just the managers list
  if (!managerId) {
    return {
      managers,
      managerId: null,
      currentStreaks: [],
      allTimeWinStreak: [],
      allTimeLoseStreak: [],
      regularSeasonWinStreak: [],
      regularSeasonLoseStreak: [],
      playoffWinStreak: [],
      playoffLoseStreak: [],
      careerStats: null
    };
  }

  // 1. CURRENT STREAKS (all scopes for this manager)
  const currentStreaks = (await query(`
    SELECT 
      ms.streak_scope,
      ms.current_streak_type,
      ms.current_streak_length,
      ms.current_streak_start_week,
      ms.week as current_week,
      s.season_year,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      CASE 
        WHEN ms.current_streak_type = 'winning' AND ms.current_streak_length >= 5 THEN 'ON FIRE 🔥🔥🔥'
        WHEN ms.current_streak_type = 'winning' AND ms.current_streak_length >= 3 THEN 'HOT 🔥'
        WHEN ms.current_streak_type = 'losing' AND ms.current_streak_length >= 5 THEN 'FROZEN ❄️❄️❄️'
        WHEN ms.current_streak_type = 'losing' AND ms.current_streak_length >= 3 THEN 'COLD 🧊'
        ELSE 'NEUTRAL'
      END as temperature
    FROM manager_streaks ms
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id AND mtn.season_year = s.season_year
    WHERE ms.manager_id = $1
      AND ms.week = (
        SELECT MAX(week) 
        FROM manager_streaks ms2 
        WHERE ms2.season_id = ms.season_id 
        AND ms2.manager_id = ms.manager_id
        AND ms2.streak_scope = ms.streak_scope
      )
      AND ms.current_streak_length > 0
    ORDER BY ms.streak_scope, ms.current_streak_length DESC
  `, [managerId])).rows;

  // 2. ALL-TIME WIN STREAK (career longest)
  const allTimeWinStreak = (await query(`
    SELECT 
      mcs.all_time_longest_win_streak as streak_length,
      s_start.season_year as start_season,
      mcs.all_time_longest_win_streak_start_week as start_week,
      s_end.season_year as end_season,
      mcs.all_time_longest_win_streak_end_week as end_week
    FROM manager_career_streaks mcs
    LEFT JOIN seasons s_start ON s_start.season_id = mcs.all_time_longest_win_streak_start_season
    LEFT JOIN seasons s_end ON s_end.season_id = mcs.all_time_longest_win_streak_end_season
    WHERE mcs.manager_id = $1
  `, [managerId])).rows;

  // 3. ALL-TIME LOSE STREAK (career longest)
  const allTimeLoseStreak = (await query(`
    SELECT 
      mcs.all_time_longest_lose_streak as streak_length,
      s_start.season_year as start_season,
      mcs.all_time_longest_lose_streak_start_week as start_week,
      s_end.season_year as end_season,
      mcs.all_time_longest_lose_streak_end_week as end_week
    FROM manager_career_streaks mcs
    LEFT JOIN seasons s_start ON s_start.season_id = mcs.all_time_longest_lose_streak_start_season
    LEFT JOIN seasons s_end ON s_end.season_id = mcs.all_time_longest_lose_streak_end_season
    WHERE mcs.manager_id = $1
  `, [managerId])).rows;

  // 4. REGULAR SEASON WIN STREAKS (top 10 by season)
  const regularSeasonWinStreak = (await query(`
    SELECT DISTINCT
      ms.longest_win_streak as streak_length,
      ms.longest_win_streak_season_year as season_year,
      ms.longest_win_streak_start_week as start_week,
      ms.longest_win_streak_end_week as end_week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id 
      AND mtn.season_year = ms.longest_win_streak_season_year
    WHERE ms.manager_id = $1
      AND ms.streak_scope = 'regular_season'
      AND ms.longest_win_streak > 0
    ORDER BY ms.longest_win_streak DESC, ms.longest_win_streak_season_year DESC
    LIMIT 10
  `, [managerId])).rows;

  // 5. REGULAR SEASON LOSE STREAKS (top 10 by season)
  const regularSeasonLoseStreak = (await query(`
    SELECT DISTINCT
      ms.longest_lose_streak as streak_length,
      ms.longest_lose_streak_season_year as season_year,
      ms.longest_lose_streak_start_week as start_week,
      ms.longest_lose_streak_end_week as end_week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id 
      AND mtn.season_year = ms.longest_lose_streak_season_year
    WHERE ms.manager_id = $1
      AND ms.streak_scope = 'regular_season'
      AND ms.longest_lose_streak > 0
    ORDER BY ms.longest_lose_streak DESC, ms.longest_lose_streak_season_year DESC
    LIMIT 10
  `, [managerId])).rows;

  // 6. PLAYOFF WIN STREAKS (top 10 by season)
  const playoffWinStreak = (await query(`
    SELECT DISTINCT
      ms.longest_win_streak as streak_length,
      ms.longest_win_streak_season_year as season_year,
      ms.longest_win_streak_start_week as start_week,
      ms.longest_win_streak_end_week as end_week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id 
      AND mtn.season_year = ms.longest_win_streak_season_year
    WHERE ms.manager_id = $1
      AND ms.streak_scope = 'playoffs'
      AND ms.longest_win_streak > 0
    ORDER BY ms.longest_win_streak DESC, ms.longest_win_streak_season_year DESC
    LIMIT 10
  `, [managerId])).rows;

  // 7. PLAYOFF LOSE STREAKS (top 10 by season)
  const playoffLoseStreak = (await query(`
    SELECT DISTINCT
      ms.longest_lose_streak as streak_length,
      ms.longest_lose_streak_season_year as season_year,
      ms.longest_lose_streak_start_week as start_week,
      ms.longest_lose_streak_end_week as end_week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id 
      AND mtn.season_year = ms.longest_lose_streak_season_year
    WHERE ms.manager_id = $1
      AND ms.streak_scope = 'playoffs'
      AND ms.longest_lose_streak > 0
    ORDER BY ms.longest_lose_streak DESC, ms.longest_lose_streak_season_year DESC
    LIMIT 10
  `, [managerId])).rows;

  // 8. CAREER STATS SUMMARY
  const careerStats = (await query(`
    SELECT 
      mcs.all_time_current_streak_type,
      mcs.all_time_current_streak_length,
      mcs.career_total_wins,
      mcs.career_total_losses,
      mcs.career_total_ties,
      mcs.career_regular_season_wins,
      mcs.career_regular_season_losses,
      mcs.career_playoff_wins,
      mcs.career_playoff_losses,
      CASE 
        WHEN (mcs.career_total_wins + mcs.career_total_losses) > 0
        THEN ROUND((mcs.career_total_wins::NUMERIC / 
                   (mcs.career_total_wins + mcs.career_total_losses)) * 100, 1)
        ELSE 0
      END as career_win_pct
    FROM manager_career_streaks mcs
    WHERE mcs.manager_id = $1
  `, [managerId])).rows[0] || null;

  return {
    managers,
    managerId: parseInt(managerId),
    currentStreaks,
    allTimeWinStreak,
    allTimeLoseStreak,
    regularSeasonWinStreak,
    regularSeasonLoseStreak,
    playoffWinStreak,
    playoffLoseStreak,
    careerStats
  };
}