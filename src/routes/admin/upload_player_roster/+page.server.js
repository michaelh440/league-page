import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return {
		uploadMode: 'staging'
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
							actual_position, roster_slot, nfl_team, fantasy_points, processed
						) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
						[
							seasonId,
							week,
							yahooPlayerId,
							playerName,
							actualPosition,
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
	}
};