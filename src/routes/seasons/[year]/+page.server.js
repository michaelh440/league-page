import { query } from '$lib/db';
import { error } from '@sveltejs/kit';

// One roster for one team in one week, with each player's fantasy points and NFL team.
// Points live in player_fantasy_stats; the platform join key differs by era -- Yahoo
// seasons (2015-2023) key on yahoo_player_id, Sleeper seasons (2024+) on
// sleeper_player_id -- so match on whichever the roster row carries. LEFT JOIN so a
// player with no recorded stat line (e.g. a team DEF) still renders, just without points.
const ROSTER_SQL = `
  SELECT
    wr.player_name,
    wr.position,
    wr.lineup_slot,
    wr.is_starter,
    wr.sleeper_player_id,
    wr.yahoo_player_id,
    pfs.total_fantasy_points AS points,
    pfs.nfl_team
  FROM weekly_roster wr
  LEFT JOIN player_fantasy_stats pfs
    ON pfs.season_id = wr.season_id
   AND pfs.week = wr.week
   AND ( (wr.sleeper_player_id IS NOT NULL AND pfs.sleeper_player_id = wr.sleeper_player_id)
      OR (wr.yahoo_player_id  IS NOT NULL AND pfs.yahoo_player_id  = wr.yahoo_player_id) )
  WHERE wr.season_id = $1
    AND wr.week = $2
    AND wr.team_id = $3
  ORDER BY
    CASE wr.lineup_slot
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
    wr.player_name
`;

export async function load({ params }) {
  const year = parseInt(params.year);
  
  // Validate year is a reasonable season year
  if (isNaN(year) || year < 2015 || year > 2030) {
    throw error(404, 'Season not found');
  }

  // Resolve the season. season_year is not unique -- 2023 has two rows (season_id 9 with
  // all the data, and an empty orphan 10). Prefer the season that actually has matchups,
  // otherwise the roster lookups key on the empty one and every roster comes back blank.
  const seasonResult = await query(`
    SELECT s.season_id
    FROM seasons s
    WHERE s.season_year = $1
    ORDER BY (SELECT COUNT(*) FROM matchups m WHERE m.season_id = s.season_id) DESC,
             s.season_id ASC
    LIMIT 1
  `, [year]);

  if (seasonResult.rows.length === 0) {
    throw error(404, 'Season not found');
  }

  const seasonId = seasonResult.rows[0].season_id;

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
    WHERE s.season_year = $1
    ORDER BY m.week ASC, m.matchup_id ASC
  `, [year]);

  // Group rows by week and add roster data
  const weeks = [];
  
  for (const row of result.rows) {
    let week = weeks.find(w => w.week === row.week);
    if (!week) {
      week = { week: row.week, games: [] };
      weeks.push(week);
    }

    // Get both rosters with per-player points
    const team1Roster = await query(ROSTER_SQL, [seasonId, row.week, row.team1_id]);
    const team2Roster = await query(ROSTER_SQL, [seasonId, row.week, row.team2_id]);

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
    season: year,
    weeks
  };
}