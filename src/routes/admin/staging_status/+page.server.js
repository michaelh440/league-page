// src/routes/admin/staging_status/+page.server.js
import { query } from '$lib/db';

export async function load() {
    try {
        // ============================================
        // SLEEPER SEASONS FROM PRODUCTION
        // ============================================
        
        // Get all Sleeper seasons
        const sleeperSeasons = await query(`
            SELECT 
                s.season_id,
                s.season_year,
                s.is_active,
                l.league_id,
                l.platform_id as sleeper_league_id,
                l.league_name
            FROM seasons s
            JOIN leagues l ON s.league_id = l.league_id
            WHERE s.platform = 'sleeper'
            ORDER BY s.season_year DESC
        `);
        
        // ============================================
        // PRODUCTION DATA STATUS BY SEASON
        // ============================================
        
        // Check drafts in production
        const draftsProduction = await query(`
            SELECT 
                d.season_id,
                s.season_year,
                COUNT(*) as draft_count,
                STRING_AGG(d.draft_name, ', ') as draft_names
            FROM drafts d
            JOIN seasons s ON d.season_id = s.season_id
            WHERE d.platform = 'sleeper'
            GROUP BY d.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check draft picks in production (join through drafts to get season)
        const draftPicksProduction = await query(`
            SELECT 
                d.season_id,
                s.season_year,
                COUNT(dp.pick_id) as pick_count
            FROM drafts d
            JOIN seasons s ON d.season_id = s.season_id
            LEFT JOIN draft_picks dp ON d.draft_id = dp.draft_id
            WHERE d.platform = 'sleeper'
            GROUP BY d.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check managers in production (linked via teams to seasons)
        const managersProduction = await query(`
            SELECT 
                t.season_id,
                s.season_year,
                COUNT(DISTINCT m.manager_id) as manager_count
            FROM teams t
            JOIN seasons s ON t.season_id = s.season_id
            JOIN managers m ON t.manager_id = m.manager_id
            WHERE s.platform = 'sleeper'
            GROUP BY t.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check teams in production
        const teamsProduction = await query(`
            SELECT 
                t.season_id,
                s.season_year,
                COUNT(*) as team_count
            FROM teams t
            JOIN seasons s ON t.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY t.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check weekly_roster in production
        const weeklyRosterProduction = await query(`
            SELECT 
                wr.season_id,
                s.season_year,
                COUNT(DISTINCT wr.week) as weeks_with_data,
                COUNT(*) as total_records
            FROM weekly_roster wr
            JOIN seasons s ON wr.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY wr.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check playoff_roster in production
        const playoffRosterProduction = await query(`
            SELECT 
                pr.season_id,
                s.season_year,
                COUNT(DISTINCT pr.week) as weeks_with_data,
                COUNT(*) as total_records
            FROM playoff_roster pr
            JOIN seasons s ON pr.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY pr.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check player_fantasy_stats in production
        const playerStatsProduction = await query(`
            SELECT 
                pfs.season_id,
                s.season_year,
                COUNT(DISTINCT pfs.week) as weeks_with_data,
                COUNT(*) as total_records
            FROM player_fantasy_stats pfs
            JOIN seasons s ON pfs.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY pfs.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check playoff_fantasy_stats in production
        const playoffStatsProduction = await query(`
            SELECT 
                pfs.season_id,
                s.season_year,
                COUNT(DISTINCT pfs.week) as weeks_with_data,
                COUNT(*) as total_records
            FROM playoff_fantasy_stats pfs
            JOIN seasons s ON pfs.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY pfs.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
        // Check matchups in production
        const matchupsProduction = await query(`
            SELECT 
                m.season_id,
                s.season_year,
                COUNT(DISTINCT m.week) as weeks_with_data,
                COUNT(*) as total_records
            FROM matchups m
            JOIN seasons s ON m.season_id = s.season_id
            WHERE s.platform = 'sleeper'
            GROUP BY m.season_id, s.season_year
            ORDER BY s.season_year DESC
        `);
        
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
            sleeperSeasons: sleeperSeasons.rows,
            production: {
                drafts: draftsProduction.rows,
                draftPicks: draftPicksProduction.rows,
                managers: managersProduction.rows,
                teams: teamsProduction.rows,
                weeklyRoster: weeklyRosterProduction.rows,
                playoffRoster: playoffRosterProduction.rows,
                playerStats: playerStatsProduction.rows,
                playoffStats: playoffStatsProduction.rows,
                matchups: matchupsProduction.rows
            },
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
            sleeperSeasons: [],
            production: {
                drafts: [],
                draftPicks: [],
                managers: [],
                teams: [],
                weeklyRoster: [],
                playoffRoster: [],
                playerStats: [],
                playoffStats: [],
                matchups: []
            },
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