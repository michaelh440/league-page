// src/routes/all-matchups/+page.server.js
import { getLeagueMatchups } from '$lib/utils/helperFunctions/leagueMatchups';
import { query } from '$lib/db';

export async function load() {
  const sleeperData = await getLeagueMatchups();

  const result = await query(`
    WITH base AS (
      SELECT
        s.season_year AS season,
        m.week,

        -- prefer teams.team_name, fallback to matchups.team*_name
        COALESCE(t1.team_name, m.team1_name) AS t1_name,
        COALESCE(t2.team_name, m.team2_name) AS t2_name,

        m.team1_score,
        m.team2_score,

        -- canonical keys (prefer team_id; fallback to normalized name)
        COALESCE(t1.team_id::text, lower(trim(m.team1_name))) AS t1_key,
        COALESCE(t2.team_id::text, lower(trim(m.team2_name))) AS t2_key
      FROM matchups m
      JOIN seasons s ON s.season_id = m.season_id
      -- keep joins within the SAME season, but don't drop the row if a team record is missing
      LEFT JOIN teams t1 ON t1.team_id = m.team1_id AND t1.season_id = m.season_id
      LEFT JOIN teams t2 ON t2.team_id = m.team2_id AND t2.season_id = m.season_id
    ),
    canon AS (
      SELECT
        season,
        week,
        LEAST(t1_key, t2_key)  AS a_key,
        GREATEST(t1_key, t2_key) AS b_key,
        CASE WHEN t1_key <= t2_key THEN t1_name      ELSE t2_name      END AS team1,
        CASE WHEN t1_key <= t2_key THEN team1_score  ELSE team2_score  END AS team1_score,
        CASE WHEN t1_key <= t2_key THEN t2_name      ELSE t1_name      END AS team2,
        CASE WHEN t1_key <= t2_key THEN team2_score  ELSE team1_score  END AS team2_score
      FROM base
    )
    SELECT DISTINCT ON (season, week, a_key, b_key)
      season, week, team1, team1_score, team2, team2_score
    FROM canon
    ORDER BY season DESC, week, a_key, b_key;
  `);

  return {
    sleeper: sleeperData,
    yahoo: result.rows
  };
}
