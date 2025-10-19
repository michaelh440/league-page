// src/routes/api/generate_summary/+server.js
import { json } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '$lib/db';

export async function POST({ request }) {
    try {
        const { prompt, season, week } = await request.json();
        
        if (!prompt) {
            return json({
                success: false,
                error: 'Prompt is required'
            }, { status: 400 });
        }
        
        // Use process.env directly
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: prompt
            }],
            system: `You are a witty, snarky fantasy football analyst writing weekly recaps for "The Hou Dat League". 
Your writing style is entertaining and slightly sarcastic. Call out bad performances and celebrate great ones.
Use sports commentary language. Keep it fun and lighthearted. Format as a narrative, not bullet points.
Keep it around 300-500 words.`
        });
        
        const summary = message.content[0].type === 'text' 
            ? message.content[0].text 
            : '';
        
        // Save the summary to the database
        if (season && week) {
            try {
                // Get season_id
                const seasonResult = await query(
                    'SELECT season_id FROM seasons WHERE season_year = $1',
                    [season]
                );

                if (seasonResult.rows.length > 0) {
                    const seasonId = seasonResult.rows[0].season_id;

                    // Save summary
                    await query(
                        `INSERT INTO weekly_summaries (
                            season_id,
                            week,
                            summary_text
                        ) VALUES ($1, $2, $3)
                        ON CONFLICT (season_id, week) 
                        DO UPDATE SET
                            summary_text = EXCLUDED.summary_text,
                            generated_at = CURRENT_TIMESTAMP`,
                        [seasonId, week, summary]
                    );
                }
            } catch (dbError) {
                console.error('Error saving summary to database:', dbError);
                // Continue even if save fails
            }
        }
        
        return json({
            success: true,
            summary,
            season,
            week
        });
        
    } catch (error) {
        console.error('Error generating summary:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}