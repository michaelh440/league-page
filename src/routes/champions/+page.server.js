// src/routes/champions/+page.server.js

import { query } from '$lib/db';

export async function load() {
  try {
    // Get all champions with manager details joined - EXCLUDING DISPUTED CHAMPIONSHIPS
    const champions = (await query(`
      SELECT 
        hr.season_year,
        hr.manager_id,
        hr.final_rank,
        hr.regular_season_rank,
        hr.playoff_status,
        m.username,
        m.real_name,
        m.logo_url,
        m.team_alias,
        -- Championship count excludes disputed
        (
          SELECT COUNT(*) 
          FROM historical_rankings hr_count 
          JOIN seasons s_count ON hr_count.season_year = s_count.season_year
          WHERE hr_count.manager_id = hr.manager_id 
            AND hr_count.final_rank = 1
            AND (s_count.disputed_championship IS NULL OR s_count.disputed_championship = false)
        ) as championship_count,
        -- Get their total seasons played
        (SELECT COUNT(*) FROM historical_rankings hr2 WHERE hr2.manager_id = hr.manager_id) as total_seasons,
        -- Get their playoff appearances
        (SELECT COUNT(*) FROM historical_rankings hr3 WHERE hr3.manager_id = hr.manager_id AND hr3.playoff_status IN ('championship', 'consolation')) as playoff_appearances
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      JOIN seasons s ON hr.season_year = s.season_year
      WHERE hr.final_rank = 1
        AND (s.disputed_championship IS NULL OR s.disputed_championship = false)
      ORDER BY hr.season_year DESC, hr.manager_id
    `)).rows;

    // Process champions to use username and logo
    const processedChampions = champions.map(champ => ({
      ...champ,
      manager_name: champ.username || champ.real_name || `Manager ${champ.manager_id}`,
      avatar_url: champ.logo_url
    }));

    // Get championship summary stats - EXCLUDING DISPUTED CHAMPIONSHIPS
    const statsQuery = await query(`
      SELECT 
        COUNT(DISTINCT hr.manager_id) as unique_champions,
        COUNT(*) as total_championships,
        MIN(hr.season_year) as first_season,
        MAX(hr.season_year) as latest_season
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      JOIN seasons s ON hr.season_year = s.season_year
      WHERE hr.final_rank = 1
        AND (s.disputed_championship IS NULL OR s.disputed_championship = false)
    `);
    
    const stats = statsQuery.rows[0] || {
      unique_champions: 0,
      total_championships: 0,
      first_season: null,
      latest_season: null,
      most_championships_by_one: 0
    };

    // Get most championships by one manager - EXCLUDING DISPUTED CHAMPIONSHIPS
    if (stats.total_championships > 0) {
      const maxChamps = (await query(`
        SELECT COUNT(*) as count
        FROM historical_rankings hr
        JOIN managers m ON hr.manager_id = m.manager_id
        JOIN seasons s ON hr.season_year = s.season_year
        WHERE hr.final_rank = 1 
          AND (s.disputed_championship IS NULL OR s.disputed_championship = false)
        GROUP BY hr.manager_id
        ORDER BY count DESC
        LIMIT 1
      `)).rows[0];
      stats.most_championships_by_one = maxChamps ? maxChamps.count : 0;
    }

    // Get managers grouped by championship count with their details - EXCLUDING DISPUTED CHAMPIONSHIPS
    const managersData = (await query(`
      SELECT 
        hr.manager_id,
        m.username,
        m.real_name,
        m.logo_url,
        m.team_alias,
        COUNT(hr.season_year) as championship_count,
        ARRAY_AGG(hr.season_year ORDER BY hr.season_year DESC) as championship_years
      FROM historical_rankings hr
      JOIN managers m ON hr.manager_id = m.manager_id
      JOIN seasons s ON hr.season_year = s.season_year
      WHERE hr.final_rank = 1
        AND (s.disputed_championship IS NULL OR s.disputed_championship = false)
      GROUP BY hr.manager_id, m.username, m.real_name, m.logo_url, m.team_alias
      ORDER BY championship_count DESC, MIN(hr.season_year) ASC
    `)).rows;

    // Process managers data to add consistent naming
    const managersByCount = managersData.map(manager => ({
      ...manager,
      manager_name: manager.username || manager.real_name || `Manager ${manager.manager_id}`,
      avatar_url: manager.logo_url
    }));

    console.log('Champions loaded:', processedChampions.length);
    console.log('Stats:', stats);
    console.log('Managers by count:', managersByCount.length);

    return {
      champions: processedChampions,
      stats,
      managersByCount
    };
  } catch (error) {
    console.error('Error loading champions page data:', error);
    return {
      champions: [],
      stats: {
        unique_champions: 0,
        total_championships: 0,
        first_season: null,
        latest_season: null,
        most_championships_by_one: 0
      },
      managersByCount: [],
      error: error.message
    };
  }
}