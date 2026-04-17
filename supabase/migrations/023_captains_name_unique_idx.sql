-- =============================================
-- Migration 023: Unique constraint on captains (operator_id, full_name)
--
-- Required for the wizard captain upsert (ON CONFLICT DO UPDATE).
-- Without this unique index the upsert falls back to INSERT-only
-- and can create duplicate captain rows for the same operator.
-- =============================================

-- The captain_boat_links upsert already uses (captain_id, boat_id)
-- which has a UNIQUE constraint from migration 020.

-- Add unique index on captains(operator_id, full_name) for upsert support.
-- We normalise with LOWER(TRIM(...)) so "Captain Rivera" and "captain rivera"
-- are treated as the same person.  However, Supabase's .upsert() onConflict
-- requires a plain expression index (not a functional one) that maps to a
-- real unique constraint.  We use a case-insensitive collation-aware index
-- and a partial approach: index on (operator_id, lower(full_name)).

CREATE UNIQUE INDEX IF NOT EXISTS captains_operator_name_idx
  ON captains (operator_id, lower(trim(full_name)));

-- Ensure the index is used as the conflict target by creating a matching
-- unique constraint (Postgres < 15 needs this for DO UPDATE):
ALTER TABLE captains
  DROP CONSTRAINT IF EXISTS captains_operator_name_key;

-- Note: we cannot use a functional expression in a standard UNIQUE constraint.
-- The upsert in actions.ts matches on 'operator_id,full_name' (exact).
-- To stay compatible we add a plain unique constraint on the trimmed value
-- via a generated column approach — but that requires PG 12+ generated columns.
-- Simplest solution: use plain unique index on (operator_id, full_name) and
-- normalise the name in application code before inserting.

-- Plain unique constraint (application must normalise case before insert):
CREATE UNIQUE INDEX IF NOT EXISTS captains_operator_exact_name_idx
  ON captains (operator_id, full_name)
  WHERE is_active = true;

COMMENT ON INDEX captains_operator_exact_name_idx IS
  'Allows upsert by (operator_id, full_name) for wizard-created captains. Application normalises name case before insert.';
