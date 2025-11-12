// src/routes/+page.server.js
import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';
import { query } from '$lib/db';

export async function load() {
	// ==========================================
	// SLEEPER API CALLS
	// ==========================================
	const standingsData = await getLeagueStandings();
	const leagueTeamManagersData = await getLeagueTeamManagers();

	// ==========================================
	// CHAMPIONS DATA FROM DATABASE
	// ==========================================
	let champions = [];
	let managersByCountRaw = [];

	try {
		console.log('Attempting to load championship data...');
		
		champions = (await query(`
			SELECT 
				hr.season_year,
				hr.manager_id,
				hr.final_rank,
				hr.regular_season_rank,
				m.username,
				m.real_name,
				m.logo_url
			FROM public.historical_rankings hr
			JOIN public.managers m ON hr.manager_id = m.manager_id
			WHERE hr.final_rank = 1
			ORDER BY hr.season_year DESC
		`)).rows;
		
		console.log('Champions loaded successfully:', champions.length, 'records');

		managersByCountRaw = (await query(`
			SELECT 
				hr.manager_id,
				m.username,
				m.real_name,
				m.logo_url,
				COUNT(hr.season_year) as championship_count,
				ARRAY_AGG(hr.season_year ORDER BY hr.season_year DESC) as championship_years
			FROM public.historical_rankings hr
			JOIN public.managers m ON hr.manager_id = m.manager_id
			WHERE hr.final_rank = 1
			GROUP BY hr.manager_id, m.username, m.real_name, m.logo_url
			ORDER BY championship_count DESC, MIN(hr.season_year) ASC
		`)).rows;
		
		console.log('Managers by count loaded successfully:', managersByCountRaw.length, 'records');
		
	} catch (error) {
		console.error('Error loading championship data:', error.message);
		console.error('Full error:', error);
		console.log('Championship data will be empty until database connection issue is resolved');
		
		// Return empty arrays so the site doesn't crash
		champions = [];
		managersByCountRaw = [];
	}

	// Process champions data
	const processedChampions = champions.map(champ => ({
		...champ,
		manager_name: champ.username || champ.real_name || `Manager ${champ.manager_id}`,
		avatar_url: champ.logo_url
	}));

	const managersByCount = managersByCountRaw.map(manager => ({
		...manager,
		manager_name: manager.username || manager.real_name || `Manager ${manager.manager_id}`,
		avatar_url: manager.logo_url
	}));

	console.log('Final champions data:', {
		championsCount: processedChampions.length,
		managersByCountCount: managersByCount.length
	});

	// ==========================================
	// FEATURED VIDEO FROM DATABASE
	// ==========================================
	let featuredVideo = null;

	try {
		console.log('Loading featured video from database...');
		
		// First try to get the explicitly featured video
		const featuredVideoQuery = `
			SELECT 
				wsv.video_id,
				wsv.video_url,
				wsv.week,
				wsv.title,
				wsv.description,
				wsv.publish_date,
				wsv.playlist,
				wsv.is_featured,
				wsv.provider_video_id,
				wsv.created_at,
				s.season_id,
				s.season_year,
				COALESCE(
					wsv.title, 
					CONCAT('Week ', wsv.week, ' - ', s.season_year, ' Season Highlights')
				) as display_title,
				COALESCE(
					wsv.description,
					CONCAT('Weekly recap for Week ', wsv.week, ' of the ', s.season_year, ' season')
				) as display_description
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			WHERE wsv.is_featured = true
			  AND wsv.video_url IS NOT NULL
			  AND wsv.generation_status = 'completed'
			LIMIT 1
		`;

		const featuredResult = await query(featuredVideoQuery);
		
		if (featuredResult.rows.length > 0) {
			const row = featuredResult.rows[0];
			featuredVideo = {
				id: row.video_id.toString(),
				title: row.display_title,
				url: row.video_url,
				date: row.publish_date ? 
					new Date(row.publish_date).toISOString().split('T')[0] : 
					new Date(row.created_at).toISOString().split('T')[0],
				description: row.display_description,
				week: row.week,
				season: row.season_year,
				playlist: row.playlist,
				featured: true
			};
			console.log('Featured video loaded:', featuredVideo.title);
		} else {
			console.log('No explicitly featured video found, checking for most recent...');
			
			// Fallback: get most recent completed video
			const recentVideoQuery = `
				SELECT 
					wsv.video_id,
					wsv.video_url,
					wsv.week,
					wsv.title,
					wsv.description,
					wsv.publish_date,
					wsv.playlist,
					wsv.provider_video_id,
					wsv.created_at,
					s.season_id,
					s.season_year,
					COALESCE(
						wsv.title, 
						CONCAT('Week ', wsv.week, ' - ', s.season_year, ' Season Highlights')
					) as display_title,
					COALESCE(
						wsv.description,
						CONCAT('Weekly recap for Week ', wsv.week, ' of the ', s.season_year, ' season')
					) as display_description
				FROM weekly_summary_videos wsv
				JOIN seasons s ON wsv.season_id = s.season_id
				WHERE wsv.video_url IS NOT NULL
				  AND wsv.generation_status = 'completed'
				ORDER BY s.season_year DESC, wsv.week DESC, wsv.created_at DESC
				LIMIT 1
			`;

			const recentResult = await query(recentVideoQuery);
			
			if (recentResult.rows.length > 0) {
				const row = recentResult.rows[0];
				featuredVideo = {
					id: row.video_id.toString(),
					title: row.display_title,
					url: row.video_url,
					date: row.publish_date ? 
						new Date(row.publish_date).toISOString().split('T')[0] : 
						new Date(row.created_at).toISOString().split('T')[0],
					description: row.display_description,
					week: row.week,
					season: row.season_year,
					playlist: row.playlist,
					featured: true
				};
				console.log('Most recent video loaded as featured:', featuredVideo.title);
			} else {
				console.log('No videos found in database');
			}
		}
	} catch (error) {
		console.error('Error loading featured video:', error.message);
		console.error('Full error:', error);
		featuredVideo = null;
	}

	// ==========================================
	// RETURN ALL DATA
	// ==========================================
	return {
		standingsData,
		leagueTeamManagersData,
		champions: processedChampions,
		managersByCount,
		featuredVideo
	};
}