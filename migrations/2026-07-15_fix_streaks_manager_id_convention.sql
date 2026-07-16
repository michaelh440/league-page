-- 2026-07-15  Fix the manager_id/team_id convention in the streaks rebuild.
--
-- update_manager_streaks_comprehensive() resolved each week's result with:
--
--     FROM matchups m
--     JOIN teams t ON (m.team1_id = t.team_id OR m.team2_id = t.team_id)
--     WHERE t.manager_id = v_manager.manager_id
--
-- but matchups.team1_id/team2_id and playoffs.team1_id/team2_id hold **manager_id**,
-- not team_id (the column names are misnomers, same as the rest of the schema). The
-- join therefore only matched when a manager's manager_id happened to collide with
-- one of their own team_id values -- true only for the 2015 managers (1-8), whose
-- first teams were team_id 1-8. Consequences:
--
--   * Every later manager (14 Jimmy, 15 Becerra, 21 Lance, 22 Hyland, 23 Tony, ...)
--     found no result, hit `CONTINUE WHEN v_result IS NULL`, and never got a
--     manager_career_streaks row at all -- a full rebuild silently dropped them.
--   * Managers whose *other* team_ids collide with a real manager_id silently
--     inherited that manager's results (manager 11 owns team_id 15 -> picked up
--     manager 15's games). LIMIT 1 made the pick arbitrary.
--
-- Fixes here:
--   1. Match team1_id/team2_id against manager_id directly; drop the teams join.
--   2. The 'all_time' scope now chains across seasons. It was restricted to
--      `season_id = p_season_id AND week = p_week - 1`, so every all-time streak
--      and all-time W/L total reset at week 1 of each season, capping
--      all_time_longest_win_streak at the longest *within a single season*.
--   3. Previous-week lookups take the most recent prior week rather than exactly
--      p_week - 1, so an idle/bye week no longer silently restarts a streak.
--
-- Re-runnable. After applying, rebuild via the Pipeline step 2 page (preview first).

