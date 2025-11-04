// src/routes/+page.server.js
/*
import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';
import { query } from '$lib/db';

export async function load() {
  // Original Sleeper API calls (exactly as before)
  const standingsData = await getLeagueStandings();
  const leagueTeamManagersData = await getLeagueTeamManagers();


 // Commented out to change to use the ranking table after the move to neon

  // Add champions data from database
  const champions = (await query(`
    SELECT 
      hr.season_year,
      hr.manager_id,
      hr.final_rank,
      hr.regular_season_rank,
      m.username,
      m.real_name,
      m.logo_url
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.final_rank = 1
    ORDER BY hr.season_year DESC
  `)).rows;
*/
/*
// Add champions data from database - Updated to use existing tables
  const champions = (await query(`
    SELECT 
      s.season_year,
      m.manager_id,
      tr.final_rank,
      tr.reg_season_rank as regular_season_rank,
      m.username,
      m.real_name,
      m.logo_url
    FROM public.team_rankings tr
    JOIN public.teams t ON tr.team_id = t.team_id
    JOIN public.seasons s ON tr.season_id = s.season_id
    JOIN public.managers m ON t.manager_id = m.manager_id
    WHERE tr.final_rank = 1
      AND tr.week = (
          SELECT MAX(tr2.week) 
          FROM public.team_rankings tr2 
          WHERE tr2.season_id = tr.season_id 
          AND tr2.final_rank IS NOT NULL
      )
    ORDER BY s.season_year DESC
  `)).rows;
//end comment here

  const managersByCountRaw = (await query(`
    SELECT 
      hr.manager_id,
      m.username,
      m.real_name,
      m.logo_url,
      COUNT(hr.season_year) as championship_count,
      ARRAY_AGG(hr.season_year ORDER BY hr.season_year DESC) as championship_years
    FROM historical_rankings hr
    JOIN managers m ON hr.manager_id = m.manager_id
    WHERE hr.final_rank = 1
    GROUP BY hr.manager_id, m.username, m.real_name, m.logo_url
    ORDER BY championship_count DESC, MIN(hr.season_year) ASC
  `)).rows;

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

  return {
    standingsData,
    leagueTeamManagersData,
    champions: processedChampions,
    managersByCount
  };
}*/



// src/routes/+page.server.js

import { getLeagueStandings, getLeagueTeamManagers } from '$lib/utils/helper';
import { query } from '$lib/db';

export async function load() {
  // Original Sleeper API calls (exactly as before)
  const standingsData = await getLeagueStandings();
  const leagueTeamManagersData = await getLeagueTeamManagers();

  // Debug database connection
  try {
    const dbDebug = await query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        current_schema() as schema_name
    `);
    console.log('App is connected to:', dbDebug.rows[0]);
    
    const tableCheck = await query(`
      SELECT COUNT(*) as table_exists 
      FROM information_schema.tables 
      WHERE table_name = 'historical_rankings' AND table_schema = 'public'
    `);
    console.log('historical_rankings table exists from app perspective:', tableCheck.rows[0]);
  } catch (error) {
    console.error('Debug connection error:', error);
  }

  // Add champions data from database with error handling
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

  console.log('Final data being returned:', {
    championsCount: processedChampions.length,
    managersByCountCount: managersByCount.length
  });

  // TODO: Replace this with actual video data from your database or API
  // For now, here's sample data structure - UPDATE WITH YOUR ACTUAL VIDEO
  const featuredVideo = {
    id: '1',
    title: 'Week 9 Recap - Huge Wims and Losses!',
    url: 'https://youtu.be/SD1YeArVqP8', // ← UPDATE THIS
    date: '2025-11-04',
    description: 'Week 9 Standings and Highlights',
    featured: true
  };


  return {
    standingsData,
    leagueTeamManagersData,
    champions: processedChampions,
    managersByCount,
    featuredVideo // Add featured video to return data
  };
}