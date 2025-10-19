// src/routes/api/weekly_summary_video/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

// GET - Check if video exists for a week
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
                success: false,
                error: 'Season not found'
            }, { status: 404 });
        }

        const seasonId = seasonResult.rows[0].season_id;

        // Get video
        const videoResult = await query(
            `SELECT 
                video_id,
                video_url,
                video_provider,
                video_duration,
                generation_status,
                provider_video_id,
                thumbnail_url,
                error_message,
                created_at,
                completed_at
            FROM weekly_summary_videos
            WHERE season_id = $1 AND week = $2`,
            [seasonId, week]
        );

        if (videoResult.rows.length === 0) {
            return json({
                success: true,
                video: null
            });
        }

        return json({
            success: true,
            video: videoResult.rows[0]
        });

    } catch (error) {
        console.error('Error fetching video:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}