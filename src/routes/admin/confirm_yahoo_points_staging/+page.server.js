import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  try {
    // Query to get unique players with their position info
    const result = await query(`
      SELECT 
        player_id,
        name as player_name,
        actual_position as position,
        roster_slot as lineup_slot,
        COUNT(*) as row_count,
        COUNT(DISTINCT week) as weeks_played,
        position_source
      FROM staging_yahoo_player_stats
      GROUP BY player_id, name, actual_position, roster_slot, position_source
      ORDER BY 
        CASE WHEN actual_position IS NULL THEN 0 ELSE 1 END,
        name
    `);

    const players = result.rows;

    // Calculate summary statistics
    const summary = {
      totalPlayers: players.length,
      missingPosition: players.filter(p => p.position === null).length,
      wrtSlots: players.filter(p => p.lineup_slot === 'W/R/T').length,
      benchSlots: players.filter(p => p.lineup_slot === 'BN').length
    };

    return {
      players,
      summary
    };
  } catch (error) {
    console.error('Error loading staging data:', error);
    
    // Return empty data structure instead of crashing
    return {
      players: [],
      summary: {
        totalPlayers: 0,
        missingPosition: 0,
        wrtSlots: 0,
        benchSlots: 0
      },
      error: 'Unable to load player data. Error: ' + error.message
    };
  }
}

/** @type {import('./$types').Actions} */
export const actions = {
  updatePosition: async ({ request }) => {
    try {
      const formData = await request.formData();
      const playerName = formData.get('playerName');
      const position = formData.get('position');

      if (!playerName || !position) {
        return fail(400, { 
          error: true, 
          message: 'Player name and position are required' 
        });
      }

      // Update all rows for this player
      const result = await query(`
        UPDATE staging_yahoo_player_stats
        SET 
          actual_position = $1,
          position_source = 'manual_admin',
          processed = TRUE
        WHERE name = $2
      `, [position, playerName]);

      return {
        success: true,
        message: `Updated ${result.rowCount} row(s) for ${playerName} to position ${position}`
      };
    } catch (error) {
      console.error('Error updating position:', error);
      return fail(500, { 
        error: true, 
        message: 'Failed to update position: ' + error.message 
      });
    }
  }
};