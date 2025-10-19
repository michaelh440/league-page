// src/routes/api/ai_prompts/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

// GET - Retrieve all prompts or a specific one
export async function GET({ url }) {
    try {
        const promptName = url.searchParams.get('name');
        
        let result;
        if (promptName) {
            // Get specific prompt
            result = await query(
                'SELECT * FROM ai_prompts WHERE prompt_name = $1',
                [promptName]
            );
        } else {
            // Get all prompts
            result = await query(
                'SELECT * FROM ai_prompts ORDER BY is_default DESC, prompt_name ASC'
            );
        }

        return json({
            success: true,
            prompts: result.rows
        });

    } catch (error) {
        console.error('Error fetching prompts:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// POST - Save/update a custom prompt
export async function POST({ request }) {
    try {
        const { promptName, systemPrompt, isDefault } = await request.json();
        
        if (!promptName || !systemPrompt) {
            return json({
                success: false,
                error: 'Missing required parameters'
            }, { status: 400 });
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
            await query('UPDATE ai_prompts SET is_default = FALSE');
        }

        // Upsert prompt
        const result = await query(
            `INSERT INTO ai_prompts (prompt_name, system_prompt, is_default)
            VALUES ($1, $2, $3)
            ON CONFLICT (prompt_name) 
            DO UPDATE SET
                system_prompt = EXCLUDED.system_prompt,
                is_default = EXCLUDED.is_default,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [promptName, systemPrompt, isDefault || false]
        );

        return json({
            success: true,
            prompt: result.rows[0],
            message: 'Prompt saved successfully'
        });

    } catch (error) {
        console.error('Error saving prompt:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// DELETE - Delete a custom prompt
export async function DELETE({ url }) {
    try {
        const promptName = url.searchParams.get('name');
        
        if (!promptName) {
            return json({
                success: false,
                error: 'Missing prompt name'
            }, { status: 400 });
        }

        // Don't allow deleting the default prompt
        const checkResult = await query(
            'SELECT is_default FROM ai_prompts WHERE prompt_name = $1',
            [promptName]
        );

        if (checkResult.rows.length > 0 && checkResult.rows[0].is_default) {
            return json({
                success: false,
                error: 'Cannot delete the default prompt'
            }, { status: 400 });
        }

        await query('DELETE FROM ai_prompts WHERE prompt_name = $1', [promptName]);

        return json({
            success: true,
            message: 'Prompt deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting prompt:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}