// src/routes/seasons/2024/playoffs/+page.server.js
import { query } from '$lib/db';

export async function load() {
  // Get reg season length
  const leagueRes = await query(`
    SELECT l.reg_season_length
    FROM leagues l
    JOIN seasons s ON l.league_id = s.league_id
    WHERE s.season_year = 2024
  `);
  const regSeasonLength = leagueRes.rows[0].reg_season_length;
  const playoffsStart = regSeasonLength + 1;

  // Pull playoff matchups w/ logos
  const result = await query(`
    SELECT 
      p.week,
      mt1.team_name AS team1,
      mt1.logo_url AS team1_logo,
      p.team1_score AS score1,
      mt2.team_name AS team2,
      mt2.logo_url AS team2_logo,
      p.team2_score AS score2,
      p.bracket
    FROM playoffs p
    JOIN seasons s ON p.season_id = s.season_id
    JOIN manager_team_names mt1 
      ON p.team1_id = mt1.manager_id 
     AND s.season_year = mt1.season_year
    JOIN manager_team_names mt2 
      ON p.team2_id = mt2.manager_id 
     AND s.season_year = mt2.season_year
    WHERE s.season_year = 2024
    ORDER BY p.week ASC, p.playoff_id ASC
  `);

  // Structure into championship/consolation brackets
  const bracketData = {
    championship: { week15: [], week16: [] },
    consolation: { week15: [], week16: [] }
  };

  result.rows.forEach((row) => {
    const weekKey = row.week === playoffsStart ? 'week15' : 'week16';
    const isChamp = row.bracket === 'championship';

    const game = {
      label: isChamp
        ? (weekKey === 'week15'
            ? `Semi Final ${bracketData.championship.week15.length + 1}`
            : bracketData.championship.week16.length === 0
              ? 'Championship'
              : '3rd Place Game')
        : (weekKey === 'week15'
            ? `Semi Final ${bracketData.consolation.week15.length + 3}`
            : bracketData.consolation.week16.length === 0
              ? '5th Place Game'
              : '7th Place Game'),
      team1: row.team1,
      team1_logo: row.team1_logo,
      score1: row.score1,
      team2: row.team2,
      team2_logo: row.team2_logo,
      score2: row.score2
    };

    if (isChamp) {
      bracketData.championship[weekKey].push(game);
    } else {
      bracketData.consolation[weekKey].push(game);
    }
  });

  return {
    season: 2024,
    ...bracketData
  };
}
