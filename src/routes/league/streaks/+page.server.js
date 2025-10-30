// src/routes/league/streaks/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // All Time Winning Streaks
  const allTimeWinningStreaks = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      mcs.all_time_longest_win_streak as streak_length,
      s_start.season_year as start_season,
      mcs.all_time_longest_win_streak_start_week as start_week,
      s_end.season_year as end_season,
      mcs.all_time_longest_win_streak_end_week as end_week
    FROM manager_career_streaks mcs
    JOIN managers m ON mcs.manager_id = m.manager_id
    LEFT JOIN seasons s_start ON s_start.season_id = mcs.all_time_longest_win_streak_start_season
    LEFT JOIN seasons s_end ON s_end.season_id = mcs.all_time_longest_win_streak_end_season
    WHERE mcs.all_time_longest_win_streak > 0
    ORDER BY mcs.all_time_longest_win_streak DESC, m.username ASC
    LIMIT 10
  `)).rows;

  // All Time Losing Streaks
  const allTimeLosingStreaks = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      mcs.all_time_longest_lose_streak as streak_length,
      s_start.season_year as start_season,
      mcs.all_time_longest_lose_streak_start_week as start_week,
      s_end.season_year as end_season,
      mcs.all_time_longest_lose_streak_end_week as end_week
    FROM manager_career_streaks mcs
    JOIN managers m ON mcs.manager_id = m.manager_id
    LEFT JOIN seasons s_start ON s_start.season_id = mcs.all_time_longest_lose_streak_start_season
    LEFT JOIN seasons s_end ON s_end.season_id = mcs.all_time_longest_lose_streak_end_season
    WHERE mcs.all_time_longest_lose_streak > 0
    ORDER BY mcs.all_time_longest_lose_streak DESC, m.username ASC
    LIMIT 10
  `)).rows;

  // Regular Season Winning Streaks
  const regularSeasonWinningStreaks = (await query(`
    SELECT DISTINCT ON (ms.manager_id)
      m.username as manager_name,
      m.logo_url as manager_logo,
      ms.longest_win_streak as streak_length,
      ms.longest_win_streak_season_year as season_year,
      ms.longest_win_streak_start_week as start_week,
      ms.longest_win_streak_end_week as end_week
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    WHERE ms.streak_scope = 'regular_season'
      AND ms.longest_win_streak > 0
    ORDER BY ms.manager_id, ms.longest_win_streak DESC
  `)).rows.sort((a, b) => b.streak_length - a.streak_length || a.manager_name.localeCompare(b.manager_name)).slice(0, 10);

  // Regular Season Losing Streaks
  const regularSeasonLosingStreaks = (await query(`
    SELECT DISTINCT ON (ms.manager_id)
      m.username as manager_name,
      m.logo_url as manager_logo,
      ms.longest_lose_streak as streak_length,
      ms.longest_lose_streak_season_year as season_year,
      ms.longest_lose_streak_start_week as start_week,
      ms.longest_lose_streak_end_week as end_week
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    WHERE ms.streak_scope = 'regular_season'
      AND ms.longest_lose_streak > 0
    ORDER BY ms.manager_id, ms.longest_lose_streak DESC
  `)).rows.sort((a, b) => b.streak_length - a.streak_length || a.manager_name.localeCompare(b.manager_name)).slice(0, 10);

  // Playoff Winning Streaks
  const playoffWinningStreaks = (await query(`
    SELECT DISTINCT ON (ms.manager_id)
      m.username as manager_name,
      m.logo_url as manager_logo,
      ms.longest_win_streak as streak_length,
      ms.longest_win_streak_season_year as season_year,
      ms.longest_win_streak_start_week as start_week,
      ms.longest_win_streak_end_week as end_week
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    WHERE ms.streak_scope = 'playoffs'
      AND ms.longest_win_streak > 0
    ORDER BY ms.manager_id, ms.longest_win_streak DESC
  `)).rows.sort((a, b) => b.streak_length - a.streak_length || a.manager_name.localeCompare(b.manager_name)).slice(0, 10);

  // Playoff Losing Streaks
  const playoffLosingStreaks = (await query(`
    SELECT DISTINCT ON (ms.manager_id)
      m.username as manager_name,
      m.logo_url as manager_logo,
      ms.longest_lose_streak as streak_length,
      ms.longest_lose_streak_season_year as season_year,
      ms.longest_lose_streak_start_week as start_week,
      ms.longest_lose_streak_end_week as end_week
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    WHERE ms.streak_scope = 'playoffs'
      AND ms.longest_lose_streak > 0
    ORDER BY ms.manager_id, ms.longest_lose_streak DESC
  `)).rows.sort((a, b) => b.streak_length - a.streak_length || a.manager_name.localeCompare(b.manager_name)).slice(0, 10);

  // Current Hot Streaks (3+ wins)
  const currentHotStreaks = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      ms.current_streak_length as streak_length,
      ms.current_streak_start_week as start_week,
      ms.week as current_week,
      s.season_year,
      ms.streak_scope
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id AND mtn.season_year = s.season_year
    WHERE ms.current_streak_type = 'winning'
      AND ms.current_streak_length >= 3
      AND ms.week = (
        SELECT MAX(week) 
        FROM manager_streaks ms2 
        WHERE ms2.season_id = ms.season_id 
        AND ms2.streak_scope = ms.streak_scope
      )
    ORDER BY ms.current_streak_length DESC, m.username ASC
    LIMIT 10
  `)).rows;

  // Current Cold Streaks (3+ losses)
  const currentColdStreaks = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      ms.current_streak_length as streak_length,
      ms.current_streak_start_week as start_week,
      ms.week as current_week,
      s.season_year,
      ms.streak_scope
    FROM manager_streaks ms
    JOIN managers m ON ms.manager_id = m.manager_id
    JOIN seasons s ON ms.season_id = s.season_id
    LEFT JOIN teams t ON t.manager_id = ms.manager_id AND t.season_id = ms.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = ms.manager_id AND mtn.season_year = s.season_year
    WHERE ms.current_streak_type = 'losing'
      AND ms.current_streak_length >= 3
      AND ms.week = (
        SELECT MAX(week) 
        FROM manager_streaks ms2 
        WHERE ms2.season_id = ms.season_id 
        AND ms2.streak_scope = ms.streak_scope
      )
    ORDER BY ms.current_streak_length DESC, m.username ASC
    LIMIT 10
  `)).rows;

  return {
    allTimeWinningStreaks,
    allTimeLosingStreaks,
    regularSeasonWinningStreaks,
    regularSeasonLosingStreaks,
    playoffWinningStreaks,
    playoffLosingStreaks,
    currentHotStreaks,
    currentColdStreaks
  };
}