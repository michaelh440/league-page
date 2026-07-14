-- 2026-07-14 — Fix manager/team logos for Sleeper seasons.
--
-- process_sleeper_users stored the raw Sleeper avatar id (e.g. "8eb8f8bf...") in
-- manager_team_names.logo_url, which isn't a usable URL, so no logo rendered on the
-- 2025 pages. Managers already have a local image in managers.logo_url (e.g.
-- "/managers/Bailey.png"), same as the Yahoo seasons. Prefer that; fall back to the
-- full Sleeper avatar CDN URL when a manager has no local image.

CREATE OR REPLACE FUNCTION public.process_sleeper_users()
 RETURNS TABLE(records_processed integer, success boolean, message text)
 LANGUAGE plpgsql
AS $function$
DECLARE
    managers_updated INTEGER := 0;
    team_names_updated INTEGER := 0;
    v_season_year INTEGER;
BEGIN
    SELECT DISTINCT season_year INTO v_season_year
    FROM staging_sleeper_users WHERE processed = FALSE LIMIT 1;

    IF v_season_year IS NULL THEN
        RETURN QUERY SELECT 0, FALSE, 'No season year found'::TEXT;
        RETURN;
    END IF;

    -- Link managers to their sleeper_user_id (only where already associated)
    WITH deduplicated AS (
        SELECT ssu.sleeper_user_id,
               ROW_NUMBER() OVER (PARTITION BY ssu.sleeper_user_id ORDER BY ssu.id DESC) as rn
        FROM staging_sleeper_users ssu
        WHERE ssu.processed = FALSE AND ssu.sleeper_user_id IS NOT NULL
    )
    UPDATE managers m
    SET sleeper_user_id = d.sleeper_user_id
    FROM deduplicated d
    WHERE d.rn = 1
        AND (m.sleeper_user_id IS NULL OR m.sleeper_user_id = d.sleeper_user_id)
        AND EXISTS (SELECT 1 FROM managers WHERE sleeper_user_id = d.sleeper_user_id AND manager_id = m.manager_id);

    GET DIAGNOSTICS managers_updated = ROW_COUNT;

    -- Upsert season-specific team names + logos. Prefer the manager's local image;
    -- fall back to the Sleeper avatar CDN URL.
    WITH deduplicated AS (
        SELECT ssu.sleeper_user_id,
            COALESCE(ssu.raw_data->'metadata'->>'team_name', ssu.display_name, ssu.username) as team_name,
            ssu.avatar as sleeper_avatar,
            ROW_NUMBER() OVER (PARTITION BY ssu.sleeper_user_id ORDER BY ssu.id DESC) as rn
        FROM staging_sleeper_users ssu
        WHERE ssu.processed = FALSE AND ssu.sleeper_user_id IS NOT NULL
    )
    INSERT INTO manager_team_names (manager_id, season_year, team_name, logo_url)
    SELECT
        m.manager_id,
        v_season_year,
        d.team_name,
        COALESCE(
            m.logo_url,
            CASE WHEN d.sleeper_avatar IS NOT NULL
                 THEN 'https://sleepercdn.com/avatars/' || d.sleeper_avatar END
        )
    FROM deduplicated d
    JOIN managers m ON m.sleeper_user_id = d.sleeper_user_id
    WHERE d.rn = 1
    ON CONFLICT (manager_id, season_year)
    DO UPDATE SET team_name = EXCLUDED.team_name, logo_url = EXCLUDED.logo_url;

    GET DIAGNOSTICS team_names_updated = ROW_COUNT;

    UPDATE staging_sleeper_users SET processed = TRUE WHERE processed = FALSE;

    RETURN QUERY SELECT team_names_updated, TRUE,
        format('Updated %s manager team names for season %s', team_names_updated, v_season_year)::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 0, FALSE, SQLERRM::TEXT;
END;
$function$;

-- One-time backfill: replace raw avatar-id logos already stored with the local image
-- (or the Sleeper CDN URL) so existing seasons render correctly.
UPDATE manager_team_names mtn
SET logo_url = COALESCE(m.logo_url, 'https://sleepercdn.com/avatars/' || mtn.logo_url)
FROM managers m
WHERE m.manager_id = mtn.manager_id
  AND mtn.logo_url IS NOT NULL
  AND mtn.logo_url NOT LIKE '/%'
  AND mtn.logo_url NOT LIKE 'http%';
