// src/routes/seasons/2018/+page.server.js
import { query } from '$lib/db';

export async function load() {
  const result = await query(`
    SELECT 
      s.season_year,
      m.week,
      mt1.team_name AS team1,
      mt1.logo_url AS team1_logo,
      m.team1_score AS score1,
      mt2.team_name AS team2,
      mt2.logo_url AS team2_logo,
      m.team2_score AS score2
    FROM matchups m
    JOIN seasons s ON m.season_id = s.season_id
    JOIN manager_team_names mt1 
      ON m.team1_id = mt1.manager_id 
     AND s.season_year = mt1.season_year
    JOIN manager_team_names mt2 
      ON m.team2_id = mt2.manager_id 
     AND s.season_year = mt2.season_year
    WHERE s.season_year = 2018
    ORDER BY m.week ASC, m.matchup_id ASC
  `);

  // Group rows by week
  const weeks = result.rows.reduce((acc, row) => {
    let week = acc.find(w => w.week === row.week);
    if (!week) {
      week = { week: row.week, games: [] };
      acc.push(week);
    }
    week.games.push({
      team1: row.team1,
      team1_logo: row.team1_logo,
      score1: row.score1,
      team2: row.team2,
      team2_logo: row.team2_logo,
      score2: row.score2
    });
    return acc;
  }, []);

  return {
    season: 2018,
    weeks
  };
}

