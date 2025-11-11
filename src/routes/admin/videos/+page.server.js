import pkg from 'pg';
const { Pool } = pkg;
import { POSTGRES_URL } from '$env/static/private';

const pool = new Pool({
	connectionString: POSTGRES_URL,
	ssl: { rejectUnauthorized: false }
});

export const load = async () => {
	try {
		// Get all videos with season info
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
		
		const videosResult = await pool.query(videosQuery);
		
		// Get all seasons for the dropdown
		const seasonsQuery = `
			SELECT season_id, season_year, season_name
			FROM seasons
			ORDER BY season_year DESC
		`;
		
		const seasonsResult = await pool.query(seasonsQuery);
		
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
			const week = data.get('week');
			const isFeatured = data.get('is_featured') === 'true';
			
			// If this video is featured, unfeatured all others
			if (isFeatured) {
				await pool.query(`
					UPDATE weekly_summary_videos 
					SET is_featured = false
				`);
			}
			
			// Insert new video
			const insertQuery = `
				INSERT INTO weekly_summary_videos 
				(video_url, season_id, week, is_featured, generation_status, created_at)
				VALUES ($1, $2, $3, $4, 'completed', NOW())
				RETURNING video_id
			`;
			
			const result = await pool.query(insertQuery, [videoUrl, seasonId, week, isFeatured]);
			
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
			const isFeatured = data.get('is_featured') === 'true';
			
			// If this video is featured, unfeatured all others
			if (isFeatured) {
				await pool.query(`
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
			
			await pool.query(updateQuery, [videoUrl, seasonId, week, isFeatured, videoId]);
			
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
			
			await pool.query('DELETE FROM weekly_summary_videos WHERE video_id = $1', [videoId]);
			
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
		try {
			const data = await request.formData();
			const videoId = data.get('video_id');
			
			// Unfeatured all videos
			await pool.query('UPDATE weekly_summary_videos SET is_featured = false');
			
			// Feature the selected video
			await pool.query(
				'UPDATE weekly_summary_videos SET is_featured = true WHERE video_id = $1',
				[videoId]
			);
			
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