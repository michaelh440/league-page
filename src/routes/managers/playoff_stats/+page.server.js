/* +page.server.js
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

  // Filter existing playoff views by manager_id
  const highestGame = (await query(`
    SELECT * FROM vw_playoff_highest_game 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const lowestGame = (await query(`
    SELECT * FROM vw_playoff_lowest_game 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const highestSeason = (await query(`
    SELECT * FROM vw_playoff_highest_season 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const lowestSeason = (await query(`
    SELECT * FROM vw_playoff_lowest_season 
    WHERE manager_id = $1 
    LIMIT 10
  `, [managerId])).rows;

  const blowout = (await query(`
    SELECT * FROM vw_playoff_largest_blowout 
    WHERE team1_manager_id = $1 OR team2_manager_id = $1 
    ORDER BY margin DESC 
    LIMIT 10
  `, [managerId])).rows;

  const nailbiter = (await query(`
    SELECT * FROM vw_playoff_closest_nailbiter 
    WHERE team1_manager_id = $1 OR team2_manager_id = $1 
    ORDER BY margin ASC 
    LIMIT 10
  `, [managerId])).rows;

  const winPct = (await query(`
    SELECT * FROM vw_playoff_win_pct 
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
}*/

import { query } from '$lib/db';

export async function load() {
  const highestGame   = (await query(`SELECT * FROM vw_playoff_highest_game`)).rows;
  const lowestGame    = (await query(`SELECT * FROM vw_playoff_lowest_game`)).rows;
  const highestSeason = (await query(`SELECT * FROM vw_playoff_highest_season`)).rows;
  const lowestSeason  = (await query(`SELECT * FROM vw_playoff_lowest_season`)).rows;
  const blowout       = (await query(`SELECT * FROM vw_playoff_largest_blowout`)).rows;
  const nailbiter     = (await query(`SELECT * FROM vw_playoff_closest_nailbiter`)).rows;
  const winPct        = (await query(`SELECT * FROM vw_playoff_win_pct`)).rows;

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