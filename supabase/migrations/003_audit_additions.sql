-- ==========================================
-- 003 — Audit additions
-- boat_photos table, trips lifecycle columns,
-- additional indexes, RLS for audit_log
-- ==========================================

-- ─── 1. boat_photos table ───
CREATE TABLE IF NOT EXISTS boat_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id       UUID NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  operator_id   UUID NOT NULL REFERENCES operators(id),
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_cover      BOOLEAN NOT NULL DEFAULT false,
  file_size     INT,
  width_px      INT,
  height_px     INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boat_photos_boat
  ON boat_photos(boat_id, display_order);

ALTER TABLE boat_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boat_photos_operator_owns" ON boat_photos;
CREATE POLICY "boat_photos_operator_owns"
  ON boat_photos FOR ALL
  USING (auth.uid() = operator_id);

DROP POLICY IF EXISTS "boat_photos_public_read" ON boat_photos;
CREATE POLICY "boat_photos_public_read"
  ON boat_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM boats
      WHERE boats.id = boat_id
      AND boats.is_active = true
    )
  );

-- ─── 2. Trips table additions ───
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS waiver_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS waiver_hash TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_by_captain TEXT,
  ADD COLUMN IF NOT EXISTS guest_count_at_start INT;

-- ─── 3. Additional indexes ───
CREATE INDEX IF NOT EXISTS idx_boats_type
  ON boats(boat_type);

CREATE INDEX IF NOT EXISTS idx_boats_operator_active
  ON boats(operator_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_trips_date_status
  ON trips(trip_date, status);

CREATE INDEX IF NOT EXISTS idx_trips_operator_upcoming
  ON trips(operator_id, trip_date)
  WHERE status = 'upcoming';

-- ─── 4. captain_license_type CHECK ───
-- Allow NULL (optional), constrain when set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'boats_captain_license_type_check'
  ) THEN
    ALTER TABLE boats ADD CONSTRAINT boats_captain_license_type_check
      CHECK (captain_license_type IS NULL OR captain_license_type IN (
        'oupv','master_25','master_50','master_100','master_200'
      ));
  END IF;
END $$;
