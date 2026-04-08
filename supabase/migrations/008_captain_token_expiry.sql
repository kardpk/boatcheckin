-- Migration 008: Captain token expiry
-- Adds expiry tracking to trips so captain snapshot tokens can be time-bounded.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS captain_token          TEXT,
  ADD COLUMN IF NOT EXISTS captain_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captain_token_version     INT NOT NULL DEFAULT 1;

-- Index for token lookup — captain snapshot API does a WHERE on captain_token
CREATE INDEX IF NOT EXISTS trips_captain_token_idx
  ON trips (captain_token)
  WHERE captain_token IS NOT NULL;

COMMENT ON COLUMN trips.captain_token_expires_at IS
  'UTC timestamp after which the captain_token is invalid. NULL = legacy token (treat as expired and regenerate).';

COMMENT ON COLUMN trips.captain_token_version IS
  'Monotonically incrementing counter. Incrementing this value invalidates all previously issued tokens for this trip without changing the token string — used for immediate revocation.';
