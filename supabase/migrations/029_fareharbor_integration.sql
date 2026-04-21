-- ============================================================
-- Migration 029 — FareHarbor Integration & Fleet Operations
-- Phase 4B: integrations, webhook_events, property_codes,
--           rental_days, fulfillment tracking, addon categories
-- ============================================================

-- ==========================================
-- TABLE: integrations (booking platform connections)
-- ==========================================
CREATE TABLE integrations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id               UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  platform                  TEXT NOT NULL
                            CHECK (platform IN ('fareharbor','rezdy','bookeo','checkfront','manual')),
  webhook_secret            TEXT NOT NULL,             -- HMAC key, shown ONCE on creation
  webhook_endpoint_token    TEXT NOT NULL,             -- URL token: /api/webhooks/[platform]/[token]
  api_key                   TEXT,                     -- future: encrypted pull-API key
  boat_name_map             JSONB NOT NULL DEFAULT '{}', -- {"FH boat name": "boat-uuid"}
  auto_create_trips         BOOLEAN NOT NULL DEFAULT true,
  auto_send_link            BOOLEAN NOT NULL DEFAULT true,
  link_delay_hours          INT NOT NULL DEFAULT 0,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  last_event_at             TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_operator  ON integrations(operator_id);
CREATE INDEX idx_integrations_platform  ON integrations(platform, is_active);
CREATE UNIQUE INDEX idx_integrations_token ON integrations(webhook_endpoint_token);

-- ==========================================
-- TABLE: webhook_events (immutable inbound log)
-- ==========================================
CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id  UUID REFERENCES integrations(id),
  operator_id     UUID REFERENCES operators(id),
  platform        TEXT NOT NULL,
  event_type      TEXT NOT NULL,    -- 'booking.confirmed', 'booking.cancelled', 'booking.modified'
  external_ref    TEXT,             -- platform's booking ID
  payload         JSONB NOT NULL,   -- raw payload (never mutated)
  trip_id         UUID REFERENCES trips(id),
  processed       BOOLEAN NOT NULL DEFAULT false,
  error_message   TEXT,
  retry_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_integration ON webhook_events(integration_id, created_at DESC);
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(processed, created_at)
  WHERE processed = false;
CREATE INDEX idx_webhook_events_ref ON webhook_events(external_ref, platform);

-- ==========================================
-- TABLE: property_codes (hotel/marina discounts)
-- ==========================================
CREATE TABLE property_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  boat_id         UUID REFERENCES boats(id) ON DELETE CASCADE, -- NULL = all operator boats
  code            TEXT NOT NULL,
  description     TEXT,          -- "Hotel guest rate", "Marina member"
  discount_type   TEXT NOT NULL
                  CHECK (discount_type IN ('percent','fixed_cents','unlock_addons')),
  discount_value  INT NOT NULL DEFAULT 0,   -- percent or cents
  valid_from      DATE,
  valid_until     DATE,
  max_uses        INT,
  use_count       INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_property_codes_lookup ON property_codes(operator_id, code);
CREATE INDEX idx_property_codes_boat ON property_codes(boat_id) WHERE boat_id IS NOT NULL;

-- ==========================================
-- TABLE: rental_days (multi-day vessel conditions)
-- ==========================================
CREATE TABLE rental_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  operator_id     UUID NOT NULL REFERENCES operators(id),
  day_number      INT NOT NULL,
  day_date        DATE NOT NULL,
  check_in_at     TIMESTAMPTZ,
  check_out_at    TIMESTAMPTZ,
  condition_in    JSONB,          -- {photos: [], notes: "", fuel_level: ""}
  condition_out   JSONB,
  issues_reported TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','complete','issue')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rental_days_trip ON rental_days(trip_id);
CREATE INDEX idx_rental_days_date ON rental_days(day_date);
CREATE UNIQUE INDEX idx_rental_days_unique ON rental_days(trip_id, day_number);

-- ==========================================
-- ALTER: trips — external booking references + multi-day
-- ==========================================
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS external_booking_ref TEXT,
  ADD COLUMN IF NOT EXISTS external_platform    TEXT
    CHECK (external_platform IN ('fareharbor','rezdy','bookeo','checkfront') OR external_platform IS NULL),
  ADD COLUMN IF NOT EXISTS integration_id       UUID REFERENCES integrations(id),
  ADD COLUMN IF NOT EXISTS duration_days        INT,
  ADD COLUMN IF NOT EXISTS return_date          DATE;

CREATE INDEX IF NOT EXISTS idx_trips_external_ref
  ON trips(external_booking_ref, external_platform)
  WHERE external_booking_ref IS NOT NULL;

-- ==========================================
-- ALTER: guests — phone + property code tracking
-- ==========================================
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS phone_verified         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS property_code_used     TEXT,
  ADD COLUMN IF NOT EXISTS discount_applied_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_lead_renter         BOOLEAN NOT NULL DEFAULT false;

