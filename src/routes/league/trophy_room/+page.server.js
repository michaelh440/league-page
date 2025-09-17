import { query } from '$lib/db';

export async function load() {
  // Raw rows from the view
  const awardsRows = (await query(`
    SELECT *
    FROM season_awards_view
    ORDER BY season_year DESC,
      CASE
        WHEN final_rank = 1 THEN 1
        WHEN final_rank = 2 THEN 2
        WHEN final_rank = 3 THEN 3
        ELSE 4
      END
  `)).rows;

  // Shape rows -> podiums per season
  const bySeason = new Map();
  for (const r of awardsRows) {
    if (!bySeason.has(r.season_id)) {
      bySeason.set(r.season_id, {
        season_id: r.season_id,
        season_year: r.season_year,
        awards: []
      });
    }
    bySeason.get(r.season_id).awards.push({
      award_type: r.award_type,
      team_id: r.team_id,
      team_name: r.team_name,
      manager_id: r.manager_id,
      manager_name: r.manager_name,
      logo_url: r.team_logo,
      final_rank: r.final_rank
    });
  }
  const awardsData = Array.from(bySeason.values()).sort(
    (a, b) => b.season_year - a.season_year
  );

  // Manager lookup
  const teamManagersData = (await query(`
    SELECT
      manager_id,
      COALESCE(team_alias, real_name, username) AS manager_name,
      logo_url,
      team_name_2015, team_name_2016, team_name_2017, team_name_2018, team_name_2019,
      team_name_2020, team_name_2021, team_name_2022, team_name_2023, team_name_2024,
      team_name_2025, team_name_2026, team_name_2027, team_name_2028, team_name_2029,
      team_name_2030
    FROM managers
  `)).rows;

  return { awardsData, teamManagersData };
}
