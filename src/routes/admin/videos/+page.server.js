// src/routes/admin/videos/+page.server.js

import { query } from '$lib/db';
import { fail } from '@sveltejs/kit';

export async function load() {
  let videos = [];
  let seasons = [];
  
  try {
    // Get all videos
    const videosResult = await query(`
      SELECT 
        wsv.video_id,
        wsv.season_id,
        wsv.week,
        wsv.video_url,
        wsv.thumbnail_url,
        wsv.video_duration,
        wsv.generation_status,
        wsv.created_at,
        wsv.completed_at,
        s.season_year
      FROM weekly_summary_videos wsv
      JOIN seasons s ON wsv.season_id = s.season_id
      ORDER BY s.season_year DESC, wsv.week DESC
    `);
    
    videos = videosResult.rows;
    
    // Get all seasons for the dropdown
    const seasonsResult = await query(`
      SELECT season_id, season_year
      FROM seasons
      ORDER BY season_year DESC
    `);
    
    seasons = seasonsResult.rows;
    
  } catch (error) {
    console.error('Error loading admin data:', error);
  }

  return {
    videos,
    seasons
  };
}

export const actions = {
  // Add new video
  add: async ({ request }) => {
    const formData = await request.formData();
    const season_id = formData.get('season_id');
    const week = formData.get('week');
    const video_url = formData.get('video_url');
    const thumbnail_url = formData.get('thumbnail_url');
    
    try {
      await query(`
        INSERT INTO weekly_summary_videos (
          season_id,
          week,
          video_url,
          thumbnail_url,
          generation_status,
          completed_at
        ) VALUES ($1, $2, $3, $4, 'completed', NOW())
      `, [season_id, week, video_url, thumbnail_url || null]);
      
      return { success: true, message: 'Video added successfully!' };
    } catch (error) {
      console.error('Error adding video:', error);
      return fail(500, { error: 'Failed to add video' });
    }
  },
  
  // Update existing video
  update: async ({ request }) => {
    const formData = await request.formData();
    const video_id = formData.get('video_id');
    const season_id = formData.get('season_id');
    const week = formData.get('week');
    const video_url = formData.get('video_url');
    const thumbnail_url = formData.get('thumbnail_url');
    
    try {
      await query(`
        UPDATE weekly_summary_videos
        SET season_id = $1,
            week = $2,
            video_url = $3,
            thumbnail_url = $4,
            completed_at = NOW()
        WHERE video_id = $5
      `, [season_id, week, video_url, thumbnail_url || null, video_id]);
      
      return { success: true, message: 'Video updated successfully!' };
    } catch (error) {
      console.error('Error updating video:', error);
      return fail(500, { error: 'Failed to update video' });
    }
  },
  
  // Delete video
  delete: async ({ request }) => {
    const formData = await request.formData();
    const video_id = formData.get('video_id');
    
    try {
      await query(`
        DELETE FROM weekly_summary_videos
        WHERE video_id = $1
      `, [video_id]);
      
      return { success: true, message: 'Video deleted successfully!' };
    } catch (error) {
      console.error('Error deleting video:', error);
      return fail(500, { error: 'Failed to delete video' });
    }
  },
  
  // Set featured video (make it the most recent by updating its week/season)
  setFeatured: async ({ request }) => {
    const formData = await request.formData();
    const video_id = formData.get('video_id');
    
    try {
      // Get current max season and week
      const maxResult = await query(`
        SELECT 
          MAX(s.season_year) as max_year
        FROM seasons s
      `);
      
      const maxYear = maxResult.rows[0].max_year;
      
      // Get the season_id for the max year
      const seasonResult = await query(`
        SELECT season_id
        FROM seasons
        WHERE season_year = $1
      `, [maxYear]);
      
      const seasonId = seasonResult.rows[0].season_id;
      
      // Get max week for this season
      const weekResult = await query(`
        SELECT COALESCE(MAX(week), 0) + 1 as next_week
        FROM weekly_summary_videos
        WHERE season_id = $1
      `, [seasonId]);
      
      const nextWeek = weekResult.rows[0].next_week;
      
      // Update the video to be the latest
      await query(`
        UPDATE weekly_summary_videos
        SET season_id = $1,
            week = $2,
            completed_at = NOW()
        WHERE video_id = $3
      `, [seasonId, nextWeek, video_id]);
      
      return { success: true, message: 'Video set as featured!' };
    } catch (error) {
      console.error('Error setting featured video:', error);
      return fail(500, { error: 'Failed to set featured video' });
    }
  }
};