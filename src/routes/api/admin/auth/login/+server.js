import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const sql = neon(DATABASE_URL);

// Handle GET requests (returns error message)
export async function GET() {
	return json({ 
		error: 'GET method not allowed. Use POST to login.',
		endpoint: '/api/admin/auth/login',
		method: 'POST'
	}, { status: 405 });
}

// Handle POST requests (actual login)
export async function POST({ request, cookies }) {
	try {
		const body = await request.json();
		const { username, password } = body;

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

		// Same response for unknown user and wrong password, so the endpoint can't be used
		// to enumerate valid usernames.
		if (users.length === 0) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		const user = users[0];

		if (!user.is_active) {
			return json({ error: 'Account is inactive. Contact administrator.' }, { status: 403 });
		}

		const passwordMatch = await bcrypt.compare(password, user.password_hash);
		if (!passwordMatch) {
			return json({ error: 'Invalid credentials' }, { status: 401 });
		}

		if (!user.is_admin) {
			return json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
		}

		// Generate session
		const sessionId = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
		const userAgent = request.headers.get('user-agent') || 'unknown';

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

		// Set cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

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
		// Log server-side only; never return DB/driver internals to the client.
		console.error('Login error:', error.message);
		return json({ error: 'Server error during login' }, { status: 500 });
	}
}