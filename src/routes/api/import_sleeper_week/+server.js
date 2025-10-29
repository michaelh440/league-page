// src/routes/api/import_sleeper_week/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import { SleeperDataAdapter } from '$lib/services/sleeperDataAdapter';

/**
 * POST: Import a specific week's data from Sleeper
 * Body: { season: 2024, week: 1, processImmediately: true }
 */
export async function POST({ request }) {
    try {
        const { season, week, processImmediately = true } = await request.json();
        
        if (!season || !week) {
            return json({
                success: false,
                error: 'Missing required parameters: season, week'
            }, { status: 400 });
        }

        // Step 1: Stage the data using existing helpers
        const adapter = new SleeperDataAdapter({ season, week });
        const importResult = await adapter.importWeekData();

        if (!importResult.success) {
            return json({
                success: false,
                error: importResult.message
            }, { status: 500 });
        }

        // Step 2: Get or create season_id
        const seasonResult = await query(`
            SELECT season_id FROM seasons 
            WHERE season_year = $1 
            LIMIT 1
        `, [season]);

        
        let seasonId;

        if (seasonResult.rows.length === 0) {
            return json({
                success: false,
                error: `Season ${season} does not exist. Please create the season in the database first.`
            }, { status: 400 });
        } else {
            seasonId = seasonResult.rows[0].season_id;
        }
        

        let processingResult = null;

        if (processImmediately) {
            // Step 3: Process staged data into main tables
            processingResult = await query(`
                SELECT * FROM process_sleeper_week($1, $2)
            `, [seasonId, week]);

            // Check if processing was successful
            const errors = processingResult.rows.filter(r => !r.success);
            if (errors.length > 0) {
                console.error('Processing errors:', errors);
            }
        }

        return json({
            success: true,
            message: `Week ${week}, Season ${season} data imported successfully`,
            seasonId,
            imported: importResult,
            processing: processImmediately ? processingResult.rows : null
        });

    } catch (error) {
        console.error('Error importing week:', error);
        return json({
            success: false,
            error: error.message || 'Failed to import week data'
        }, { status: 500 });
    }
}

/**
 * GET: Check status of imported data
 * Query params: ?season=2024&week=1
 */
export async function GET({ url }) {
    try {
        const season = url.searchParams.get('season');
        const week = url.searchParams.get('week');

        if (!season || !week) {
            return json({
                success: false,
                error: 'Missing required parameters: season, week'
            }, { status: 400 });
        }

        // Get staging status
        const stagingStatus = await query(`
            SELECT 
                (SELECT COUNT(*) FROM staging_sleeper_matchups 
                 WHERE season_year = $1 AND week = $2 AND processed = FALSE) as unprocessed_matchups,
                (SELECT COUNT(*) FROM staging_sleeper_matchups 
                 WHERE season_year = $1 AND week = $2 AND processed = TRUE) as processed_matchups,
                (SELECT COUNT(*) FROM staging_sleeper_weekly_rosters 
                 WHERE season_year = $1 AND week = $2 AND processed = FALSE) as unprocessed_rosters,
                (SELECT COUNT(*) FROM staging_sleeper_weekly_rosters 
                 WHERE season_year = $1 AND week = $2 AND processed = TRUE) as processed_rosters
        `, [season, week]);

        // Get main table status
        const mainStatus = await query(`
            SELECT 
                s.season_id,
                s.season_year,
                COUNT(DISTINCT m.matchup_id) as matchups_count,
                COUNT(DISTINCT ws.team_id) as teams_with_scores,
                COUNT(DISTINCT wr.team_id) as teams_with_rosters
            FROM seasons s
            LEFT JOIN matchups m ON m.season_id = s.season_id AND m.week = $2
            LEFT JOIN weekly_scoring ws ON ws.season_id = s.season_id AND ws.week = $2
            LEFT JOIN weekly_roster wr ON wr.season_id = s.season_id AND wr.week = $2
            WHERE s.season_year = $1
            GROUP BY s.season_id, s.season_year
        `, [season, week]);

        return json({
            success: true,
            staging: stagingStatus.rows[0],
            main: mainStatus.rows[0] || null
        });

    } catch (error) {
        console.error('Error checking import status:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}