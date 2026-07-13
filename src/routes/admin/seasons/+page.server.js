// src/routes/admin/seasons/+page.server.js
import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	try {
		// Get all seasons with league info
		const seasonsQuery = `
			SELECT 
				s.season_id,
				s.league_id,
				s.season_year,
				s.is_active,
				s.platform,
				s.created_at,
				l.league_name,
				l.platform_id,
				l.platform as league_platform,
				COUNT(DISTINCT t.team_id) as team_count,
				COUNT(DISTINCT wsv.video_id) as video_count
			FROM seasons s
			LEFT JOIN leagues l ON s.league_id = l.league_id
			LEFT JOIN teams t ON s.season_id = t.season_id
			LEFT JOIN weekly_summary_videos wsv ON s.season_id = wsv.season_id
			GROUP BY s.season_id, s.league_id, s.season_year, s.is_active, 
			         s.platform, s.created_at, l.league_name, l.platform_id, l.platform
			ORDER BY s.season_year DESC, s.is_active DESC
		`;
		
		const seasonsResult = await query(seasonsQuery);
		
		// Get all leagues for the dropdown
		const leaguesQuery = `
			SELECT league_id, league_name, platform, platform_id
			FROM leagues
			ORDER BY league_name
		`;
		
		const leaguesResult = await query(leaguesQuery);
		
		// Get stats
		const statsQuery = `
			SELECT 
				COUNT(*) as total_seasons,
				COUNT(*) FILTER (WHERE is_active = true) as active_seasons,
				MIN(season_year) as first_season,
				MAX(season_year) as latest_season
			FROM seasons
		`;
		
		const statsResult = await query(statsQuery);
		
		return {
			seasons: seasonsResult.rows,
			leagues: leaguesResult.rows,
			stats: statsResult.rows[0]
		};
	} catch (error) {
		console.error('Error loading seasons:', error);
		return {
			seasons: [],
			leagues: [],
			stats: {},
			error: error.message
		};
	}
};

