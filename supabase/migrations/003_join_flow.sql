-- Phase 3C: Guest Join Flow — Migration 003
-- Run: npx supabase db push
-- then: npx supabase gen types typescript --linked > apps/web/types/database.ts

-- Safety acknowledgments column
-- Stores each card the guest confirmed individually with timestamp
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS safety_acknowledgments
    JSONB DEFAULT '[]';

-- Waiver hash (ties signature to exact text guest signed)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS waiver_text_hash TEXT;

-- Non-swimmer flag (for captain snapshot)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_non_swimmer
    BOOLEAN NOT NULL DEFAULT false;

-- Seasickness prone flag (captain info)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS is_seasickness_prone
    BOOLEAN NOT NULL DEFAULT false;

-- Push subscription for PWA notifications
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS push_subscription
    JSONB DEFAULT NULL;

-- GDPR fields (required for EU guests)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS gdpr_consent
    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent
    BOOLEAN NOT NULL DEFAULT false;

-- Index for idempotency lookups (name + trip)
CREATE INDEX IF NOT EXISTS idx_guests_name_trip
  ON guests (trip_id, full_name)
  WHERE deleted_at IS NULL;
