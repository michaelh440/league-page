// src/routes/admin/videos/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

// The form sends one `segment` field: a week number ("1".."18") or a category name.
// Numbered weeks store the number; everything else stores a NULL week. The
// weekly_summary_videos_week_matches_category check enforces that pairing.
const NON_WEEK_CATEGORIES = ['preseason', 'draft', 'postseason', 'misc'];

function parseSegment(segment) {
	const value = (segment ?? '').toString().trim();

	if (/^\d+$/.test(value)) {
		const week = parseInt(value, 10);
		if (week < 1 || week > 18) return { error: `Week must be between 1 and 18 (got ${week})` };
		return { category: 'week', week };
	}

	if (NON_WEEK_CATEGORIES.includes(value)) {
		return { category: value, week: null };
	}

	return { error: 'Select a week, Preseason, Draft, Post Season, or Miscellaneous' };
}

export const load = async () => {
	try {
		// Get all videos with season info
		const videosQuery = `
			SELECT 
				wsv.video_id,
				wsv.video_url,
				wsv.category,
				wsv.week,
				wsv.title,
				wsv.description,
				wsv.publish_date,
				wsv.playlist,
				wsv.is_featured,
				wsv.generation_status,
				wsv.video_provider,
				wsv.provider_video_id,
				wsv.thumbnail_url,
				wsv.created_at,
				s.season_id,
				s.season_year,
				s.platform
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			-- Reverse chronological within a season. week is NULL for the non-week
			-- categories, so order by the category first and let NULLs sort last.
			ORDER BY s.season_year DESC,
			         CASE wsv.category
			           WHEN 'postseason' THEN 4
			           WHEN 'week'       THEN 3
			           WHEN 'draft'      THEN 2
			           WHEN 'preseason'  THEN 1
			           ELSE 0
			         END DESC,
			         wsv.week DESC NULLS LAST
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
		
		return {
			videos: videosResult.rows,
			seasons: seasonsResult.rows
		};
	} catch (error) {
		console.error('Error loading admin videos:', error);
		return {
			videos: [],
			seasons: [],
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
			const title = data.get('title');
			const description = data.get('description');
			const publishDate = data.get('publish_date');
			const playlist = data.get('playlist');
			const isFeatured = data.get('is_featured') === 'on';

			const segment = parseSegment(data.get('segment'));
			if (segment.error) {
				return fail(400, { success: false, error: segment.error });
			}

			// Extract YouTube ID from URL
			const youtubeId = extractYoutubeId(videoUrl);

			// If this video is featured, unfeatured all others
			if (isFeatured) {
				await query('UPDATE weekly_summary_videos SET is_featured = false');
			}

			// Insert new video
			const insertQuery = `
				INSERT INTO weekly_summary_videos
				(video_url, season_id, category, week, title, description, publish_date, playlist,
				 is_featured, video_provider, generation_status, provider_video_id, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'youtube', 'completed', $10, NOW())
				RETURNING video_id
			`;

			const result = await query(insertQuery, [
				videoUrl, seasonId, segment.category, segment.week, title, description,
				publishDate, playlist, isFeatured, youtubeId
			]);
			
			return {
				success: true,
				message: 'Video added successfully',
				video_id: result.rows[0].video_id
			};
		} catch (error) {
			console.error('Error adding video:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Update existing video
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			const videoUrl = data.get('video_url');
			const seasonId = data.get('season_id');
			const title = data.get('title');
			const description = data.get('description');
			const publishDate = data.get('publish_date');
			const playlist = data.get('playlist');
			const isFeatured = data.get('is_featured') === 'on';

			const segment = parseSegment(data.get('segment'));
			if (segment.error) {
				return fail(400, { success: false, error: segment.error });
			}

			// Extract YouTube ID from URL
			const youtubeId = extractYoutubeId(videoUrl);

			// If this video is featured, unfeatured all others
			if (isFeatured) {
				await query(
					'UPDATE weekly_summary_videos SET is_featured = false WHERE video_id != $1',
					[videoId]
				);
			}

			// Update video
			const updateQuery = `
				UPDATE weekly_summary_videos
				SET video_url = $1,
				    season_id = $2,
				    category = $11,
				    week = $3,
				    title = $4,
				    description = $5,
				    publish_date = $6,
				    playlist = $7,
				    is_featured = $8,
				    provider_video_id = $9,
				    video_provider = 'youtube',
				    generation_status = 'completed'
				WHERE video_id = $10
			`;
			
			await query(updateQuery, [
				videoUrl, seasonId, segment.week, title, description, publishDate, playlist,
				isFeatured, youtubeId, videoId, segment.category
			]);
			
			return {
				success: true,
				message: 'Video updated successfully'
			};
		} catch (error) {
			console.error('Error updating video:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
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
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Set featured video
	setFeatured: async ({ request }) => {
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			
			// Unfeatured all videos
			await query('UPDATE weekly_summary_videos SET is_featured = false');
			
			// Feature the selected video
			await query(
				'UPDATE weekly_summary_videos SET is_featured = true WHERE video_id = $1',
				[videoId]
			);
			
			return {
				success: true,
				message: 'Featured video updated successfully'
			};
		} catch (error) {
			console.error('Error setting featured video:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
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