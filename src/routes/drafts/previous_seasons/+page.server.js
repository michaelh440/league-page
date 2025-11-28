// +page.server.js
/*import { query } from '$lib/db';

export async function load({ url }) {
  const selectedSeason = url.searchParams.get('season');

  // Get all available seasons that have draft data
  const availableSeasons = (await query(`
    SELECT DISTINCT s.season_year, s.season_id
    FROM seasons s
    JOIN drafts d ON s.season_id = d.draft_id
    ORDER BY s.season_year DESC
  `)).rows;

  // Get position colors for legend
  const positionColors = (await query(`
    SELECT position, color_hex, background_color
    FROM position_colors
    ORDER BY 
      CASE position 
        WHEN 'QB' THEN 1
        WHEN 'RB' THEN 2  
        WHEN 'WR' THEN 3
        WHEN 'TE' THEN 4
        WHEN 'K' THEN 5
        WHEN 'DEF' THEN 6
        ELSE 7
      END
  `)).rows;

  // If no season selected, return basic data
  if (!selectedSeason) {
    return {
      availableSeasons,
      positionColors,
      selectedSeason: null,
      draftInfo: null,
      participants: [],
      draftPicks: []
    };
  }

  // Get draft info for selected season
  const draftInfo = (await query(`
    SELECT d.*, s.season_year
    FROM drafts d
    JOIN seasons s ON d.season_id = s.season_id
    WHERE s.season_year = $1
  `, [selectedSeason])).rows[0];

  if (!draftInfo) {
    return {
      availableSeasons,
      positionColors,
      selectedSeason,
      draftInfo: null,
      participants: [],
      draftPicks: []
    };
  }

  // Get draft participants (managers in draft order)
  const participants = (await query(`
    SELECT 
      part.draft_position,
      mgr.manager_id,
      mgr.username AS manager_name,
      mgr.logo_url AS manager_logo,
      t.team_name
    FROM draft_participants part
    JOIN managers mgr ON part.manager_id = mgr.manager_id
    JOIN teams t ON part.team_id = t.team_id
    WHERE part.draft_id = $1
    ORDER BY part.draft_position
  `, [draftInfo.draft_id])).rows;

  // Get all draft picks for the grid
 const draftPicks = (await query(`
  SELECT 
    dp.pick_number,
    dp.round_number,
    dp.pick_in_round,
    dp.manager_id,
    p.player_name,
    p.position,
    dp.player_nfl_team,  -- Changed from p.nfl_team
    pc.background_color,
    pc.color_hex
  FROM draft_picks dp
  JOIN nfl_players p ON dp.player_id = p.player_id
  JOIN position_colors pc ON p.position = pc.position
  WHERE dp.draft_id = $1
  ORDER BY dp.pick_number
`, [draftInfo.draft_id])).rows;

  return {
    availableSeasons,
    positionColors,
    selectedSeason,
    draftInfo,
    participants,
    draftPicks
  };
}*/

// +page.server.js
import { query } from '$lib/db';

export async function load({ url }) {
  const selectedSeason = url.searchParams.get('season');

  // Get all available seasons that have draft data
  const availableSeasons = (await query(`
    SELECT DISTINCT s.season_year, s.season_id
    FROM seasons s
    JOIN drafts d ON s.season_id = d.draft_id
    ORDER BY s.season_year DESC
  `)).rows;

  // Get position colors for legend
  const positionColors = (await query(`
    SELECT position, color_hex, background_color
    FROM position_colors
    ORDER BY 
      CASE position 
        WHEN 'QB' THEN 1
        WHEN 'RB' THEN 2  
        WHEN 'WR' THEN 3
        WHEN 'TE' THEN 4
        WHEN 'K' THEN 5
        WHEN 'DEF' THEN 6
        ELSE 7
      END
  `)).rows;

  // If no season selected, return basic data
  if (!selectedSeason) {
    return {
      availableSeasons,
      positionColors,
      selectedSeason: null,
      draftInfo: null,
      participants: [],
      draftPicks: []
    };
  }

  // Get draft info for selected season
  const draftInfo = (await query(`
    SELECT d.*, s.season_year
    FROM drafts d
    JOIN seasons s ON d.season_id = s.season_id
    WHERE s.season_year = $1
  `, [selectedSeason])).rows[0];

  if (!draftInfo) {
    return {
      availableSeasons,
      positionColors,
      selectedSeason,
      draftInfo: null,
      participants: [],
      draftPicks: []
    };
  }

  // Get draft participants (managers in draft order)
  const participants = (await query(`
    SELECT 
      part.draft_position,
      mgr.manager_id,
      mgr.username AS manager_name,
      mgr.logo_url AS manager_logo,
      t.team_name
    FROM draft_participants part
    JOIN managers mgr ON part.manager_id = mgr.manager_id
    JOIN teams t ON part.team_id = t.team_id
    WHERE part.draft_id = $1
    ORDER BY part.draft_position
  `, [draftInfo.draft_id])).rows;

  // Get all draft picks for the grid
  /*const draftPicks = (await query(`
    SELECT 
      dp.pick_number,
      dp.round_number,
      dp.pick_in_round,
      dp.manager_id,
      p.player_name,
      p.position,
      dp.player_nfl_team,
      pc.background_color,
      pc.color_hex
    FROM draft_picks dp
    JOIN nfl_players p ON dp.player_id = p.player_id
    JOIN position_colors pc ON p.position = pc.position
    WHERE dp.draft_id = $1
    ORDER BY dp.pick_number
  `, [draftInfo.draft_id])).rows;*/

const draftPicks = (await query(`
  SELECT 
    pick_number, round_number, pick_in_round, manager_id,
    player_name, position, player_nfl_team, 
    background_color, color_hex
  FROM draft_picks_with_details
  WHERE draft_id = $1
  ORDER BY pick_number
`, [draftInfo.draft_id])).rows;



  return {
    availableSeasons,
    positionColors,
    selectedSeason,
    draftInfo,
    participants,
    draftPicks
  };
}
