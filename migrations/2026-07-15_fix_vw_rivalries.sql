-- 2026-07-15  Rebuild vw_rivalries as a live view over matchups + playoffs.
--
-- Two separate defects, both fixed here by removing the precomputed tables from the path:
--
-- 1. STALE DATA (the user-visible bug). The view read the precomputed `rivalries` and
--    `rivalries_all_time` tables. Nothing rebuilds them: rivalries_all_time summed to
--    683 games against 834 actually played, and rivalries.last_updated was 2025-09-26 --
--    before the 2025 season finished. So the rivalries pages were missing a full season.
--
-- 2. WRONG ID CONVENTION. rivalries_all_time.team1_id/team2_id hold **manager_id**
--    (values 1..21), but the view joined them to teams.team_id:
--
--        JOIN teams t1 ON t1.team_id = ra.team1_id
--        JOIN managers m1 ON m1.manager_id = t1.manager_id
--
--    Because manager ids (1-23) are all valid team ids (1-106), that resolved to a real
--    but wrong manager: only 28/146 rows named the correct pair, and it emitted at least
--    one rivalry of a manager against himself (ra.team2_id = 9 -> team_id 9, which
--    manager 1 owns -> "Jose vs Jose"). Only the *_name columns were affected -- both
--    pages resolve names client-side from manager_id -- so this was latent, not visible.
--
-- Also fixed:
--   * The season scope's team1_id/team2_id came from an unordered
--     (SELECT t.team_id FROM teams WHERE manager_id = ... LIMIT 1) -- an arbitrary
--     season's team. Both scopes now expose manager_id consistently.
--   * Display names no longer fall back to real_name, which is '?' for some managers.
--
-- Contract preserved: same 14 columns, same names, same types, same canonical
-- one-row-per-pair shape (team1_id < team2_id). Both pages work unchanged.
--
-- The `rivalries` and `rivalries_all_time` tables are now unused by this view. They are
-- left in place rather than dropped -- decide separately whether anything else needs them.

DROP VIEW IF EXISTS vw_rivalries;

CREATE VIEW vw_rivalries AS
WITH games AS (
    -- One row per completed game, with the pair canonicalised so a matchup is counted
    -- once regardless of which side was stored as team1.
    -- NOTE: matchups/playoffs team1_id/team2_id hold manager_id, not team_id.
    SELECT m.season_id,
           LEAST(m.team1_id, m.team2_id)    AS m1,
           GREATEST(m.team1_id, m.team2_id) AS m2,
           CASE WHEN m.team1_score > m.team2_score THEN m.team1_id
                WHEN m.team2_score > m.team1_score THEN m.team2_id
           END AS winner
    FROM matchups m
    WHERE m.team1_score IS NOT NULL AND m.team2_score IS NOT NULL
      AND m.team1_id IS NOT NULL AND m.team2_id IS NOT NULL
      AND m.team1_id <> m.team2_id

    UNION ALL

    SELECT p.season_id,
           LEAST(p.team1_id, p.team2_id),
           GREATEST(p.team1_id, p.team2_id),
           CASE WHEN p.team1_score > p.team2_score THEN p.team1_id
                WHEN p.team2_score > p.team1_score THEN p.team2_id
           END
    FROM playoffs p
    WHERE p.team1_score IS NOT NULL AND p.team2_score IS NOT NULL
      AND p.team1_id IS NOT NULL AND p.team2_id IS NOT NULL
      AND p.team1_id <> p.team2_id
),
agg AS (
    SELECT 'season'::text AS scope,
           g.season_id,
           g.m1, g.m2,
           COUNT(*)::integer                                   AS games_played,
           COUNT(*) FILTER (WHERE g.winner = g.m1)::integer    AS m1_wins,
           COUNT(*) FILTER (WHERE g.winner = g.m2)::integer    AS m2_wins,
           COUNT(*) FILTER (WHERE g.winner IS NULL)::integer   AS ties
    FROM games g
    GROUP BY g.season_id, g.m1, g.m2

    UNION ALL

    SELECT 'all_time'::text,
           NULL::integer,
           g.m1, g.m2,
           COUNT(*)::integer,
           COUNT(*) FILTER (WHERE g.winner = g.m1)::integer,
           COUNT(*) FILTER (WHERE g.winner = g.m2)::integer,
           COUNT(*) FILTER (WHERE g.winner IS NULL)::integer
    FROM games g
    GROUP BY g.m1, g.m2
)
SELECT a.scope,
       a.season_id,
       a.m1 AS team1_id,          -- manager_id (name kept for the existing consumers)
       a.m2 AS team2_id,          -- manager_id
       COALESCE(mg1.team_alias, mg1.username)::text AS team1_name,
       COALESCE(mg2.team_alias, mg2.username)::text AS team2_name,
       mg1.username::text AS manager1_username,
       mg2.username::text AS manager2_username,
       a.games_played,
       a.m1_wins AS team1_wins,
       a.m2_wins AS team2_wins,
       a.ties,
       ROUND(CASE WHEN a.games_played > 0
                  THEN a.m1_wins::numeric / a.games_played::numeric * 100
                  ELSE 0 END, 2) AS team1_win_pct,
       ROUND(CASE WHEN a.games_played > 0
                  THEN a.m2_wins::numeric / a.games_played::numeric * 100
                  ELSE 0 END, 2) AS team2_win_pct
FROM agg a
JOIN managers mg1 ON mg1.manager_id = a.m1
JOIN managers mg2 ON mg2.manager_id = a.m2;
