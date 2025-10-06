// src/lib/services/sleeperDataAdapter.js
// Adapts your existing Sleeper helper functions to populate staging tables

import { getLeagueData } from '$lib/utils/helperFunctions/leagueData';
import { getLeagueRosters } from '$lib/utils/helperFunctions/leagueRosters';
import { getLeagueTeamManagers } from '$lib/utils/helperFunctions/leagueTeamManagers';
import { leagueID } from '$lib/utils/leagueInfo';
import { query } from '$lib/db';

export class SleeperDataAdapter {
    constructor({ season, week }) {
        this.season = season;
        this.week = week;
    }

    /**
     * Fetch players directly from Sleeper API
     */
    async fetchPlayers() {
        const response = await fetch('https://api.sleeper.app/v1/players/nfl', {
            compress: true
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch players from Sleeper');
        }
        
        return response.json();
    }

    /**
     * Fetch matchups for specific week (your existing function gets all weeks)
     */
    async fetchSpecificWeekMatchups() {
        const response = await fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/${this.week}`,
            { compress: true }
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch matchups');
        }
        
        return response.json();
    }

    /**
     * Complete import workflow using your existing helper functions
     */
    async importWeekData() {
        try {
            // Step 1: Get all data using your existing helpers and direct Sleeper fetch
            const [leagueData, rostersData, matchupsData, teamManagers, playersData] = await Promise.all([
                getLeagueData(leagueID),
                getLeagueRosters(leagueID),
                this.fetchSpecificWeekMatchups(),
                getLeagueTeamManagers(),
                this.fetchPlayers()
            ]);

            // Step 2: Stage league info
            await this.stageLeague(leagueData);

            // Step 3: Stage users/managers
            await this.stageUsers(teamManagers);

            // Step 4: Stage rosters
            await this.stageRosters(rostersData.rosters, leagueData);

            // Step 5: Stage matchups for this week
            await this.stageMatchups(matchupsData, leagueData);

            // Step 6: Stage weekly rosters (starters/bench)
            await this.stageWeeklyRosters(matchupsData, rostersData.rosters, playersData);

            return {
                success: true,
                message: `Week ${this.week} data staged successfully`
            };

        } catch (error) {
            console.error('Error importing week data:', error);
            return {
                success: false,
                message: error.message || 'Failed to import week data'
            };
        }
    }

    /**
     * Stage league data
     */
    async stageLeague(leagueData) {
        await query(`
            INSERT INTO staging_sleeper_league (
                sleeper_league_id, league_name, season_year, 
                total_rosters, roster_positions, scoring_settings, raw_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (sleeper_league_id) DO UPDATE SET
                league_name = EXCLUDED.league_name,
                total_rosters = EXCLUDED.total_rosters,
                raw_data = EXCLUDED.raw_data,
                processed = FALSE
        `, [
            leagueData.league_id,
            leagueData.name,
            this.season,
            leagueData.total_rosters,
            JSON.stringify(leagueData.roster_positions || []),
            JSON.stringify(leagueData.scoring_settings || {}),
            JSON.stringify(leagueData)
        ]);
    }

    /**
     * Stage users from your teamManagers structure
     */
    async stageUsers(teamManagers) {
        const users = teamManagers.users;
        
        for (const userId in users) {
            const user = users[userId];
            
            await query(`
                INSERT INTO staging_sleeper_users (
                    sleeper_user_id, username, display_name, 
                    avatar, season_year, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (sleeper_user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    display_name = EXCLUDED.display_name,
                    avatar = EXCLUDED.avatar,
                    raw_data = EXCLUDED.raw_data,
                    processed = FALSE
            `, [
                userId,
                user.user_name || user.username,
                user.display_name,
                user.avatar,
                this.season,
                JSON.stringify(user)
            ]);
        }
    }

    /**
     * Stage rosters from your rosters structure
     */
    async stageRosters(rosters, leagueData) {
        for (const rosterId in rosters) {
            const roster = rosters[rosterId];
            
            await query(`
                INSERT INTO staging_sleeper_rosters (
                    sleeper_roster_id, sleeper_league_id, sleeper_user_id,
                    owner_id, season_year, settings, metadata, 
                    players, starters, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (sleeper_roster_id, sleeper_league_id, season_year) DO UPDATE SET
                    sleeper_user_id = EXCLUDED.sleeper_user_id,
                    settings = EXCLUDED.settings,
                    metadata = EXCLUDED.metadata,
                    players = EXCLUDED.players,
                    starters = EXCLUDED.starters,
                    raw_data = EXCLUDED.raw_data,
                    processed = FALSE
            `, [
                roster.roster_id,
                leagueData.league_id,
                roster.owner_id,
                roster.owner_id,
                this.season,
                JSON.stringify(roster.settings || {}),
                JSON.stringify(roster.metadata || {}),
                JSON.stringify(roster.players || []),
                JSON.stringify(roster.starters || []),
                JSON.stringify(roster)
            ]);
        }
    }

    /**
     * Stage matchups for this week
     */
    async stageMatchups(matchupsData, leagueData) {
        for (const matchup of matchupsData) {
            await query(`
                INSERT INTO staging_sleeper_matchups (
                    sleeper_league_id, sleeper_matchup_id, season_year, week,
                    roster_id, points, starters, starters_points, 
                    players_points, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (sleeper_league_id, week, roster_id, season_year) DO UPDATE SET
                    sleeper_matchup_id = EXCLUDED.sleeper_matchup_id,
                    points = EXCLUDED.points,
                    starters = EXCLUDED.starters,
                    starters_points = EXCLUDED.starters_points,
                    players_points = EXCLUDED.players_points,
                    raw_data = EXCLUDED.raw_data,
                    processed = FALSE
            `, [
                leagueData.league_id,
                matchup.matchup_id,
                this.season,
                this.week,
                matchup.roster_id,
                matchup.points,
                JSON.stringify(matchup.starters || []),
                JSON.stringify(matchup.starters_points || []),
                JSON.stringify(matchup.players_points || {}),
                JSON.stringify(matchup)
            ]);
        }
    }

    /**
     * Stage weekly rosters with starter/bench details
     */
    async stageWeeklyRosters(matchupsData, rosters, players) {
        for (const matchup of matchupsData) {
            const roster = rosters[matchup.roster_id];
            if (!roster) continue;

            // Build starters with positions
            const startersWithPositions = (matchup.starters || []).map((playerId, idx) => {
                const player = players[playerId];
                return {
                    player_id: playerId,
                    player_name: player?.full_name || player?.fn + ' ' + player?.ln || 'Unknown',
                    position: player?.pos || 'UNKNOWN',
                    lineup_slot: this.determineLineupSlot(player?.pos, idx),
                    points: matchup.starters_points?.[idx] || 0
                };
            });

            // Build bench players
            const benchPlayers = (roster.players || [])
                .filter((playerId) => !(matchup.starters || []).includes(playerId))
                .map((playerId) => {
                    const player = players[playerId];
                    return {
                        player_id: playerId,
                        player_name: player?.full_name || player?.fn + ' ' + player?.ln || 'Unknown',
                        position: player?.pos || 'UNKNOWN',
                        points: matchup.players_points?.[playerId] || 0
                    };
                });

            await query(`
                INSERT INTO staging_sleeper_weekly_rosters (
                    sleeper_league_id, roster_id, season_year, week,
                    starters, players, starters_with_positions, 
                    bench_with_positions, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (sleeper_league_id, roster_id, week, season_year) DO UPDATE SET
                    starters = EXCLUDED.starters,
                    players = EXCLUDED.players,
                    starters_with_positions = EXCLUDED.starters_with_positions,
                    bench_with_positions = EXCLUDED.bench_with_positions,
                    raw_data = EXCLUDED.raw_data,
                    processed = FALSE
            `, [
                leagueData.league_id,
                matchup.roster_id,
                this.season,
                this.week,
                JSON.stringify(matchup.starters || []),
                JSON.stringify(roster.players || []),
                JSON.stringify(startersWithPositions),
                JSON.stringify(benchPlayers),
                JSON.stringify({ matchup, roster })
            ]);
        }
    }

    /**
     * Determine lineup slot from position
     */
    determineLineupSlot(position, index) {
        const positionMap = {
            'QB': 'QB',
            'RB': 'RB',
            'WR': 'WR',
            'TE': 'TE',
            'K': 'K',
            'DEF': 'DEF'
        };
        return positionMap[position] || 'FLEX';
    }
}