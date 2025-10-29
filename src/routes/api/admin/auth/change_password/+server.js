import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST({ request, cookies }) {
	try {
		// Check if user is authenticated
		const sessionId = cookies.get('session');
		if (!sessionId) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Get session from database
		const sessions = await sql`
			SELECT user_id, expires_at 
			FROM sessions 
			WHERE session_id = ${sessionId}
		`;

		if (sessions.length === 0) {
			return json({ error: 'Invalid session' }, { status: 401 });
		}

		const session = sessions[0];

		// Check if session is expired
		if (new Date(session.expires_at) < new Date()) {
			return json({ error: 'Session expired' }, { status: 401 });
		}

		// Get request body
		const { currentPassword, newPassword } = await request.json();

		if (!currentPassword || !newPassword) {
			return json(
				{ error: 'Current password and new password are required' },
				{ status: 400 }
			);
		}

		if (newPassword.length < 8) {
			return json(
				{ error: 'New password must be at least 8 characters' },
				{ status: 400 }
			);
		}

		// Get user's current password hash
		const users = await sql`
			SELECT user_id, password_hash 
			FROM users 
			WHERE user_id = ${session.user_id}
		`;

		if (users.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const user = users[0];

		// Verify current password
		const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

		if (!passwordMatch) {
			return json({ error: 'Current password is incorrect' }, { status: 401 });
		}

		// Hash new password
		const newPasswordHash = await bcrypt.hash(newPassword, 10);

		// Update password in database
		await sql`
			UPDATE users 
			SET password_hash = ${newPasswordHash},
				updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ${user.user_id}
		`;

		return json({
			success: true,
			message: 'Password changed successfully'
		});
	} catch (error) {
		console.error('Change password error:', error);
		return json(
			{ error: 'An error occurred while changing password' },
			{ status: 500 }
		);
	}
}