CREATE OR REPLACE FUNCTION public.update_manager_streaks_comprehensive(p_season_id integer, p_week integer, p_is_playoff boolean DEFAULT false)
 RETURNS TABLE(ret_manager_id integer, ret_streak_scope text, ret_current_streak_type text, ret_current_streak_length integer, ret_status text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_manager RECORD;
    v_result TEXT;
    v_previous_streak RECORD;
    v_previous_all_time RECORD;
    v_career_streak RECORD;
    v_current_streak_type TEXT;
    v_current_streak_length INTEGER;
    v_current_streak_start_week INTEGER;
    v_all_time_streak_type TEXT;
    v_all_time_streak_length INTEGER;
    v_all_time_streak_start_week INTEGER;
    v_season_year INTEGER;
    v_scope TEXT;
BEGIN
    -- Determine scope
    v_scope := CASE WHEN p_is_playoff THEN 'playoffs' ELSE 'regular_season' END;

    -- Get season year
    SELECT season_year INTO v_season_year FROM seasons WHERE season_id = p_season_id;

    -- Loop through each manager in the season
    FOR v_manager IN
        SELECT DISTINCT t.manager_id
        FROM teams t
        WHERE t.season_id = p_season_id
    LOOP
        -- Get this week's result. NOTE: team1_id/team2_id hold manager_id.
        IF p_is_playoff THEN
            SELECT
                CASE
                    WHEN (p.team1_id = v_manager.manager_id AND p.team1_score > p.team2_score) OR
                         (p.team2_id = v_manager.manager_id AND p.team2_score > p.team1_score)
                    THEN 'W'
                    WHEN (p.team1_id = v_manager.manager_id AND p.team1_score < p.team2_score) OR
                         (p.team2_id = v_manager.manager_id AND p.team2_score < p.team1_score)
                    THEN 'L'
                    ELSE 'T'
                END INTO v_result
            FROM playoffs p
            WHERE p.season_id = p_season_id
                AND p.week = p_week
                AND (p.team1_id = v_manager.manager_id OR p.team2_id = v_manager.manager_id)
                AND p.team1_score IS NOT NULL
                AND p.team2_score IS NOT NULL
            LIMIT 1;
        ELSE
            SELECT
                CASE
                    WHEN (m.team1_id = v_manager.manager_id AND m.team1_score > m.team2_score) OR
                         (m.team2_id = v_manager.manager_id AND m.team2_score > m.team1_score)
                    THEN 'W'
                    WHEN (m.team1_id = v_manager.manager_id AND m.team1_score < m.team2_score) OR
                         (m.team2_id = v_manager.manager_id AND m.team2_score < m.team1_score)
                    THEN 'L'
                    ELSE 'T'
                END INTO v_result
            FROM matchups m
            WHERE m.season_id = p_season_id
                AND m.week = p_week
                AND (m.team1_id = v_manager.manager_id OR m.team2_id = v_manager.manager_id)
                AND m.team1_score IS NOT NULL
                AND m.team2_score IS NOT NULL
            LIMIT 1;
        END IF;

        -- Skip if no result found (manager didn't play this week)
        CONTINUE WHEN v_result IS NULL;

        -- Previous row for this scope: the most recent prior week in this season.
        -- (Not strictly p_week - 1: playoff weeks aren't contiguous and an idle
        -- week shouldn't restart the streak.)
        SELECT ms.* INTO v_previous_streak
        FROM manager_streaks ms
        WHERE ms.manager_id = v_manager.manager_id
            AND ms.season_id = p_season_id
            AND ms.streak_scope = v_scope
            AND ms.week < p_week
        ORDER BY ms.week DESC
        LIMIT 1;

        -- Previous all_time row: the most recent week this manager played in ANY
        -- season, so the all-time streak carries across season boundaries.
        SELECT ms.* INTO v_previous_all_time
        FROM manager_streaks ms
        JOIN seasons s ON s.season_id = ms.season_id
        WHERE ms.manager_id = v_manager.manager_id
            AND ms.streak_scope = 'all_time'
            AND (s.season_year < v_season_year
                 OR (s.season_year = v_season_year AND ms.week < p_week))
        ORDER BY s.season_year DESC, ms.week DESC
        LIMIT 1;

        -- Get career streak data
        SELECT * INTO v_career_streak
        FROM manager_career_streaks
        WHERE manager_id = v_manager.manager_id;

        -- Calculate new streak based on result
        IF v_result = 'T' THEN
            v_current_streak_type := 'none';
            v_current_streak_length := 0;
            v_current_streak_start_week := NULL;
        ELSIF v_result = 'W' THEN
            IF COALESCE(v_previous_streak.current_streak_type, 'none') = 'winning' THEN
                v_current_streak_type := 'winning';
                v_current_streak_length := COALESCE(v_previous_streak.current_streak_length, 0) + 1;
                v_current_streak_start_week := v_previous_streak.current_streak_start_week;
            ELSE
                v_current_streak_type := 'winning';
                v_current_streak_length := 1;
                v_current_streak_start_week := p_week;
            END IF;
        ELSE -- Loss
            IF COALESCE(v_previous_streak.current_streak_type, 'none') = 'losing' THEN
                v_current_streak_type := 'losing';
                v_current_streak_length := COALESCE(v_previous_streak.current_streak_length, 0) + 1;
                v_current_streak_start_week := v_previous_streak.current_streak_start_week;
            ELSE
                v_current_streak_type := 'losing';
                v_current_streak_length := 1;
                v_current_streak_start_week := p_week;
            END IF;
        END IF;

        -- Insert/Update season-specific streak (regular_season or playoffs)
        INSERT INTO manager_streaks (
            manager_id,
            season_id,
            week,
            streak_scope,
            current_streak_type,
            current_streak_length,
            current_streak_start_week,
            longest_win_streak,
            longest_win_streak_start_week,
            longest_win_streak_end_week,
            longest_win_streak_season_year,
            longest_lose_streak,
            longest_lose_streak_start_week,
            longest_lose_streak_end_week,
            longest_lose_streak_season_year,
            total_wins,
            total_losses,
            total_ties
        ) VALUES (
            v_manager.manager_id,
            p_season_id,
            p_week,
            v_scope,
            v_current_streak_type,
            v_current_streak_length,
            v_current_streak_start_week,
            -- Update longest win streak if current beats it
            CASE
                WHEN v_current_streak_type = 'winning' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_win_streak, 0)
                THEN v_current_streak_length
                ELSE COALESCE(v_previous_streak.longest_win_streak, 0)
            END,
            CASE
                WHEN v_current_streak_type = 'winning' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_win_streak, 0)
                THEN v_current_streak_start_week
                ELSE v_previous_streak.longest_win_streak_start_week
            END,
            CASE
                WHEN v_current_streak_type = 'winning' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_win_streak, 0)
                THEN p_week
                ELSE v_previous_streak.longest_win_streak_end_week
            END,
            CASE
                WHEN v_current_streak_type = 'winning' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_win_streak, 0)
                THEN v_season_year
                ELSE v_previous_streak.longest_win_streak_season_year
            END,
            -- Update longest lose streak if current beats it
            CASE
                WHEN v_current_streak_type = 'losing' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_lose_streak, 0)
                THEN v_current_streak_length
                ELSE COALESCE(v_previous_streak.longest_lose_streak, 0)
            END,
            CASE
                WHEN v_current_streak_type = 'losing' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_lose_streak, 0)
                THEN v_current_streak_start_week
                ELSE v_previous_streak.longest_lose_streak_start_week
            END,
            CASE
                WHEN v_current_streak_type = 'losing' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_lose_streak, 0)
                THEN p_week
                ELSE v_previous_streak.longest_lose_streak_end_week
            END,
            CASE
                WHEN v_current_streak_type = 'losing' AND
                     v_current_streak_length > COALESCE(v_previous_streak.longest_lose_streak, 0)
                THEN v_season_year
                ELSE v_previous_streak.longest_lose_streak_season_year
            END,
            COALESCE(v_previous_streak.total_wins, 0) + CASE WHEN v_result = 'W' THEN 1 ELSE 0 END,
            COALESCE(v_previous_streak.total_losses, 0) + CASE WHEN v_result = 'L' THEN 1 ELSE 0 END,
            COALESCE(v_previous_streak.total_ties, 0) + CASE WHEN v_result = 'T' THEN 1 ELSE 0 END
        )
        ON CONFLICT (manager_id, season_id, week, streak_scope)
        DO UPDATE SET
            current_streak_type = EXCLUDED.current_streak_type,
            current_streak_length = EXCLUDED.current_streak_length,
            current_streak_start_week = EXCLUDED.current_streak_start_week,
            longest_win_streak = EXCLUDED.longest_win_streak,
            longest_win_streak_start_week = EXCLUDED.longest_win_streak_start_week,
            longest_win_streak_end_week = EXCLUDED.longest_win_streak_end_week,
            longest_win_streak_season_year = EXCLUDED.longest_win_streak_season_year,
            longest_lose_streak = EXCLUDED.longest_lose_streak,
            longest_lose_streak_start_week = EXCLUDED.longest_lose_streak_start_week,
            longest_lose_streak_end_week = EXCLUDED.longest_lose_streak_end_week,
            longest_lose_streak_season_year = EXCLUDED.longest_lose_streak_season_year,
            total_wins = EXCLUDED.total_wins,
            total_losses = EXCLUDED.total_losses,
            total_ties = EXCLUDED.total_ties,
            updated_at = CURRENT_TIMESTAMP;

        -- Calculate all-time streak (continuing from the previous week played)
        IF v_result = 'T' THEN
            v_all_time_streak_type := 'none';
            v_all_time_streak_length := 0;
            v_all_time_streak_start_week := NULL;
        ELSIF v_result = 'W' THEN
            IF COALESCE(v_previous_all_time.current_streak_type, 'none') = 'winning' THEN
                v_all_time_streak_type := 'winning';
                v_all_time_streak_length := COALESCE(v_previous_all_time.current_streak_length, 0) + 1;
                v_all_time_streak_start_week := v_previous_all_time.current_streak_start_week;
            ELSE
                v_all_time_streak_type := 'winning';
                v_all_time_streak_length := 1;
                v_all_time_streak_start_week := p_week;
            END IF;
        ELSE
            IF COALESCE(v_previous_all_time.current_streak_type, 'none') = 'losing' THEN
                v_all_time_streak_type := 'losing';
                v_all_time_streak_length := COALESCE(v_previous_all_time.current_streak_length, 0) + 1;
                v_all_time_streak_start_week := v_previous_all_time.current_streak_start_week;
            ELSE
                v_all_time_streak_type := 'losing';
                v_all_time_streak_length := 1;
                v_all_time_streak_start_week := p_week;
            END IF;
        END IF;

        -- Insert/Update all_time scope
        INSERT INTO manager_streaks (
            manager_id, season_id, week, streak_scope,
            current_streak_type, current_streak_length, current_streak_start_week,
            longest_win_streak, longest_win_streak_start_week,
            longest_win_streak_end_week, longest_win_streak_season_year,
            longest_lose_streak, longest_lose_streak_start_week,
            longest_lose_streak_end_week, longest_lose_streak_season_year,
            total_wins, total_losses, total_ties
        ) VALUES (
            v_manager.manager_id, p_season_id, p_week, 'all_time',
            v_all_time_streak_type, v_all_time_streak_length, v_all_time_streak_start_week,
            GREATEST(
                COALESCE(v_previous_all_time.longest_win_streak, 0),
                CASE WHEN v_all_time_streak_type = 'winning' THEN v_all_time_streak_length ELSE 0 END
            ),
            CASE
                WHEN v_all_time_streak_type = 'winning' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_win_streak, 0)
                THEN v_all_time_streak_start_week
                ELSE v_previous_all_time.longest_win_streak_start_week
            END,
            CASE
                WHEN v_all_time_streak_type = 'winning' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_win_streak, 0)
                THEN p_week
                ELSE v_previous_all_time.longest_win_streak_end_week
            END,
            CASE
                WHEN v_all_time_streak_type = 'winning' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_win_streak, 0)
                THEN v_season_year
                ELSE v_previous_all_time.longest_win_streak_season_year
            END,
            GREATEST(
                COALESCE(v_previous_all_time.longest_lose_streak, 0),
                CASE WHEN v_all_time_streak_type = 'losing' THEN v_all_time_streak_length ELSE 0 END
            ),
            CASE
                WHEN v_all_time_streak_type = 'losing' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_lose_streak, 0)
                THEN v_all_time_streak_start_week
                ELSE v_previous_all_time.longest_lose_streak_start_week
            END,
            CASE
                WHEN v_all_time_streak_type = 'losing' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_lose_streak, 0)
                THEN p_week
                ELSE v_previous_all_time.longest_lose_streak_end_week
            END,
            CASE
                WHEN v_all_time_streak_type = 'losing' AND
                     v_all_time_streak_length > COALESCE(v_previous_all_time.longest_lose_streak, 0)
                THEN v_season_year
                ELSE v_previous_all_time.longest_lose_streak_season_year
            END,
            COALESCE(v_previous_all_time.total_wins, 0) + CASE WHEN v_result = 'W' THEN 1 ELSE 0 END,
            COALESCE(v_previous_all_time.total_losses, 0) + CASE WHEN v_result = 'L' THEN 1 ELSE 0 END,
            COALESCE(v_previous_all_time.total_ties, 0) + CASE WHEN v_result = 'T' THEN 1 ELSE 0 END
        )
        ON CONFLICT (manager_id, season_id, week, streak_scope)
        DO UPDATE SET
            current_streak_type = EXCLUDED.current_streak_type,
            current_streak_length = EXCLUDED.current_streak_length,
            current_streak_start_week = EXCLUDED.current_streak_start_week,
            longest_win_streak = EXCLUDED.longest_win_streak,
            longest_win_streak_start_week = EXCLUDED.longest_win_streak_start_week,
            longest_win_streak_end_week = EXCLUDED.longest_win_streak_end_week,
            longest_win_streak_season_year = EXCLUDED.longest_win_streak_season_year,
            longest_lose_streak = EXCLUDED.longest_lose_streak,
            longest_lose_streak_start_week = EXCLUDED.longest_lose_streak_start_week,
            longest_lose_streak_end_week = EXCLUDED.longest_lose_streak_end_week,
            longest_lose_streak_season_year = EXCLUDED.longest_lose_streak_season_year,
            total_wins = EXCLUDED.total_wins,
            total_losses = EXCLUDED.total_losses,
            total_ties = EXCLUDED.total_ties,
            updated_at = CURRENT_TIMESTAMP;

        -- Update career streaks table
        INSERT INTO manager_career_streaks (
            manager_id,
            all_time_current_streak_type,
            all_time_current_streak_length,
            all_time_current_streak_start_season,
            all_time_current_streak_start_week,
            all_time_longest_win_streak,
            all_time_longest_win_streak_start_season,
            all_time_longest_win_streak_start_week,
            all_time_longest_win_streak_end_season,
            all_time_longest_win_streak_end_week,
            all_time_longest_lose_streak,
            all_time_longest_lose_streak_start_season,
            all_time_longest_lose_streak_start_week,
            all_time_longest_lose_streak_end_season,
            all_time_longest_lose_streak_end_week,
            career_total_wins,
            career_total_losses,
            career_total_ties,
            career_regular_season_wins,
            career_regular_season_losses,
            career_playoff_wins,
            career_playoff_losses
        ) VALUES (
            v_manager.manager_id,
            v_all_time_streak_type,
            v_all_time_streak_length,
            CASE WHEN v_all_time_streak_length = 1 THEN p_season_id
                 ELSE COALESCE(v_career_streak.all_time_current_streak_start_season, p_season_id) END,
            CASE WHEN v_all_time_streak_length = 1 THEN p_week
                 ELSE COALESCE(v_career_streak.all_time_current_streak_start_week, p_week) END,
            GREATEST(
                COALESCE(v_career_streak.all_time_longest_win_streak, 0),
                CASE WHEN v_all_time_streak_type = 'winning' THEN v_all_time_streak_length ELSE 0 END
            ),
            CASE WHEN v_all_time_streak_type = 'winning' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_win_streak, 0)
                 THEN p_season_id ELSE v_career_streak.all_time_longest_win_streak_start_season END,
            CASE WHEN v_all_time_streak_type = 'winning' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_win_streak, 0)
                 THEN v_all_time_streak_start_week ELSE v_career_streak.all_time_longest_win_streak_start_week END,
            CASE WHEN v_all_time_streak_type = 'winning' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_win_streak, 0)
                 THEN p_season_id ELSE v_career_streak.all_time_longest_win_streak_end_season END,
            CASE WHEN v_all_time_streak_type = 'winning' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_win_streak, 0)
                 THEN p_week ELSE v_career_streak.all_time_longest_win_streak_end_week END,
            GREATEST(
                COALESCE(v_career_streak.all_time_longest_lose_streak, 0),
                CASE WHEN v_all_time_streak_type = 'losing' THEN v_all_time_streak_length ELSE 0 END
            ),
            CASE WHEN v_all_time_streak_type = 'losing' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_lose_streak, 0)
                 THEN p_season_id ELSE v_career_streak.all_time_longest_lose_streak_start_season END,
            CASE WHEN v_all_time_streak_type = 'losing' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_lose_streak, 0)
                 THEN v_all_time_streak_start_week ELSE v_career_streak.all_time_longest_lose_streak_start_week END,
            CASE WHEN v_all_time_streak_type = 'losing' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_lose_streak, 0)
                 THEN p_season_id ELSE v_career_streak.all_time_longest_lose_streak_end_season END,
            CASE WHEN v_all_time_streak_type = 'losing' AND
                      v_all_time_streak_length > COALESCE(v_career_streak.all_time_longest_lose_streak, 0)
                 THEN p_week ELSE v_career_streak.all_time_longest_lose_streak_end_week END,
            COALESCE(v_career_streak.career_total_wins, 0) + CASE WHEN v_result = 'W' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_total_losses, 0) + CASE WHEN v_result = 'L' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_total_ties, 0) + CASE WHEN v_result = 'T' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_regular_season_wins, 0) +
                CASE WHEN NOT p_is_playoff AND v_result = 'W' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_regular_season_losses, 0) +
                CASE WHEN NOT p_is_playoff AND v_result = 'L' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_playoff_wins, 0) +
                CASE WHEN p_is_playoff AND v_result = 'W' THEN 1 ELSE 0 END,
            COALESCE(v_career_streak.career_playoff_losses, 0) +
                CASE WHEN p_is_playoff AND v_result = 'L' THEN 1 ELSE 0 END
        )
        ON CONFLICT (manager_id)
        DO UPDATE SET
            all_time_current_streak_type = EXCLUDED.all_time_current_streak_type,
            all_time_current_streak_length = EXCLUDED.all_time_current_streak_length,
            all_time_current_streak_start_season = EXCLUDED.all_time_current_streak_start_season,
            all_time_current_streak_start_week = EXCLUDED.all_time_current_streak_start_week,
            all_time_longest_win_streak = EXCLUDED.all_time_longest_win_streak,
            all_time_longest_win_streak_start_season = EXCLUDED.all_time_longest_win_streak_start_season,
            all_time_longest_win_streak_start_week = EXCLUDED.all_time_longest_win_streak_start_week,
            all_time_longest_win_streak_end_season = EXCLUDED.all_time_longest_win_streak_end_season,
            all_time_longest_win_streak_end_week = EXCLUDED.all_time_longest_win_streak_end_week,
            all_time_longest_lose_streak = EXCLUDED.all_time_longest_lose_streak,
            all_time_longest_lose_streak_start_season = EXCLUDED.all_time_longest_lose_streak_start_season,
            all_time_longest_lose_streak_start_week = EXCLUDED.all_time_longest_lose_streak_start_week,
            all_time_longest_lose_streak_end_season = EXCLUDED.all_time_longest_lose_streak_end_season,
            all_time_longest_lose_streak_end_week = EXCLUDED.all_time_longest_lose_streak_end_week,
            career_total_wins = EXCLUDED.career_total_wins,
            career_total_losses = EXCLUDED.career_total_losses,
            career_total_ties = EXCLUDED.career_total_ties,
            career_regular_season_wins = EXCLUDED.career_regular_season_wins,
            career_regular_season_losses = EXCLUDED.career_regular_season_losses,
            career_playoff_wins = EXCLUDED.career_playoff_wins,
            career_playoff_losses = EXCLUDED.career_playoff_losses,
            last_updated = CURRENT_TIMESTAMP;

        -- Return status
        ret_manager_id := v_manager.manager_id;
        ret_streak_scope := v_scope;
        ret_current_streak_type := v_current_streak_type;
        ret_current_streak_length := v_current_streak_length;
        ret_status := 'SUCCESS';
        RETURN NEXT;
    END LOOP;
END;
$function$;
