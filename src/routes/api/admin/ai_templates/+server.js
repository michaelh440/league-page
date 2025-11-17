import { query } from '$lib/db.js';

// GET all templates
export async function GET() {
    try {
        const result = await query(`
            SELECT 
                id,
                name,
                agent_name,
                agent_photo,
                system_prompt,
                tone_preset,
                context_settings,
                temperature,
                max_tokens,
                length_preset,
                additional_prompts,
                is_default,
                created_at,
                updated_at
            FROM ai_templates
            ORDER BY is_default DESC, created_at DESC
        `);
        
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching AI templates:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST new template
export async function POST({ request }) {
    try {
        const template = await request.json();
        
        const result = await query(`
            INSERT INTO ai_templates (
                name,
                agent_name,
                agent_photo,
                system_prompt,
                tone_preset,
                context_settings,
                temperature,
                max_tokens,
                length_preset,
                additional_prompts,
                is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            template.name,
            template.agent_name || '',
            template.agent_photo || '',
            template.system_prompt,
            template.tone_preset,
            JSON.stringify(template.context_settings),
            template.temperature,
            template.max_tokens,
            template.length_preset,
            JSON.stringify(template.additional_prompts || []),
            template.is_default || false
        ]);
        
        return new Response(JSON.stringify(result.rows[0]), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error creating AI template:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}