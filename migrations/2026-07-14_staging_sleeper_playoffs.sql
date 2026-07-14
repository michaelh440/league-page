-- 2026-07-14 — Staging table for playoff matchups.
--
-- Playoff matchups are derived from Sleeper's winners/losers brackets. Rather than
-- deriving them at push time, the fetch stages them here (one row per bracket game),
-- so playoffs follow the same stage -> preview -> push flow as everything else and the
-- overview grid shows real staged counts. Kept separate from staging_sleeper_matchups so
-- process_sleeper_matchups (regular season) never sweeps these into the regular matchups.

CREATE TABLE IF NOT EXISTS staging_sleeper_playoffs (
    id SERIAL PRIMARY KEY,
    sleeper_league_id TEXT,
    season_year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    sleeper_matchup_id TEXT,          -- bracket match id (m)
    team1_manager_id INTEGER,
    team1_name TEXT,
    team2_manager_id INTEGER,
    team2_name TEXT,
    team1_score NUMERIC,
    team2_score NUMERIC,
    bracket TEXT,                      -- Championship | Consolation
    round_name TEXT,                   -- Semi Final | Championship | 3rd Place | ...
    raw_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    mapped_playoff_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Sleeper numbers the winners and losers brackets independently (both have m=1, m=2),
    -- so bracket must be part of the key or Consolation games overwrite Championship ones.
    UNIQUE (season_year, week, bracket, sleeper_matchup_id)
);
