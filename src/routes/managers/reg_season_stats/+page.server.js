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

  // 1. HIGHEST SINGLE GAMES - Use weekly_scoring with proper team/manager joins
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

  // 3. HIGHEST SEASONS - Aggregate weekly_scoring by season
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

  // 5. BLOWOUTS - Match the structure from bio page exactly
  const blowout = (await query(`
    SELECT 
      s.season_year as year,
      m.season_id,
      m.week,
      $1 as team1_manager_id,
      -- Get team name for this manager
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1),
        COALESCE(mgr_self.team_alias, mgr_self.real_name, mgr_self.username)
      ) as team1_name,
      -- Get team logo for this manager  
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team1_score
        ELSE m.team2_score 
      END as team1_score,
      -- Opponent info
      CASE 
        WHEN m.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN m.team1_id = $1 THEN 
          COALESCE(m2.team_alias, m2.real_name, m2.username)
        ELSE 
          COALESCE(m1.team_alias, m1.real_name, m1.username)
      END as team2_name,
      CASE 
        WHEN m.team1_id = $1 THEN m2.logo_url
        ELSE m1.logo_url
      END as team2_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team2_score
        ELSE m.team1_score 
      END as team2_score,
      ABS(m.team1_score - m.team2_score) as margin
    FROM matchups m
    JOIN seasons s ON m.season_id = s.season_id
    JOIN managers mgr_self ON mgr_self.manager_id = $1
    LEFT JOIN managers m1 ON m.team1_id = m1.manager_id
    LEFT JOIN managers m2 ON m.team2_id = m2.manager_id
    WHERE (m.team1_id = $1 OR m.team2_id = $1)
      AND m.team1_score IS NOT NULL 
      AND m.team2_score IS NOT NULL
    ORDER BY margin DESC 
    LIMIT 10
  `, [managerId])).rows;

  // 6. NAILBITERS - Match the structure from bio page exactly
  const nailbiter = (await query(`
    SELECT 
      s.season_year as year,
      m.season_id,
      m.week,
      $1 as team1_manager_id,
      -- Get team name for this manager
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1),
        COALESCE(mgr_self.team_alias, mgr_self.real_name, mgr_self.username)
      ) as team1_name,
      -- Get team logo for this manager  
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team1_score
        ELSE m.team2_score 
      END as team1_score,
      -- Opponent info
      CASE 
        WHEN m.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN m.team1_id = $1 THEN 
          COALESCE(m2.team_alias, m2.real_name, m2.username)
        ELSE 
          COALESCE(m1.team_alias, m1.real_name, m1.username)
      END as team2_name,
      CASE 
        WHEN m.team1_id = $1 THEN m2.logo_url
        ELSE m1.logo_url
      END as team2_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team2_score
        ELSE m.team1_score 
      END as team2_score,
      ABS(m.team1_score - m.team2_score) as margin
    FROM matchups m
    JOIN seasons s ON m.season_id = s.season_id
    JOIN managers mgr_self ON mgr_self.manager_id = $1
    LEFT JOIN managers m1 ON m.team1_id = m1.manager_id
    LEFT JOIN managers m2 ON m.team2_id = m2.manager_id
    WHERE (m.team1_id = $1 OR m.team2_id = $1)
      AND m.team1_score IS NOT NULL 
      AND m.team2_score IS NOT NULL
    ORDER BY margin ASC 
    LIMIT 10
  `, [managerId])).rows;

  // 7. WIN PERCENTAGE - Calculate from matchups using manager_id directly
  const winPct = (await query(`
    WITH manager_games AS (
      SELECT 
        CASE 
          WHEN m.team1_id = $1 AND m.team1_score > m.team2_score THEN 1
          WHEN m.team2_id = $1 AND m.team2_score > m.team1_score THEN 1
          ELSE 0
        END as wins,
        CASE 
          WHEN m.team1_id = $1 AND m.team1_score < m.team2_score THEN 1
          WHEN m.team2_id = $1 AND m.team2_score < m.team1_score THEN 1
          ELSE 0
        END as losses,
        CASE 
          WHEN (m.team1_id = $1 OR m.team2_id = $1) AND m.team1_score = m.team2_score THEN 1
          ELSE 0
        END as ties
      FROM matchups m
      WHERE (m.team1_id = $1 OR m.team2_id = $1)
        AND m.team1_score IS NOT NULL 
        AND m.team2_score IS NOT NULL
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