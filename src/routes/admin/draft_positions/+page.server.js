// src/routes/admin/draft_positions/+page.server.js
// Lists draft picks whose position couldn't be resolved (name-match/defense detection
// failed) so an admin can assign one by hand. Writes draft_picks.position, which the
// draft_picks_with_details view prefers over the automatic lookup.
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

export async function load() {
	try {
		const picks = (
			await query(`
				SELECT dp.pick_id,
				       s.season_year,
				       s.platform,
				       dp.round_number,
				       dp.pick_number,
				       dp.pick_in_round,
				       dp.player_name,
				       dp.player_nfl_team,
				       dp.manager_name
				FROM draft_picks_with_details dp
				JOIN drafts d ON d.draft_id = dp.draft_id
				JOIN seasons s ON s.season_id = d.season_id
				WHERE dp.position IS NULL
				ORDER BY s.season_year DESC, dp.pick_number
			`)
		).rows;

		return { picks, positions: POSITIONS };
	} catch (error) {
		console.error('Error loading unpositioned draft picks:', error);
		return { picks: [], positions: POSITIONS, error: error.message };
	}
}

export const actions = {
	assign: async ({ request }) => {
		const data = await request.formData();
		const pickId = data.get('pick_id');
		const position = data.get('position');

		if (!pickId || !position) {
			return fail(400, { success: false, error: 'Missing pick or position' });
		}
		if (!POSITIONS.includes(position)) {
			return fail(400, { success: false, error: `Invalid position: ${position}` });
		}

		try {
			await query('UPDATE draft_picks SET position = $1 WHERE pick_id = $2', [position, pickId]);
			return { success: true, pick_id: Number(pickId), position };
		} catch (error) {
			console.error('Error assigning draft position:', error);
			return fail(500, { success: false, error: error.message });
		}
	}
};
