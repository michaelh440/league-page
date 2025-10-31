import { error, fail } from '@sveltejs/kit';
import { parse } from 'csv-parse/sync';
import { sql } from '$lib/server/db';

export async function load() {
  try {
    // Get summary stats
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_records,
        array_agg(DISTINCT season_id ORDER BY season_id) as seasons,
        MAX(created_at) as last_upload
      FROM player_fantasy_stats
      WHERE platform = 'yahoo'
    `;

    return {
      stats: {
        totalRecords: parseInt(statsResult[0].total_records),
        seasons: statsResult[0].seasons || [],
        lastUpload: statsResult[0].last_upload 
          ? new Date(statsResult[0].last_upload).toLocaleDateString() 
          : null
      }
    };
  } catch (err) {
    console.error('Error loading stats:', err);
    return {
      stats: null
    };
  }
}

export const actions = {
  uploadCSV: async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('csvFile');
      const mode = formData.get('mode') || 'insert';

      if (!file || !(file instanceof File)) {
        return fail(400, { error: true, message: 'No file uploaded' });
      }

      // Read the CSV file
      const text = await file.text();
      
      // Parse CSV
      let records;
      try {
        records = parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } catch (parseError) {
        return fail(400, { 
          error: true, 
          message: 'Failed to parse CSV: ' + parseError.message 
        });
      }

      if (records.length === 0) {
        return fail(400, { error: true, message: 'CSV file is empty' });
      }

      // Validate required columns
      const requiredColumns = [
        'season', 'week', 'player_id', 'player_name', 
        'position', 'nfl_team', 'fantasy_points'
      ];
      
      const firstRecord = records[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
      
      if (missingColumns.length > 0) {
        return fail(400, {
          error: true,
          message: `Missing required columns: ${missingColumns.join(', ')}`
        });
      }

      console.log(`Processing ${records.length} records in ${mode} mode...`);

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const errors = [];

      // Process records in batches
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            // Extract data
            const season = parseInt(record.season);
            const week = parseInt(record.week);
            const playerId = record.player_id;
            const playerName = record.player_name;
            const position = record.position;
            const nflTeam = record.nfl_team;
            const fantasyPoints = parseFloat(record.fantasy_points) || 0;

            // Validate
            if (!season || !week || !playerId) {
              skipped++;
              continue;
            }

            // Get or create player
            let player = await sql`
              SELECT player_id FROM nfl_players 
              WHERE yahoo_player_id = ${playerId}
              LIMIT 1
            `;

            let dbPlayerId;
            if (player.length === 0) {
              // Insert new player
              const newPlayer = await sql`
                INSERT INTO nfl_players (
                  yahoo_player_id, player_name, position, is_active
                )
                VALUES (${playerId}, ${playerName}, ${position}, true)
                RETURNING player_id
              `;
              dbPlayerId = newPlayer[0].player_id;
            } else {
              dbPlayerId = player[0].player_id;
            }

            // Prepare stat data for player_fantasy_stats table
            const statData = {
              season_id: season,
              week: week,
              player_id: dbPlayerId,
              yahoo_player_id: playerId,
              player_name: playerName,
              position: position,
              nfl_team: nflTeam,
              total_fantasy_points: fantasyPoints,
              platform: 'yahoo'
            };

            // Note: Your player_fantasy_stats table doesn't have a detailed_stats column
            // It only tracks total_fantasy_points
            // If you want detailed stats, you'd need to add columns or a separate table

            // Insert or update based on mode
            if (mode === 'insert') {
              // Check if exists
              const existing = await sql`
                SELECT fantasy_stat_id FROM player_fantasy_stats
                WHERE season_id = ${season}
                AND week = ${week}
                AND yahoo_player_id = ${playerId}
                AND platform = 'yahoo'
              `;

              if (existing.length > 0) {
                skipped++;
                continue;
              }

              // Insert
              await sql`
                INSERT INTO player_fantasy_stats ${sql(statData)}
              `;
              inserted++;

            } else if (mode === 'update') {
              // Upsert - conflict on (season_id, week, yahoo_player_id, platform)
              await sql`
                INSERT INTO player_fantasy_stats ${sql(statData)}
                ON CONFLICT (season_id, week, yahoo_player_id, platform)
                WHERE yahoo_player_id IS NOT NULL
                DO UPDATE SET
                  player_id = EXCLUDED.player_id,
                  player_name = EXCLUDED.player_name,
                  position = EXCLUDED.position,
                  nfl_team = EXCLUDED.nfl_team,
                  total_fantasy_points = EXCLUDED.total_fantasy_points,
                  updated_at = CURRENT_TIMESTAMP
              `;
              
              // Count as insert or update
              const check = await sql`
                SELECT created_at, updated_at FROM player_fantasy_stats
                WHERE season_id = ${season}
                AND week = ${week}
                AND yahoo_player_id = ${playerId}
                AND platform = 'yahoo'
              `;
              
              if (check[0] && check[0].created_at.getTime() === check[0].updated_at.getTime()) {
                inserted++;
              } else {
                updated++;
              }
            }

          } catch (recordError) {
            console.error('Error processing record:', recordError);
            errors.push({
              row: i + batch.indexOf(record) + 2, // +2 for header and 0-index
              error: recordError.message
            });
            skipped++;
          }
        }
      }

      console.log(`Upload complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

      return {
        success: true,
        message: `Successfully processed ${records.length} records`,
        details: {
          processed: records.length,
          inserted,
          updated,
          skipped
        }
      };

    } catch (err) {
      console.error('Upload error:', err);
      return fail(500, {
        error: true,
        message: 'Upload failed: ' + err.message
      });
    }
  }
};