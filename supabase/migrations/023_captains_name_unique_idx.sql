-- =============================================
-- Migration 023 (REVISED): Captains unique index
--
-- Problem: migration 017 copied boats.captain_name → captains and created
-- duplicate (operator_id, full_name) pairs.  We must deduplicate BEFORE
-- adding the unique index or the index creation will fail.
--
-- Steps:
--   1. Remove hard duplicates (keep newest, discard older copies)
--   2. Create partial unique index on active rows
-- =============================================

-- ─────────────────────────────────────────────
-- 1. Deduplicate captains table
--    Keep the NEWEST row per (operator_id, lower(trim(full_name)))
--    Hard-delete the older duplicates that have NO trip assignments.
-- ─────────────────────────────────────────────

-- Identify the IDs to keep (newest per normalised name per operator)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY operator_id, lower(trim(full_name))
      ORDER BY created_at DESC
    ) AS rn
  FROM captains
),
keep_ids AS (
  SELECT id FROM ranked WHERE rn = 1
),
-- Identify the duplicates that are safe to delete
-- (no trip_assignments referencing them)
safe_to_delete AS (
  SELECT c.id
  FROM captains c
  LEFT JOIN ranked r ON r.id = c.id
  LEFT JOIN trip_assignments ta ON ta.captain_id = c.id
  WHERE r.rn > 1           -- it's a duplicate
    AND ta.id IS NULL      -- no trip assignment references it
)
DELETE FROM captains
WHERE id IN (SELECT id FROM safe_to_delete);

-- For any remaining duplicates that DO have trip assignments,
-- soft-delete them so the unique index (partial on is_active=true)
-- doesn't conflict.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY operator_id, lower(trim(full_name))
      ORDER BY created_at DESC
    ) AS rn
  FROM captains
  WHERE is_active = true
)
UPDATE captains
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- ─────────────────────────────────────────────
-- 2. Add partial unique index on active rows
--    Scoped to is_active = true so deactivated records
--    never conflict with newly created ones.
-- ─────────────────────────────────────────────

-- Drop old indexes if they were partially created before this migration failed
DROP INDEX IF EXISTS captains_operator_name_idx;
DROP INDEX IF EXISTS captains_operator_exact_name_idx;

-- Create the unique partial index
-- The upsert in actions.ts uses onConflict: 'operator_id,full_name'
-- which Supabase maps to this index.
CREATE UNIQUE INDEX captains_operator_name_idx
  ON captains (operator_id, full_name)
  WHERE is_active = true;

COMMENT ON INDEX captains_operator_name_idx IS
  'Unique per active captain name per operator. Used by wizard upsert (ON CONFLICT DO UPDATE). Soft-deleted captains are excluded (is_active = false).';
