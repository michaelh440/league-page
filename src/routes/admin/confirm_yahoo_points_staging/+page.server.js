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
    console.log('=== AI Detection Started ===');
    try {
      const formData = await request.formData();
      const playerIds = JSON.parse(formData.get('playerIds') || '[]');
      console.log(`Received ${playerIds.length} player IDs:`, playerIds);

      if (playerIds.length === 0) {
        console.log('No player IDs provided');
        return fail(400, { 
          error: true, 
          message: 'No players selected for AI detection' 
        });
      }

      // Get player data
      console.log('Querying database for player data...');
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
      console.log(`Found ${playersToAnalyze.length} players to analyze:`, playersToAnalyze.map(p => p.name));

      if (playersToAnalyze.length === 0) {
        console.log('No players need position detection');
        return {
          success: true,
          suggestions: [],
          message: 'No players need position detection'
        };
      }

      // Check API key
      if (!ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY is not set!');
        return fail(500, {
          error: true,
          message: 'API key not configured. Check server environment variables.'
        });
      }
      console.log('API key found, length:', ANTHROPIC_API_KEY.length);

      // Initialize Anthropic client
      console.log('Initializing Anthropic client...');
      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
      });

      // Prepare prompt
      const playerList = playersToAnalyze.map(p => 
        `- ID: ${p.player_id}, Name: ${p.name}, Team: ${p.nfl_team || 'N/A'}, Slot: ${p.roster_slot || 'N/A'}, Avg: ${parseFloat(p.avg_points || 0).toFixed(2)}`
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

      console.log('Sending request to Claude API...');
      console.log('Prompt length:', prompt.length);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      console.log('Received response from Claude API');
      console.log('Response content blocks:', message.content.length);

      const responseText = message.content[0].text;
      console.log('Response text length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 200));

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        console.error('Failed to find JSON array in response');
        console.error('Full response:', responseText);
        return fail(500, {
          error: true,
          message: 'Failed to parse AI response - no JSON array found in output'
        });
      }

      console.log('JSON match found, parsing...');
      const suggestions = JSON.parse(jsonMatch[0]);
      console.log(`Successfully parsed ${suggestions.length} suggestions`);

      return {
        success: true,
        suggestions,
        message: `AI analyzed ${suggestions.length} players`
      };

    } catch (error) {
      console.error('=== AI Detection Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // More specific error messages
      let errorMessage = 'AI detection failed: ';
      
      if (error.message.includes('API key')) {
        errorMessage += 'Invalid API key. Check your ANTHROPIC_API_KEY environment variable.';
      } else if (error.message.includes('rate limit')) {
        errorMessage += 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Try reducing the number of players.';
      } else if (error.name === 'SyntaxError') {
        errorMessage += 'Failed to parse JSON response from AI.';
      } else {
        errorMessage += error.message;
      }
      
      return fail(500, {
        error: true,
        message: errorMessage
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
        const result = await query(`
          UPDATE staging_yahoo_player_stats
          SET 
            actual_position = $1,
            position_source = $2,
            processed = TRUE
          WHERE player_id = $3
          AND actual_position IS NULL
        `, [suggestion.position, suggestion.source, suggestion.player_id]);

        updatedCount += result.rowCount;
      }

      return {
        success: true,
        message: `Applied ${suggestions.length} suggestion(s), updated ${updatedCount} row(s)`
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