-- ==========================================
-- ALTER: guest_addon_orders — fulfillment tracking
-- ==========================================
ALTER TABLE guest_addon_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'ordered'
    CHECK (fulfillment_status IN ('ordered','prepping','ready','loaded','delivered')),
  ADD COLUMN IF NOT EXISTS fulfillment_notes  TEXT,
  ADD COLUMN IF NOT EXISTS fulfilled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_by       TEXT;

CREATE INDEX IF NOT EXISTS idx_addon_orders_fulfillment
  ON guest_addon_orders(fulfillment_status, trip_id);

-- ==========================================
-- ALTER: addons — resort-grade categorization
-- ==========================================
ALTER TABLE addons
  ADD COLUMN IF NOT EXISTS category          TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('food','beverage','gear','safety','experience','seasonal','other','general')),
  ADD COLUMN IF NOT EXISTS prep_time_hours   NUMERIC(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cutoff_hours      NUMERIC(3,1) NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS is_seasonal       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seasonal_from     DATE,
  ADD COLUMN IF NOT EXISTS seasonal_until    DATE,
  ADD COLUMN IF NOT EXISTS requires_staff_confirmation BOOLEAN NOT NULL DEFAULT false;

-- ==========================================
-- VIEW: v_fleet_today — live fleet status grid
-- ==========================================
CREATE OR REPLACE VIEW v_fleet_today AS
SELECT
  b.id                      AS boat_id,
  b.operator_id,
  b.boat_name,
  b.slip_number,
  t.id                      AS trip_id,
  t.trip_type,
  t.departure_time,
  t.duration_hours,
  t.duration_days,
  t.status                  AS trip_status,
  t.trip_code,
  t.slug                    AS trip_slug,
  t.requires_qualification,
  COUNT(g.id)                 AS total_guests,
  COUNT(g.id) FILTER (WHERE g.waiver_signed = true)           AS waivers_signed,
  COUNT(g.id) FILTER (WHERE g.checked_in_at IS NOT NULL)      AS checked_in,
  COUNT(gq.id) FILTER (WHERE gq.qualification_status = 'flagged') AS flags,
  COUNT(gao.id) FILTER (WHERE gao.fulfillment_status = 'ordered') AS addons_pending_prep,
  SUM(gao.total_cents) FILTER (WHERE gao.status = 'confirmed')    AS addon_revenue_cents
FROM boats b
LEFT JOIN trips t
  ON t.boat_id = b.id
  AND t.trip_date = CURRENT_DATE
  AND t.status != 'cancelled'
LEFT JOIN guests g
  ON g.trip_id = t.id
  AND g.deleted_at IS NULL
LEFT JOIN guest_qualifications gq
  ON gq.trip_id = t.id
LEFT JOIN guest_addon_orders gao
  ON gao.trip_id = t.id
  AND gao.guest_id = g.id
GROUP BY
  b.id, b.operator_id, b.boat_name, b.slip_number,
  t.id, t.trip_type, t.departure_time, t.duration_hours,
  t.duration_days, t.status, t.trip_code, t.slug, t.requires_qualification;

-- ==========================================
-- VIEW: v_fulfillment_board — dock/kitchen prep view
-- ==========================================
CREATE OR REPLACE VIEW v_fulfillment_board AS
SELECT
  t.id              AS trip_id,
  t.trip_date,
  t.departure_time,
  t.operator_id,
  b.boat_name,
  b.slip_number,
  a.id              AS addon_id,
  a.name            AS addon_name,
  a.category,
  a.prep_time_hours,
  gao.id            AS order_id,
  gao.quantity,
  gao.fulfillment_status,
  gao.fulfillment_notes,
  gao.total_cents,
  gao.notes,
  g.full_name       AS guest_name
FROM guest_addon_orders gao
JOIN trips t   ON t.id       = gao.trip_id
JOIN boats b   ON b.id       = t.boat_id
JOIN addons a  ON a.id       = gao.addon_id
JOIN guests g  ON g.id       = gao.guest_id AND g.deleted_at IS NULL
WHERE gao.status = 'confirmed';

-- ==========================================
-- RLS: new tables
-- ==========================================
ALTER TABLE integrations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_days     ENABLE ROW LEVEL SECURITY;

-- integrations: full CRUD for own operator
CREATE POLICY "integrations_operator_all" ON integrations
  FOR ALL
  USING (auth.uid() = operator_id);

-- webhook_events: read-only for own operator (events written by service role only)
CREATE POLICY "webhook_events_operator_select" ON webhook_events
  FOR SELECT
  USING (auth.uid() = operator_id);

-- property_codes: full CRUD for own operator
CREATE POLICY "property_codes_operator_all" ON property_codes
  FOR ALL
  USING (auth.uid() = operator_id);

-- rental_days: full CRUD for own operator
CREATE POLICY "rental_days_operator_all" ON rental_days
  FOR ALL
  USING (auth.uid() = operator_id);

