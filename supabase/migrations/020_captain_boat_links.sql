-- =============================================
-- Migration 020: Captain-Boat Links + Role + Data Fix
--
-- 1. captain_boat_links  — many-to-many linkage
-- 2. default_role        — on captains table
-- 3. Data fix            — dedup + single default
-- =============================================


-- ─────────────────────────────────────────────
-- 1. CAPTAIN-BOAT LINKS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captain_boat_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id  UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  boat_id     UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (captain_id, boat_id)
);

CREATE INDEX IF NOT EXISTS idx_captain_boat_links_captain
  ON captain_boat_links(captain_id);
CREATE INDEX IF NOT EXISTS idx_captain_boat_links_boat
  ON captain_boat_links(boat_id);
CREATE INDEX IF NOT EXISTS idx_captain_boat_links_operator
  ON captain_boat_links(operator_id);


-- ─────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE captain_boat_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "captain_boat_links_operator" ON captain_boat_links;
CREATE POLICY "captain_boat_links_operator" ON captain_boat_links
  FOR ALL USING (auth.uid() = operator_id);


-- ─────────────────────────────────────────────
-- 3. DEFAULT ROLE ON CAPTAINS
-- ─────────────────────────────────────────────
ALTER TABLE captains ADD COLUMN IF NOT EXISTS default_role TEXT
  NOT NULL DEFAULT 'captain'
  CHECK (default_role IN ('captain', 'first_mate', 'crew', 'deckhand'));


-- ─────────────────────────────────────────────
-- 4. AUTO-LINK: existing boats.captain_name → captains
-- ─────────────────────────────────────────────
INSERT INTO captain_boat_links (captain_id, boat_id, operator_id)
SELECT c.id, b.id, c.operator_id
FROM captains c
JOIN boats b ON b.operator_id = c.operator_id
  AND LOWER(TRIM(b.captain_name)) = LOWER(TRIM(c.full_name))
WHERE b.is_active = true
  AND c.is_active = true
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────
-- 5. DATA FIX: Deduplicate captains
--    Keep the newest entry per (operator, name), deactivate older ones
-- ─────────────────────────────────────────────
WITH dupes AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY operator_id, LOWER(TRIM(full_name))
      ORDER BY created_at DESC
    ) AS rn
  FROM captains
  WHERE is_active = true
)
UPDATE captains SET is_active = false
WHERE id IN (SELECT id FROM dupes WHERE rn > 1);


-- ─────────────────────────────────────────────
-- 6. DATA FIX: Only 1 default per operator
--    Keep the first-created captain as default
-- ─────────────────────────────────────────────
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY operator_id
      ORDER BY created_at ASC
    ) AS rn
  FROM captains
  WHERE is_active = true AND is_default = true
)
UPDATE captains SET is_default = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);


-- ─────────────────────────────────────────────
-- 7. COMMENTS
-- ─────────────────────────────────────────────
COMMENT ON TABLE captain_boat_links IS
  'Many-to-many: which captains/crew are linked to which boats. Used for roster display and smart defaults.';

COMMENT ON COLUMN captains.default_role IS
  'The crew member''s default role (captain, first_mate, crew, deckhand). Used for roster grouping and trip assignment defaults.';
