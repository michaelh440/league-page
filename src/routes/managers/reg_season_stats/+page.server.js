// +page.server.js
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
      highestGame: [],
      lowestGame: [],
      highestSeason: [],
      lowestSeason: [],
      blowout: [],
      nailbiter: [],
      winPct: []
    };
  }

  // 1. HIGHEST SINGLE GAMES - Get from weekly_scoring for this manager
  const highestGame = (await query(`
    SELECT 
      s.season_year as year,
      ws.week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      ws.team_score as score
    FROM weekly_scoring ws
    JOIN teams t ON ws.team_id = t.team_id
    JOIN managers m ON t.manager_id = m.manager_id
    JOIN seasons s ON ws.season_id = s.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
      AND mtn.season_year = s.season_year
    WHERE m.manager_id = $1 
      AND ws.team_score IS NOT NULL
    ORDER BY ws.team_score DESC
    LIMIT 10
  `, [managerId])).rows;

  // 2. LOWEST SINGLE GAMES
  const lowestGame = (await query(`
    SELECT 
      s.season_year as year,
      ws.week,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      ws.team_score as score
    FROM weekly_scoring ws
    JOIN teams t ON ws.team_id = t.team_id
    JOIN managers m ON t.manager_id = m.manager_id
    JOIN seasons s ON ws.season_id = s.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
      AND mtn.season_year = s.season_year
    WHERE m.manager_id = $1 
      AND ws.team_score IS NOT NULL
    ORDER BY ws.team_score ASC
    LIMIT 10
  `, [managerId])).rows;

  // 3. HIGHEST SEASONS - Season totals for this manager
  const highestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      SUM(ws.team_score) as total_points
    FROM weekly_scoring ws
    JOIN teams t ON ws.team_id = t.team_id
    JOIN managers m ON t.manager_id = m.manager_id
    JOIN seasons s ON ws.season_id = s.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
      AND mtn.season_year = s.season_year
    WHERE m.manager_id = $1 
      AND ws.team_score IS NOT NULL
    GROUP BY s.season_year, COALESCE(mtn.team_name, t.team_name), 
             COALESCE(mtn.logo_url, m.logo_url)
    ORDER BY total_points DESC
    LIMIT 10
  `, [managerId])).rows;

  // 4. LOWEST SEASONS
  const lowestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      SUM(ws.team_score) as total_points
    FROM weekly_scoring ws
    JOIN teams t ON ws.team_id = t.team_id
    JOIN managers m ON t.manager_id = m.manager_id
    JOIN seasons s ON ws.season_id = s.season_id
    LEFT JOIN manager_team_names mtn ON mtn.manager_id = m.manager_id 
      AND mtn.season_year = s.season_year
    WHERE m.manager_id = $1 
      AND ws.team_score IS NOT NULL
    GROUP BY s.season_year, COALESCE(mtn.team_name, t.team_name), 
             COALESCE(mtn.logo_url, m.logo_url)
    HAVING SUM(ws.team_score) > 500
    ORDER BY total_points ASC
    LIMIT 10
  `, [managerId])).rows;

  // 5. BLOWOUTS - Join through teams table to get proper manager association
  const blowout = (await query(`
    SELECT 
      s.season_year as year,
      mat.week,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(mtn1.team_name, t1.team_name)
        ELSE COALESCE(mtn2.team_name, t2.team_name)
      END as team_name,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(mtn1.logo_url, m1.logo_url)
        ELSE COALESCE(mtn2.logo_url, m2.logo_url)
      END as team_logo,
      CASE 
        WHEN t1.manager_id = $1 THEN mat.team1_score
        ELSE mat.team2_score 
      END as my_score,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(m2.team_alias, m2.real_name, m2.username)
        ELSE COALESCE(m1.team_alias, m1.real_name, m1.username)
      END as opponent_name,
      CASE 
        WHEN t1.manager_id = $1 THEN mat.team2_score
        ELSE mat.team1_score 
      END as opponent_score,
      ABS(mat.team1_score - mat.team2_score) as margin,
      CASE 
        WHEN (t1.manager_id = $1 AND mat.team1_score > mat.team2_score) OR 
             (t2.manager_id = $1 AND mat.team2_score > mat.team1_score) 
        THEN 'W' 
        ELSE 'L' 
      END as result
    FROM matchups mat
    JOIN seasons s ON mat.season_id = s.season_id
    JOIN teams t1 ON mat.team1_id = t1.team_id
    JOIN teams t2 ON mat.team2_id = t2.team_id
    JOIN managers m1 ON t1.manager_id = m1.manager_id
    JOIN managers m2 ON t2.manager_id = m2.manager_id
    LEFT JOIN manager_team_names mtn1 ON m1.manager_id = mtn1.manager_id 
      AND mtn1.season_year = s.season_year
    LEFT JOIN manager_team_names mtn2 ON m2.manager_id = mtn2.manager_id 
      AND mtn2.season_year = s.season_year
    WHERE (t1.manager_id = $1 OR t2.manager_id = $1)
      AND mat.team1_score IS NOT NULL 
      AND mat.team2_score IS NOT NULL
    ORDER BY margin DESC 
    LIMIT 10
  `, [managerId])).rows;

  // 6. NAILBITERS - Same logic as blowouts but ordered by smallest margin
  const nailbiter = (await query(`
    SELECT 
      s.season_year as year,
      mat.week,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(mtn1.team_name, t1.team_name)
        ELSE COALESCE(mtn2.team_name, t2.team_name)
      END as team_name,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(mtn1.logo_url, m1.logo_url)
        ELSE COALESCE(mtn2.logo_url, m2.logo_url)
      END as team_logo,
      CASE 
        WHEN t1.manager_id = $1 THEN mat.team1_score
        ELSE mat.team2_score 
      END as my_score,
      CASE 
        WHEN t1.manager_id = $1 THEN COALESCE(m2.team_alias, m2.real_name, m2.username)
        ELSE COALESCE(m1.team_alias, m1.real_name, m1.username)
      END as opponent_name,
      CASE 
        WHEN t1.manager_id = $1 THEN mat.team2_score
        ELSE mat.team1_score 
      END as opponent_score,
      ABS(mat.team1_score - mat.team2_score) as margin,
      CASE 
        WHEN (t1.manager_id = $1 AND mat.team1_score > mat.team2_score) OR 
             (t2.manager_id = $1 AND mat.team2_score > mat.team1_score) 
        THEN 'W' 
        ELSE 'L' 
      END as result
    FROM matchups mat
    JOIN seasons s ON mat.season_id = s.season_id
    JOIN teams t1 ON mat.team1_id = t1.team_id
    JOIN teams t2 ON mat.team2_id = t2.team_id
    JOIN managers m1 ON t1.manager_id = m1.manager_id
    JOIN managers m2 ON t2.manager_id = m2.manager_id
    LEFT JOIN manager_team_names mtn1 ON m1.manager_id = mtn1.manager_id 
      AND mtn1.season_year = s.season_year
    LEFT JOIN manager_team_names mtn2 ON m2.manager_id = mtn2.manager_id 
      AND mtn2.season_year = s.season_year
    WHERE (t1.manager_id = $1 OR t2.manager_id = $1)
      AND mat.team1_score IS NOT NULL 
      AND mat.team2_score IS NOT NULL
    ORDER BY margin ASC 
    LIMIT 10
  `, [managerId])).rows;

  // 7. WIN PERCENTAGE - Calculate across all seasons for this manager
  const winPct = (await query(`
    WITH manager_games AS (
      SELECT 
        CASE 
          WHEN t1.manager_id = $1 AND mat.team1_score > mat.team2_score THEN 1
          WHEN t2.manager_id = $1 AND mat.team2_score > mat.team1_score THEN 1
          ELSE 0
        END as wins,
        CASE 
          WHEN t1.manager_id = $1 AND mat.team1_score < mat.team2_score THEN 1
          WHEN t2.manager_id = $1 AND mat.team2_score < mat.team1_score THEN 1
          ELSE 0
        END as losses,
        CASE 
          WHEN (t1.manager_id = $1 OR t2.manager_id = $1) AND mat.team1_score = mat.team2_score THEN 1
          ELSE 0
        END as ties
      FROM matchups mat
      JOIN teams t1 ON mat.team1_id = t1.team_id
      JOIN teams t2 ON mat.team2_id = t2.team_id
      WHERE (t1.manager_id = $1 OR t2.manager_id = $1)
        AND mat.team1_score IS NOT NULL 
        AND mat.team2_score IS NOT NULL
    )
    SELECT 
      mgr.manager_id,
      COALESCE(mgr.team_alias, mgr.real_name, mgr.username) as manager_name,
      mgr.logo_url as team_logo,
      SUM(mg.wins) as wins,
      SUM(mg.losses) as losses,
      SUM(mg.ties) as ties,
      CASE 
        WHEN COUNT(*) = 0 THEN 0::numeric
        ELSE ROUND((SUM(mg.wins)::numeric / COUNT(*)::numeric), 4)
      END as win_pct
    FROM manager_games mg, managers mgr
    WHERE mgr.manager_id = $1
    GROUP BY mgr.manager_id, mgr.team_alias, mgr.real_name, mgr.username, mgr.logo_url
  `, [managerId])).rows;

  return {
    managers,
    managerId: parseInt(managerId),
    highestGame,
    lowestGame,
    highestSeason,
    lowestSeason,
    blowout,
    nailbiter,
    winPct
  };
}