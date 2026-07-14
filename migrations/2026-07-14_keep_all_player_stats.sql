-- 2026-07-14 — Keep ALL player stats in the fantasy-stats tables.
--
-- The Sleeper data pipeline (/admin/data_pipeline) loads every NFL player's weekly
-- stats, including IDP / O-line / special-teams positions (DB, LB, OL, CB, DT, DE, ...).
-- The original position CHECK constraints only permitted QB/RB/WR/TE/K/DEF, which caused
-- ~1,500 of ~2,280 staged player-stat rows per week to be dropped on push.
--
-- These constraints were applied to the DEV database directly; run this on PRODUCTION
-- before/when promoting the pipeline so the same rows are retained there.

ALTER TABLE player_fantasy_stats  DROP CONSTRAINT IF EXISTS player_fantasy_stats_position_check;
ALTER TABLE playoff_fantasy_stats DROP CONSTRAINT IF EXISTS playoff_fantasy_stats_position_check;
