// src/routes/seasons/2015/+page.server.js
import { query } from '$lib/db';

export async function load() {
  const result = await query(`
    SELECT 
      s.season_year,
      m.week,
      t1.team_name AS team1,
      m.team1_score AS score1,
      t2.team_name AS team2,
      m.team2_score AS score2,
      m.matchup_id
    FROM matchups m
    JOIN seasons s ON m.season_id = s.season_id
    JOIN teams t1 ON m.team1_id = t1.team_id
    JOIN teams t2 ON m.team2_id = t2.team_id
    WHERE s.season_year = 2015
    ORDER BY m.week ASC, m.matchup_id ASC
  `);

  console.log('Season 2015 query result:', result.rows);

  // group results by week
  const weeks = result.rows.reduce((acc, row) => {
    let week = acc.find(w => w.week === row.week);
    if (!week) {
      week = { week: row.week, games: [] };
      acc.push(week);
    }
    week.games.push({
      team1: row.team1,
      score1: row.score1,
      team2: row.team2,
      score2: row.score2
    });
    return acc;
  }, []);

  console.log('Season 2015 weeks object:', weeks);

  return {
    season: 2015,
    weeks
  };
}
