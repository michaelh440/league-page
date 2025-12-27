// src/routes/api/admin/stats/weekly_summaries/+server.js
import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

export async function GET({ locals }) {
	if (!locals.user || !locals.user.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await sql`SELECT COUNT(*) as count FROM weekly_summaries`;
		return json({ count: parseInt(result[0].count) });
	} catch (error) {
		console.error('Stats error:', error);
		return json({ error: 'Failed to fetch stats' }, { status: 500 });
	}
}
