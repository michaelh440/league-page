/*import { query } from '$lib/db';

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
}*/

// src/routes/league/reg_season_stats/+page.server.js - With debugging
import { query, testConnection } from '$lib/db';

export async function load() {
  try {
    // Test connection first
    console.log('Testing database connection...');
    const connectionTest = await testConnection();
    if (!connectionTest) {
      throw new Error('Database connection test failed');
    }

    console.log('Loading reg season stats...');
    
    // Test each query individually to identify which one fails
    let highestGame, lowestGame, highestSeason, lowestSeason, blowout, nailbiter, winPct;
    
    try {
      console.log('Querying vw_reg_season_highest_game...');
      highestGame = (await query(`SELECT * FROM vw_reg_season_highest_game`)).rows;
      console.log('✓ highestGame loaded:', highestGame.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading highestGame:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_lowest_game...');
      lowestGame = (await query(`SELECT * FROM vw_reg_season_lowest_game`)).rows;
      console.log('✓ lowestGame loaded:', lowestGame.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading lowestGame:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_highest_season...');
      highestSeason = (await query(`SELECT * FROM vw_reg_season_highest_season`)).rows;
      console.log('✓ highestSeason loaded:', highestSeason.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading highestSeason:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_lowest_season...');
      lowestSeason = (await query(`SELECT * FROM vw_reg_season_lowest_season`)).rows;
      console.log('✓ lowestSeason loaded:', lowestSeason.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading lowestSeason:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_largest_blowout...');
      blowout = (await query(`SELECT * FROM vw_reg_season_largest_blowout`)).rows;
      console.log('✓ blowout loaded:', blowout.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading blowout:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_closest_nailbiter...');
      nailbiter = (await query(`SELECT * FROM vw_reg_season_closest_nailbiter`)).rows;
      console.log('✓ nailbiter loaded:', nailbiter.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading nailbiter:', error.message);
      throw error;
    }
    
    try {
      console.log('Querying vw_reg_season_win_pct...');
      winPct = (await query(`SELECT * FROM vw_reg_season_win_pct`)).rows;
      console.log('✓ winPct loaded:', winPct.length, 'rows');
    } catch (error) {
      console.error('✗ Error loading winPct:', error.message);
      throw error;
    }

    console.log('All reg season stats loaded successfully!');

    return {
      highestGame,
      lowestGame,
      highestSeason,
      lowestSeason,
      blowout,
      nailbiter,
      winPct
    };
  } catch (error) {
    console.error('Error in load function:', error);
    throw error;
  }
}
