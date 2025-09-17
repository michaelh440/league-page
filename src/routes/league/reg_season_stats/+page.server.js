import { query } from '$lib/db';

export async function load() {
  const highestGame   = (await query(`SELECT * FROM vw_reg_season_highest_game`)).rows;
  const lowestGame    = (await query(`SELECT * FROM vw_reg_season_lowest_game`)).rows;
  const highestSeason = (await query(`SELECT * FROM vw_reg_season_highest_season`)).rows;
  const lowestSeason  = (await query(`SELECT * FROM vw_reg_season_lowest_season`)).rows;
  const blowout       = (await query(`SELECT * FROM vw_reg_season_largest_blowout`)).rows;
  const nailbiter     = (await query(`SELECT * FROM vw_reg_season_closest_nailbiter`)).rows;
  const winPct        = (await query(`SELECT * FROM vw_reg_season_win_pct`)).rows;

  return {
    highestGame,
    lowestGame,
    highestSeason,
    lowestSeason,
    blowout,
    nailbiter,
    winPct
  };
}
