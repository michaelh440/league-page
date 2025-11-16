import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const anthropic = new Anthropic({
	apiKey: ANTHROPIC_API_KEY
});

export async function POST({ request, fetch }) {
	try {
		const { season, week, promptId } = await request.json();

		if (!season || !week) {
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		const seasonYear = parseInt(season);
		const weekNum = parseInt(week);

		// Get season_id
		const seasonResult = await query(
			`SELECT season_id FROM seasons WHERE season_year = $1`,
			[seasonYear]
		);

		if (seasonResult.rows.length === 0) {
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult.rows[0].season_id;

		// Check if summary already exists
		const existingCheck = await query(
			`SELECT summary_id FROM weekly_summaries WHERE season_id = $1 AND week = $2`,
			[seasonId, weekNum]
		);

		if (existingCheck.rows.length > 0) {
			return json({ 
				success: false, 
				error: 'Summary already exists for this week. Delete it first to regenerate.' 
			}, { status: 400 });
		}

		// 1. Fetch enhanced context
		const contextResponse = await fetch(
			`/api/weekly_summary_context?season=${seasonYear}&week=${weekNum}`
		);
		const contextData = await contextResponse.json();

		if (!contextData.success) {
			return json({ 
				success: false, 
				error: 'Failed to fetch context data' 
			}, { status: 500 });
		}

		const context = contextData.context;

		// 2. Get the AI prompt
		const promptResult = await query(
			promptId 
				? `SELECT system_prompt FROM ai_prompts WHERE prompt_id = $1`
				: `SELECT system_prompt FROM ai_prompts WHERE is_default = true`,
			promptId ? [promptId] : []
		);

		if (promptResult.rows.length === 0) {
			return json({ 
				success: false, 
				error: 'No AI prompt found' 
			}, { status: 404 });
		}

		const systemPrompt = promptResult.rows[0].system_prompt;

		// 3. Format the context for Claude
		const formattedContext = formatContextForAI(context);

		// 4. Generate the summary with Claude
		const message = await anthropic.messages.create({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 4096,
			system: systemPrompt,
			messages: [{
				role: 'user',
				content: formattedContext
			}]
		});

		const summaryText = message.content[0].text;

		// 5. Save the summary
		const insertResult = await query(
			`INSERT INTO weekly_summaries (season_id, week, summary_text, generated_at, published)
			 VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)
			 RETURNING summary_id`,
			[seasonId, weekNum, summaryText]
		);

		return json({
			success: true,
			summary: {
				summary_id: insertResult.rows[0].summary_id,
				season_id: seasonId,
				week: weekNum,
				summary_text: summaryText
			}
		});

	} catch (error) {
		console.error('Error generating summary:', error);
		return json({ 
			success: false, 
			error: error.message 
		}, { status: 500 });
	}
}

function formatContextForAI(context) {
	const { seasonYear, week, standings, previousSummaries, streaks, matchups, rosterData, benchAnalysis, careerStats, temporalScope } = context;

	let prompt = `Generate an entertaining, snarky weekly fantasy football recap for ${seasonYear} Week ${week}.

IMPORTANT TEMPORAL CONTEXT:
You are writing this summary as if it's ${seasonYear} Week ${week}. Only reference information that would have been available at this point in time. Do NOT reference any future weeks, games, or outcomes.
${temporalScope.note}

`;

	// Add standings
	if (standings && standings.length > 0) {
		prompt += `\n## CURRENT STANDINGS (through Week ${week}):\n`;
		standings.forEach(team => {
			prompt += `${team.rank}. ${team.team_name} (${team.manager_name}): ${team.wins}-${team.losses}`;
			if (team.ties > 0) prompt += `-${team.ties}`;
			prompt += ` | ${team.points_for.toFixed(2)} PF | ${team.points_against.toFixed(2)} PA\n`;
		});
	}

	// Add streaks
	if (streaks && streaks.length > 0) {
		const hotTeams = streaks.filter(s => s.current_streak_type === 'winning' && s.current_streak_length >= 2);
		const coldTeams = streaks.filter(s => s.current_streak_type === 'losing' && s.current_streak_length >= 2);
		
		if (hotTeams.length > 0) {
			prompt += `\n## HOT TEAMS:\n`;
			hotTeams.forEach(team => {
				prompt += `- ${team.team_name} (${team.manager_name}): ${team.current_streak_length}-game winning streak\n`;
			});
		}
		
		if (coldTeams.length > 0) {
			prompt += `\n## COLD TEAMS:\n`;
			coldTeams.forEach(team => {
				prompt += `- ${team.team_name} (${team.manager_name}): ${team.current_streak_length}-game losing streak\n`;
			});
		}
	}

	// Add this week's matchups
	if (matchups && matchups.length > 0) {
		prompt += `\n## WEEK ${week} MATCHUPS:\n`;
		matchups.forEach(m => {
			prompt += `\n### ${m.team1_name} (${m.team1_manager}) vs ${m.team2_name} (${m.team2_manager})\n`;
			prompt += `Score: ${m.team1_score?.toFixed(2) || 'TBD'} - ${m.team2_score?.toFixed(2) || 'TBD'}\n`;
			
			if (m.h2h_games > 0) {
				prompt += `Head-to-head history: ${m.team1_h2h_wins}-${m.team2_h2h_wins} in ${m.h2h_games} previous meetings\n`;
			}
		});
	}

	// Add roster analysis
	if (rosterData && rosterData.length > 0) {
		prompt += `\n## ROSTER PERFORMANCE:\n`;
		rosterData.forEach(team => {
			if (team.roster && team.roster.length > 0) {
				const starters = team.roster.filter(p => p.role === 'starter');
				const bench = team.roster.filter(p => p.role === 'bench');
				
				prompt += `\n${team.team_name} (${team.manager_name}):\n`;
				prompt += `- Starter points: ${team.starter_points?.toFixed(2) || 0}\n`;
				prompt += `- Bench points: ${team.bench_points?.toFixed(2) || 0}\n`;
				
				// Top starters
				const topStarters = starters
					.filter(p => p.points !== null)
					.sort((a, b) => b.points - a.points)
					.slice(0, 3);
				
				if (topStarters.length > 0) {
					prompt += `- Top starters: ${topStarters.map(p => `${p.player_name} (${p.position}, ${p.points?.toFixed(2)} pts)`).join(', ')}\n`;
				}
				
				// Top bench players (potential mistakes)
				const topBench = bench
					.filter(p => p.points !== null && p.points > 15)
					.sort((a, b) => b.points - a.points)
					.slice(0, 2);
				
				if (topBench.length > 0) {
					prompt += `- High-scoring bench: ${topBench.map(p => `${p.player_name} (${p.position}, ${p.points?.toFixed(2)} pts)`).join(', ')}\n`;
				}
			}
		});
	}

	// Add bench blunders
	if (benchAnalysis && benchAnalysis.length > 0) {
		prompt += `\n## LINEUP MISTAKES:\n`;
		benchAnalysis.slice(0, 5).forEach(mistake => {
			prompt += `- ${mistake.manager_name} benched ${mistake.benched_player} (${mistake.position}, ${mistake.bench_points?.toFixed(2)} pts) `;
			prompt += `and started ${mistake.started_player} (${mistake.starter_points?.toFixed(2)} pts) - `;
			prompt += `Left ${mistake.points_left_on_bench?.toFixed(2)} points on the bench!\n`;
		});
	}

	// Add career context
	if (careerStats && careerStats.length > 0) {
		prompt += `\n## ALL-TIME RECORDS (through this week):\n`;
		careerStats.slice(0, 5).forEach(stat => {
			if (stat.career_wins > 0 || stat.career_losses > 0) {
				prompt += `- ${stat.manager_name}: ${stat.career_wins}-${stat.career_losses} (${stat.career_win_pct}% win rate)\n`;
			}
		});
	}

	// Add previous summaries for continuity
	if (previousSummaries && previousSummaries.length > 0) {
		prompt += `\n## PREVIOUS SUMMARIES (for context/continuity):\n`;
		previousSummaries.slice(0, 3).forEach(prev => {
			prompt += `\n### ${prev.season_year} Week ${prev.week}:\n`;
			prompt += `${prev.summary_text.substring(0, 500)}...\n`;
		});
	}

	prompt += `\n---\n\nBased on all this information, write an entertaining, snarky recap of Week ${week}. `;
	prompt += `Focus on the most interesting storylines, biggest performances, worst mistakes, and ongoing narratives. `;
	prompt += `Keep it fun and engaging, around 300-400 words. Remember: you're writing as if it's ${seasonYear} Week ${week}.`;

	return prompt;
}