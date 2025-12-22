import { query } from '$lib/db';

/**
 * Fetches all awards for a specific manager
 * @param {number} managerId - The manager's ID
 * @returns {Promise<Array>} Array of award objects
 */
export async function getManagerAwards(managerId) {
  const awards = [];

  // Get enabled award definitions
  const enabledAwards = (await query(`
    SELECT award_id, award_key, award_name, award_category, icon_emoji
    FROM award_definitions 
    WHERE is_enabled = TRUE
  `)).rows;

  const enabledKeys = enabledAwards.map(a => a.award_key);
  const awardMap = enabledAwards.reduce((acc, a) => {
    acc[a.award_key] = a;
    return acc;
  }, {});

  // Weekly High Scores (top 3 finishes per week)
  if (enabledKeys.includes('weekly_high_score')) {
    const weeklyHighs = (await query(`
      SELECT 
        season_year, season_id, week, score, weekly_rank
      FROM vw_award_weekly_high_score 
      WHERE manager_id = $1 AND weekly_rank = 1
      ORDER BY score DESC
    `, [managerId])).rows;

    for (const row of weeklyHighs) {
      awards.push({
        ...awardMap['weekly_high_score'],
        season_year: row.season_year,
        season_id: row.season_id,
        week: row.week,
        value: row.score,
        rank_position: row.weekly_rank
      });
    }
  }

  // Season Most Points (top 3 finishes)
  if (enabledKeys.includes('season_most_points')) {
    const seasonPoints = (await query(`
      SELECT 
        season_year, season_id, total_points, season_rank
      FROM vw_award_season_most_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of seasonPoints) {
      awards.push({
        ...awardMap['season_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Season Most Wins
  if (enabledKeys.includes('season_most_wins')) {
    const seasonWins = (await query(`
      SELECT 
        season_year, season_id, wins, season_rank, record
      FROM vw_award_season_most_wins 
      WHERE manager_id = $1 AND season_rank = 1
      ORDER BY wins DESC
    `, [managerId])).rows;

    for (const row of seasonWins) {
      awards.push({
        ...awardMap['season_most_wins'],
        season_year: row.season_year,
        season_id: row.season_id,
        value: row.wins,
        rank_position: row.season_rank,
        additional_data: { record: row.record }
      });
    }
  }

  // Best QB Season
  if (enabledKeys.includes('season_qb_most_points')) {
    const qbAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_qb_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of qbAwards) {
      awards.push({
        ...awardMap['season_qb_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Best RB Season
  if (enabledKeys.includes('season_rb_most_points')) {
    const rbAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_rb_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of rbAwards) {
      awards.push({
        ...awardMap['season_rb_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Best WR Season
  if (enabledKeys.includes('season_wr_most_points')) {
    const wrAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_wr_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of wrAwards) {
      awards.push({
        ...awardMap['season_wr_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Best TE Season
  if (enabledKeys.includes('season_te_most_points')) {
    const teAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_te_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of teAwards) {
      awards.push({
        ...awardMap['season_te_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Best K Season
  if (enabledKeys.includes('season_k_most_points')) {
    const kAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_k_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of kAwards) {
      awards.push({
        ...awardMap['season_k_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Best DEF Season
  if (enabledKeys.includes('season_def_most_points')) {
    const defAwards = (await query(`
      SELECT 
        season_year, season_id, player_name, total_points, season_rank
      FROM vw_award_season_def_points 
      WHERE manager_id = $1 AND season_rank <= 3
      ORDER BY total_points DESC
    `, [managerId])).rows;

    for (const row of defAwards) {
      awards.push({
        ...awardMap['season_def_most_points'],
        season_year: row.season_year,
        season_id: row.season_id,
        player_name: row.player_name,
        value: row.total_points,
        rank_position: row.season_rank
      });
    }
  }

  // Sort awards by rank position (1st place first) then by value
  awards.sort((a, b) => {
    if (a.rank_position !== b.rank_position) {
      return a.rank_position - b.rank_position;
    }
    return (b.value || 0) - (a.value || 0);
  });

  return awards;
}

/**
 * Fetches award summary counts for a manager
 * @param {number} managerId - The manager's ID
 * @returns {Promise<Object>} Object with award counts
 */
export async function getManagerAwardsSummary(managerId) {
  const result = await query(`
    SELECT * FROM vw_manager_awards_summary WHERE manager_id = $1
  `, [managerId]);

  return result.rows[0] || {
    weekly_high_score_count: 0,
    season_most_points_count: 0,
    season_most_wins_count: 0,
    total_awards: 0
  };
}