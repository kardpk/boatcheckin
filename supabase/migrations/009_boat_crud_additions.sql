-- ==========================================
-- 009_boat_crud_additions.sql
-- Soft-deactivation support for boats
-- ==========================================

-- Add soft-deactivation columns
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS deactivated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by  UUID REFERENCES operators(id);

-- Partial index: quickly find active boats for a given operator
CREATE INDEX IF NOT EXISTS idx_boats_active_only
  ON boats (operator_id)
  WHERE deactivated_at IS NULL AND is_active = true;

-- Comment for future maintainers
COMMENT ON COLUMN boats.deactivated_at IS 'Soft-deactivated timestamp; NULL = active';
COMMENT ON COLUMN boats.deactivated_by IS 'Operator who deactivated (for audit)';
