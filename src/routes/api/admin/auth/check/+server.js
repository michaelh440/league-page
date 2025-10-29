import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
	// Check if user is authenticated and is admin
	if (locals.user && locals.user.is_admin) {
		return json({
			authenticated: true,
			user: {
				user_id: locals.user.user_id,
				username: locals.user.username,
				email: locals.user.email,
				role: locals.user.role,
				is_admin: locals.user.is_admin,
				permissions: {
					can_edit_profile: locals.user.can_edit_profile,
					can_view_stats: locals.user.can_view_stats,
					can_manage_seasons: locals.user.can_manage_seasons,
					can_manage_managers: locals.user.can_manage_managers
				}
			}
		});
	}

	return json({ authenticated: false }, { status: 401 });
}
