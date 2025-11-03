import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// Check for unprocessed staging data
	const stagingCheck = await query(
		`SELECT 
			season_id,
			COUNT(*) as record_count,
			COUNT(*) FILTER (WHERE actual_position IS NULL) as missing_position,
			MIN(week) as min_week,
			MAX(week) as max_week
		FROM staging_yahoo_player_stats
		WHERE processed = false
		GROUP BY season_id
		ORDER BY season_id`
	);
	
	return {
		uploadMode: 'staging',
		hasUnprocessedData: stagingCheck.rows.length > 0,
		stagingSummary: stagingCheck.rows
	};
}

// Simple CSV parser function
function parseCSV(csvText) {
	const lines = csvText.trim().split('\n');
	if (lines.length === 0) return [];
	
	const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
	const records = [];
	
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		
		const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
		const record = {};
		headers.forEach((header, index) => {
			record[header] = values[index] || '';
		});
		records.push(record);
	}
	
	return records;
}

/** @type {import('./$types').Actions} */
export const actions = {
	upload: async ({ request }) => {
		console.log('📤 Upload request received');
		
		try {
			const formData = await request.formData();
			const file = formData.get('csvFile');
			const seasonId = parseInt(formData.get('seasonId'));

			console.log('Season ID:', seasonId);
			console.log('File:', file?.name);

			if (!file || !seasonId) {
				return fail(400, { 
					success: false, 
					error: 'Missing required fields: file or seasonId' 
				});
			}

			// Read CSV file
			const csvText = await file.text();
			console.log('CSV file size:', csvText.length, 'characters');

			// Parse CSV
			const records = parseCSV(csvText);

			console.log('Total records in CSV:', records.length);

			if (records.length === 0) {
				return fail(400, { 
					success: false, 
					error: 'CSV file is empty' 
				});
			}

			// Validate required columns
			const requiredColumns = ['season', 'week', 'team_id', 'team_name', 'player_id', 
									'player_name', 'position', 'selected_position', 'nfl_team', 'fantasy_points'];
			const headers = Object.keys(records[0]);
			const missingColumns = requiredColumns.filter(col => !headers.includes(col));

			if (missingColumns.length > 0) {
				return fail(400, { 
					success: false, 
					error: `Missing required columns: ${missingColumns.join(', ')}` 
				});
			}

			console.log('CSV columns validated ✓');
			console.log('First row:', records[0]);

			// Process records
			let inserted = 0;
			let skipped = 0;
			let positionsNeedingFixing = 0;

			for (let i = 0; i < records.length; i++) {
				const row = records[i];

				// Log progress every 100 rows
				if (i > 0 && i % 100 === 0) {
					console.log(`Progress: ${i}/${records.length} rows processed...`);
				}

				// Get mapped team_id
				// Note: Staging table doesn't store team_id - that's handled in separate roster tables
				
				const week = parseInt(row.week);
				const yahooPlayerId = row.player_id?.trim();
				const playerName = row.player_name?.trim();
				const position = row.position?.trim();
				const selectedPosition = row.selected_position?.trim();
				const nflTeam = row.nfl_team?.trim();
				const fantasyPoints = parseFloat(row.fantasy_points) || 0;

				// Validate position (only accept valid NFL positions)
				const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
				const actualPosition = validPositions.includes(position) ? position : null;

				if (!actualPosition) {
					positionsNeedingFixing++;
				}

				// Check if record already exists
				const existingRecord = await query(
					`SELECT 1 FROM staging_yahoo_player_stats 
					 WHERE season_id = $1 AND week = $2 AND player_id = $3
					 LIMIT 1`,
					[seasonId, week, yahooPlayerId]
				);

				if (existingRecord.rows.length > 0) {
					skipped++;
					continue;
				}

				// Insert into staging table
				try {
					await query(
						`INSERT INTO staging_yahoo_player_stats (
							season_id, week, player_id, name, 
							actual_position, position_source, roster_slot, nfl_team, fantasy_points, processed
						) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
						[
							seasonId,
							week,
							yahooPlayerId,
							playerName,
							actualPosition,
							actualPosition ? 'csv_import' : null, // Set position_source based on whether we have a position
							selectedPosition,
							nflTeam,
							fantasyPoints
						]
					);
					inserted++;
				} catch (err) {
					console.error(`Error inserting row ${i + 1}:`, err.message);
					skipped++;
				}
			}

			console.log('✅ Upload complete!');
			console.log(`   Inserted: ${inserted}`);
			console.log(`   Skipped: ${skipped}`);
			console.log(`   Positions needing fixing: ${positionsNeedingFixing}`);

			// Get summary of records needing position fixes
			const summaryResult = await query(
				`SELECT 
					COUNT(*) FILTER (WHERE actual_position IS NULL) as missing_position,
					COUNT(*) as total
				FROM staging_yahoo_player_stats 
				WHERE season_id = $1 AND processed = false`,
				[seasonId]
			);

			return {
				success: true,
				message: `Successfully uploaded ${inserted} records from ${file.name}`,
				stats: {
					inserted,
					skipped,
					total: records.length,
					positions_needing_fixing: positionsNeedingFixing,
					summary: summaryResult.rows[0]
				}
			};

		} catch (error) {
			console.error('❌ Upload error:', error);
			return fail(500, { 
				success: false, 
				error: `Error: ${error.message}` 
			});
		}
	},
	
	runETL: async ({ request }) => {
		try {
			const formData = await request.formData();
			const playoffConfigStr = formData.get('playoffConfig');
			const playoffConfig = JSON.parse(playoffConfigStr);
			
			console.log('=== RUNNING ETL ===');
			console.log('Playoff configuration:', playoffConfig);
			
			let regularInserted = 0;
			let playoffInserted = 0;
			let skipped = 0;
			
			// Get all unprocessed staging records
			const stagingRecords = await query(
				`SELECT 
					staging_id,
					season_id,
					week,
					player_id,
					name,
					actual_position,
					roster_slot,
					nfl_team,
					fantasy_points
				FROM staging_yahoo_player_stats
				WHERE processed = false
				ORDER BY season_id, week, player_id`
			);
			
			console.log(`Processing ${stagingRecords.rows.length} staging records...`);
			
			for (const rec of stagingRecords.rows) {
				// Skip if position is missing
				if (!rec.actual_position) {
					console.log(`Skipping player_id ${rec.player_id} (week ${rec.week}, season ${rec.season_id}): Missing position`);
					skipped++;
					continue;
				}
				
				// Get playoff start week for this season
				const playoffWeek = playoffConfig[rec.season_id.toString()];
				
				if (!playoffWeek) {
					console.log(`No playoff config for season ${rec.season_id}. Skipping player_id ${rec.player_id}`);
					skipped++;
					continue;
				}
				
				// Determine target table based on week
				if (rec.week < playoffWeek) {
					// REGULAR SEASON
					// Check if already exists
					const existing = await query(
						`SELECT 1 FROM player_fantasy_stats 
						WHERE season_id = $1 AND week = $2 AND player_id = $3`,
						[rec.season_id, rec.week, rec.player_id]
					);
					
					if (existing.rows.length > 0) {
						skipped++;
						continue;
					}
					
					// Insert to regular season table
					await query(
						`INSERT INTO player_fantasy_stats (
							season_id, week, player_id, player_name, position,
							nfl_team, fantasy_points, platform, imported_at
						) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
						[rec.season_id, rec.week, rec.player_id, rec.name, rec.actual_position,
						 rec.nfl_team, rec.fantasy_points, 'yahoo']
					);
					
					regularInserted++;
				} else {
					// PLAYOFFS
					// Check if already exists
					const existing = await query(
						`SELECT 1 FROM playoff_fantasy_stats 
						WHERE season_id = $1 AND week = $2 AND player_id = $3`,
						[rec.season_id, rec.week, rec.player_id]
					);
					
					if (existing.rows.length > 0) {
						skipped++;
						continue;
					}
					
					// Insert to playoff table
					await query(
						`INSERT INTO playoff_fantasy_stats (
							season_id, week, player_id, player_name, position,
							nfl_team, fantasy_points, platform, imported_at
						) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
						[rec.season_id, rec.week, rec.player_id, rec.name, rec.actual_position,
						 rec.nfl_team, rec.fantasy_points, 'yahoo']
					);
					
					playoffInserted++;
				}
				
				// Mark as processed
				await query(
					`UPDATE staging_yahoo_player_stats 
					SET processed = true 
					WHERE staging_id = $1`,
					[rec.staging_id]
				);
				
				// Log progress every 100 records
				if ((regularInserted + playoffInserted) % 100 === 0) {
					console.log(`Progress: ${regularInserted} regular, ${playoffInserted} playoff`);
				}
			}
			
			console.log('=== ETL COMPLETE ===');
			console.log(`Regular Season: ${regularInserted}`);
			console.log(`Playoffs: ${playoffInserted}`);
			console.log(`Skipped: ${skipped}`);
			
			return {
				success: true,
				message: 'ETL completed successfully!',
				stats: {
					regularInserted,
					playoffInserted,
					skipped,
					total: regularInserted + playoffInserted
				}
			};
			
		} catch (error) {
			console.error('ETL error:', error);
			return fail(500, { error: `ETL failed: ${error.message}` });
		}
	}
};