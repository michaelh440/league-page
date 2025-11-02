import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return {
		uploadMode: 'staging'
	};
}

function parseCSV(text) {
	const lines = text.split('\n').filter(line => line.trim());
	if (lines.length === 0) return { headers: [], rows: [] };
	
	const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
	const rows = [];
	
	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
		const row = {};
		headers.forEach((header, index) => {
			row[header] = values[index] || '';
		});
		rows.push(row);
	}
	
	return { headers, rows };
}

/** @type {import('./$types').Actions} */
export const actions = {
	upload: async ({ request }) => {
		try {
			const formData = await request.formData();
			const file = formData.get('csvFile');

			if (!file || file.size === 0) {
				return fail(400, { error: 'No file uploaded' });
			}

			// Read CSV file
			const text = await file.text();
			const { headers, rows } = parseCSV(text);

			console.log('=== CSV UPLOAD TO STAGING ===');
			console.log('Total rows:', rows.length);
			console.log('CSV headers:', headers);
			console.log('First row:', rows[0]);

			// Validate required columns
			// CSV format: season,week,team_id,team_name,player_id,player_name,position,selected_position,nfl_team,status,fantasy_points
			const requiredColumns = ['season', 'week', 'player_id', 'player_name', 'fantasy_points'];
			const missingColumns = requiredColumns.filter(col => !headers.includes(col));
			
			if (missingColumns.length > 0) {
				return fail(400, { 
					error: `Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}` 
				});
			}

			console.log('CSV validation passed. Uploading to staging_yahoo_player_stats...');

			let inserted = 0;
			let skipped = 0;
			let errors = [];

			// Process each row - insert into STAGING table
			for (const [index, row] of rows.entries()) {
				try {
					// Map CSV columns to staging table columns
					// staging_yahoo_player_stats schema:
					// - season_id INTEGER (maps from CSV 'season')
					// - week INTEGER
					// - player_id INTEGER (Yahoo's player ID)
					// - name TEXT (player name)
					// - roster_slot TEXT (selected_position from CSV - BN, W/R/T, QB, etc.)
					// - nfl_team TEXT
					// - fantasy_points NUMERIC
					// - actual_position TEXT (will be filled via admin UI or from CSV if valid)
					// - position_source TEXT (will be filled via admin UI or set to 'csv_import')
					// - processed BOOLEAN (false initially)
					
					const seasonId = parseInt(row.season);
					const week = parseInt(row.week);
					const playerId = parseInt(row.player_id); // Yahoo player ID
					const playerName = row.player_name || '';
					const position = row.position || null; // Actual NFL position (QB, RB, WR, TE, K, DEF)
					const rosterSlot = row.selected_position || ''; // Fantasy roster slot (BN, W/R/T, etc.)
					const nflTeam = row.nfl_team || '';
					const fantasyPoints = parseFloat(row.fantasy_points) || 0;

					// Validation
					if (!seasonId || !week || !playerId || !playerName) {
						console.log(`Row ${index}: Missing required data - season:${seasonId}, week:${week}, playerId:${playerId}, name:${playerName}`);
						skipped++;
						continue;
					}

					// If position is provided, validate it
					if (position) {
						const validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
						if (!validPositions.includes(position)) {
							console.log(`Row ${index}: Invalid position '${position}' for ${playerName}, will set to NULL`);
							// Don't skip, just set position to null - can be fixed in admin UI
						}
					}

					// Check if record already exists in staging
					const existingResult = await query(
						`SELECT staging_id FROM staging_yahoo_player_stats 
						 WHERE season_id = $1 AND week = $2 AND player_id = $3`,
						[seasonId, week, playerId]
					);

					if (existingResult.rows.length > 0) {
						skipped++;
						continue;
					}

					// Insert into staging table
					// actual_position: set from CSV 'position' if valid, otherwise NULL (can be fixed in admin UI)
					// position_source: 'csv_import' if we have position, NULL otherwise
					// processed: false (will be set to true after ETL migration)
					await query(
						`INSERT INTO staging_yahoo_player_stats 
						 (season_id, week, player_id, name, roster_slot, nfl_team, fantasy_points, actual_position, position_source, processed)
						 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
						[
							seasonId, 
							week, 
							playerId, 
							playerName, 
							rosterSlot, 
							nflTeam, 
							fantasyPoints,
							position && ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(position) ? position : null,
							position && ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(position) ? 'csv_import' : null
						]
					);
					inserted++;

					// Log progress every 100 rows
					if ((index + 1) % 100 === 0) {
						console.log(`Processed ${index + 1}/${rows.length} rows...`);
					}

				} catch (error) {
					console.error(`Error processing row ${index}:`, error);
					errors.push(`Row ${index + 1}: ${error.message}`);
					if (errors.length < 5) {
						console.error('Row data:', row);
					}
				}
			}

			console.log('=== STAGING UPLOAD COMPLETE ===');
			console.log(`Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors.length}`);

			// Get summary stats
			const summaryResult = await query(
				`SELECT 
					COUNT(*) as total_records,
					COUNT(actual_position) as with_position,
					COUNT(*) - COUNT(actual_position) as missing_position,
					COUNT(DISTINCT season_id) as seasons,
					MIN(season_id) as min_season,
					MAX(season_id) as max_season
				FROM staging_yahoo_player_stats
				WHERE processed = false`
			);

			const summary = summaryResult.rows[0];

			return {
				success: true,
				message: `Upload complete! Inserted ${inserted} records, skipped ${skipped} duplicates.`,
				stats: { 
					inserted, 
					skipped, 
					errors: errors.slice(0, 10),
					summary: {
						total_records: parseInt(summary.total_records),
						with_position: parseInt(summary.with_position),
						missing_position: parseInt(summary.missing_position),
						seasons: parseInt(summary.seasons),
						min_season: parseInt(summary.min_season),
						max_season: parseInt(summary.max_season)
					}
				}
			};

		} catch (error) {
			console.error('Staging upload error:', error);
			return fail(500, { error: `Upload failed: ${error.message}` });
		}
	}
};