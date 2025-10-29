// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				user_id: number;
				username: string;
				email: string;
				role: string;
				is_admin: boolean;
				can_edit_profile: boolean;
				can_view_stats: boolean;
				can_manage_seasons: boolean;
				can_manage_managers: boolean;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
