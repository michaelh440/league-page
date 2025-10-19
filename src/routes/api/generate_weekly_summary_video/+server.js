// src/routes/api/generate_weekly_summary_video/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { createHeyGenVideo, checkHeyGenVideoStatus } from '$lib/heygen';

// POST - Generate video from summary
export async function POST({ request }) {
    try {
        const { season, week, summaryText, testMode } = await request.json();

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

        // Create or update video record with pending status
        const videoResult = await query(
            `INSERT INTO weekly_summary_videos (
                season_id,
                week,
                generation_status,
                created_at
            ) VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
            ON CONFLICT (season_id, week) 
            DO UPDATE SET
                generation_status = 'pending',
                error_message = NULL,
                video_url = NULL,
                thumbnail_url = NULL,
                provider_video_id = NULL,
                created_at = CURRENT_TIMESTAMP
            RETURNING video_id`,
            [seasonId, week]
        );

        const videoId = videoResult.rows[0].video_id;

        if (testMode) {
            // ==========================================
            // TEST MODE - Simulate video generation
            // ==========================================
            console.log('Test mode: Simulating video generation for:', {
                videoId,
                season,
                week,
                summaryLength: summaryText.length
            });
            
            // Update to processing status
            await query(
                `UPDATE weekly_summary_videos 
                SET generation_status = 'processing'
                WHERE video_id = $1`,
                [videoId]
            );
            
            // Simulate processing delay (2 seconds) then complete
            setTimeout(async () => {
                try {
                    // Use a public test video URL (Big Buck Bunny sample)
                    const testVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                    
                    await query(
                        `UPDATE weekly_summary_videos 
                        SET 
                            generation_status = 'completed',
                            video_url = $1,
                            thumbnail_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
                            video_duration = 596,
                            completed_at = CURRENT_TIMESTAMP,
                            error_message = NULL
                        WHERE video_id = $2`,
                        [testVideoUrl, videoId]
                    );
                    
                    console.log('Test video generation completed:', videoId);
                } catch (err) {
                    console.error('Error completing test video:', err);
                    await query(
                        `UPDATE weekly_summary_videos 
                        SET 
                            generation_status = 'failed',
                            error_message = $1
                        WHERE video_id = $2`,
                        [err.message, videoId]
                    );
                }
            }, 2000);
            
            return json({
                success: true,
                message: 'Test video generation initiated',
                videoId,
                status: 'processing',
                testMode: true
            });
        }

        // ==========================================
        // PRODUCTION MODE - HeyGen API integration
        // ==========================================
        
        console.log('Production mode: Generating HeyGen video for:', {
            videoId,
            season,
            week,
            summaryLength: summaryText.length
        });
        
        // Call HeyGen API to create video
        const heygenResult = await createHeyGenVideo(summaryText, {
            title: `Week ${week} - ${season} Fantasy Football Summary`
        });
        
        if (!heygenResult.success) {
            // Failed to start video generation
            await query(
                `UPDATE weekly_summary_videos 
                SET 
                    generation_status = 'failed',
                    error_message = $1
                WHERE video_id = $2`,
                [heygenResult.error, videoId]
            );
            
            return json({
                success: false,
                error: heygenResult.error
            }, { status: 500 });
        }
        
        // Successfully started video generation
        await query(
            `UPDATE weekly_summary_videos 
            SET 
                generation_status = 'processing',
                provider_video_id = $1
            WHERE video_id = $2`,
            [heygenResult.videoId, videoId]
        );
        
        // Start background polling to check for completion
        pollHeyGenVideo(videoId, heygenResult.videoId);

        return json({
            success: true,
            message: 'HeyGen video generation started',
            videoId,
            status: 'processing',
            heygenVideoId: heygenResult.videoId
        });

    } catch (error) {
        console.error('Error generating video:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Background polling function to check HeyGen video status
async function pollHeyGenVideo(videoId, heygenVideoId, attempts = 0) {
    const maxAttempts = 120; // Max 10 minutes (5 second intervals)
    
    if (attempts >= maxAttempts) {
        console.log('Polling timeout for video:', videoId);
        await query(
            `UPDATE weekly_summary_videos 
            SET 
                generation_status = 'failed',
                error_message = 'Video generation timeout'
            WHERE video_id = $1`,
            [videoId]
        );
        return;
    }
    
    try {
        const status = await checkHeyGenVideoStatus(heygenVideoId);
        
        if (!status.success) {
            console.error('Error checking video status:', status.error);
            // Retry after delay
            setTimeout(() => pollHeyGenVideo(videoId, heygenVideoId, attempts + 1), 5000);
            return;
        }
        
        if (status.status === 'completed') {
            // Video is ready!
            await query(
                `UPDATE weekly_summary_videos 
                SET 
                    generation_status = 'completed',
                    video_url = $1,
                    thumbnail_url = $2,
                    video_duration = $3,
                    completed_at = CURRENT_TIMESTAMP,
                    error_message = NULL
                WHERE video_id = $4`,
                [status.videoUrl, status.thumbnailUrl, status.duration, videoId]
            );
            console.log('HeyGen video completed:', videoId);
        } else if (status.status === 'failed') {
            // Video generation failed
            await query(
                `UPDATE weekly_summary_videos 
                SET 
                    generation_status = 'failed',
                    error_message = $1
                WHERE video_id = $2`,
                [status.error || 'Video generation failed', videoId]
            );
            console.log('HeyGen video failed:', videoId);
        } else {
            // Still processing, poll again
            setTimeout(() => pollHeyGenVideo(videoId, heygenVideoId, attempts + 1), 5000);
        }
    } catch (error) {
        console.error('Error polling HeyGen video:', error);
        setTimeout(() => pollHeyGenVideo(videoId, heygenVideoId, attempts + 1), 5000);
    }
}

// GET - Check video generation status
export async function GET({ url }) {
    try {
        const videoId = url.searchParams.get('videoId');

        if (!videoId) {
            return json({
                success: false,
                error: 'Missing videoId parameter'
            }, { status: 400 });
        }

        const result = await query(
            `SELECT 
                video_id,
                video_url,
                generation_status,
                provider_video_id,
                thumbnail_url,
                error_message,
                completed_at
            FROM weekly_summary_videos
            WHERE video_id = $1`,
            [videoId]
        );

        if (result.rows.length === 0) {
            return json({
                success: false,
                error: 'Video not found'
            }, { status: 404 });
        }

        return json({
            success: true,
            video: result.rows[0]
        });

    } catch (error) {
        console.error('Error checking video status:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}