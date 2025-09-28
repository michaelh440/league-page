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

  // 1. ALL-TIME HIGHEST SINGLE GAME (combines regular season + playoffs)
  const highestGame = (await query(`
    -- Regular season games
    SELECT 
      'Regular Season' as game_type,
      ws.season_id,
      s.season_year as year,
      ws.week,
      NULL as round_name,
      ws.team_id,
      t.manager_id,
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

    UNION ALL

    -- Playoff games
    SELECT 
      'Playoffs' as game_type,
      NULL as season_id,
      s.season_year as year,
      p.week,
      p.round_name,
      NULL as team_id,
      $1 as manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr.logo_url
      ) as team_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as score
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr ON mgr.manager_id = $1
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL

    ORDER BY score DESC
    LIMIT 10
  `, [managerId])).rows;

  // 2. ALL-TIME LOWEST SINGLE GAME
  const lowestGame = (await query(`
    -- Regular season games
    SELECT 
      'Regular Season' as game_type,
      ws.season_id,
      s.season_year as year,
      ws.week,
      NULL as round_name,
      ws.team_id,
      t.manager_id,
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

    UNION ALL

    -- Playoff games
    SELECT 
      'Playoffs' as game_type,
      NULL as season_id,
      s.season_year as year,
      p.week,
      p.round_name,
      NULL as team_id,
      $1 as manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr.logo_url
      ) as team_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as score
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr ON mgr.manager_id = $1
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL

    ORDER BY score ASC
    LIMIT 10
  `, [managerId])).rows;

  // 3. ALL-TIME HIGHEST SEASONS (regular season totals only)
  const highestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      SUM(ws.team_score) as total_points,
      SUM(ws.team_score) as points  -- Frontend expects 'points' field
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

  // 4. ALL-TIME LOWEST SEASONS
  const lowestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(mtn.team_name, t.team_name) as team_name,
      COALESCE(mtn.logo_url, m.logo_url) as team_logo,
      SUM(ws.team_score) as total_points,
      SUM(ws.team_score) as points  -- Frontend expects 'points' field
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

  // 5. ALL-TIME LARGEST BLOWOUTS (combines regular season + playoffs)
  const blowout = (await query(`
    -- Regular season blowouts
    SELECT 
      'Regular Season' as game_type,
      s.season_year as year,
      m.season_id,
      m.week,
      NULL as round_name,
      $1 as team1_manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team1_score
        ELSE m.team2_score 
      END as team1_score,
      CASE 
        WHEN m.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN m.team1_id = $1 THEN 
          COALESCE(
            (SELECT mtn2.team_name FROM manager_team_names mtn2 WHERE mtn2.manager_id = m2.manager_id AND mtn2.season_year = s.season_year),
            (SELECT t2.team_name FROM teams t2 WHERE t2.manager_id = m2.manager_id AND t2.season_id = s.season_id LIMIT 1),
            COALESCE(m2.real_name, m2.username)
          )
        ELSE 
          COALESCE(
            (SELECT mtn1.team_name FROM manager_team_names mtn1 WHERE mtn1.manager_id = m1.manager_id AND mtn1.season_year = s.season_year),
            (SELECT t1.team_name FROM teams t1 WHERE t1.manager_id = m1.manager_id AND t1.season_id = s.season_id LIMIT 1),
            COALESCE(m1.real_name, m1.username)
          )
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

    UNION ALL

    -- Playoff blowouts
    SELECT 
      'Playoffs' as game_type,
      s.season_year as year,
      p.season_id,
      p.week,
      p.round_name,
      $1 as team1_manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as team1_score,
      CASE 
        WHEN p.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN p.team1_id = $1 THEN 
          COALESCE(
            (SELECT mtn2.team_name FROM manager_team_names mtn2 WHERE mtn2.manager_id = m2.manager_id AND mtn2.season_year = s.season_year),
            (SELECT t2.team_name FROM teams t2 WHERE t2.manager_id = m2.manager_id AND t2.season_id = s.season_id LIMIT 1),
            COALESCE(m2.real_name, m2.username)
          )
        ELSE 
          COALESCE(
            (SELECT mtn1.team_name FROM manager_team_names mtn1 WHERE mtn1.manager_id = m1.manager_id AND mtn1.season_year = s.season_year),
            (SELECT t1.team_name FROM teams t1 WHERE t1.manager_id = m1.manager_id AND t1.season_id = s.season_id LIMIT 1),
            COALESCE(m1.real_name, m1.username)
          )
      END as team2_name,
      CASE 
        WHEN p.team1_id = $1 THEN m2.logo_url
        ELSE m1.logo_url
      END as team2_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team2_score
        ELSE p.team1_score 
      END as team2_score,
      ABS(p.team1_score - p.team2_score) as margin
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr_self ON mgr_self.manager_id = $1
    LEFT JOIN managers m1 ON p.team1_id = m1.manager_id
    LEFT JOIN managers m2 ON p.team2_id = m2.manager_id
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL

    ORDER BY margin DESC
    LIMIT 10
  `, [managerId])).rows;

  // 6. ALL-TIME CLOSEST NAILBITERS
  const nailbiter = (await query(`
    -- Regular season nailbiters
    SELECT 
      'Regular Season' as game_type,
      s.season_year as year,
      m.season_id,
      m.week,
      NULL as round_name,
      $1 as team1_manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN m.team1_id = $1 THEN m.team1_score
        ELSE m.team2_score 
      END as team1_score,
      CASE 
        WHEN m.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN m.team1_id = $1 THEN 
          COALESCE(
            (SELECT mtn2.team_name FROM manager_team_names mtn2 WHERE mtn2.manager_id = m2.manager_id AND mtn2.season_year = s.season_year),
            (SELECT t2.team_name FROM teams t2 WHERE t2.manager_id = m2.manager_id AND t2.season_id = s.season_id LIMIT 1),
            COALESCE(m2.real_name, m2.username)
          )
        ELSE 
          COALESCE(
            (SELECT mtn1.team_name FROM manager_team_names mtn1 WHERE mtn1.manager_id = m1.manager_id AND mtn1.season_year = s.season_year),
            (SELECT t1.team_name FROM teams t1 WHERE t1.manager_id = m1.manager_id AND t1.season_id = s.season_id LIMIT 1),
            COALESCE(m1.real_name, m1.username)
          )
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

    UNION ALL

    -- Playoff nailbiters
    SELECT 
      'Playoffs' as game_type,
      s.season_year as year,
      p.season_id,
      p.week,
      p.round_name,
      $1 as team1_manager_id,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as team1_score,
      CASE 
        WHEN p.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      CASE 
        WHEN p.team1_id = $1 THEN 
          COALESCE(
            (SELECT mtn2.team_name FROM manager_team_names mtn2 WHERE mtn2.manager_id = m2.manager_id AND mtn2.season_year = s.season_year),
            (SELECT t2.team_name FROM teams t2 WHERE t2.manager_id = m2.manager_id AND t2.season_id = s.season_id LIMIT 1),
            COALESCE(m2.real_name, m2.username)
          )
        ELSE 
          COALESCE(
            (SELECT mtn1.team_name FROM manager_team_names mtn1 WHERE mtn1.manager_id = m1.manager_id AND mtn1.season_year = s.season_year),
            (SELECT t1.team_name FROM teams t1 WHERE t1.manager_id = m1.manager_id AND t1.season_id = s.season_id LIMIT 1),
            COALESCE(m1.real_name, m1.username)
          )
      END as team2_name,
      CASE 
        WHEN p.team1_id = $1 THEN m2.logo_url
        ELSE m1.logo_url
      END as team2_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team2_score
        ELSE p.team1_score 
      END as team2_score,
      ABS(p.team1_score - p.team2_score) as margin
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr_self ON mgr_self.manager_id = $1
    LEFT JOIN managers m1 ON p.team1_id = m1.manager_id
    LEFT JOIN managers m2 ON p.team2_id = m2.manager_id
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL

    ORDER BY margin ASC
    LIMIT 10
  `, [managerId])).rows;

  // 7. ALL-TIME WIN PERCENTAGE (combines regular season + playoffs)
  const winPct = (await query(`
    WITH all_games AS (
      -- Regular season games
      SELECT 
        CASE 
          WHEN m.team1_id = $1 AND m.team1_score > m.team2_score THEN 1 
          WHEN m.team2_id = $1 AND m.team2_score > m.team1_score THEN 1
          WHEN m.team1_id = $1 AND m.team1_score < m.team2_score THEN 0
          WHEN m.team2_id = $1 AND m.team2_score < m.team1_score THEN 0
          ELSE 0.5 
        END as result
      FROM matchups m
      WHERE (m.team1_id = $1 OR m.team2_id = $1)
        AND m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
      
      UNION ALL
      
      -- Playoff games
      SELECT 
        CASE 
          WHEN p.team1_id = $1 AND p.team1_score > p.team2_score THEN 1 
          WHEN p.team2_id = $1 AND p.team2_score > p.team1_score THEN 1
          WHEN p.team1_id = $1 AND p.team1_score < p.team2_score THEN 0
          WHEN p.team2_id = $1 AND p.team2_score < p.team1_score THEN 0
          ELSE 0.5 
        END as result
      FROM playoffs p
      WHERE (p.team1_id = $1 OR p.team2_id = $1)
        AND p.team1_score IS NOT NULL AND p.team2_score IS NOT NULL
    )
    SELECT 
      m.manager_id,
      COALESCE(m.real_name, m.username) as manager_name,
      COALESCE(m.real_name, m.username) as team_name,  -- Use real_name/username instead of team_alias
      m.logo_url as team_logo,
      COUNT(ag.result) as games_played,
      SUM(CASE WHEN ag.result = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN ag.result = 0 THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN ag.result = 0.5 THEN 1 ELSE 0 END) as ties,
      CASE 
        WHEN COUNT(ag.result) = 0 THEN 0::numeric
        ELSE (SUM(ag.result)::numeric / COUNT(ag.result)::numeric)
      END as win_pct
    FROM managers m
    LEFT JOIN all_games ag ON TRUE
    WHERE m.manager_id = $1
    GROUP BY m.manager_id, m.real_name, m.username, m.logo_url
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