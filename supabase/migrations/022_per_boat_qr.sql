-- ==========================================
-- Migration 022: Per-Boat QR Code Support
--
-- Adds a public_slug to boats — a stable, unguessable 32-char hex slug
-- used in the permanent QR URL: boatcheckin.com/board/[public_slug]
-- Captains print once, laminate, affix to vessel. Never changes.
--
-- Also adds an index to speed up "trips for this boat today" queries
-- that power the /board/[publicSlug] routing logic.
-- ==========================================

BEGIN;

-- 1. Add public_slug column to boats (nullable first for backfill)
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

-- 2. Backfill existing boats with a random 32-char hex slug
--    encode(gen_random_bytes(16), 'hex') = 32 hex chars = 128 bits of entropy
UPDATE boats
  SET public_slug = encode(gen_random_bytes(16), 'hex')
  WHERE public_slug IS NULL;

-- 3. Make it NOT NULL and add UNIQUE constraint going forward
ALTER TABLE boats
  ALTER COLUMN public_slug SET NOT NULL;

ALTER TABLE boats
  ADD CONSTRAINT boats_public_slug_unique UNIQUE (public_slug);

-- 4. Auto-generate public_slug on INSERT if caller doesn't supply one
CREATE OR REPLACE FUNCTION set_boat_public_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_slug IS NULL OR NEW.public_slug = '' THEN
    NEW.public_slug := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boat_public_slug ON boats;
CREATE TRIGGER trg_boat_public_slug
  BEFORE INSERT ON boats
  FOR EACH ROW
  EXECUTE FUNCTION set_boat_public_slug();

-- 5. Fast lookup index: /board/[publicSlug] resolves boat in one hit
CREATE INDEX IF NOT EXISTS idx_boats_public_slug
  ON boats (public_slug)
  WHERE is_active = true;

-- 6. Fast lookup for "trips on this boat today" query
--    Powers the routing logic: no trips / one trip / many trips
CREATE INDEX IF NOT EXISTS idx_trips_boat_date_status
  ON trips (boat_id, trip_date, status)
  WHERE status IN ('upcoming', 'active');

-- 7. RLS: public_slug is exposed via the existing public read policy on boats
--    (boats_public_read: SELECT WHERE is_active = true)
--    No new policy needed — the column is included in SELECT *.

COMMIT;

-- Post-migration verification queries (run manually to confirm):
-- SELECT COUNT(*) FROM boats WHERE public_slug IS NULL;          → 0
-- SELECT LENGTH(public_slug) FROM boats LIMIT 5;                 → all 32
-- EXPLAIN SELECT * FROM trips WHERE boat_id = '...'
--   AND trip_date = CURRENT_DATE AND status IN ('upcoming','active');
--   → should index scan on idx_trips_boat_date_status
