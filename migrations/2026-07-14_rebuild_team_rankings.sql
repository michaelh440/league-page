-- 2026-07-14 — Rebuild per-week regular-season team_rankings from matchups/weekly_scoring.
--
-- team_rankings holds one cumulative row per (season_id, week, manager_id) — the standings
-- THROUGH that week: reg_season_rank, W/L/T, points for/against, week-over-week rank change.
-- This lets the standings / reg-season views show live, partial data as weeks are loaded,
-- without touching historical_rankings (which stays final-only). Playoff_rank / final_rank
-- are left as-is (set separately once playoffs are complete).
--
-- Idempotent: recomputes every week that has matchups for the season on each call.

CREATE OR REPLACE FUNCTION public.rebuild_reg_season_team_rankings(p_season_id integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    wk INTEGER;
    weeks_done INTEGER := 0;
BEGIN
    -- Rebuild only the regular-season ranking rows we own; keep any rows for weeks with
    -- no matchups untouched.
    DELETE FROM team_rankings
    WHERE season_id = p_season_id
      AND week IN (SELECT DISTINCT week FROM matchups WHERE season_id = p_season_id);

    FOR wk IN SELECT DISTINCT week FROM matchups WHERE season_id = p_season_id ORDER BY week
    LOOP
        INSERT INTO team_rankings (
            season_id, week, team_id, reg_season_rank,
            wins, losses, ties, points_for, points_against, is_playoff_eligible
        )
        WITH cume AS (
            SELECT
                manager_id,
                SUM(win)  AS wins,
                SUM(loss) AS losses,
                SUM(tie)  AS ties,
                SUM(pf)   AS points_for,
                SUM(pa)   AS points_against
            FROM (
                SELECT team1_id AS manager_id,
                    CASE WHEN team1_score > team2_score THEN 1 ELSE 0 END AS win,
                    CASE WHEN team1_score < team2_score THEN 1 ELSE 0 END AS loss,
                    CASE WHEN team1_score = team2_score THEN 1 ELSE 0 END AS tie,
                    team1_score AS pf, team2_score AS pa
                FROM matchups
                WHERE season_id = p_season_id AND week <= wk
                  AND team1_score IS NOT NULL AND team2_score IS NOT NULL
                UNION ALL
                SELECT team2_id,
                    CASE WHEN team2_score > team1_score THEN 1 ELSE 0 END,
                    CASE WHEN team2_score < team1_score THEN 1 ELSE 0 END,
                    CASE WHEN team2_score = team1_score THEN 1 ELSE 0 END,
                    team2_score, team1_score
                FROM matchups
                WHERE season_id = p_season_id AND week <= wk
                  AND team1_score IS NOT NULL AND team2_score IS NOT NULL
            ) g
            GROUP BY manager_id
        ),
        ranked AS (
            SELECT c.*, ROW_NUMBER() OVER (ORDER BY c.wins DESC, c.points_for DESC) AS rnk
            FROM cume c
        )
        SELECT p_season_id, wk, manager_id, rnk,
               wins, losses, ties, points_for, points_against, (rnk <= 8)
        FROM ranked;

        weeks_done := weeks_done + 1;
    END LOOP;

    -- Week-over-week regular-season rank change
    UPDATE team_rankings tr
    SET wow_reg_season_rank_change = prev.reg_season_rank - tr.reg_season_rank
    FROM team_rankings prev
    WHERE tr.season_id = p_season_id
      AND prev.season_id = p_season_id
      AND prev.team_id = tr.team_id
      AND prev.week = tr.week - 1;

    RETURN weeks_done;
END;
$function$;
