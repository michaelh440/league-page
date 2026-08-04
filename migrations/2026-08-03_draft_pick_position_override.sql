-- 2026-08-03  Manual position override for draft picks.
--
-- draft_picks_with_details resolves each pick's position by matching player_name against
-- nfl_players.player_name, then colors it via position_colors. That name match fails for
-- ~87 picks (name suffixes "Jr./Sr.", punctuation/nicknames "DJ" vs "D.J.", full-team
-- defense names "Arizona Cardinals" that the city-only DEF check misses, and players not
-- in nfl_players at all). Those picks fall back to a near-white default and read as
-- "uncolored" on the drafts page. The 9 Yahoo seasons have no reliable player_id to fix
-- this automatically, so add a per-pick override the admin can set by hand.
--
-- resolution order in the view: manual override -> full-team-name defense -> city-name
-- defense -> nfl_players name match.

ALTER TABLE draft_picks ADD COLUMN IF NOT EXISTS position text;

ALTER TABLE draft_picks DROP CONSTRAINT IF EXISTS draft_picks_position_check;
ALTER TABLE draft_picks ADD CONSTRAINT draft_picks_position_check
  CHECK (position IS NULL OR position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DEF'));

CREATE OR REPLACE VIEW draft_picks_with_details AS
WITH resolved AS (
  SELECT dp.pick_id, dp.draft_id, dp.pick_number, dp.round_number, dp.pick_in_round,
         dp.manager_id, dp.team_id, dp.player_id, dp.player_name, dp.manager_name,
         dp.player_nfl_team, dp.pick_time, dp.trade_notes,
         COALESCE(
           dp.position,                                       -- manual override wins
           CASE WHEN dp.player_name = ANY (ARRAY[             -- defense drafted by full team name
                  'Arizona Cardinals','Atlanta Falcons','Baltimore Ravens','Buffalo Bills',
                  'Carolina Panthers','Chicago Bears','Cincinnati Bengals','Cleveland Browns',
                  'Dallas Cowboys','Denver Broncos','Detroit Lions','Green Bay Packers',
                  'Houston Texans','Indianapolis Colts','Jacksonville Jaguars','Kansas City Chiefs',
                  'Las Vegas Raiders','Los Angeles Chargers','Los Angeles Rams','Miami Dolphins',
                  'Minnesota Vikings','New England Patriots','New Orleans Saints','New York Giants',
                  'New York Jets','Philadelphia Eagles','Pittsburgh Steelers','San Francisco 49ers',
                  'Seattle Seahawks','Tampa Bay Buccaneers','Tennessee Titans','Washington Commanders'])
                THEN 'DEF' END,
           CASE WHEN dp.player_name = ANY (ARRAY[             -- defense drafted by city name
                  'Cincinnati','Denver','Arizona','Seattle','Tampa Bay','Baltimore','Buffalo',
                  'Carolina','Chicago','Cleveland','Dallas','Detroit','Green Bay','Houston',
                  'Indianapolis','Jacksonville','Kansas City','Las Vegas','Los Angeles','Miami',
                  'Minnesota','New England','New Orleans','New York','Philadelphia','Pittsburgh',
                  'San Francisco','Tennessee','Washington'])
                THEN 'DEF' END,
           np.position                                        -- nfl_players name match
         ) AS position
  FROM draft_picks dp
  LEFT JOIN (
    SELECT DISTINCT ON (nfl_players.player_name) nfl_players.player_name, nfl_players.position
    FROM nfl_players
    WHERE nfl_players.position = ANY (ARRAY['QB','RB','WR','TE','K','DEF'])
    ORDER BY nfl_players.player_name,
      CASE nfl_players.position
        WHEN 'RB' THEN 1 WHEN 'WR' THEN 2 WHEN 'QB' THEN 3
        WHEN 'TE' THEN 4 WHEN 'K' THEN 5 WHEN 'DEF' THEN 6 ELSE NULL END
  ) np ON dp.player_name = np.player_name
)
SELECT r.pick_id, r.draft_id, r.pick_number, r.round_number, r.pick_in_round,
       r.manager_id, r.team_id, r.player_id, r.player_name, r.manager_name, r.player_nfl_team,
       r.position,
       COALESCE(pc.background_color, '#f8f9fa') AS background_color,
       COALESCE(pc.color_hex, '#000000') AS color_hex,
       r.pick_time, r.trade_notes
FROM resolved r
LEFT JOIN position_colors pc ON r.position = pc.position;
