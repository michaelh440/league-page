// src/routes/api/weekly_summary_video/+server.js
import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

export async function GET({ url }) {
	try {
		const season = url.searchParams.get('season');
		const week = url.searchParams.get('week');

		console.log('GET /api/weekly_summary_video - season:', season, 'week:', week);

		if (!season || !week) {
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		// Get season_id using season_year column
		const seasonResult = await sql`
			SELECT season_id FROM seasons WHERE season_year = ${parseInt(season)}
		`;
		
		console.log('Season result:', seasonResult);

		if (seasonResult.length === 0) {
			return json({ success: false, error: `Season ${season} not found` }, { status: 404 });
		}

		const seasonId = seasonResult[0].season_id;

		// Get video
		const result = await sql`
			SELECT * FROM weekly_summary_videos
			WHERE season_id = ${seasonId} AND week = ${parseInt(week)}
		`;

		console.log('Video result:', result);

		if (result.length === 0) {
			return json({ success: true, video: null });
		}

		return json({ success: true, video: result[0] });
	} catch (error) {
		console.error('Error in weekly_summary_video GET:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function DELETE({ request }) {
	try {
		const { season, week } = await request.json();

		if (!season || !week) {
			return json({ success: false, error: 'season and week required' }, { status: 400 });
		}

		// Get season_id - try 'year' column first
		let seasonResult = await sql`
			SELECT season_id FROM seasons WHERE year = ${parseInt(season)}
		`;
		
		if (seasonResult.length === 0) {
			// Try using season_id directly as fallback
			seasonResult = await sql`
				SELECT season_id FROM seasons WHERE season_id = ${parseInt(season)}
			`;
		}

		if (seasonResult.length === 0) {
			return json({ success: false, error: 'Season not found' }, { status: 404 });
		}

		const seasonId = seasonResult[0].season_id;

		// Delete video
		await sql`
			DELETE FROM weekly_summary_videos
			WHERE season_id = ${seasonId} AND week = ${parseInt(week)}
		`;

		return json({ success: true });
	} catch (error) {
		console.error('Error in weekly_summary_video DELETE:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}