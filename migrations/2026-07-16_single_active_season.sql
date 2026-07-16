-- 2026-07-16  Enforce exactly one active season, league-wide.
--
-- THE BUG: every mechanism that was supposed to keep a single active season scoped its
-- deactivation to `WHERE league_id = ...`. But this schema creates a NEW league row per
-- season (season 12 -> league 12, season 13 -> league 13; seasons.league_id is unique
-- per year in practice), so "all other seasons in this league" is always the empty set.
-- The mutual exclusion never deactivated anything. Three layers repeated the mistake:
--
--   1. trigger_deactivate_other_seasons -> deactivate_other_seasons()  (league-scoped,
--      and BEFORE UPDATE only, so INSERT ... is_active = true was never guarded at all)
--   2. deactivate_other_seasons(p_season_id, p_league_id)              (league-scoped;
--      dead code -- not called from the app -- dropped here)
--   3. the admin/seasons page actions                                  (league-scoped;
--      fixed in the app code alongside this migration)
--
-- Consumers read is_active globally (`SELECT ... FROM seasons WHERE is_active = true`,
-- `seasons.find(s => s.is_active)`), so global is the correct scope.
--
-- Zero active seasons stays legal (off-season); at most one is enforced.

-- 1. Normalise: keep only the newest active season if several are somehow active.
UPDATE seasons SET is_active = false
WHERE is_active IS TRUE
  AND season_id <> (
    SELECT season_id FROM seasons WHERE is_active IS TRUE
    ORDER BY season_year DESC, season_id DESC LIMIT 1
  );

-- 2. NULL is_active reads as "not active" everywhere; make that explicit so the
--    partial index and the app agree.
UPDATE seasons SET is_active = false WHERE is_active IS NULL;
ALTER TABLE seasons ALTER COLUMN is_active SET DEFAULT false;
ALTER TABLE seasons ALTER COLUMN is_active SET NOT NULL;

-- 3. Hard guarantee: at most one active season in the whole table.
DROP INDEX IF EXISTS seasons_only_one_active;
CREATE UNIQUE INDEX seasons_only_one_active
    ON seasons ((is_active))
    WHERE is_active;

-- 4. Fix the trigger: deactivate globally, and cover INSERT as well as UPDATE.
--    The nested UPDATE re-fires this trigger with NEW.is_active = false, which falls
--    through the IF, so there is no recursion.
--
--    KNOWN EDGE CASE: a single statement that activates several rows at once --
--    e.g. UPDATE seasons SET is_active = true WHERE season_id IN (11,12,13) -- fails
--    with "tuple to be updated was already modified by an operation triggered by the
--    current command". That is inherent to a BEFORE trigger writing sibling rows.
--    It is a safe failure (the statement aborts; no bad data lands), and the request
--    is incoherent anyway -- it asks for three active seasons. The admin UI only ever
--    activates one row at a time. Activate seasons one statement at a time.
CREATE OR REPLACE FUNCTION public.deactivate_other_seasons()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.is_active IS TRUE THEN
        UPDATE seasons
        SET is_active = FALSE
        WHERE is_active IS TRUE
          AND season_id IS DISTINCT FROM NEW.season_id;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_deactivate_other_seasons ON seasons;
CREATE TRIGGER trigger_deactivate_other_seasons
    BEFORE INSERT OR UPDATE ON seasons
    FOR EACH ROW
    WHEN (NEW.is_active IS TRUE)
    EXECUTE FUNCTION deactivate_other_seasons();

-- 5. Drop the league-scoped helper. Not referenced anywhere in the app, and its
--    signature bakes in the wrong scope.
DROP FUNCTION IF EXISTS public.deactivate_other_seasons(integer, integer);
