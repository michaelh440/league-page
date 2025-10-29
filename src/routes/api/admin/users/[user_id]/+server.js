import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';

const sql = neon(DATABASE_URL);

// GET - Get single user
export async function GET({ params, locals }) {
	// Check authentication and admin permission
	if (!locals.user || !locals.user.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const users = await sql`
			SELECT 
				user_id,
				username,
				email,
				role,
				is_admin,
				can_edit_profile,
				can_view_stats,
				can_manage_seasons,
				can_manage_managers,
				is_active,
				created_at
			FROM users
			WHERE user_id = ${params.user_id}
			LIMIT 1
		`;

		if (users.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ user: users[0] });
	} catch (error) {
		console.error('Get user error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}

// PUT - Update user
export async function PUT({ params, request, locals }) {
	// Check authentication and admin permission
	if (!locals.user || !locals.user.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const {
			email,
			password,
			role,
			is_admin,
			can_edit_profile,
			can_view_stats,
			can_manage_seasons,
			can_manage_managers,
			is_active
		} = data;

		// Check if user exists
		const existingUsers = await sql`
			SELECT user_id FROM users WHERE user_id = ${params.user_id}
		`;

		if (existingUsers.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Prevent admin from deactivating themselves
		if (params.user_id === locals.user.user_id && is_active === false) {
			return json({ error: 'Cannot deactivate your own account' }, { status: 400 });
		}

		// Build update query
		if (password && password.length > 0) {
			// Validate password length
			if (password.length < 8) {
				return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
			}

			// Update with new password
			const passwordHash = await bcrypt.hash(password, 10);
			
			await sql`
				UPDATE users
				SET 
					email = ${email},
					password_hash = ${passwordHash},
					role = ${role},
					is_admin = ${is_admin},
					can_edit_profile = ${can_edit_profile},
					can_view_stats = ${can_view_stats},
					can_manage_seasons = ${can_manage_seasons},
					can_manage_managers = ${can_manage_managers},
					is_active = ${is_active}
				WHERE user_id = ${params.user_id}
			`;
		} else {
			// Update without changing password
			await sql`
				UPDATE users
				SET 
					email = ${email},
					role = ${role},
					is_admin = ${is_admin},
					can_edit_profile = ${can_edit_profile},
					can_view_stats = ${can_view_stats},
					can_manage_seasons = ${can_manage_seasons},
					can_manage_managers = ${can_manage_managers},
					is_active = ${is_active}
				WHERE user_id = ${params.user_id}
			`;
		}

		// Get updated user
		const updatedUsers = await sql`
			SELECT 
				user_id,
				username,
				email,
				role,
				is_admin,
				can_edit_profile,
				can_view_stats,
				can_manage_seasons,
				can_manage_managers,
				is_active,
				created_at
			FROM users
			WHERE user_id = ${params.user_id}
		`;

		return json({ 
			success: true,
			user: updatedUsers[0]
		});
	} catch (error) {
		console.error('Update user error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}

// DELETE - Delete user
export async function DELETE({ params, locals }) {
	// Check authentication and admin permission
	if (!locals.user || !locals.user.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Prevent admin from deleting themselves
		if (params.user_id === locals.user.user_id) {
			return json({ error: 'Cannot delete your own account' }, { status: 400 });
		}

		// Check if user exists
		const existingUsers = await sql`
			SELECT user_id FROM users WHERE user_id = ${params.user_id}
		`;

		if (existingUsers.length === 0) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Delete user's sessions first
		await sql`
			DELETE FROM sessions WHERE user_id = ${params.user_id}
		`;

		// Delete user
		await sql`
			DELETE FROM users WHERE user_id = ${params.user_id}
		`;

		return json({ 
			success: true,
			message: 'User deleted successfully'
		});
	} catch (error) {
		console.error('Delete user error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}