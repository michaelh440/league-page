// src/routes/admin/videos/test/+page.server.js
import { query } from '$lib/db';

export const load = async () => {
	const diagnostics = {
		connection: null,
		tables: {},
		videos: null,
		seasons: null,
		errors: []
	};
	
	try {
		// Test 1: Basic connection
		console.log('TEST 1: Testing basic database connection...');
		const connTest = await query('SELECT NOW() as time, current_database() as db, current_user as user');
		diagnostics.connection = connTest.rows[0];
		console.log('✅ Connection successful:', diagnostics.connection);
	} catch (error) {
		diagnostics.errors.push({ test: 'connection', error: error.message });
		console.error('❌ Connection failed:', error);
	}
	
	try {
		// Test 2: Check weekly_summary_videos table structure
		console.log('TEST 2: Checking weekly_summary_videos table...');
		const videoTableInfo = await query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_schema = 'public' 
			AND table_name = 'weekly_summary_videos'
			ORDER BY ordinal_position
		`);
		diagnostics.tables.weekly_summary_videos = videoTableInfo.rows;
		console.log('✅ weekly_summary_videos columns:', videoTableInfo.rows);
	} catch (error) {
		diagnostics.errors.push({ test: 'weekly_summary_videos_structure', error: error.message });
		console.error('❌ Error checking weekly_summary_videos:', error);
	}
	
	try {
		// Test 3: Count videos
		console.log('TEST 3: Counting videos...');
		const videoCount = await query('SELECT COUNT(*) as count FROM weekly_summary_videos');
		console.log('✅ Total videos in database:', videoCount.rows[0].count);
		
		// Get all videos without JOIN first
		const allVideos = await query(`
			SELECT * FROM weekly_summary_videos 
			ORDER BY created_at DESC
		`);
		diagnostics.videos = {
			count: videoCount.rows[0].count,
			raw_data: allVideos.rows
		};
		console.log('✅ Video data:', allVideos.rows);
	} catch (error) {
		diagnostics.errors.push({ test: 'videos_query', error: error.message });
		console.error('❌ Error querying videos:', error);
	}
	
	try {
		// Test 4: Check seasons table structure
		console.log('TEST 4: Checking seasons table...');
		const seasonsTableInfo = await query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_schema = 'public' 
			AND table_name = 'seasons'
			ORDER BY ordinal_position
		`);
		diagnostics.tables.seasons = seasonsTableInfo.rows;
		console.log('✅ seasons columns:', seasonsTableInfo.rows);
	} catch (error) {
		diagnostics.errors.push({ test: 'seasons_structure', error: error.message });
		console.error('❌ Error checking seasons:', error);
	}
	
	try {
		// Test 5: Get all seasons
		console.log('TEST 5: Querying seasons...');
		const allSeasons = await query(`
			SELECT * FROM seasons 
			ORDER BY season_year DESC
		`);
		diagnostics.seasons = {
			count: allSeasons.rows.length,
			data: allSeasons.rows
		};
		console.log('✅ Seasons data:', allSeasons.rows);
	} catch (error) {
		diagnostics.errors.push({ test: 'seasons_query', error: error.message });
		console.error('❌ Error querying seasons:', error);
	}
	
	try {
		// Test 6: Try the JOIN query
		console.log('TEST 6: Testing JOIN query...');
		const joinQuery = await query(`
			SELECT 
				wsv.video_id,
				wsv.video_url,
				wsv.week,
				wsv.is_featured,
				wsv.season_id as video_season_id,
				s.season_id as season_season_id,
				s.season_year,
				s.season_name
			FROM weekly_summary_videos wsv
			JOIN seasons s ON wsv.season_id = s.season_id
			ORDER BY s.season_year DESC, wsv.week DESC
		`);
		diagnostics.joinTest = joinQuery.rows;
		console.log('✅ JOIN query result:', joinQuery.rows);
	} catch (error) {
		diagnostics.errors.push({ test: 'join_query', error: error.message });
		console.error('❌ Error in JOIN query:', error);
	}
	
	return { diagnostics };
};