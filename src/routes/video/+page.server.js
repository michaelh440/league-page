// src/routes/video/+page.server.js
import { query } from '$lib/db';

export async function load() {
	try {
		console.log('Loading all videos from database...');
		
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
				wsv.provider_video_id,
				wsv.generation_status,
				s.season_id,
				s.season_year,
				-- week is NULL for the non-week categories, so the fallback title has to
				-- name the segment rather than always saying "Week <null>".
				COALESCE(
					wsv.title,
					CONCAT(
						CASE wsv.category
						  WHEN 'week'       THEN CONCAT('Week ', wsv.week)
						  WHEN 'preseason'  THEN 'Preseason'
						  WHEN 'draft'      THEN 'Draft'
						  WHEN 'postseason' THEN 'Post Season'
						  ELSE 'Miscellaneous'
						END,
						' - ', s.season_year, ' Season'
					)
				) as display_title,
				COALESCE(
					wsv.description,
					CASE wsv.category
					  WHEN 'week' THEN CONCAT('Weekly recap for Week ', wsv.week, ' of the ', s.season_year, ' season')
					  ELSE CONCAT('From the ', s.season_year, ' season')
					END
				) as display_description,
				COALESCE(wsv.publish_date, wsv.created_at) as sort_date
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			WHERE wsv.video_url IS NOT NULL
			  AND wsv.generation_status = 'completed'
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

		const result = await query(videosQuery);
		
		const videos = result.rows.map(row => ({
			id: row.video_id.toString(),
			title: row.display_title,
			url: row.video_url,
			date: row.publish_date || row.sort_date.toISOString().split('T')[0],
			description: row.display_description,
			week: row.week,
			category: row.category,
			season: row.season_year,
			playlist: row.playlist,
			featured: row.is_featured || false
		}));

		console.log(`Loaded ${videos.length} videos from database`);

		return {
			videos
		};
	} catch (error) {
		console.error('Error loading videos:', error);
		return {
			videos: [],
			error: error.message
		};
	}
}