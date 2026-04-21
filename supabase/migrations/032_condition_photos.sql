-- ============================================================
-- Migration 032 — Condition Photos, Return Inspection, Seasonal Promo
-- Phase 4E: completes multi-day rental use case
-- Reference: RESORT_FLEET_ARCHITECTURE.md §4.1, §5.6, §8
-- ============================================================

-- ==========================================
-- ALTER: rental_days — condition photo arrays
-- ==========================================
-- Each element: { url: string, caption?: string, uploadedAt: string }
ALTER TABLE rental_days
  ADD COLUMN IF NOT EXISTS photos_in   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS photos_out  JSONB NOT NULL DEFAULT '[]';

-- ==========================================
-- ALTER: trips — return inspection record
-- ==========================================
-- Sealed at end of multi-day rental when guest submits final vessel condition
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS return_inspected_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_condition_notes    TEXT,
  ADD COLUMN IF NOT EXISTS return_condition_photos   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS return_fuel_level         TEXT
    CHECK (return_fuel_level IN ('full', '3/4', '1/2', '1/4', 'empty') OR return_fuel_level IS NULL),
  ADD COLUMN IF NOT EXISTS return_has_issues         BOOLEAN NOT NULL DEFAULT false;

-- Index: fast lookup of trips with pending return inspections
CREATE INDEX IF NOT EXISTS idx_trips_return_inspection
  ON trips(operator_id, trip_date)
  WHERE return_inspected_at IS NULL AND status != 'cancelled';

-- ==========================================
-- ALTER: operators — seasonal promo config
-- ==========================================
-- Operator configures their seasonal hook: "Lobster Season July 19-25"
-- Rendered on post-trip completed page as a rebook prompt
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS seasonal_promo_label  TEXT,        -- e.g. "Lobster Season"
  ADD COLUMN IF NOT EXISTS seasonal_promo_dates  TEXT,        -- e.g. "July 19–25"
  ADD COLUMN IF NOT EXISTS seasonal_promo_url    TEXT;        -- deeplink or booking URL

-- ==========================================
-- POLICY NOTE (Supabase Storage)
-- ==========================================
-- Bucket: condition-photos (already exists — private)
-- No SQL needed for bucket creation.
-- RLS policy on storage.objects for service_role is handled by default.
-- Signed URLs are generated server-side with 1hr TTL via:
--   supabase.storage.from('condition-photos').createSignedUrl(path, 3600)
