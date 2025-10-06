// src/routes/api/weekly_summary/+server.js
import { json } from '@sveltejs/kit';
import { query } from '$lib/db';

export async function GET({ url }) {
    try {
        const season = url.searchParams.get('season');
        const week = url.searchParams.get('week');
        
        if (!season || !week) {
            return json({
                success: false,
                error: 'Missing season or week parameter'
            }, { status: 400 });
        }

        const result = await query(`
            WITH weekly_matchup_details AS (
                SELECT 
                    s.season_year,
                    m.week,
                    m.matchup_id,
                    
                    -- Team 1 info
                    m.team1_id,
                    COALESCE(mtn1.team_name, t1.team_name) as team1_name,
                    mgr1.manager_id as manager1_id,
                    mgr1.username as manager1_name,
                    m.team1_score,
                    
                    -- Team 2 info
                    m.team2_id,
                    COALESCE(mtn2.team_name, t2.team_name) as team2_name,
                    mgr2.manager_id as manager2_id,
                    mgr2.username as manager2_name,
                    m.team2_score,
                    
                    -- Winner calculation
                    CASE 
                        WHEN m.team1_score > m.team2_score THEN COALESCE(mtn1.team_name, t1.team_name)
                        WHEN m.team2_score > m.team1_score THEN COALESCE(mtn2.team_name, t2.team_name)
                        ELSE 'TIE'
                    END as winner,
                    ABS(m.team1_score - m.team2_score) as margin
                    
                FROM matchups m
                JOIN seasons s ON m.season_id = s.season_id
                
                -- Join to teams to get manager_id
                JOIN teams t1 ON m.team1_id = t1.team_id
                JOIN managers mgr1 ON t1.manager_id = mgr1.manager_id
                LEFT JOIN manager_team_names mtn1 ON mtn1.manager_id = mgr1.manager_id 
                    AND mtn1.season_year = s.season_year
                
                JOIN teams t2 ON m.team2_id = t2.team_id
                JOIN managers mgr2 ON t2.manager_id = mgr2.manager_id
                LEFT JOIN manager_team_names mtn2 ON mtn2.manager_id = mgr2.manager_id 
                    AND mtn2.season_year = s.season_year
                    
                WHERE m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
            )
            SELECT * FROM weekly_matchup_details
            WHERE season_year = $1 AND week = $2
            ORDER BY matchup_id
        `, [season, week]);

        return json({
            success: true,
            season,
            week,
            matchups: result.rows
        });

    } catch (error) {
        console.error('Error fetching weekly summary:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}