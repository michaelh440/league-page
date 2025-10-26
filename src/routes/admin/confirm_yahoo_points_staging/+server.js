import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export async function load() {
  try {
    // Get unique players with their position status and row counts
    const playersQuery = `
      SELECT 
        player_id,
        player_name,
        position,
        lineup_slot,
        COUNT(*) as row_count,
        MIN(week) as first_week,
        MAX(week) as last_week,
        STRING_AGG(DISTINCT lineup_slot, ', ' ORDER BY lineup_slot) as all_slots
      FROM staging_yahoo_weekly_player_points
      GROUP BY player_id, player_name, position, lineup_slot
      ORDER BY 
        CASE WHEN position IS NULL THEN 0 ELSE 1 END,
        player_name
    `;
    
    const players = (await query(playersQuery)).rows;
    
    // Get summary statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT player_id) as total_unique_players,
        COUNT(*) as total_rows,
        COUNT(CASE WHEN position IS NULL THEN 1 END) as null_position_rows,
        COUNT(CASE WHEN lineup_slot = 'W/R/T' THEN 1 END) as wrt_slot_rows,
        COUNT(CASE WHEN lineup_slot = 'BN' THEN 1 END) as bn_slot_rows,
        COUNT(DISTINCT CASE WHEN position IS NULL THEN player_id END) as players_needing_position
      FROM staging_yahoo_weekly_player_points
    `;
    
    const stats = (await query(statsQuery)).rows[0];
    
    return {
      players,
      stats
    };
    
  } catch (error) {
    console.error('Error loading staging data:', error);
    return {
      players: [],
      stats: {
        total_unique_players: 0,
        total_rows: 0,
        null_position_rows: 0,
        wrt_slot_rows: 0,
        bn_slot_rows: 0,
        players_needing_position: 0
      },
      error: error.message
    };
  }
}

export const actions = {
  updatePosition: async ({ request }) => {
    try {
      const data = await request.formData();
      const playerId = data.get('player_id');
      const playerName = data.get('player_name');
      const position = data.get('position');
      
      if (!playerId || !position) {
        return fail(400, { error: 'Missing required fields' });
      }
      
      // Update all rows for this player
      const updateQuery = `
        UPDATE staging_yahoo_weekly_player_points
        SET position = $1
        WHERE player_id = $2
        RETURNING *
      `;
      
      const result = await query(updateQuery, [position, playerId]);
      
      return {
        success: true,
        message: `Updated ${result.rowCount} rows for ${playerName} to position ${position}`,
        rowCount: result.rowCount
      };
      
    } catch (error) {
      console.error('Error updating position:', error);
      return fail(500, { error: error.message });
    }
  },
  
  bulkUpdate: async ({ request }) => {
    try {
      const data = await request.formData();
      const updates = JSON.parse(data.get('updates'));
      
      let totalUpdated = 0;
      
      for (const update of updates) {
        const updateQuery = `
          UPDATE staging_yahoo_weekly_player_points
          SET position = $1
          WHERE player_id = $2
        `;
        
        const result = await query(updateQuery, [update.position, update.player_id]);
        totalUpdated += result.rowCount;
      }
      
      return {
        success: true,
        message: `Bulk updated ${totalUpdated} total rows for ${updates.length} players`,
        totalUpdated
      };
      
    } catch (error) {
      console.error('Error in bulk update:', error);
      return fail(500, { error: error.message });
    }
  }
};