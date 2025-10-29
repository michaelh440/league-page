import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const sql = neon(DATABASE_URL);

export async function POST({ request, cookies }) {
	try {
		const { username, password } = await request.json();

		// Validate input
		if (!username || !password) {
			return json({ error: 'Username and password are required' }, { status: 400 });
		}

		// Find user by username
		const users = await sql`
			SELECT 
				user_id,
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
			FROM users
			WHERE username = ${username}
			LIMIT 1
		`;

		const user = users[0];

		// Check if user exists
		if (!user) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		// Check if user is active
		if (!user.is_active) {
			return json({ error: 'Account is inactive. Contact administrator.' }, { status: 403 });
		}

		// Verify password
		const passwordMatch = await bcrypt.compare(password, user.password_hash);
		if (!passwordMatch) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		// Check if user has admin access
		if (!user.is_admin) {
			return json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
		}

		// Generate session ID
		const sessionId = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Get request info
		const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
		const userAgent = request.headers.get('user-agent') || 'unknown';

		// Create session in database
		await sql`
			INSERT INTO sessions (
				session_id,
				user_id,
				expires_at,
				ip_address,
				user_agent
			) VALUES (
				${sessionId},
				${user.user_id},
				${expiresAt.toISOString()},
				${ipAddress},
				${userAgent}
			)
		`;

		// Set session cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days in seconds
		});

		// Return success (don't send password_hash to client)
		return json({
			success: true,
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: user.role,
				is_admin: user.is_admin,
				can_edit_profile: user.can_edit_profile,
				can_view_stats: user.can_view_stats,
				can_manage_seasons: user.can_manage_seasons,
				can_manage_managers: user.can_manage_managers
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Server error during login' }, { status: 500 });
	}
}
