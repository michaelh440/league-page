-- 2026-07-16  Let a video be attached to Preseason / Draft / Post Season / Miscellaneous
--             as well as a numbered week.
--
-- weekly_summary_videos.week was `integer NOT NULL` with UNIQUE (season_id, week), so a
-- video could only ever be pinned to a numbered week. Rather than smuggle the new
-- categories in as sentinel week numbers (0 = preseason, -1 = draft, ...) -- which is
-- opaque and would cap Miscellaneous at one video per season -- add an explicit
-- category and let week be NULL for everything that isn't a week.
--
-- Multiplicity: one video per numbered week per season (the existing rule, preserved by
-- the partial unique index). The non-week categories are unconstrained -- Miscellaneous
-- plainly needs several, and there is no reason to cap Draft or Post Season at one.

-- 1. The category. Existing rows are all numbered-week videos, so the default backfills
--    them correctly.
ALTER TABLE weekly_summary_videos
    ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'week';

ALTER TABLE weekly_summary_videos
    DROP CONSTRAINT IF EXISTS weekly_summary_videos_category_check;
ALTER TABLE weekly_summary_videos
    ADD CONSTRAINT weekly_summary_videos_category_check
    CHECK (category IN ('preseason', 'draft', 'week', 'postseason', 'misc'));

-- 2. week is only meaningful for category = 'week'.
ALTER TABLE weekly_summary_videos ALTER COLUMN week DROP NOT NULL;

ALTER TABLE weekly_summary_videos
    DROP CONSTRAINT IF EXISTS weekly_summary_videos_week_matches_category;
ALTER TABLE weekly_summary_videos
    ADD CONSTRAINT weekly_summary_videos_week_matches_category
    CHECK (
        (category = 'week'  AND week IS NOT NULL)
     OR (category <> 'week' AND week IS NULL)
    );

-- 3. UNIQUE (season_id, week) can't survive nullable weeks (NULLs don't conflict, so it
--    would silently stop guarding anything meaningful). Replace it with a partial unique
--    index that says what was actually intended: one video per numbered week per season.
ALTER TABLE weekly_summary_videos
    DROP CONSTRAINT IF EXISTS weekly_summary_videos_season_id_week_key;

DROP INDEX IF EXISTS weekly_summary_videos_one_per_week;
CREATE UNIQUE INDEX weekly_summary_videos_one_per_week
    ON weekly_summary_videos (season_id, week)
    WHERE category = 'week';
