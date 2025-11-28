// src/routes/drafts/managers/+page.server.js

import { query } from '$lib/db';

export async function load({ url }) {
  const managerId = url.searchParams.get('manager_id');

  try {
    // Get all managers for the dropdown
    const managers = (await query(`
      SELECT 
        manager_id,
        username AS manager_name,
        logo_url AS manager_logo
      FROM managers
      ORDER BY username
    `)).rows;

    // Get position colors from database (or use defaults)
    let positionColors;
    try {
      const colorsResult = await query(`
        SELECT position, color_hex, background_color
        FROM position_colors
      `);
      positionColors = colorsResult.rows.length > 0 ? colorsResult.rows : getDefaultColors();
    } catch {
      positionColors = getDefaultColors();
    }

    // If no manager selected, return basic data
    if (!managerId) {
      return {
        managers,
        positionColors,
        draftPicks: []
      };
    }

    // Get actual draft picks for this manager across all seasons
    // Using the draft_picks_with_details view which includes position and colors
    const draftPicksResult = await query(`
      SELECT 
        d.season_year,
        dp.draft_id,
        dp.pick_id,
        dp.pick_number,
        dp.round_number,
        dp.pick_in_round,
        dp.manager_id,
        dp.team_id,
        dp.player_id,
        dp.player_name,
        dp.manager_name,
        dp.player_nfl_team,
        dp.position,
        dp.background_color,
        dp.color_hex
      FROM draft_picks_with_details dp
      JOIN drafts d ON dp.draft_id = d.draft_id
      WHERE dp.manager_id = $1
      ORDER BY d.season_year DESC, dp.round_number ASC, dp.pick_in_round ASC
    `, [managerId]);

    const draftPicks = draftPicksResult.rows;

    console.log(`Loaded ${draftPicks.length} draft picks for manager ${managerId}`);

    return {
      managers,
      positionColors,
      draftPicks
    };
  } catch (error) {
    console.error('Error loading manager draft data:', error);
    return {
      managers: [],
      positionColors: getDefaultColors(),
      draftPicks: [],
      error: error.message
    };
  }
}

function getDefaultColors() {
  return [
    { position: 'QB', color_hex: '#ffffff', background_color: '#dc2626' },
    { position: 'RB', color_hex: '#ffffff', background_color: '#16a34a' },
    { position: 'WR', color_hex: '#ffffff', background_color: '#2563eb' },
    { position: 'TE', color_hex: '#ffffff', background_color: '#ea580c' },
    { position: 'K', color_hex: '#000000', background_color: '#fbbf24' },
    { position: 'DEF', color_hex: '#ffffff', background_color: '#7c2d12' }
  ];
}