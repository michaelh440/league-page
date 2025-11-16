// src/routes/api/generate_summary/+server.js
import { json } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { query } from '$lib/db';

export async function POST({ request, fetch }) {
    try {
        const { prompt, season, week, systemPrompt, refinementMode, existingSummary, refinementInstructions, seasonType } = await request.json();
        
        if (!prompt && !refinementMode) {
            return json({
                success: false,
                error: 'Prompt is required'
            }, { status: 400 });
        }
        
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        let userPrompt;
        let systemMessage;
        
        if (refinementMode && existingSummary && refinementInstructions) {
            // Refinement mode - modify existing summary
            userPrompt = `Here is an existing weekly fantasy football recap:

${existingSummary}

Please refine this recap with the following instructions:
${refinementInstructions}

Keep the same general format and length (300-500 words), but make the requested changes.`;
            
            systemMessage = systemPrompt || `You are a witty, snarky fantasy football analyst writing weekly recaps for "The Hou Dat League". 
Your writing style is entertaining and slightly sarcastic. Call out bad performances and celebrate great ones.
Use sports commentary language. Keep it fun and lighthearted. Format as a narrative, not bullet points.`;
            
        } else {
            // Normal generation mode - use enhanced context
            userPrompt = prompt;
            
            // If we have season/week, fetch enhanced context and add it to the prompt
            if (season && week) {
                try {
                    const contextResponse = await fetch(
                        `http://localhost:5173/api/weekly_summary_context?season=${season}&week=${week}`
                    );
                    const contextData = await contextResponse.json();
                    
                    if (contextData.success) {
                        const enhancedPrompt = formatEnhancedContext(contextData.context, prompt, seasonType);
                        userPrompt = enhancedPrompt;
                    }
                } catch (err) {
                    console.error('Error fetching enhanced context:', err);
                    // Continue with original prompt if context fetch fails
                }
            }
            
            systemMessage = systemPrompt || `You are a witty, snarky fantasy football analyst writing weekly recaps for "The Hou Dat League". 
Your writing style is entertaining and slightly sarcastic. Call out bad performances and celebrate great ones.
Use sports commentary language. Keep it fun and lighthearted. Format as a narrative, not bullet points.
Keep it around 300-500 words.`;
        }
        
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: userPrompt
            }],
            system: systemMessage
        });
        
        const summary = message.content[0].type === 'text' 
            ? message.content[0].text 
            : '';
        
        // Save the summary to the database (only in normal mode or if explicitly requested)
        if (season && week && !refinementMode) {
            try {
                console.log('💾 Attempting to save summary for season:', season, 'week:', week);
                
                const seasonResult = await query(
                    'SELECT season_id FROM seasons WHERE season_year = $1',
                    [season]
                );

                if (seasonResult.rows.length > 0) {
                    const seasonId = seasonResult.rows[0].season_id;
                    console.log('✅ Found season_id:', seasonId);

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
                    
                    console.log('✅ Summary saved successfully');
                } else {
                    console.error('❌ Season not found for year:', season);
                }
            } catch (dbError) {
                console.error('❌ DATABASE SAVE ERROR:', dbError);
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

function formatEnhancedContext(context, originalPrompt, seasonType = 'regular') {
    const { seasonYear, week, standings, previousSummaries, streaks, matchups, rosterData, benchAnalysis, careerStats, temporalScope } = context;
    
    const typeLabel = seasonType === 'playoffs' ? 'PLAYOFF' : 'REGULAR SEASON';
    
    let enhancedPrompt = `You are creating a ${typeLabel} recap for Week ${week} of the ${seasonYear} season.

CRITICAL TEMPORAL CONTEXT:
${temporalScope.note}
You are writing as if it's ${seasonYear} Week ${week}. Only reference information available at this point in time.

`;

    // Add standings context
    if (standings && standings.length > 0) {
        enhancedPrompt += `\n## CURRENT STANDINGS (through Week ${week}):\n`;
        standings.forEach((team, idx) => {
            enhancedPrompt += `${idx + 1}. ${team.team_name} (${team.manager_name}): ${team.wins}-${team.losses}`;
            if (team.ties > 0) enhancedPrompt += `-${team.ties}`;
            enhancedPrompt += ` | ${parseFloat(team.points_for).toFixed(2)} PF | ${parseFloat(team.points_against).toFixed(2)} PA\n`;
        });
    }

    // Add streaks
    if (streaks && streaks.length > 0) {
        const hotTeams = streaks.filter(s => s.current_streak_type === 'winning' && s.current_streak_length >= 2);
        const coldTeams = streaks.filter(s => s.current_streak_type === 'losing' && s.current_streak_length >= 2);
        
        if (hotTeams.length > 0) {
            enhancedPrompt += `\n## 🔥 HOT TEAMS:\n`;
            hotTeams.forEach(team => {
                enhancedPrompt += `- ${team.team_name} (${team.manager_name}): ${team.current_streak_length}-game WIN streak`;
                if (team.longest_win_streak === team.current_streak_length && team.current_streak_length >= 3) {
                    enhancedPrompt += ` (SEASON HIGH!)`;
                }
                enhancedPrompt += `\n`;
            });
        }
        
        if (coldTeams.length > 0) {
            enhancedPrompt += `\n## 🧊 COLD TEAMS:\n`;
            coldTeams.forEach(team => {
                enhancedPrompt += `- ${team.team_name} (${team.manager_name}): ${team.current_streak_length}-game LOSING streak`;
                if (team.longest_lose_streak === team.current_streak_length && team.current_streak_length >= 3) {
                    enhancedPrompt += ` (SEASON HIGH!)`;
                }
                enhancedPrompt += `\n`;
            });
        }
    }

    // Add head-to-head context for matchups
    if (matchups && matchups.length > 0) {
        enhancedPrompt += `\n## WEEK ${week} MATCHUP DETAILS:\n`;
        matchups.forEach((m, idx) => {
            enhancedPrompt += `\n### Matchup ${idx + 1}`;
            if (m.round_name) enhancedPrompt += ` - ${m.round_name}`;
            if (m.bracket) enhancedPrompt += ` (${m.bracket})`;
            enhancedPrompt += `:\n`;
            
            enhancedPrompt += `${m.team1_name} (${m.team1_manager}) vs ${m.team2_name} (${m.team2_manager})\n`;
            enhancedPrompt += `Score: ${parseFloat(m.team1_score || 0).toFixed(2)} - ${parseFloat(m.team2_score || 0).toFixed(2)}\n`;
            
            // Add head-to-head history
            if (m.h2h_games > 0) {
                enhancedPrompt += `📊 All-time head-to-head: ${m.team1_h2h_wins}-${m.team2_h2h_wins} in ${m.h2h_games} previous meetings\n`;
            }
        });
    }

    // Add bench blunders with specific examples
    if (benchAnalysis && benchAnalysis.length > 0) {
        enhancedPrompt += `\n## 💺 BIGGEST LINEUP MISTAKES:\n`;
        benchAnalysis.slice(0, 5).forEach(mistake => {
            enhancedPrompt += `- ${mistake.manager_name}: Benched ${mistake.benched_player} (${mistake.position}) who scored ${parseFloat(mistake.bench_points).toFixed(1)} pts, `;
            enhancedPrompt += `while starting ${mistake.started_player} who only scored ${parseFloat(mistake.starter_points).toFixed(1)} pts. `;
            enhancedPrompt += `LEFT ${parseFloat(mistake.points_left_on_bench).toFixed(1)} POINTS ON THE BENCH!\n`;
        });
    }

    // Add career context for perspective
    if (careerStats && careerStats.length > 0) {
        enhancedPrompt += `\n## 📈 ALL-TIME RECORDS (through this week):\n`;
        careerStats.slice(0, 8).forEach(stat => {
            if (stat.career_wins > 0 || stat.career_losses > 0) {
                enhancedPrompt += `- ${stat.manager_name}: ${stat.career_wins}-${stat.career_losses} career (${parseFloat(stat.career_win_pct).toFixed(1)}% win rate)\n`;
            }
        });
    }

    // Add previous summaries for continuity
    if (previousSummaries && previousSummaries.length > 0) {
        enhancedPrompt += `\n## 📝 RECENT SUMMARIES (for story continuity):\n`;
        previousSummaries.slice(0, 2).forEach(prev => {
            enhancedPrompt += `\n### ${prev.season_year} Week ${prev.week}:\n`;
            enhancedPrompt += `${prev.summary_text.substring(0, 400)}...\n`;
        });
    }

    // Add the original matchup data
    enhancedPrompt += `\n---\n\n## ORIGINAL MATCHUP DATA:\n`;
    enhancedPrompt += originalPrompt;

    // Final instructions
    enhancedPrompt += `\n\n---\n\nBased on ALL this context, write an entertaining, snarky ${typeLabel} recap. `;
    enhancedPrompt += `Use the standings, streaks, head-to-head records, and bench blunders to add depth. `;
    enhancedPrompt += `Reference ongoing storylines from previous weeks when relevant. `;
    enhancedPrompt += `Keep it fun, around 300-500 words. `;
    if (seasonType === 'playoffs') {
        enhancedPrompt += `Remember this is PLAYOFFS - emphasize the high stakes!`;
    }

    return enhancedPrompt;
}