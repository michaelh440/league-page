import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

export async function POST({ cookies }) {
	try {
		const sessionId = cookies.get('session');

		if (sessionId) {
			// Delete session from database
			await sql`
				DELETE FROM sessions
				WHERE session_id = ${sessionId}
			`;
		}

		// Clear session cookie
		cookies.delete('session', { path: '/' });

		return json({ success: true });
	} catch (error) {
		console.error('Logout error:', error);
		// Still clear cookie even if database deletion fails
		cookies.delete('session', { path: '/' });
		return json({ success: true });
	}
}
