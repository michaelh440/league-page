// src/routes/drafts/current_season/performance_tracking/+page.server.js

import { query } from '$lib/db';
import { getPreviousDrafts, getLeagueTeamManagers, loadPlayers } from '$lib/utils/helper';

export async function load({ fetch }) {
    try {
        // Get the most recent draft
        const allPreviousDrafts = await getPreviousDrafts();
        const lastDraft = allPreviousDrafts && allPreviousDrafts.length > 0 
            ? allPreviousDrafts[0]
            : null;
        
        const leagueTeamManagersData = await getLeagueTeamManagers();
        const playersData = await loadPlayers(fetch);

        // Get performance data for the current season
        // This queries your player_stats or scoring tables
        let performanceData = {};
        
        if (lastDraft && lastDraft.season_year) {
            const seasonYear = lastDraft.season_year;
            
            // Query to get player performance stats for the season
            // Adjust this query based on your actual database schema
            const performanceQuery = await query(`
                SELECT 
                    player_id,
                    SUM(points) as total_points,
                    COUNT(DISTINCT week) as games_played,
                    AVG(points) as avg_points_per_game,
                    MAX(points) as best_game
                FROM player_stats
                WHERE season_year = $1
                GROUP BY player_id
            `, [seasonYear]);

            // Convert to object keyed by player_id for easy lookup
            performanceData = performanceQuery.rows.reduce((acc, row) => {
                acc[row.player_id] = {
                    total_points: parseFloat(row.total_points) || 0,
                    games_played: parseInt(row.games_played) || 0,
                    avg_points_per_game: parseFloat(row.avg_points_per_game) || 0,
                    best_game: parseFloat(row.best_game) || 0
                };
                return acc;
            }, {});

            console.log(`Loaded performance data for ${Object.keys(performanceData).length} players in ${seasonYear}`);
        }

        return {
            draftData: lastDraft,
            performanceData,
            leagueTeamManagersData,
            playersData,
        };
    } catch (error) {
        console.error('Error loading performance tracking data:', error);
        return {
            draftData: null,
            performanceData: {},
            leagueTeamManagersData: [],
            playersData: [],
        };
    }
}