// src/routes/api/generate_weekly_summary_video/+server.js
import { json } from '@sveltejs/kit';
import { createHeyGenVideo, getHeyGenVideoStatus } from '$lib/heygen';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

export async function POST({ request }) {
	try {
		const { season, week, summary, testMode = false, avatarId, voiceId } = await request.json();

		if (!season || !week || !summary) {
			return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
		}

		// Get season_id
		const seasonResult = await sql`
			SELECT season_id FROM seasons WHERE season = ${season}
		`;

		if (seasonResult.length === 0) {
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult[0].season_id;

		// Check if video already exists
		const existingVideo = await sql`
			SELECT * FROM weekly_summary_videos
			WHERE season_id = ${seasonId} AND week = ${week}
		`;

		if (existingVideo.length > 0) {
			// Delete existing video record
			await sql`
				DELETE FROM weekly_summary_videos
				WHERE season_id = ${seasonId} AND week = ${week}
			`;
		}

		if (testMode) {
			// Test mode: Create a mock video record
			console.log('Test mode enabled - creating mock video');

			// Insert pending video record
			const insertResult = await sql`
				INSERT INTO weekly_summary_videos (
					season_id, week, generation_status, video_provider
				)
				VALUES (${seasonId}, ${week}, 'pending', 'test')
				RETURNING video_id
			`;

			const videoId = insertResult[0].video_id;

			// Simulate processing delay
			setTimeout(async () => {
				try {
					const testVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
					const testThumbnail = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';

					await sql`
						UPDATE weekly_summary_videos
						SET 
							generation_status = 'completed',
							video_url = ${testVideoUrl},
							thumbnail_url = ${testThumbnail},
							video_duration = 596,
							completed_at = CURRENT_TIMESTAMP
						WHERE video_id = ${videoId}
					`;

					console.log('Test video completed:', videoId);
				} catch (err) {
					console.error('Error updating test video:', err);
				}
			}, 2000);

			return json({ success: true, videoId, testMode: true });
		} else {
			// Production mode: Use HeyGen API
			console.log('Creating HeyGen video with avatar:', avatarId, 'and voice:', voiceId);

			// Insert pending video record
			const insertResult = await sql`
				INSERT INTO weekly_summary_videos (
					season_id, week, generation_status, video_provider
				)
				VALUES (${seasonId}, ${week}, 'pending', 'heygen')
				RETURNING video_id
			`;

			const videoId = insertResult[0].video_id;

			try {
				// Call HeyGen API with custom avatar and voice
				const result = await createHeyGenVideo(summary, {
					avatarId: avatarId,
					voiceId: voiceId
				});

				if (!result.success) {
					await sql`
						UPDATE weekly_summary_videos
						SET 
							generation_status = 'failed',
							error_message = ${result.error}
						WHERE video_id = ${videoId}
					`;

					return json({ success: false, error: result.error }, { status: 500 });
				}

				// Update with HeyGen video ID and set to processing
				await sql`
					UPDATE weekly_summary_videos
					SET 
						generation_status = 'processing',
						provider_video_id = ${result.videoId}
					WHERE video_id = ${videoId}
				`;

				// Start polling for completion
				pollHeyGenStatus(videoId, result.videoId, sql);

				return json({ success: true, videoId, heygenVideoId: result.videoId });
			} catch (err) {
				console.error('Error creating HeyGen video:', err);

				await sql`
					UPDATE weekly_summary_videos
					SET 
						generation_status = 'failed',
						error_message = ${err.message}
					WHERE video_id = ${videoId}
				`;

				return json({ success: false, error: err.message }, { status: 500 });
			}
		}
	} catch (error) {
		console.error('Error in generate_weekly_summary_video POST:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function GET({ url }) {
	try {
		const videoId = url.searchParams.get('videoId');

		if (!videoId) {
			return json({ success: false, error: 'videoId required' }, { status: 400 });
		}

		const result = await sql`
			SELECT * FROM weekly_summary_videos WHERE video_id = ${videoId}
		`;

		if (result.length === 0) {
			return json({ success: false, error: 'Video not found' }, { status: 404 });
		}

		return json({ success: true, video: result[0] });
	} catch (error) {
		console.error('Error in generate_weekly_summary_video GET:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

async function pollHeyGenStatus(videoId, heygenVideoId, sql, attempts = 0) {
	const maxAttempts = 60; // 5 minutes
	const pollInterval = 5000; // 5 seconds

	if (attempts >= maxAttempts) {
		console.log('Polling timeout for video:', videoId);
		await sql`
			UPDATE weekly_summary_videos
			SET 
				generation_status = 'failed',
				error_message = 'Video generation timeout'
			WHERE video_id = ${videoId}
		`;
		return;
	}

	try {
		const status = await getHeyGenVideoStatus(heygenVideoId);

		if (!status.success) {
			console.error('Error checking HeyGen status:', status.error);
			setTimeout(() => pollHeyGenStatus(videoId, heygenVideoId, sql, attempts + 1), pollInterval);
			return;
		}

		console.log('HeyGen video status:', status.status, 'for video:', videoId);

		if (status.status === 'completed' && status.videoUrl) {
			// Video is ready!
			await sql`
				UPDATE weekly_summary_videos
				SET 
					generation_status = 'completed',
					video_url = ${status.videoUrl},
					thumbnail_url = ${status.thumbnailUrl || null},
					video_duration = ${status.duration || null},
					completed_at = CURRENT_TIMESTAMP
				WHERE video_id = ${videoId}
			`;
			console.log('Video completed successfully:', videoId);
		} else if (status.status === 'failed') {
			await sql`
				UPDATE weekly_summary_videos
				SET 
					generation_status = 'failed',
					error_message = ${status.error || 'HeyGen video generation failed'}
				WHERE video_id = ${videoId}
			`;
		} else {
			// Still processing, poll again
			setTimeout(() => pollHeyGenStatus(videoId, heygenVideoId, sql, attempts + 1), pollInterval);
		}
	} catch (err) {
		console.error('Error polling HeyGen status:', err);
		setTimeout(() => pollHeyGenStatus(videoId, heygenVideoId, sql, attempts + 1), pollInterval);
	}
}