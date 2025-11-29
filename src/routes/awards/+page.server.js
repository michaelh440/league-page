import { query } from '$lib/db';

export async function load() {
  // Get enabled awards
  const enabledAwards = (await query(`
    SELECT award_key, award_name, award_category, icon_emoji
    FROM award_definitions 
    WHERE is_enabled = TRUE
    ORDER BY sort_order, award_name
  `)).rows;

  const enabledKeys = enabledAwards.map(a => a.award_key);

  // Initialize results object
  const results = {};

  // Weekly High Score
  if (enabledKeys.includes('weekly_high_score')) {
    results.weeklyHighScore = (await query(`
      SELECT * FROM vw_award_weekly_high_score 
      ORDER BY score DESC 
      LIMIT 10
    `)).rows;
  }

  // Weekly Low Score
  if (enabledKeys.includes('weekly_low_score')) {
    results.weeklyLowScore = (await query(`
      SELECT * FROM vw_award_weekly_low_score 
      ORDER BY score ASC 
      LIMIT 10
    `)).rows;
  }

  // Season Most Points
  if (enabledKeys.includes('season_most_points')) {
    results.seasonMostPoints = (await query(`
      SELECT * FROM vw_award_season_most_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Season Least Points
  if (enabledKeys.includes('season_least_points')) {
    results.seasonLeastPoints = (await query(`
      SELECT * FROM vw_award_season_least_points 
      ORDER BY total_points ASC 
      LIMIT 10
    `)).rows;
  }

  // Season Most Wins
  if (enabledKeys.includes('season_most_wins')) {
    results.seasonMostWins = (await query(`
      SELECT * FROM vw_award_season_most_wins 
      ORDER BY wins DESC, losses ASC 
      LIMIT 10
    `)).rows;
  }

  // Season Least Wins
  if (enabledKeys.includes('season_least_wins')) {
    results.seasonLeastWins = (await query(`
      SELECT * FROM vw_award_season_least_wins 
      ORDER BY wins ASC, losses DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - QB
  if (enabledKeys.includes('season_qb_most_points')) {
    results.seasonQbPoints = (await query(`
      SELECT * FROM vw_award_season_qb_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - RB
  if (enabledKeys.includes('season_rb_most_points')) {
    results.seasonRbPoints = (await query(`
      SELECT * FROM vw_award_season_rb_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - WR
  if (enabledKeys.includes('season_wr_most_points')) {
    results.seasonWrPoints = (await query(`
      SELECT * FROM vw_award_season_wr_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - TE
  if (enabledKeys.includes('season_te_most_points')) {
    results.seasonTePoints = (await query(`
      SELECT * FROM vw_award_season_te_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - K
  if (enabledKeys.includes('season_k_most_points')) {
    results.seasonKPoints = (await query(`
      SELECT * FROM vw_award_season_k_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  // Positional Awards - DEF
  if (enabledKeys.includes('season_def_most_points')) {
    results.seasonDefPoints = (await query(`
      SELECT * FROM vw_award_season_def_points 
      ORDER BY total_points DESC 
      LIMIT 10
    `)).rows;
  }

  return {
    enabledAwards,
    enabledKeys,
    ...results
  };
}