/*import { getUpcomingDraft, getPreviousDrafts, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ fetch }) {
    const upcomingDraftData = getUpcomingDraft();
    const previousDraftsData = getPreviousDrafts();
    const leagueTeamManagersData = getLeagueTeamManagers();
    const playersData = loadPlayers(fetch);

    return {
        upcomingDraftData,
        previousDraftsData,
        leagueTeamManagersData,
        playersData,
    };
}*/



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

    // Simple position colors (you can create this table or hardcode)
    const positionColors = [
      { position: 'QB', color_hex: '#ffffff', background_color: '#dc2626' },
      { position: 'RB', color_hex: '#ffffff', background_color: '#16a34a' },
      { position: 'WR', color_hex: '#ffffff', background_color: '#2563eb' },
      { position: 'TE', color_hex: '#ffffff', background_color: '#ea580c' },
      { position: 'K', color_hex: '#000000', background_color: '#fbbf24' },
      { position: 'DEF', color_hex: '#ffffff', background_color: '#7c2d12' }
    ];

    // If no manager selected, return basic data
    if (!managerId) {
      return {
        managers,
        positionColors,
        draftPicks: []
      };
    }

    // For now, let's create some mock draft data based on your historical_rankings table
    // This shows the concept - you can replace with actual draft tables when you have them
    const draftPicks = (await query(`
      SELECT 
        hr.season_year,
        hr.manager_id,
        -- Mock draft data based on historical rankings
        CASE 
          WHEN hr.season_year = 2023 AND hr.manager_id = $1 THEN '[
            {"round_number": 1, "pick_number": 3, "player_name": "Josh Jacobs", "position": "RB", "player_nfl_team": "LV"},
            {"round_number": 2, "pick_number": 18, "player_name": "Davante Adams", "position": "WR", "player_nfl_team": "LV"},
            {"round_number": 3, "pick_number": 27, "player_name": "Jalen Hurts", "position": "QB", "player_nfl_team": "PHI"}
          ]'::json
          WHEN hr.season_year = 2022 AND hr.manager_id = $1 THEN '[
            {"round_number": 1, "pick_number": 5, "player_name": "Dalvin Cook", "position": "RB", "player_nfl_team": "MIN"},
            {"round_number": 2, "pick_number": 20, "player_name": "Mike Evans", "position": "WR", "player_nfl_team": "TB"},
            {"round_number": 3, "pick_number": 29, "player_name": "Russell Wilson", "position": "QB", "player_nfl_team": "SEA"}
          ]'::json
          ELSE '[]'::json
        END as draft_data
      FROM historical_rankings hr
      WHERE hr.manager_id = $1 
        AND hr.season_year IN (2022, 2023)
      ORDER BY hr.season_year DESC
    `, [managerId])).rows;

    // Process the mock data into the expected format
    const processedPicks = [];
    draftPicks.forEach(season => {
      if (season.draft_data && Array.isArray(season.draft_data)) {
        season.draft_data.forEach(pick => {
          const posColor = positionColors.find(p => p.position === pick.position) || 
                          { color_hex: '#000000', background_color: '#cccccc' };
          
          processedPicks.push({
            season_year: season.season_year,
            round_number: pick.round_number,
            pick_number: pick.pick_number,
            manager_id: season.manager_id,
            player_name: pick.player_name,
            position: pick.position,
            player_nfl_team: pick.player_nfl_team,
            color_hex: posColor.color_hex,
            background_color: posColor.background_color
          });
        });
      }
    });

    console.log(`Loaded ${processedPicks.length} draft picks for manager ${managerId}`);

    return {
      managers,
      positionColors,
      draftPicks: processedPicks
    };
  } catch (error) {
    console.error('Error loading manager draft data:', error);
    return {
      managers: [],
      positionColors: [],
      draftPicks: []
    };
  }
}