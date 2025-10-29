import { redirect } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Get session cookie
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		try {
			// Verify session in database
			const sessions = await sql`
				SELECT 
					s.session_id,
					s.user_id,
					s.expires_at,
					u.user_id,
					u.username,
					u.email,
					u.role,
					u.is_admin,
					u.can_edit_profile,
					u.can_view_stats,
					u.can_manage_seasons,
					u.can_manage_managers,
					u.is_active
				FROM sessions s
				JOIN users u ON s.user_id = u.user_id
				WHERE s.session_id = ${sessionId}
				  AND s.expires_at > NOW()
				  AND u.is_active = TRUE
				LIMIT 1
			`;

			const session = sessions[0];

			if (session) {
				// Attach user to locals
				event.locals.user = {
					user_id: session.user_id,
					username: session.username,
					email: session.email,
					role: session.role,
					is_admin: session.is_admin,
					can_edit_profile: session.can_edit_profile,
					can_view_stats: session.can_view_stats,
					can_manage_seasons: session.can_manage_seasons,
					can_manage_managers: session.can_manage_managers
				};
			} else {
				// Session invalid or expired, clear cookie
				event.cookies.delete('session', { path: '/' });
			}
		} catch (error) {
			console.error('Session verification error:', error);
			// On error, clear cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	// Check if accessing admin routes
	if (event.url.pathname.startsWith('/admin')) {
		// Allow login page without authentication
		if (event.url.pathname === '/admin/login') {
			// If already logged in, redirect to admin dashboard
			if (event.locals.user && event.locals.user.is_admin) {
				throw redirect(303, '/admin');
			}
		} else {
			// All other admin routes require authentication
			if (!event.locals.user || !event.locals.user.is_admin) {
				throw redirect(303, '/admin/login');
			}
		}
	}

	return resolve(event);
}