export const actions = {
	// Add new season
	add: async ({ request }) => {
		try {
			const data = await request.formData();
			const leagueMode = (data.get('league_mode') || 'existing').toString();
			const seasonYear = data.get('season_year');
			const isActive = data.get('is_active') === 'on';

			let leagueId;
			let platform;
			let createdLeagueNote = '';

			if (leagueMode === 'new_sleeper') {
				// Create (or reuse) a Sleeper league directly from its league ID
				const sleeperLeagueId = (data.get('sleeper_league_id') || '').toString().trim();
				let leagueName = (data.get('league_name') || '').toString().trim();
				platform = 'sleeper';

				if (!sleeperLeagueId) {
					return fail(400, { success: false, error: 'Sleeper League ID is required' });
				}

				// Reuse an existing league with this Sleeper ID rather than duplicating it
				const existingLeague = await query(
					`SELECT league_id FROM leagues WHERE platform_id = $1 AND platform = 'sleeper'`,
					[sleeperLeagueId]
				);

				if (existingLeague.rows.length > 0) {
					leagueId = existingLeague.rows[0].league_id;
					createdLeagueNote = ' (linked to existing league)';
				} else {
					// Best-effort enrich from the public Sleeper API; fall back to sane defaults
					let maxTeams = 12;
					let regSeasonLength = 14;
					let scoringType = null; // DB defaults to 'Half-PPR'
					let leagueYear = parseInt(seasonYear);

					try {
						const res = await fetch(`https://api.sleeper.app/v1/league/${sleeperLeagueId}`);
						if (res.ok) {
							const l = await res.json();
							if (l && l.league_id) {
								if (!leagueName) leagueName = l.name;
								if (l.total_rosters) maxTeams = l.total_rosters;
								if (l.settings?.playoff_week_start) regSeasonLength = l.settings.playoff_week_start - 1;
								const rec = l.scoring_settings?.rec;
								if (rec !== undefined) scoringType = rec >= 1 ? 'PPR' : rec >= 0.5 ? 'Half-PPR' : 'Standard';
								if (l.season) leagueYear = parseInt(l.season);
							}
						}
					} catch (err) {
						console.warn('Sleeper league lookup failed:', err.message);
					}

					if (!leagueName) {
						return fail(400, {
							success: false,
							error: 'Could not read the league name from Sleeper. Enter a league name and try again.'
						});
					}

					const leagueInsert = await query(
						`INSERT INTO leagues
							(platform_id, platform, league_name, max_teams, reg_season_length, scoring_type, league_year, created_at)
						 VALUES ($1, 'sleeper', $2, $3, $4, $5, $6, NOW())
						 RETURNING league_id`,
						[sleeperLeagueId, leagueName, maxTeams, regSeasonLength, scoringType, leagueYear]
					);
					leagueId = leagueInsert.rows[0].league_id;
					createdLeagueNote = ` (created league "${leagueName}")`;
				}
			} else {
				leagueId = data.get('league_id');
				platform = data.get('platform');
				if (!leagueId) {
					return fail(400, { success: false, error: 'Please select a league' });
				}
			}

			// Check if season already exists for this league and year
			const checkQuery = `
				SELECT season_id FROM seasons
				WHERE league_id = $1 AND season_year = $2
			`;
			const checkResult = await query(checkQuery, [leagueId, seasonYear]);
			
			if (checkResult.rows.length > 0) {
				return fail(400, {
					success: false,
					error: `Season ${seasonYear} already exists for this league`
				});
			}
			
			// If setting as active, deactivate all other seasons for this league
			if (isActive) {
				await query(
					'UPDATE seasons SET is_active = false WHERE league_id = $1',
					[leagueId]
				);
			}
			
			// Insert new season
			const insertQuery = `
				INSERT INTO seasons 
				(league_id, season_year, is_active, platform, created_at)
				VALUES ($1, $2, $3, $4, NOW())
				RETURNING season_id
			`;
			
			const result = await query(insertQuery, [leagueId, seasonYear, isActive, platform]);

			return {
				success: true,
				message: `Season ${seasonYear} created successfully${createdLeagueNote}`,
				season_id: result.rows[0].season_id
			};
		} catch (error) {
			console.error('Error adding season:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Update existing season
	update: async ({ request }) => {
		try {
			const data = await request.formData();
			const seasonId = data.get('season_id');
			const leagueId = data.get('league_id');
			const seasonYear = data.get('season_year');
			const platform = data.get('platform');
			const isActive = data.get('is_active') === 'on';
			
			// If setting as active, deactivate all other seasons for this league
			if (isActive) {
				await query(
					'UPDATE seasons SET is_active = false WHERE league_id = $1 AND season_id != $2',
					[leagueId, seasonId]
				);
			}
			
			// Update season
			const updateQuery = `
				UPDATE seasons
				SET league_id = $1, 
				    season_year = $2, 
				    is_active = $3,
				    platform = $4
				WHERE season_id = $5
			`;
			
			await query(updateQuery, [leagueId, seasonYear, isActive, platform, seasonId]);
			
			return {
				success: true,
				message: 'Season updated successfully'
			};
		} catch (error) {
			console.error('Error updating season:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Delete season
	delete: async ({ request }) => {
		try {
			const data = await request.formData();
			const seasonId = data.get('season_id');
			
			// Check if season has associated data
			const checkQuery = `
				SELECT 
					(SELECT COUNT(*) FROM teams WHERE season_id = $1) as team_count,
					(SELECT COUNT(*) FROM weekly_summary_videos WHERE season_id = $1) as video_count
			`;
			const checkResult = await query(checkQuery, [seasonId]);
			const counts = checkResult.rows[0];
			
			if (counts.team_count > 0 || counts.video_count > 0) {
				return fail(400, {
					success: false,
					error: `Cannot delete season with ${counts.team_count} teams and ${counts.video_count} videos. Delete associated data first.`
				});
			}
			
			await query('DELETE FROM seasons WHERE season_id = $1', [seasonId]);
			
			return {
				success: true,
				message: 'Season deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting season:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	},
	
	// Toggle active status
	toggleActive: async ({ request }) => {
		try {
			const data = await request.formData();
			const seasonId = data.get('season_id');
			const leagueId = data.get('league_id');
			
			// Deactivate all seasons for this league
			await query(
				'UPDATE seasons SET is_active = false WHERE league_id = $1',
				[leagueId]
			);
			
			// Activate this season
			await query(
				'UPDATE seasons SET is_active = true WHERE season_id = $1',
				[seasonId]
			);
			
			return {
				success: true,
				message: 'Active season updated successfully'
			};
		} catch (error) {
			console.error('Error toggling active status:', error);
			return fail(500, {
				success: false,
				error: error.message
			});
		}
	}
};