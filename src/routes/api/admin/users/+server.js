import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';

const sql = neon(DATABASE_URL);

// GET - List all users
export async function GET({ locals }) {
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
			ORDER BY created_at DESC
		`;

		return json({ users });
	} catch (error) {
		console.error('Get users error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}

// POST - Create new user
export async function POST({ request, locals }) {
	// Check authentication and admin permission
	if (!locals.user || !locals.user.is_admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const {
			username,
			email,
			password,
			role = 'manager',
			is_admin = false,
			can_edit_profile = true,
			can_view_stats = true,
			can_manage_seasons = false,
			can_manage_managers = false,
			is_active = true
		} = data;

		// Validate required fields
		if (!username || !email || !password) {
			return json({ error: 'Username, email, and password are required' }, { status: 400 });
		}

		// Validate password length
		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}

		// Check if username already exists
		const existingUsers = await sql`
			SELECT user_id FROM users WHERE username = ${username}
		`;

		if (existingUsers.length > 0) {
			return json({ error: 'Username already exists' }, { status: 409 });
		}

		// Check if email already exists
		const existingEmails = await sql`
			SELECT user_id FROM users WHERE email = ${email}
		`;

		if (existingEmails.length > 0) {
			return json({ error: 'Email already exists' }, { status: 409 });
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 10);

		// Create user
		const newUsers = await sql`
			INSERT INTO users (
				username,
				password_hash,
				email,
				role,
				is_admin,
				can_edit_profile,
				can_view_stats,
				can_manage_seasons,
				can_manage_managers,
				is_active
			) VALUES (
				${username},
				${passwordHash},
				${email},
				${role},
				${is_admin},
				${can_edit_profile},
				${can_view_stats},
				${can_manage_seasons},
				${can_manage_managers},
				${is_active}
			)
			RETURNING user_id, username, email, role, is_admin, is_active, created_at
		`;

		return json({ 
			success: true,
			user: newUsers[0]
		}, { status: 201 });
	} catch (error) {
		console.error('Create user error:', error);
		return json({ error: 'Server error' }, { status: 500 });
	}
}