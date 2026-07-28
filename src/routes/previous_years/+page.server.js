// src/routes/previous_years/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // "Previous seasons" = completed seasons only: everything except the current (active)
  // season, and only seasons that actually have games. Data-driven so the current season
  // drops off automatically each year instead of being hardcoded.
  const result = await query(`
    SELECT DISTINCT s.season_year
    FROM seasons s
    WHERE s.is_active = false
      AND EXISTS (SELECT 1 FROM matchups m WHERE m.season_id = s.season_id)
    ORDER BY s.season_year DESC
  `);

  return { seasons: result.rows.map((r) => r.season_year) };
}
