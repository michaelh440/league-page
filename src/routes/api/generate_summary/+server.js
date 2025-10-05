// src/routes/api/generate_summary/+server.js
import { json } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY
});

export async function POST({ request }) {
    try {
        const { prompt, season, week } = await request.json();
        
        if (!prompt) {
            return json({
                success: false,
                error: 'Prompt is required'
            }, { status: 400 });
        }
        
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