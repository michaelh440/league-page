import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';

const sql = neon(DATABASE_URL);

export async function POST({ request, locals }) {
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { currentPassword, newPassword } = await request.json();

		// Validate input
		if (!currentPassword || !newPassword) {
			return json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 8) {
			return json({ error: 'New password must be at least 8 characters' }, { status: 400 });
		}

		// Get current user's password hash
		const users = await sql`
			SELECT user_id, password_hash
			FROM users
			WHERE user_id = ${locals.user.user_id}
			LIMIT 1
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

		// Update password (no updated_at column)
		await sql`
			UPDATE users
			SET password_hash = ${newPasswordHash}
			WHERE user_id = ${locals.user.user_id}
		`;

		console.log('Password updated successfully for user:', locals.user.user_id);

		return json({
			success: true,
			message: 'Password changed successfully'
		});
	} catch (error) {
		console.error('Change password error:', error);
		return json({ 
			error: 'Server error',
			details: error.message 
		}, { status: 500 });
	}
}