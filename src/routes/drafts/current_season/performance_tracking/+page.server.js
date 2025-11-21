// src/routes/drafts/current_season/performance_tracking/+page.js
// Alternative loader if you're using Sleeper API for player stats

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

        // Get performance data from Sleeper API
        let performanceData = {};
        
        if (lastDraft && lastDraft.season_year) {
            const seasonYear = lastDraft.season_year;
            
            // Fetch player stats from Sleeper
            // You'll need to adjust this based on how you're storing/fetching Sleeper data
            try {
                // Option 1: Fetch from your own API endpoint that aggregates Sleeper data
                const statsResponse = await fetch(`/api/player-stats/${seasonYear}`);
                if (statsResponse.ok) {
                    performanceData = await statsResponse.json();
                }
                
                // Option 2: If you have player stats in your players data from Sleeper
                // Calculate totals from the playersData stats object
                performanceData = playersData.reduce((acc, player) => {
                    if (player.stats && player.stats[seasonYear]) {
                        const seasonStats = player.stats[seasonYear];
                        acc[player.player_id] = {
                            total_points: calculateTotalPoints(seasonStats),
                            games_played: countGamesPlayed(seasonStats),
                            avg_points_per_game: calculateAvgPoints(seasonStats),
                            best_game: findBestGame(seasonStats)
                        };
                    }
                    return acc;
                }, {});
                
            } catch (error) {
                console.error('Error fetching player stats:', error);
            }

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

// Helper functions to calculate stats from Sleeper data
function calculateTotalPoints(stats) {
    // Sum up all weekly points
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, weekStats) => {
        return sum + (weekStats.pts_ppr || weekStats.pts_half_ppr || weekStats.pts_std || 0);
    }, 0);
}

function countGamesPlayed(stats) {
    if (!stats) return 0;
    return Object.keys(stats).length;
}

function calculateAvgPoints(stats) {
    const total = calculateTotalPoints(stats);
    const games = countGamesPlayed(stats);
    return games > 0 ? total / games : 0;
}

function findBestGame(stats) {
    if (!stats) return 0;
    return Math.max(...Object.values(stats).map(weekStats => 
        weekStats.pts_ppr || weekStats.pts_half_ppr || weekStats.pts_std || 0
    ));
}