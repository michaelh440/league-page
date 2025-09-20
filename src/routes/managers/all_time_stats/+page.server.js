/*import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('manager_id');

  // For the dropdown (show real_name, fallback to username)
  const managers = (await query(`
    SELECT manager_id::int,
           COALESCE(real_name, username) AS name
    FROM managers
    ORDER BY manager_id
  `)).rows;

  // If no manager selected, just return list
  if (!managerId) {
    return { managers, managerId: null, stats: null };
  }

  const highestGame   = (await query(
    `SELECT * FROM vw_all_time_highest_game WHERE manager_id = $1`, [managerId]
  )).rows;

  const lowestGame    = (await query(
    `SELECT * FROM vw_all_time_lowest_game WHERE manager_id = $1`, [managerId]
  )).rows;

  const highestSeason = (await query(
    `SELECT * FROM vw_all_time_highest_season WHERE manager_id = $1`, [managerId]
  )).rows;

  const lowestSeason  = (await query(
    `SELECT * FROM vw_all_time_lowest_season WHERE manager_id = $1`, [managerId]
  )).rows;

  const blowout       = (await query(
    `SELECT * FROM vw_all_time_largest_blowout WHERE manager_id = $1`, [managerId]
  )).rows;

  const nailbiter     = (await query(
    `SELECT * FROM vw_all_time_closest_nailbiter WHERE manager_id = $1`, [managerId]
  )).rows;

  const winPct        = (await query(
    `SELECT * FROM vw_all_time_win_pct WHERE manager_id = $1`, [managerId]
  )).rows;

  return {
    managers,
    managerId,
    stats: { highestGame, lowestGame, highestSeason, lowestSeason, blowout, nailbiter, winPct }
  };
}*/


/*import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('managerId');

  // Always fetch managers for dropdown (real_name preferred)
  const managers = (await query(
    `SELECT manager_id,
            COALESCE(real_name, username) AS name,
            logo_url
     FROM managers
     ORDER BY name`
  )).rows;

  // No manager selected yet → return only dropdown data
  if (!managerId) {
    return {
      managerId: null,
      managers,
      highestGame: [], lowestGame: [],
      highestSeason: [], lowestSeason: [],
      blowout: [], nailbiter: [], winPct: []
    };
  }

  const highestGame = (await query(
    `SELECT * FROM vw_all_time_highest_game
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const lowestGame = (await query(
    `SELECT * FROM vw_all_time_lowest_game
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const highestSeason = (await query(
    `SELECT * FROM vw_all_time_highest_season
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const lowestSeason = (await query(
    `SELECT * FROM vw_all_time_lowest_season
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const blowout = (await query(
    `SELECT * FROM vw_all_time_largest_blowout
     WHERE team1_id IN (SELECT team_id FROM teams WHERE manager_id = $1)
        OR team2_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const nailbiter = (await query(
    `SELECT * FROM vw_all_time_closest_nailbiter
     WHERE team1_id IN (SELECT team_id FROM teams WHERE manager_id = $1)
        OR team2_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  const winPct = (await query(
    `SELECT * FROM vw_all_time_win_pct
     WHERE team_id IN (SELECT team_id FROM teams WHERE manager_id = $1)`,
    [managerId]
  )).rows;

  return {
    managerId,
    managers,
    highestGame, lowestGame,
    highestSeason, lowestSeason,
    blowout, nailbiter, winPct
  };
}*/


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

  // Filter existing league views by manager_id
  const highestGame = (await query(`
    SELECT * FROM vw_all_time_highest_game 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const lowestGame = (await query(`
    SELECT * FROM vw_all_time_lowest_game 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const highestSeason = (await query(`
    SELECT *, total_points as points FROM vw_all_time_highest_season 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const lowestSeason = (await query(`
    SELECT *, total_points as points FROM vw_all_time_lowest_season 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const blowout = (await query(`
    SELECT * FROM vw_all_time_largest_blowout 
    WHERE team1_manager_id = $1 OR team2_manager_id = $1 
    ORDER BY margin DESC 
    LIMIT 10
  `, [managerId])).rows;

  const nailbiter = (await query(`
    SELECT * FROM vw_all_time_closest_nailbiter 
    WHERE team1_manager_id = $1 OR team2_manager_id = $1 
    ORDER BY margin ASC 
    LIMIT 10
  `, [managerId])).rows;

  const winPct = (await query(`
    SELECT * FROM vw_all_time_win_pct 
    WHERE manager_id = $1
  `, [managerId])).rows;

  return {
    managers,
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
