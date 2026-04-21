-- ============================================================
-- Migration 030 — Add-On Revenue Layer & Multi-Day Foundation
-- Phase 4C: addon_payment_mode, applicable_categories,
--           Stripe Connect columns, rental_days enhancements
-- ============================================================

-- ==========================================
-- ALTER: operators — addon payment mode + Stripe Connect
-- ==========================================
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded   BOOLEAN NOT NULL DEFAULT false,
  -- Three-mode payment control. DEFAULT 'external' is safe:
  -- operator must explicitly opt in to Stripe or Free.
  ADD COLUMN IF NOT EXISTS addon_payment_mode         TEXT NOT NULL DEFAULT 'external'
    CHECK (addon_payment_mode IN ('stripe', 'external', 'free'));

-- ==========================================
-- ALTER: guest_addon_orders — payment tracking + external ref
-- ==========================================
ALTER TABLE guest_addon_orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id           TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee_cents         INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_captured_at        TIMESTAMPTZ,
  -- Carries FH booking ref or trip code for external billing traceability
  ADD COLUMN IF NOT EXISTS external_reference         TEXT;

-- ==========================================
-- ALTER: property_codes — category-scoped discounts
-- ==========================================
ALTER TABLE property_codes
  -- NULL = applies to all addon categories
  -- Non-null = applies only to matching categories
  -- e.g. ARRAY['food','beverage'] = hotel rate on F&B only
  ADD COLUMN IF NOT EXISTS applicable_categories      TEXT[];

-- ==========================================
-- INDEX: trips — efficient tomorrow/date-range board queries
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_trips_date_operator
  ON trips(operator_id, trip_date)
  WHERE status != 'cancelled';

-- ==========================================
-- ALTER: rental_days — promoted text columns for easier querying
-- (condition_in/condition_out JSONB still available for structured data)
-- ==========================================
ALTER TABLE rental_days
  ADD COLUMN IF NOT EXISTS submitted_by_guest_id  UUID REFERENCES guests(id),
  ADD COLUMN IF NOT EXISTS notes_in               TEXT,
  ADD COLUMN IF NOT EXISTS notes_out              TEXT,
  ADD COLUMN IF NOT EXISTS fuel_level_in          TEXT
    CHECK (fuel_level_in IN ('full','3/4','1/2','1/4','empty') OR fuel_level_in IS NULL),
  ADD COLUMN IF NOT EXISTS fuel_level_out         TEXT
    CHECK (fuel_level_out IN ('full','3/4','1/2','1/4','empty') OR fuel_level_out IS NULL);

-- ==========================================
-- INDEX: guest_addon_orders — payment status queries
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_addon_orders_payment
  ON guest_addon_orders(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_addon_orders_external_ref
  ON guest_addon_orders(external_reference)
  WHERE external_reference IS NOT NULL;
