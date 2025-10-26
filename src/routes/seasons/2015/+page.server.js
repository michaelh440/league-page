// src/routes/seasons/2015/+page.server.js
import { query } from '$lib/db';

export async function load() {
  const result = await query(`
    SELECT 
      s.season_year,
      m.week,
      m.team1_id,
      mt1.team_name AS team1,
      mt1.logo_url AS team1_logo,
      m.team1_score AS score1,
      m.team2_id,
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
    WHERE s.season_year = 2015
    ORDER BY m.week ASC, m.matchup_id ASC
  `);

  // Get season_id for roster queries
  const seasonResult = await query(`
    SELECT season_id FROM seasons WHERE season_year = 2015
  `);
  const seasonId = seasonResult.rows[0]?.season_id;

  // Group rows by week and add roster data
  const weeks = [];
  
  for (const row of result.rows) {
    let week = weeks.find(w => w.week === row.week);
    if (!week) {
      week = { week: row.week, games: [] };
      weeks.push(week);
    }

    // Get team1 roster
    const team1Roster = await query(`
      SELECT 
        player_name,
        position,
        lineup_slot,
        is_starter,
        yahoo_player_id
      FROM weekly_roster
      WHERE season_id = $1 
        AND week = $2 
        AND team_id = $3
      ORDER BY 
        CASE lineup_slot
          WHEN 'QB' THEN 1
          WHEN 'RB' THEN 2
          WHEN 'WR' THEN 3
          WHEN 'TE' THEN 4
          WHEN 'FLEX' THEN 5
          WHEN 'K' THEN 6
          WHEN 'DEF' THEN 7
          WHEN 'BN' THEN 8
          WHEN 'IR' THEN 9
          ELSE 10
        END,
        player_name
    `, [seasonId, row.week, row.team1_id]);

    // Get team2 roster
    const team2Roster = await query(`
      SELECT 
        player_name,
        position,
        lineup_slot,
        is_starter,
        yahoo_player_id
      FROM weekly_roster
      WHERE season_id = $1 
        AND week = $2 
        AND team_id = $3
      ORDER BY 
        CASE lineup_slot
          WHEN 'QB' THEN 1
          WHEN 'RB' THEN 2
          WHEN 'WR' THEN 3
          WHEN 'TE' THEN 4
          WHEN 'FLEX' THEN 5
          WHEN 'K' THEN 6
          WHEN 'DEF' THEN 7
          WHEN 'BN' THEN 8
          WHEN 'IR' THEN 9
          ELSE 10
        END,
        player_name
    `, [seasonId, row.week, row.team2_id]);

    week.games.push({
      team1: row.team1,
      team1_logo: row.team1_logo,
      score1: row.score1,
      team2: row.team2,
      team2_logo: row.team2_logo,
      score2: row.score2,
      team1_roster: team1Roster.rows,
      team2_roster: team2Roster.rows
    });
  }

  return {
    season: 2015,
    weeks
  };
}