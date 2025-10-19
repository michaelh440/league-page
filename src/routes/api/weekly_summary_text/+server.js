// src/routes/api/weekly_summary_text/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
    try {
        const season = url.searchParams.get('season');
        const week = url.searchParams.get('week');
        
        if (!season || !week) {
            return json({
                success: false,
                error: 'Missing season or week parameter'
            }, { status: 400 });
        }

        // Get season_id
        const seasonResult = await query(
            'SELECT season_id FROM seasons WHERE season_year = $1',
            [season]
        );

        if (seasonResult.rows.length === 0) {
            return json({
                success: true,
                summary: null,
                message: 'Season not found'
            });
        }

        const seasonId = seasonResult.rows[0].season_id;

        // Get existing summary
        const result = await query(
            `SELECT 
                summary_id,
                summary_text,
                video_url,
                audio_url,
                generated_at,
                published
            FROM weekly_summaries 
            WHERE season_id = $1 AND week = $2`,
            [seasonId, week]
        );

        if (result.rows.length === 0) {
            return json({
                success: true,
                summary: null,
                message: 'No summary found'
            });
        }

        return json({
            success: true,
            summary: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching summary:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const { season, week, summaryText, videoUrl, audioUrl, published } = await request.json();
        
        if (!season || !week || !summaryText) {
            return json({
                success: false,
                error: 'Missing required parameters'
            }, { status: 400 });
        }

        // Get season_id
        const seasonResult = await query(
            'SELECT season_id FROM seasons WHERE season_year = $1',
            [season]
        );

        if (seasonResult.rows.length === 0) {
            return json({
                success: false,
                error: 'Season not found'
            }, { status: 404 });
        }

        const seasonId = seasonResult.rows[0].season_id;

        // Upsert summary
        const result = await query(
            `INSERT INTO weekly_summaries (
                season_id,
                week,
                summary_text,
                video_url,
                audio_url,
                published
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (season_id, week) 
            DO UPDATE SET
                summary_text = EXCLUDED.summary_text,
                video_url = COALESCE(EXCLUDED.video_url, weekly_summaries.video_url),
                audio_url = COALESCE(EXCLUDED.audio_url, weekly_summaries.audio_url),
                published = COALESCE(EXCLUDED.published, weekly_summaries.published),
                generated_at = CURRENT_TIMESTAMP
            RETURNING summary_id, generated_at`,
            [seasonId, week, summaryText, videoUrl, audioUrl, published]
        );

        return json({
            success: true,
            summary: result.rows[0],
            message: 'Summary saved successfully'
        });

    } catch (error) {
        console.error('Error saving summary:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}