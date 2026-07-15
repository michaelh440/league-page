-- 2026-07-15 — Fix the process_sleeper_matchups() overload the pipeline actually calls.
--
-- There are TWO overloads:
--   process_sleeper_matchups()                <- called by process_sleeper_week (the pipeline)
--   process_sleeper_matchups(p_season_id int) <- fixed previously, but nothing calls it
--
-- The no-arg one still wrote teams.team_id into matchups.team1_id/team2_id (the app keys
-- these on manager_id) and never wrote weekly_scoring at all. That's why every pipeline
-- push produced team_id rows and weekly_scoring stayed empty.
--
-- Fix: the (p_season_id) version does the real work (manager_id + weekly_scoring, with a
-- canonical team order so re-processing can't create an (A,B)/(B,A) duplicate), and the
-- no-arg version simply resolves the season and delegates to it.

CREATE OR REPLACE FUNCTION public.process_sleeper_matchups(p_season_id integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    processed_count INTEGER := 0;
    r RECORD;
    v_m1 INTEGER;
    v_m2 INTEGER;
    v_s1 NUMERIC;
    v_s2 NUMERIC;
    v_tmp INTEGER;
BEGIN
    -- Pair the two staged rows that share a game (each row is one team's entry)
    FOR r IN
        SELECT sm1.id AS id1, sm2.id AS id2,
               sm1.week, sm1.sleeper_matchup_id,
               sm1.roster_id AS roster1, sm2.roster_id AS roster2,
               sm1.points AS points1, sm2.points AS points2
        FROM staging_sleeper_matchups sm1
        JOIN staging_sleeper_matchups sm2
          ON sm1.sleeper_matchup_id = sm2.sleeper_matchup_id
         AND sm1.week = sm2.week
         AND sm1.season_year = sm2.season_year
         AND sm1.roster_id < sm2.roster_id
        WHERE sm1.processed = FALSE
          AND sm2.processed = FALSE
          AND sm1.sleeper_matchup_id IS NOT NULL
          AND sm1.points IS NOT NULL
          AND sm2.points IS NOT NULL
    LOOP
        -- Resolve each roster to its MANAGER id (the app's convention)
        SELECT t.manager_id INTO v_m1 FROM teams t
        WHERE t.season_id = p_season_id AND t.platform_team_id = r.roster1::TEXT LIMIT 1;

        SELECT t.manager_id INTO v_m2 FROM teams t
        WHERE t.season_id = p_season_id AND t.platform_team_id = r.roster2::TEXT LIMIT 1;

        -- Skip (leave unprocessed for review) if a roster doesn't map to a manager
        IF v_m1 IS NULL OR v_m2 IS NULL THEN
            CONTINUE;
        END IF;

        v_s1 := r.points1;
        v_s2 := r.points2;

        -- Canonical order: team1_id is always the lower manager_id, so re-processing
        -- updates the same row instead of inserting a mirrored duplicate.
        IF v_m1 > v_m2 THEN
            v_tmp := v_m1; v_m1 := v_m2; v_m2 := v_tmp;
            v_s1 := r.points2; v_s2 := r.points1;
        END IF;

        INSERT INTO matchups (
            season_id, week, team1_id, team1_name, team2_id, team2_name,
            team1_score, team2_score, platform, platform_matchup_id
        ) VALUES (
            p_season_id, r.week, v_m1,
            (SELECT t.team_name FROM teams t WHERE t.season_id = p_season_id AND t.manager_id = v_m1 LIMIT 1),
            v_m2,
            (SELECT t.team_name FROM teams t WHERE t.season_id = p_season_id AND t.manager_id = v_m2 LIMIT 1),
            v_s1, v_s2, 'sleeper', r.sleeper_matchup_id::TEXT
        )
        ON CONFLICT (season_id, week, team1_id, team2_id) DO UPDATE SET
            team1_score = EXCLUDED.team1_score,
            team2_score = EXCLUDED.team2_score,
            team1_name = EXCLUDED.team1_name,
            team2_name = EXCLUDED.team2_name,
            platform_matchup_id = EXCLUDED.platform_matchup_id;

        -- weekly_scoring: one row per manager per week (team_id column holds manager_id)
        INSERT INTO weekly_scoring (season_id, week, team_id, team_score, platform)
        VALUES (p_season_id, r.week, v_m1, v_s1, 'sleeper')
        ON CONFLICT (season_id, week, team_id) DO UPDATE SET team_score = EXCLUDED.team_score;

        INSERT INTO weekly_scoring (season_id, week, team_id, team_score, platform)
        VALUES (p_season_id, r.week, v_m2, v_s2, 'sleeper')
        ON CONFLICT (season_id, week, team_id) DO UPDATE SET team_score = EXCLUDED.team_score;

        UPDATE staging_sleeper_matchups SET processed = TRUE WHERE id IN (r.id1, r.id2);

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$function$;


-- The overload the pipeline actually calls: resolve the season, then delegate.
CREATE OR REPLACE FUNCTION public.process_sleeper_matchups()
 RETURNS TABLE(records_processed integer, success boolean, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_season_id INTEGER;
    v_count INTEGER;
BEGIN
    SELECT s.season_id INTO v_season_id
    FROM staging_sleeper_matchups sm
    JOIN seasons s ON s.season_year = sm.season_year AND s.platform = 'sleeper'
    WHERE sm.processed = FALSE
    LIMIT 1;

    IF v_season_id IS NULL THEN
        RETURN QUERY SELECT 0, FALSE, 'No unprocessed sleeper matchups found'::TEXT;
        RETURN;
    END IF;

    v_count := process_sleeper_matchups(v_season_id);

    RETURN QUERY SELECT v_count, TRUE,
        format('Processed %s matchup(s) into matchups + weekly_scoring', v_count)::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 0, FALSE, SQLERRM::TEXT;
END;
$function$;
