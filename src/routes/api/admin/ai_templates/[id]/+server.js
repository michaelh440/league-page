import { query } from '$lib/db.js';

// PUT update template
export async function PUT({ params, request }) {
    try {
        const template = await request.json();
        const { id } = params;
        
        const result = await query(`
            UPDATE ai_templates
            SET 
                name = $1,
                system_prompt = $2,
                tone_preset = $3,
                context_settings = $4,
                temperature = $5,
                max_tokens = $6,
                length_preset = $7,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
        `, [
            template.name,
            template.system_prompt,
            template.tone_preset,
            JSON.stringify(template.context_settings),
            template.temperature,
            template.max_tokens,
            template.length_preset,
            id
        ]);
        
        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Template not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error updating AI template:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE template
export async function DELETE({ params }) {
    try {
        const { id } = params;
        
        const result = await query(`
            DELETE FROM ai_templates
            WHERE id = $1
            RETURNING id
        `, [id]);
        
        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Template not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error deleting AI template:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}