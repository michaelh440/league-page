-- 2026-07-14 — Sleeper pipeline: store manager_id (not team_id) in matchups/weekly_scoring.
--
-- The whole app (and the Yahoo/2024 data) keys matchups.team1_id/team2_id,
-- weekly_scoring.team_id, playoffs.team1_id/team2_id and team_rankings.team_id on
-- manager_id. process_sleeper_matchups was writing the real teams.team_id instead, so
-- Sleeper-pipeline seasons (2025+) didn't join on any standings/records/rankings page.
--
-- This rewrites the function to resolve manager_id from the staged roster's mapped_team_id.
-- (playoffs are written from application code — see helperFunctions/playoffBrackets.js.)

CREATE OR REPLACE FUNCTION public.process_sleeper_matchups(p_season_id integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    processed_count INTEGER := 0;
    matchup_record RECORD;
    v_manager_id INTEGER;
    v_opp_manager_id INTEGER;
BEGIN
    -- Process matchups in pairs
    FOR matchup_record IN
        SELECT DISTINCT ON (sleeper_matchup_id, week)
            sleeper_league_id,
            sleeper_matchup_id,
            season_year,
            week,
            MIN(id) as id1,
            MAX(id) as id2
        FROM staging_sleeper_matchups
        WHERE processed = FALSE
            AND sleeper_matchup_id IS NOT NULL
        GROUP BY sleeper_league_id, sleeper_matchup_id, season_year, week
        HAVING COUNT(*) = 2
    LOOP
        -- Resolve manager_id (not team_id) for each side, via the staged roster's mapped team
        SELECT t.manager_id INTO v_manager_id
        FROM staging_sleeper_matchups sm
        JOIN teams t ON t.platform_team_id = sm.roster_id::text AND t.season_id = p_season_id
        WHERE sm.id = matchup_record.id1;

        SELECT t.manager_id INTO v_opp_manager_id
        FROM staging_sleeper_matchups sm
        JOIN teams t ON t.platform_team_id = sm.roster_id::text AND t.season_id = p_season_id
        WHERE sm.id = matchup_record.id2;

        -- Insert matchup (team1_id/team2_id hold manager_id, per the app convention)
        INSERT INTO matchups (
            season_id, week, team1_id, team2_id, team1_score, team2_score, platform, platform_matchup_id
        )
        SELECT
            p_season_id, matchup_record.week, v_manager_id, v_opp_manager_id,
            sm1.points, sm2.points, 'sleeper', matchup_record.sleeper_matchup_id::TEXT
        FROM staging_sleeper_matchups sm1
        CROSS JOIN staging_sleeper_matchups sm2
        WHERE sm1.id = matchup_record.id1 AND sm2.id = matchup_record.id2
        ON CONFLICT (season_id, week, team1_id, team2_id) DO UPDATE SET
            team1_score = EXCLUDED.team1_score,
            team2_score = EXCLUDED.team2_score;

        -- Weekly scoring for both sides (team_id column holds manager_id)
        INSERT INTO weekly_scoring (season_id, week, team_id, team_score, platform)
        SELECT p_season_id, week, v_manager_id, points, 'sleeper'
        FROM staging_sleeper_matchups WHERE id = matchup_record.id1
        ON CONFLICT (season_id, week, team_id) DO UPDATE SET team_score = EXCLUDED.team_score;

        INSERT INTO weekly_scoring (season_id, week, team_id, team_score, platform)
        SELECT p_season_id, week, v_opp_manager_id, points, 'sleeper'
        FROM staging_sleeper_matchups WHERE id = matchup_record.id2
        ON CONFLICT (season_id, week, team_id) DO UPDATE SET team_score = EXCLUDED.team_score;

        UPDATE staging_sleeper_matchups SET processed = TRUE
        WHERE id IN (matchup_record.id1, matchup_record.id2);

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$function$;
