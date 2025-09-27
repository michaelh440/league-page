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

  // 1. HIGHEST PLAYOFF GAMES - Direct query using playoffs table
  const highestGame = (await query(`
    SELECT 
      s.season_year as year,
      p.week,
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

  // 2. LOWEST PLAYOFF GAMES
  const lowestGame = (await query(`
    SELECT 
      s.season_year as year,
      p.week,
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

  // 3. HIGHEST PLAYOFF SEASONS - Aggregate playoff points by season
  const highestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr.logo_url
      ) as team_logo,
      SUM(CASE 
        WHEN p.team1_id = $1 THEN p.team1_score 
        WHEN p.team2_id = $1 THEN p.team2_score 
        ELSE 0 
      END) as total_points
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr ON mgr.manager_id = $1
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL
    GROUP BY s.season_year, mgr.logo_url
    HAVING SUM(CASE 
      WHEN p.team1_id = $1 THEN p.team1_score 
      WHEN p.team2_id = $1 THEN p.team2_score 
      ELSE 0 
    END) > 0
    ORDER BY total_points DESC
    LIMIT 10
  `, [managerId])).rows;

  // 4. LOWEST PLAYOFF SEASONS
  const lowestSeason = (await query(`
    SELECT 
      s.season_year as year,
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team_name,
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr.logo_url
      ) as team_logo,
      SUM(CASE 
        WHEN p.team1_id = $1 THEN p.team1_score 
        WHEN p.team2_id = $1 THEN p.team2_score 
        ELSE 0 
      END) as total_points
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN managers mgr ON mgr.manager_id = $1
    WHERE (p.team1_id = $1 OR p.team2_id = $1)
      AND p.team1_score IS NOT NULL 
      AND p.team2_score IS NOT NULL
    GROUP BY s.season_year, mgr.logo_url
    HAVING SUM(CASE 
      WHEN p.team1_id = $1 THEN p.team1_score 
      WHEN p.team2_id = $1 THEN p.team2_score 
      ELSE 0 
    END) > 0
    ORDER BY total_points ASC
    LIMIT 10
  `, [managerId])).rows;

  // 5. PLAYOFF BLOWOUTS - Use playoffs table with team1_id/team2_id as manager_ids
  const blowout = (await query(`
    SELECT 
      s.season_year as year,
      p.season_id,
      p.week,
      $1 as team1_manager_id,
      -- Get team name for this manager
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      -- Get team logo for this manager  
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as team1_score,
      -- Opponent info
      CASE 
        WHEN p.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      -- Get opponent team name - prioritize manager_team_names
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

  // 6. PLAYOFF NAILBITERS - Same as blowouts but ordered by smallest margin
  const nailbiter = (await query(`
    SELECT 
      s.season_year as year,
      p.season_id,
      p.week,
      $1 as team1_manager_id,
      -- Get team name for this manager
      COALESCE(
        (SELECT mtn.team_name FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        (SELECT t.team_name FROM teams t WHERE t.manager_id = $1 AND t.season_id = s.season_id LIMIT 1)
      ) as team1_name,
      -- Get team logo for this manager  
      COALESCE(
        (SELECT mtn.logo_url FROM manager_team_names mtn WHERE mtn.manager_id = $1 AND mtn.season_year = s.season_year),
        mgr_self.logo_url
      ) as team1_logo,
      CASE 
        WHEN p.team1_id = $1 THEN p.team1_score
        ELSE p.team2_score 
      END as team1_score,
      -- Opponent info
      CASE 
        WHEN p.team1_id = $1 THEN m2.manager_id
        ELSE m1.manager_id
      END as team2_manager_id,
      -- Get opponent team name - prioritize manager_team_names
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

  // 7. PLAYOFF WIN PERCENTAGE - Calculate from playoffs using manager_id directly
  const winPct = (await query(`
    WITH playoff_games AS (
      SELECT 
        CASE 
          WHEN p.team1_id = $1 AND p.team1_score > p.team2_score THEN 1
          WHEN p.team2_id = $1 AND p.team2_score > p.team1_score THEN 1
          ELSE 0
        END as wins,
        CASE 
          WHEN p.team1_id = $1 AND p.team1_score < p.team2_score THEN 1
          WHEN p.team2_id = $1 AND p.team2_score < p.team1_score THEN 1
          ELSE 0
        END as losses,
        CASE 
          WHEN (p.team1_id = $1 OR p.team2_id = $1) AND p.team1_score = p.team2_score THEN 1
          ELSE 0
        END as ties
      FROM playoffs p
      WHERE (p.team1_id = $1 OR p.team2_id = $1)
        AND p.team1_score IS NOT NULL 
        AND p.team2_score IS NOT NULL
    )
    SELECT 
      mgr.manager_id,
      COALESCE(mgr.team_alias, mgr.real_name, mgr.username) as manager_name,
      mgr.logo_url as team_logo,
      SUM(pg.wins) as wins,
      SUM(pg.losses) as losses,
      SUM(pg.ties) as ties,
      CASE 
        WHEN COUNT(*) = 0 THEN 0::numeric
        ELSE ROUND((SUM(pg.wins)::numeric / COUNT(*)::numeric), 4)
      END as win_pct
    FROM playoff_games pg, managers mgr
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