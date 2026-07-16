// src/routes/api/rebuild_streaks/+server.js
//
// manager_career_streaks is a precomputed table rebuilt by populate_all_streaks_from_history().
// That function writes directly, so there's no "compute without writing" path — instead the
// preview runs the rebuild inside a transaction, reads the result, and ROLLS BACK, leaving
// the table untouched.
//
//   GET  -> PREVIEW: what a rebuild would produce + what's stored now (no changes committed)
//   POST -> COMMIT:  actually rebuild
import { json } from '@sveltejs/kit';
import { query, withClient } from '$lib/db';

const STREAKS_SQL = `
	SELECT mcs.manager_id,
	       m.username AS manager_name,
	       mcs.career_total_wins, mcs.career_total_losses, mcs.career_total_ties,
	       mcs.all_time_longest_win_streak, mcs.all_time_longest_lose_streak,
	       mcs.all_time_current_streak_type, mcs.all_time_current_streak_length
	FROM manager_career_streaks mcs
	JOIN managers m ON m.manager_id = mcs.manager_id
	ORDER BY mcs.career_total_wins DESC NULLS LAST, manager_name
`;

export async function GET() {
	try {
		const current = await query(STREAKS_SQL);
		const currentMeta = await query(`SELECT MAX(last_updated)::text AS last_updated FROM manager_career_streaks`);

		// Rebuild inside a transaction, read it, then roll back so nothing is committed.
		const rows = await withClient(async (client) => {
			try {
				await client.query('BEGIN');
				await client.query('SELECT populate_all_streaks_from_history()');
				const preview = await client.query(STREAKS_SQL);
				await client.query('ROLLBACK');
				return preview.rows;
			} catch (err) {
				await client.query('ROLLBACK').catch(() => {});
				throw err;
			}
		});

		return json({
			success: true,
			preview: rows,
			current: current.rows,
			lastUpdated: currentMeta.rows[0]?.last_updated ?? null
		});
	} catch (error) {
		console.error('Error previewing streak rebuild:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}

export async function POST() {
	try {
		await query(`SELECT populate_all_streaks_from_history()`);
		const rows = await query(STREAKS_SQL);
		const meta = await query(`SELECT MAX(last_updated)::text AS last_updated FROM manager_career_streaks`);
		return json({
			success: true,
			managers: rows.rowCount,
			rows: rows.rows,
			lastUpdated: meta.rows[0]?.last_updated ?? null
		});
	} catch (error) {
		console.error('Error rebuilding streaks:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
