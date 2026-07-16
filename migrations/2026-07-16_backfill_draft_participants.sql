-- 2026-07-16  Backfill draft_participants for drafts that have picks but no participants.
--
-- The 2024 draft (draft_id 13, season 11) had 150 draft_picks but ZERO rows in
-- draft_participants. The previous-seasons draft grid builds its columns entirely from
-- draft_participants (one column per participant, ordered by draft_position) and matches
-- each pick to a column by manager_id -- so with no participants, no columns render and
-- all 150 picks have nowhere to land. The page looked empty even though the pick data
-- was intact.
--
-- Reconstruct the missing participants from round 1: in both snake and linear drafts,
-- round 1 has exactly one pick per manager and pick_in_round IS the draft slot. For
-- draft 13 that is a clean 10 picks / 10 distinct managers / 10 distinct positions.
--
-- team_id comes from the manager's team in that draft's season. Re-runnable: it only
-- touches drafts that currently have no participant rows, so applying it twice is a
-- no-op.

INSERT INTO draft_participants (draft_id, manager_id, team_id, draft_position)
SELECT r1.draft_id,
       r1.manager_id,
       t.team_id,
       r1.pick_in_round AS draft_position
FROM draft_picks r1
JOIN drafts d   ON d.draft_id = r1.draft_id
JOIN teams  t   ON t.season_id = d.season_id AND t.manager_id = r1.manager_id
WHERE r1.round_number = 1
  AND NOT EXISTS (
      SELECT 1 FROM draft_participants p WHERE p.draft_id = r1.draft_id
  )
ON CONFLICT (draft_id, manager_id) DO NOTHING;
