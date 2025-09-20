import db from '$lib/db'; // adjust to however you query Postgres

export async function load() {
  const { rows: managers } = await db.query(`
    SELECT 
      m.manager_id,
      m.name,
      m.logo_url,
      m.year_joined,
      COALESCE(m.bio, '') AS bio,
      t.team_name AS current_team,
      COALESCE(r.wins, 0) AS wins,
      COALESCE(r.losses, 0) AS losses,
      COALESCE(r.ties, 0) AS ties,
      COALESCE(ch.championships, 0) AS championships
    FROM managers m
    LEFT JOIN teams t 
      ON t.manager_id = m.manager_id
      AND t.is_current = TRUE
    LEFT JOIN manager_records r 
      ON r.manager_id = m.manager_id
    LEFT JOIN (
      SELECT manager_id, COUNT(*) AS championships
      FROM manager_awards
      WHERE award_type = 'championship'
      GROUP BY manager_id
    ) ch ON ch.manager_id = m.manager_id
    ORDER BY m.name;
  `);

  return { managers };
}
