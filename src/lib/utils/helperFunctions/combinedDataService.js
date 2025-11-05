export async function getCombinedStandings(year = null) {
  const { useDatabase, currentYear } = await getDataSource(year);
  
  // For current season, return null to let existing Sleeper code handle it
  if (!useDatabase) {
    return null;
  }
  
  // For historical years, get from database
  try {
    const standingsQuery = await query(`
      WITH latest_week AS (
        SELECT MAX(week) as max_week 
        FROM team_rankings tr
        JOIN seasons s ON tr.season_id = s.season_id
        WHERE s.season_year = $1
      )
      SELECT 
        t.platform_team_id as roster_id,
        t.team_name,
        m.logo_url,
        m.username,
        tr.wins,
        tr.losses,
        tr.ties,
        tr.points_for as fpts,
        tr.points_against as fpts_against,
        tr.reg_season_rank
      FROM team_rankings tr
      CROSS JOIN latest_week lw
      JOIN managers m ON tr.team_id = m.manager_id
      JOIN teams t ON t.manager_id = m.manager_id AND t.season_id = tr.season_id
      JOIN seasons s ON tr.season_id = s.season_id
      WHERE s.season_year = $1 
        AND tr.week = lw.max_week
      ORDER BY tr.reg_season_rank
    `, [year]);
    
    return {
      year: year,
      rosters: standingsQuery.rows,
      source: 'database'
    };
  } catch (error) {
    console.error('Error fetching historical standings:', error);
    return null;
  }
}