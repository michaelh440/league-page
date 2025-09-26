// src/routes/managers/bio/+page.server.js

import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('manager_id');

  try {
    // Always get the list of managers for the dropdown
    const managersResult = await query(`
      SELECT 
        m.manager_id,
        m.username,
        m.real_name,
        m.logo_url,
        m.year_joined,
        m.biography,
        m.team_alias,
        m.philosophy,
        m.favorite_team,
        m.signature_moves,
        m.strengths,
        m.weaknesses,
        COALESCE(champ_count.championships, 0) AS championships
      FROM managers m
      LEFT JOIN (
        SELECT 
          manager_id, 
          COUNT(*) AS championships
        FROM historical_rankings 
        WHERE final_rank = 1 
        GROUP BY manager_id
      ) champ_count ON champ_count.manager_id = m.manager_id
      ORDER BY m.username
    `);

    const managers = managersResult.rows;

    // If no manager selected, return just the managers list
    if (!managerId) {
      return {
        managers,
        selectedManager: null,
        careerStats: null,
        playoffStats: null
      };
    }

    // Get the selected manager's detailed info
    const selectedManager = managers.find(m => m.manager_id == managerId);

    // Get career stats for the selected manager
    let careerStats = null;
    let playoffStats = null;

    if (managerId) {
      // Career Stats Queries - Updated to use manager_id in matchups
      const [
        regularSeasonWinPct,
        highestGame,
        lowestGame,
        highestSeason,
        lowestSeason,
        seasonHistory
      ] = await Promise.all([
        // Overall regular season win percentage and stats
        query(`
          SELECT * FROM vw_reg_season_win_pct 
          WHERE manager_id = $1
        `, [managerId]),

        // Highest single game
        query(`
          SELECT score, year, week, team_name 
          FROM vw_reg_season_highest_game 
          WHERE manager_id = $1 
          ORDER BY score DESC
          LIMIT 1
        `, [managerId]),

        // Lowest single game
        query(`
          SELECT score, year, week, team_name 
          FROM vw_reg_season_lowest_game 
          WHERE manager_id = $1 
          ORDER BY score ASC
          LIMIT 1
        `, [managerId]),

        // Highest season total
        query(`
          SELECT total_points, year, team_name 
          FROM vw_reg_season_highest_season 
          WHERE manager_id = $1 
          ORDER BY total_points DESC
          LIMIT 1
        `, [managerId]),

        // Lowest season total
        query(`
          SELECT total_points, year, team_name 
          FROM vw_reg_season_lowest_season 
          WHERE manager_id = $1 
          ORDER BY total_points ASC
          LIMIT 1
        `, [managerId]),

        // Season by season history with corrected manager_id joins and season filtering
        query(`
          WITH season_stats AS (
            SELECT 
              s.season_year,
              t.team_id,
              t.manager_id,
              -- Win/Loss calculation from matchups using manager_id AND season_id
              COUNT(CASE 
                WHEN (m.team1_id = t.manager_id AND m.team1_score > m.team2_score) OR 
                     (m.team2_id = t.manager_id AND m.team2_score > m.team1_score) 
                THEN 1 
              END) as wins,
              COUNT(CASE 
                WHEN (m.team1_id = t.manager_id AND m.team1_score < m.team2_score) OR 
                     (m.team2_id = t.manager_id AND m.team2_score < m.team1_score) 
                THEN 1 
              END) as losses,
              COUNT(CASE 
                WHEN (m.team1_id = t.manager_id OR m.team2_id = t.manager_id) AND 
                     m.team1_score = m.team2_score 
                THEN 1 
              END) as ties,
              -- Count total games to filter out seasons without data
              COUNT(CASE 
                WHEN (m.team1_id = t.manager_id OR m.team2_id = t.manager_id) AND 
                     m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
                THEN 1 
              END) as total_games
            FROM seasons s
            JOIN teams t ON t.season_id = s.season_id AND t.manager_id = $1
            LEFT JOIN matchups m ON (m.team1_id = t.manager_id OR m.team2_id = t.manager_id)
              AND m.season_id = s.season_id
              AND m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
            GROUP BY s.season_year, t.team_id, t.manager_id
          ),
          scoring_stats AS (
            SELECT 
              s.season_year,
              t.team_id,
              t.manager_id,
              -- Get average points from weekly_scoring table with fallback to matchups
              COALESCE(
                AVG(CASE WHEN ws.team_score IS NOT NULL THEN ws.team_score END),
                -- Fallback: calculate from matchups if weekly_scoring team_ids don't match
                AVG(CASE 
                  WHEN m.team1_id = t.manager_id AND m.team1_score IS NOT NULL THEN m.team1_score
                  WHEN m.team2_id = t.manager_id AND m.team2_score IS NOT NULL THEN m.team2_score
                END)
              ) as avg_points,
              -- Calculate average points against from matchups using manager_id AND season_id
              AVG(CASE 
                WHEN m.team1_id = t.manager_id AND m.team2_score IS NOT NULL THEN m.team2_score
                WHEN m.team2_id = t.manager_id AND m.team1_score IS NOT NULL THEN m.team1_score
              END) as avg_points_against
            FROM seasons s
            JOIN teams t ON t.season_id = s.season_id AND t.manager_id = $1
            LEFT JOIN weekly_scoring ws ON ws.team_id = t.team_id AND ws.season_id = s.season_id
            LEFT JOIN matchups m ON (m.team1_id = t.manager_id OR m.team2_id = t.manager_id)
              AND m.season_id = s.season_id
              AND m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
            GROUP BY s.season_year, t.team_id, t.manager_id
          ),
          playoff_info AS (
            SELECT 
              s.season_year,
              -- Check if they made playoffs based on final ranking (1-4 = playoffs, 5-8 = consolation)
              CASE 
                WHEN hr.final_rank BETWEEN 1 AND 4 THEN true
                WHEN hr.final_rank BETWEEN 5 AND 8 THEN true  
                ELSE false 
              END as made_playoffs
            FROM seasons s
            JOIN teams t ON t.season_id = s.season_id AND t.manager_id = $1
            LEFT JOIN historical_rankings hr ON hr.manager_id = $1 AND hr.season_year = s.season_year
            GROUP BY s.season_year, hr.final_rank
          ),
          final_rankings AS (
            SELECT 
              hr.season_year,
              hr.final_rank
            FROM historical_rankings hr
            WHERE hr.manager_id = $1
          )
          SELECT 
            ss.season_year as year,
            ss.wins,
            ss.losses,
            ss.ties,
            pi.made_playoffs,
            ROUND(sc.avg_points, 2) as avg_points,
            ROUND(sc.avg_points_against, 2) as avg_points_against,
            -- Show 'TBD' for seasons without final rankings (like 2024)
            CASE 
              WHEN fr.final_rank IS NOT NULL THEN fr.final_rank
              ELSE NULL 
            END as finish
          FROM season_stats ss
          LEFT JOIN scoring_stats sc ON sc.season_year = ss.season_year AND sc.team_id = ss.team_id
          LEFT JOIN playoff_info pi ON pi.season_year = ss.season_year
          LEFT JOIN final_rankings fr ON fr.season_year = ss.season_year
          WHERE ss.total_games > 0  -- Only include seasons with actual game data
          ORDER BY ss.season_year DESC
        `, [managerId])
      ]);

      const winPctData = regularSeasonWinPct.rows[0];
      
      careerStats = {
        record: winPctData ? `${winPctData.wins}-${winPctData.losses}-${winPctData.ties}` : '0-0-0',
        winPct: winPctData ? `${(winPctData.win_pct * 100).toFixed(1)}%` : '0.0%',
        avgScore: '0.0', // We'll calculate this from season history
        avgPtsAg: '0.0', // We'll calculate this from season history
        highScore: highestGame.rows[0]?.score || 0,
        lowScore: lowestGame.rows[0]?.score || 0,
        seasonHistory: seasonHistory.rows || []
      };

      // Calculate overall averages from season history
      if (seasonHistory.rows.length > 0) {
        const validSeasons = seasonHistory.rows.filter(season => 
          season.avg_points !== null && season.avg_points !== undefined
        );
        
        if (validSeasons.length > 0) {
          const totalPoints = validSeasons.reduce((sum, season) => sum + parseFloat(season.avg_points || 0), 0);
          const totalPointsAgainst = validSeasons.reduce((sum, season) => sum + parseFloat(season.avg_points_against || 0), 0);
          careerStats.avgScore = (totalPoints / validSeasons.length).toFixed(1);
          careerStats.avgPtsAg = (totalPointsAgainst / validSeasons.length).toFixed(1);
        }
      }

      // Playoff Stats Queries - Updated to use manager_id in matchups
      const [
        playoffWinPct,
        playoffHighGame,
        playoffLowGame,
        playoffHistory,
        trophyCount
      ] = await Promise.all([
        // Playoff win percentage
        query(`
          SELECT * FROM vw_playoff_win_pct 
          WHERE manager_id = $1
        `, [managerId]),

        // Highest playoff game
        query(`
          SELECT score, year, week, team_name 
          FROM vw_playoff_highest_game 
          WHERE manager_id = $1 
          ORDER BY score DESC
          LIMIT 1
        `, [managerId]),

        // Lowest playoff game
        query(`
          SELECT score, year, week, team_name 
          FROM vw_playoff_lowest_game 
          WHERE manager_id = $1 
          ORDER BY score ASC
          LIMIT 1
        `, [managerId]),

        // Playoff history by year - Updated to use manager_id and match season data
        query(`
          WITH playoff_seasons AS (
            SELECT 
              s.season_year,
              t.team_id,
              COUNT(CASE 
                WHEN (p.team1_id = t.manager_id AND p.team1_score > p.team2_score) OR 
                     (p.team2_id = t.manager_id AND p.team2_score > p.team1_score) 
                THEN 1 
              END) as wins,
              COUNT(CASE 
                WHEN (p.team1_id = t.manager_id AND p.team1_score < p.team2_score) OR 
                     (p.team2_id = t.manager_id AND p.team2_score < p.team1_score) 
                THEN 1 
              END) as losses,
              AVG(CASE 
                WHEN p.team1_id = t.manager_id AND p.team1_score IS NOT NULL THEN p.team1_score
                WHEN p.team2_id = t.manager_id AND p.team2_score IS NOT NULL THEN p.team2_score
              END) as avg_points,
              AVG(CASE 
                WHEN p.team1_id = t.manager_id AND p.team2_score IS NOT NULL THEN p.team2_score
                WHEN p.team2_id = t.manager_id AND p.team1_score IS NOT NULL THEN p.team1_score
              END) as avg_points_against,
              -- Count total playoff games to filter out seasons without playoff data
              COUNT(CASE 
                WHEN (p.team1_id = t.manager_id OR p.team2_id = t.manager_id) AND 
                     p.team1_score IS NOT NULL AND p.team2_score IS NOT NULL
                THEN 1 
              END) as total_playoff_games
            FROM seasons s
            JOIN teams t ON t.season_id = s.season_id AND t.manager_id = $1
            LEFT JOIN playoffs p ON (p.team1_id = t.manager_id OR p.team2_id = t.manager_id)
              AND p.season_id = s.season_id
              AND p.team1_score IS NOT NULL AND p.team2_score IS NOT NULL
            GROUP BY s.season_year, t.team_id
          ),
          final_rankings AS (
            SELECT 
              hr.season_year,
              hr.final_rank
            FROM historical_rankings hr
            WHERE hr.manager_id = $1
          )
          SELECT 
            ps.season_year as year,
            ps.wins,
            ps.losses,
            ROUND(ps.avg_points, 2) as avg_points,
            ROUND(ps.avg_points_against, 2) as avg_points_against,
            COALESCE(fr.final_rank, 99) as finish
          FROM playoff_seasons ps
          LEFT JOIN final_rankings fr ON fr.season_year = ps.season_year
          WHERE ps.total_playoff_games > 0  -- Only include seasons where they actually played playoff games
          ORDER BY ps.season_year DESC
        `, [managerId]),

        // Trophy counts
        query(`
          SELECT 
            SUM(CASE WHEN final_rank = 1 THEN 1 ELSE 0 END) as championships,
            SUM(CASE WHEN final_rank = 2 THEN 1 ELSE 0 END) as runner_ups,
            SUM(CASE WHEN final_rank = 3 THEN 1 ELSE 0 END) as third_place
          FROM historical_rankings 
          WHERE manager_id = $1
        `, [managerId])
      ]);

      const playoffWinPctData = playoffWinPct.rows[0];
      const trophies = trophyCount.rows[0] || { championships: 0, runner_ups: 0, third_place: 0 };
      
      playoffStats = {
        record: playoffWinPctData ? `${playoffWinPctData.playoff_wins}-${playoffWinPctData.playoff_losses}` : '0-0',
        winPct: playoffWinPctData ? `${(playoffWinPctData.playoff_win_pct * 100).toFixed(1)}%` : '0.0%',
        avgScore: '0.0',
        avgPtsAg: '0.0',
        highScore: playoffHighGame.rows[0]?.score || 0,
        lowScore: playoffLowGame.rows[0]?.score || 0,
        playoffHistory: playoffHistory.rows || [],
        championships: parseInt(trophies.championships) || 0,
        runnerUps: parseInt(trophies.runner_ups) || 0,
        thirdPlace: parseInt(trophies.third_place) || 0
      };

      // Calculate playoff averages
      if (playoffHistory.rows.length > 0) {
        const validPlayoffSeasons = playoffHistory.rows.filter(season => 
          season.avg_points !== null && season.avg_points !== undefined
        );
        
        if (validPlayoffSeasons.length > 0) {
          const totalPoints = validPlayoffSeasons.reduce((sum, season) => sum + parseFloat(season.avg_points || 0), 0);
          const totalPointsAgainst = validPlayoffSeasons.reduce((sum, season) => sum + parseFloat(season.avg_points_against || 0), 0);
          playoffStats.avgScore = (totalPoints / validPlayoffSeasons.length).toFixed(1);
          playoffStats.avgPtsAg = (totalPointsAgainst / validPlayoffSeasons.length).toFixed(1);
        }
      }
    }

    console.log(`Loaded biography data for ${managers.length} managers, selected: ${managerId}`);
    
    return {
      managers,
      selectedManager,
      careerStats,
      playoffStats
    };

  } catch (error) {
    console.error('Error in managers bio load:', error);
    return {
      managers: [],
      selectedManager: null,
      careerStats: null,
      playoffStats: null
    };
  }
}