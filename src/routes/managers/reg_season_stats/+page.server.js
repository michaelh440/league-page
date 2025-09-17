import { query } from '$lib/db';

export async function load({ params }) {
  const managerId = params.managerId;

  const highestGame   = (await query(
    `SELECT * FROM vw_reg_season_highest_game
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const lowestGame    = (await query(
    `SELECT * FROM vw_reg_season_lowest_game
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const highestSeason = (await query(
    `SELECT * FROM vw_reg_season_highest_season
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const lowestSeason  = (await query(
    `SELECT * FROM vw_reg_season_lowest_season
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const blowout       = (await query(
    `SELECT * FROM vw_reg_season_largest_blowout
     WHERE team1_id IN (SELECT team_id FROM teams WHERE manager_id = $1)
        OR team2_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const nailbiter     = (await query(
    `SELECT * FROM vw_reg_season_closest_nailbiter
     WHERE team1_id IN (SELECT team_id FROM teams WHERE manager_id = $1)
        OR team2_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const winPct        = (await query(
    `SELECT * FROM vw_reg_season_win_pct
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  return {
    managerId,
    highestGame,
    lowestGame,
    highestSeason,
    lowestSeason,
    blowout,
    nailbiter,
    winPct
  };
}
