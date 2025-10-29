import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

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
  },

  aiDetectPositions: async ({ request }) => {
    try {
      const formData = await request.formData();
      const playerIds = JSON.parse(formData.get('playerIds') || '[]');

      if (playerIds.length === 0) {
        return fail(400, { 
          error: true, 
          message: 'No players selected for AI detection' 
        });
      }

      // Get player data
      const result = await query(`
        SELECT DISTINCT
          player_id,
          name,
          roster_slot,
          nfl_team,
          AVG(fantasy_points) as avg_points
        FROM staging_yahoo_player_stats
        WHERE player_id = ANY($1)
        AND actual_position IS NULL
        GROUP BY player_id, name, roster_slot, nfl_team
      `, [playerIds]);

      const playersToAnalyze = result.rows;

      if (playersToAnalyze.length === 0) {
        return {
          success: true,
          suggestions: [],
          message: 'No players need position detection'
        };
      }

      // Initialize Anthropic client
      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      });

      // Prepare prompt
      const playerList = playersToAnalyze.map(p => 
        `- ID: ${p.player_id}, Name: ${p.name}, Team: ${p.nfl_team}, Slot: ${p.roster_slot}, Avg: ${parseFloat(p.avg_points).toFixed(2)}`
      ).join('\n');

      const prompt = `Analyze these fantasy football players and determine their positions (QB/RB/WR/TE/K/DEF).

Players:
${playerList}

Respond with ONLY a JSON array:
[
  {"player_id": 12345, "name": "Player Name", "position": "QB", "confidence": "high", "reasoning": "explanation"},
  ...
]

Confidence: "high" (certain), "medium" (likely), "low" (uncertain)`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return fail(500, {
          error: true,
          message: 'Failed to parse AI response'
        });
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        suggestions,
        message: `AI analyzed ${suggestions.length} players`
      };

    } catch (error) {
      console.error('Error in AI detection:', error);
      return fail(500, {
        error: true,
        message: 'AI detection failed: ' + error.message
      });
    }
  },

  applyAISuggestions: async ({ request }) => {
    try {
      const formData = await request.formData();
      const suggestions = JSON.parse(formData.get('suggestions') || '[]');

      if (suggestions.length === 0) {
        return fail(400, {
          error: true,
          message: 'No suggestions to apply'
        });
      }

      let updatedCount = 0;

      for (const suggestion of suggestions) {
        if (suggestion.approved) {
          const result = await query(`
            UPDATE staging_yahoo_player_stats
            SET 
              actual_position = $1,
              position_source = 'ai_detected',
              processed = TRUE
            WHERE player_id = $2
            AND actual_position IS NULL
          `, [suggestion.position, suggestion.player_id]);

          updatedCount += result.rowCount;
        }
      }

      return {
        success: true,
        message: `Applied AI suggestions: updated ${updatedCount} row(s)`
      };

    } catch (error) {
      console.error('Error applying AI suggestions:', error);
      return fail(500, {
        error: true,
        message: 'Failed to apply suggestions: ' + error.message
      });
    }
  }
};