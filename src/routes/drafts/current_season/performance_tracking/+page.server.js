// src/routes/drafts/current_season/performance_tracking/+page.server.js

import { query } from '$lib/db';

export async function load() {
    try {
        // Get the active season
        const activeSeasonResult = await query(`
            SELECT season_id, season_year
            FROM seasons
            WHERE is_active = true
            LIMIT 1
        `);
        
        const activeSeason = activeSeasonResult.rows[0];
        
        if (!activeSeason) {
            console.log('No active season found');
            return {
                draftData: null,
                performanceData: {},
                leagueTeamManagersData: [],
                playersData: []
            };
        }

        console.log('Active season:', activeSeason);

        // Get the draft for this season
        const draftResult = await query(`
            SELECT 
                d.draft_id,
                d.season_id,
                d.season_year,
                d.draft_name,
                d.draft_type,
                d.total_rounds,
                d.draft_date,
                d.draft_status
            FROM drafts d
            WHERE d.season_id = $1
            ORDER BY d.draft_date DESC
            LIMIT 1
        `, [activeSeason.season_id]);

        const draft = draftResult.rows[0];
        
        if (!draft) {
            console.log('No draft found for season:', activeSeason.season_id);
            return {
                draftData: null,
                performanceData: {},
                leagueTeamManagersData: [],
                playersData: []
            };
        }

        console.log('Draft found:', draft.draft_id, draft.draft_name);

        // Get draft picks with position and color info using the view
        const picksResult = await query(`
            SELECT 
                dp.pick_id,
                dp.draft_id,
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
            WHERE dp.draft_id = $1
            ORDER BY dp.pick_number ASC
        `, [draft.draft_id]);

        console.log('Draft picks found:', picksResult.rows.length);

        // Get managers
        const managersResult = await query(`
            SELECT 
                manager_id,
                username as manager_name,
                logo_url as manager_logo
            FROM managers
            ORDER BY username
        `);

        // Get player performance data for this season
        // Sum up all weekly points for each player
        const performanceResult = await query(`
            SELECT 
                player_id,
                player_name,
                position,
                SUM(total_fantasy_points) as total_points,
                COUNT(DISTINCT week) as games_played,
                AVG(total_fantasy_points) as avg_points_per_game,
                MAX(total_fantasy_points) as best_game
            FROM player_fantasy_stats
            WHERE season_id = $1
            GROUP BY player_id, player_name, position
        `, [activeSeason.season_id]);

        console.log('Performance data found for players:', performanceResult.rows.length);

        // Convert performance data to object keyed by player_id
        const performanceData = performanceResult.rows.reduce((acc, row) => {
            acc[row.player_id] = {
                total_points: parseFloat(row.total_points) || 0,
                games_played: parseInt(row.games_played) || 0,
                avg_points_per_game: parseFloat(row.avg_points_per_game) || 0,
                best_game: parseFloat(row.best_game) || 0
            };
            return acc;
        }, {});

        // Also create a lookup by player_name for cases where player_id doesn't match
        const performanceByName = performanceResult.rows.reduce((acc, row) => {
            acc[row.player_name.toLowerCase()] = {
                total_points: parseFloat(row.total_points) || 0,
                games_played: parseInt(row.games_played) || 0,
                avg_points_per_game: parseFloat(row.avg_points_per_game) || 0,
                best_game: parseFloat(row.best_game) || 0
            };
            return acc;
        }, {});

        // Construct the draftData object with picks embedded
        const draftData = {
            draft_id: draft.draft_id,
            draft_name: draft.draft_name || `${draft.season_year} Draft`,
            draft_datetime: draft.draft_date, // Map draft_date to draft_datetime for the component
            season_year: draft.season_year,
            draft_type: draft.draft_type,
            total_rounds: draft.total_rounds,
            draft_picks: picksResult.rows.map(pick => ({
                ...pick,
                // Ensure we have the performance data attached
                // Try by player_id first, then by name
                _performance: performanceData[pick.player_id] || 
                              performanceByName[pick.player_name?.toLowerCase()] ||
                              { total_points: 0, games_played: 0 }
            }))
        };

        // Get all NFL players for reference
        const playersResult = await query(`
            SELECT 
                player_id,
                player_name,
                position,
                sleeper_player_id
            FROM nfl_players
            WHERE position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DEF')
        `);

        return {
            draftData,
            performanceData,
            performanceByName,
            leagueTeamManagersData: managersResult.rows,
            playersData: playersResult.rows
        };

    } catch (error) {
        console.error('Error loading performance tracking data:', error);
        return {
            draftData: null,
            performanceData: {},
            leagueTeamManagersData: [],
            playersData: [],
            error: error.message
        };
    }
}