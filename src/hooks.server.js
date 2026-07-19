import { redirect } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const sql = neon(DATABASE_URL);

export async function handle({ event, resolve }) {
	const sessionId = event.cookies.get('session');

	if (sessionId) {
		try {
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
				event.cookies.delete('session', { path: '/' });
			}
		} catch (error) {
			console.error('Session verification error:', error);
			event.cookies.delete('session', { path: '/' });
		}
	}

	// Check if accessing admin routes
	if (event.url.pathname.startsWith('/admin')) {
		if (event.url.pathname === '/admin/login') {
			if (event.locals.user && event.locals.user.is_admin) {
				throw redirect(303, '/admin');
			}
		} else {
			if (!event.locals.user || !event.locals.user.is_admin) {
				throw redirect(303, '/admin/login');
			}
		}
	}

	// Gate the admin API surface. hooks only guards /admin page routes above; API routes
	// live under /api and were previously unauthenticated, so any anonymous caller could
	// hit production-mutating endpoints (process_staging_week, process_playoff_week,
	// populate_historical_rankings, rebuild_streaks, admin/seasons, ...). Require an admin
	// session for those. Public read endpoints (blog, version, player/news fetches, and the
	// GET side of weekly_summary_text used by the public matchups page) are excluded.
	if (isAdminOnlyApi(event.url.pathname, event.request.method)) {
		if (!event.locals.user?.is_admin) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
	}

	return resolve(event);
}

// Endpoints not under /api/admin/ that still perform admin reads, pipeline work, staging,
// content generation, or mutations. Verified against every /api caller in the app: none of
// these are hit from public pages.
const ADMIN_API_PATHS = [
	'/api/ai_prompts',
	'/api/archive_playoff',
	'/api/archive_rosters_stats',
	'/api/check_archived_data',
	'/api/draft_status',
	'/api/generate_summary',
	'/api/generate_weekly_summary_video',
	'/api/heygen_avatars',
	'/api/heygen_voices',
	'/api/import_sleeper_week',
	'/api/playoff_status',
	'/api/populate_historical_rankings',
	'/api/process_playoff_week',
	'/api/process_staging_draft',
	'/api/process_staging_week',
	'/api/production_week',
	'/api/rebuild_streaks',
	'/api/sleeper-status',
	'/api/stage_draft',
	'/api/stage_playoff_matchups',
	'/api/staging_preview',
	'/api/test_archive',
	'/api/test_combined',
	'/api/test_db'
];

function isAdminOnlyApi(pathname, method) {
	// The whole /api/admin/* namespace, except the auth endpoints needed to log in/out/check.
	if (pathname.startsWith('/api/admin/')) {
		return !pathname.startsWith('/api/admin/auth/');
	}
	if (ADMIN_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
		return true;
	}
	// Mixed endpoints: the GET is public, only the mutating methods are admin.
	// weekly_summary_text GET feeds the public matchups page; POST upserts summary text.
	// weekly_summary_video GET is unused publicly; DELETE removes a video.
	if (
		(pathname === '/api/weekly_summary_text' || pathname === '/api/weekly_summary_video') &&
		method !== 'GET'
	) {
		return true;
	}
	return false;
}