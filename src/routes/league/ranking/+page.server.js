// src/routes/league/ranking/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // Top Final Ranking - managers ranked by best season finish
  const topFinalRanking = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      MIN(hr.final_rank) as best_finish,
      COUNT(hr.season_year) as seasons_played,
      AVG(hr.final_rank::numeric) as avg_finish
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.final_rank IS NOT NULL
    GROUP BY hr.manager_id, m.username, m.logo_url
    ORDER BY best_finish ASC, avg_finish ASC
    LIMIT 10
  `)).rows;

  // Top Regular Season Ranking
  const topRegularSeasonRanking = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      MIN(hr.regular_season_rank) as best_regular_finish,
      COUNT(hr.season_year) as seasons_played,
      AVG(hr.regular_season_rank::numeric) as avg_regular_finish
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.regular_season_rank IS NOT NULL
    GROUP BY hr.manager_id, m.username, m.logo_url
    ORDER BY best_regular_finish ASC, avg_regular_finish ASC
    LIMIT 10
  `)).rows;

  // Playoff Appearances (championship OR consolation bracket)
  const playoffAppearances = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      COUNT(*) as playoff_appearances,
      COUNT(*) FILTER (WHERE hr.playoff_status = 'championship') as championship_appearances,
      (SELECT COUNT(*) FROM historical_rankings hr2 WHERE hr2.manager_id = hr.manager_id) as total_seasons,
      ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM historical_rankings hr2 WHERE hr2.manager_id = hr.manager_id) * 100, 1) as playoff_percentage
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.playoff_status IN ('championship', 'consolation')
    GROUP BY hr.manager_id, m.username, m.logo_url
    ORDER BY playoff_appearances DESC, playoff_percentage DESC
    LIMIT 10
  `)).rows;

  // Championships (final_rank = 1)
  const championships = (await query(`
    SELECT 
      m.username as manager_name,
      m.logo_url as manager_logo,
      COUNT(*) as championships,
      array_agg(hr.season_year ORDER BY hr.season_year) as championship_years
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.final_rank = 1
    GROUP BY hr.manager_id, m.username, m.logo_url
    ORDER BY championships DESC
  `)).rows;

  return {
    topFinalRanking,
    topRegularSeasonRanking,
    playoffAppearances,
    championships
  };
}