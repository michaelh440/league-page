// src/routes/admin/videos/+page.server.js
import { query } from '$lib/db';

export const load = async () => {
	console.log('========== ADMIN VIDEOS PAGE LOAD ==========');
	
	try {
		// Test basic database connection
		console.log('Testing database connection...');
		const testResult = await query('SELECT NOW() as current_time');
		console.log('Database connection successful:', testResult.rows[0]);
		
		// Check if tables exist
		console.log('Checking if weekly_summary_videos table exists...');
		const tableCheck = await query(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'weekly_summary_videos'
			);
		`);
		console.log('weekly_summary_videos table exists:', tableCheck.rows[0].exists);
		
		console.log('Checking if seasons table exists...');
		const seasonsTableCheck = await query(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'seasons'
			);
		`);
		console.log('seasons table exists:', seasonsTableCheck.rows[0].exists);
		
		// Get all videos with season info
		console.log('Attempting to load videos...');
		const videosQuery = `
			SELECT 
				wsv.video_id,
				wsv.video_url,
				wsv.week,
				wsv.is_featured,
				wsv.generation_status,
				wsv.created_at,
				s.season_id,
				s.season_year,
				CONCAT('Week ', wsv.week, ' - ', s.season_year, ' Season Highlights') as title
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			ORDER BY s.season_year DESC, wsv.week DESC
		`;
		
		const videosResult = await query(videosQuery);
		console.log('Videos query result:', {
			rowCount: videosResult.rows.length,
			rows: videosResult.rows
		});
		
		// Get all seasons for the dropdown
		console.log('Attempting to load seasons...');
		const seasonsQuery = `
			SELECT season_id, season_year, season_name
			FROM seasons
			ORDER BY season_year DESC
		`;
		
		const seasonsResult = await query(seasonsQuery);
		console.log('Seasons query result:', {
			rowCount: seasonsResult.rows.length,
			rows: seasonsResult.rows
		});
		
		console.log('========== RETURNING DATA ==========');
		console.log('Videos count:', videosResult.rows.length);
		console.log('Seasons count:', seasonsResult.rows.length);
		
		return {
			videos: videosResult.rows,
			seasons: seasonsResult.rows
		};
	} catch (error) {
		console.error('========== ERROR IN ADMIN VIDEOS LOAD ==========');
		console.error('Error message:', error.message);
		console.error('Error stack:', error.stack);
		console.error('Full error:', error);
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
		console.log('========== ADD VIDEO ACTION ==========');
		try {
			const data = await request.formData();
			const videoUrl = data.get('video_url');
			const seasonId = data.get('season_id');
			const week = data.get('week');
			const isFeatured = data.get('is_featured') === 'true';
			
			console.log('Form data:', { videoUrl, seasonId, week, isFeatured });
			
			// If this video is featured, unfeatured all others
			if (isFeatured) {
				console.log('Unfeaturing other videos...');
				await query(`
					UPDATE weekly_summary_videos 
					SET is_featured = false
				`);
			}
			
			// Insert new video
			console.log('Inserting new video...');
			const insertQuery = `
				INSERT INTO weekly_summary_videos 
				(video_url, season_id, week, is_featured, generation_status, created_at)
				VALUES ($1, $2, $3, $4, 'completed', NOW())
				RETURNING video_id
			`;
			
			const result = await query(insertQuery, [videoUrl, seasonId, week, isFeatured]);
			console.log('Insert result:', result.rows[0]);
			
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
		console.log('========== UPDATE VIDEO ACTION ==========');
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			const videoUrl = data.get('video_url');
			const seasonId = data.get('season_id');
			const week = data.get('week');
			const isFeatured = data.get('is_featured') === 'true';
			
			console.log('Update data:', { videoId, videoUrl, seasonId, week, isFeatured });
			
			// If this video is featured, unfeatured all others
			if (isFeatured) {
				await query(`
					UPDATE weekly_summary_videos 
					SET is_featured = false
					WHERE video_id != $1
				`, [videoId]);
			}
			
			// Update video
			const updateQuery = `
				UPDATE weekly_summary_videos
				SET video_url = $1, season_id = $2, week = $3, is_featured = $4
				WHERE video_id = $5
			`;
			
			await query(updateQuery, [videoUrl, seasonId, week, isFeatured, videoId]);
			console.log('Video updated successfully');
			
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
		console.log('========== DELETE VIDEO ACTION ==========');
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			
			console.log('Deleting video ID:', videoId);
			await query('DELETE FROM weekly_summary_videos WHERE video_id = $1', [videoId]);
			console.log('Video deleted successfully');
			
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
	
	// Set featured video
	setFeatured: async ({ request }) => {
		console.log('========== SET FEATURED VIDEO ACTION ==========');
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			
			console.log('Setting featured video ID:', videoId);
			
			// Unfeatured all videos
			await query('UPDATE weekly_summary_videos SET is_featured = false');
			
			// Feature the selected video
			await query(
				'UPDATE weekly_summary_videos SET is_featured = true WHERE video_id = $1',
				[videoId]
			);
			
			console.log('Featured video updated successfully');
			
			return {
				success: true,
				message: 'Featured video updated successfully'
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