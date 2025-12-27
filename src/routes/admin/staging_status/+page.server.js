// src/routes/admin/staging_status/+page.server.js
import { query } from '$lib/db';

export async function load() {
    try {
        // ============================================
        // SEASON-LEVEL STAGING TABLES (no weeks)
        // ============================================
        
        // staging_sleeper_league
        const leagueStaging = await query(`
            SELECT 
                season_year,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count
            FROM staging_sleeper_league
            GROUP BY season_year
            ORDER BY season_year DESC
        `);
        
        // staging_sleeper_users
        const usersStaging = await query(`
            SELECT 
                season_year,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count,
                COUNT(*) FILTER (WHERE mapped_manager_id IS NOT NULL) as mapped_count
            FROM staging_sleeper_users
            GROUP BY season_year
            ORDER BY season_year DESC
        `);
        
        // staging_sleeper_rosters
        const rostersStaging = await query(`
            SELECT 
                season_year,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count,
                COUNT(*) FILTER (WHERE mapped_team_id IS NOT NULL) as mapped_count
            FROM staging_sleeper_rosters
            GROUP BY season_year
            ORDER BY season_year DESC
        `);
        
        // staging_sleeper_drafts
        const draftsStaging = await query(`
            SELECT 
                season_year,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count,
                COUNT(*) FILTER (WHERE mapped_draft_id IS NOT NULL) as mapped_count
            FROM staging_sleeper_drafts
            GROUP BY season_year
            ORDER BY season_year DESC
        `);
        
        // staging_sleeper_draft_picks
        const draftPicksStaging = await query(`
            SELECT 
                season_year,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count,
                COUNT(*) FILTER (WHERE mapped_pick_id IS NOT NULL) as mapped_count
            FROM staging_sleeper_draft_picks
            GROUP BY season_year
            ORDER BY season_year DESC
        `);
        
        // ============================================
        // WEEK-LEVEL STAGING TABLES
        // ============================================
        
        // staging_sleeper_matchups - by season and week
        const matchupsStaging = await query(`
            SELECT 
                season_year,
                week,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count
            FROM staging_sleeper_matchups
            GROUP BY season_year, week
            ORDER BY season_year DESC, week
        `);
        
        // staging_sleeper_player_stats - by season and week
        const playerStatsStaging = await query(`
            SELECT 
                season_year,
                week,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count
            FROM staging_sleeper_player_stats
            GROUP BY season_year, week
            ORDER BY season_year DESC, week
        `);
        
        // staging_sleeper_weekly_rosters - by season and week
        const weeklyRostersStaging = await query(`
            SELECT 
                season_year,
                week,
                COUNT(*) as total_records,
                COUNT(*) FILTER (WHERE processed = true) as processed_count,
                COUNT(*) FILTER (WHERE processed = false) as unprocessed_count
            FROM staging_sleeper_weekly_rosters
            GROUP BY season_year, week
            ORDER BY season_year DESC, week
        `);
        
        // ============================================
        // Get list of all seasons in staging tables
        // ============================================
        const allSeasons = await query(`
            SELECT DISTINCT season_year 
            FROM (
                SELECT season_year FROM staging_sleeper_league
                UNION SELECT season_year FROM staging_sleeper_users
                UNION SELECT season_year FROM staging_sleeper_rosters
                UNION SELECT season_year FROM staging_sleeper_drafts
                UNION SELECT season_year FROM staging_sleeper_draft_picks
                UNION SELECT season_year FROM staging_sleeper_matchups
                UNION SELECT season_year FROM staging_sleeper_player_stats
                UNION SELECT season_year FROM staging_sleeper_weekly_rosters
            ) all_years
            ORDER BY season_year DESC
        `);
        
        // ============================================
        // Organize week-level data by season
        // ============================================
        const weeklyDataBySeason = {};
        
        allSeasons.rows.forEach(({ season_year }) => {
            weeklyDataBySeason[season_year] = {
                matchups: matchupsStaging.rows.filter(r => r.season_year === season_year),
                playerStats: playerStatsStaging.rows.filter(r => r.season_year === season_year),
                weeklyRosters: weeklyRostersStaging.rows.filter(r => r.season_year === season_year)
            };
        });
        
        return {
            seasonLevel: {
                league: leagueStaging.rows,
                users: usersStaging.rows,
                rosters: rostersStaging.rows,
                drafts: draftsStaging.rows,
                draftPicks: draftPicksStaging.rows
            },
            weekLevel: weeklyDataBySeason,
            seasons: allSeasons.rows.map(r => r.season_year)
        };
        
    } catch (error) {
        console.error('Error fetching staging status:', error);
        return {
            error: error.message,
            seasonLevel: {
                league: [],
                users: [],
                rosters: [],
                drafts: [],
                draftPicks: []
            },
            weekLevel: {},
            seasons: []
        };
    }
}