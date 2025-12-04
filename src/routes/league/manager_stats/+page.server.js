import { query } from '$lib/db';

export async function load({ url }) {
  // Get season from query param, default to active season
  const seasonParam = url.searchParams.get('season');
  
  // Get available seasons for dropdown
  const seasonsResult = await query(`SELECT * FROM vw_available_seasons`);
  const seasons = seasonsResult.rows;
  
  // Determine which season to use
  let selectedSeasonId;
  if (seasonParam) {
    selectedSeasonId = parseInt(seasonParam);
  } else {
    // Find active season or most recent
    const activeSeason = seasons.find(s => s.is_active);
    selectedSeasonId = activeSeason ? activeSeason.season_id : seasons[0]?.season_id;
  }
  
  // Get managers for this season
  const managersResult = await query(
    `SELECT * FROM vw_manager_season_list WHERE season_id = $1 ORDER BY manager_name`,
    [selectedSeasonId]
  );
  const managers = managersResult.rows;
  
  // Get running average points data
  const avgPointsResult = await query(
    `SELECT * FROM vw_manager_running_avg_points WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const avgPointsData = avgPointsResult.rows;
  
  // Get running average margin data
  const avgMarginResult = await query(
    `SELECT * FROM vw_manager_running_avg_margin WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const avgMarginData = avgMarginResult.rows;
  
  // Get weekly margins for bar chart
  const weeklyMarginsResult = await query(
    `SELECT * FROM vw_manager_weekly_margins WHERE season_id = $1`,
    [selectedSeasonId]
  );
  const weeklyMarginsData = weeklyMarginsResult.rows;

  return {
    seasons,
    selectedSeasonId,
    managers,
    avgPointsData,
    avgMarginData,
    weeklyMarginsData
  };
}