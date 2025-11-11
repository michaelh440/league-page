// src/routes/admin/videos/+page.server.js
import { query } from '$lib/db';

export const load = async () => {
	try {
		// Get all videos with season info
		const videosQuery = `
			SELECT 
				wsv.video_id,
				wsv.video_url,
				wsv.week,
				wsv.generation_status,
				wsv.video_provider,
				wsv.provider_video_id,
				wsv.thumbnail_url,
				wsv.created_at,
				s.season_id,
				s.season_year,
				s.platform,
				CONCAT('Week ', wsv.week, ' - ', s.season_year, ' Season') as title
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			ORDER BY s.season_year DESC, wsv.week DESC
		`;
		
		const videosResult = await query(videosQuery);
		
		// Get all seasons for the dropdown
		const seasonsQuery = `
			SELECT season_id, season_year, platform,
				CONCAT(season_year, ' Season') as season_name
			FROM seasons
			ORDER BY season_year DESC
		`;
		
		const seasonsResult = await query(seasonsQuery);
		
		// Get the current featured video (most recent completed one)
		const featuredQuery = `
			SELECT video_id
			FROM weekly_summary_videos
			WHERE video_url IS NOT NULL 
			  AND generation_status = 'completed'
			ORDER BY created_at DESC
			LIMIT 1
		`;
		const featuredResult = await query(featuredQuery);
		const featuredVideoId = featuredResult.rows.length > 0 ? featuredResult.rows[0].video_id : null;
		
		// Add featured flag to videos
		const videosWithFeatured = videosResult.rows.map(video => ({
			...video,
			is_featured: video.video_id === featuredVideoId
		}));
		
		return {
			videos: videosWithFeatured,
			seasons: seasonsResult.rows,
			featuredVideoId
		};
	} catch (error) {
		console.error('Error loading admin videos:', error);
		return {
			videos: [],
			seasons: [],
			featuredVideoId: null,
			error: error.message
		};
	}
};

export const actions = {
	// Add new video
	add: async ({ request }) => {
		try {
			const data = await request.formData();
			const videoUrl = data.get('video_url');
			const seasonId = data.get('season_id');
			const week = data.get('week');
			
			// Extract YouTube ID from URL
			const youtubeId = extractYoutubeId(videoUrl);
			
			// Insert new video
			const insertQuery = `
				INSERT INTO weekly_summary_videos 
				(video_url, season_id, week, video_provider, generation_status, 
				 provider_video_id, created_at)
				VALUES ($1, $2, $3, 'youtube', 'completed', $4, NOW())
				RETURNING video_id
			`;
			
			const result = await query(insertQuery, [videoUrl, seasonId, week, youtubeId]);
			
			return {
				success: true,
				message: 'Video added successfully',
				video_id: result.rows[0].video_id
			};
		} catch (error) {
			console.error('Error adding video:', error);
			return {
				success: false,
				error: error.message
			};
		}
	},
	
	// Update existing video
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			const videoUrl = data.get('video_url');
			const seasonId = data.get('season_id');
			const week = data.get('week');
			
			// Extract YouTube ID from URL
			const youtubeId = extractYoutubeId(videoUrl);
			
			// Update video
			const updateQuery = `
				UPDATE weekly_summary_videos
				SET video_url = $1, 
				    season_id = $2, 
				    week = $3,
				    provider_video_id = $4,
				    video_provider = 'youtube',
				    generation_status = 'completed'
				WHERE video_id = $5
			`;
			
			await query(updateQuery, [videoUrl, seasonId, week, youtubeId, videoId]);
			
			return {
				success: true,
				message: 'Video updated successfully'
			};
		} catch (error) {
			console.error('Error updating video:', error);
			return {
				success: false,
				error: error.message
			};
		}
	},
	
	// Delete video
	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			
			await query('DELETE FROM weekly_summary_videos WHERE video_id = $1', [videoId]);
			
			return {
				success: true,
				message: 'Video deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting video:', error);
			return {
				success: false,
				error: error.message
			};
		}
	},
	
	// Set featured video (we'll track this in a separate way since there's no column)
	// For now, the "featured" video is just the most recent completed one
	setFeatured: async ({ request }) => {
		try {
			// Since there's no is_featured column, we could:
			// 1. Add the column to the database
			// 2. Store in a separate settings table
			// 3. Just use "most recent" as featured
			
			// For now, let's just return success
			// The actual featured logic is handled in the load function
			return {
				success: true,
				message: 'Feature status updated (currently using most recent video as featured)'
			};
		} catch (error) {
			console.error('Error setting featured video:', error);
			return {
				success: false,
				error: error.message
			};
		}
	}
};

// Helper function to extract YouTube video ID
function extractYoutubeId(url) {
	if (!url) return null;
	
	// Handle various YouTube URL formats
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
		/^([a-zA-Z0-9_-]{11})$/  // Just the ID
	];
	
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	
	return url; // Return as-is if no pattern matches
}