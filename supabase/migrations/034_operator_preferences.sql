-- ================================================
-- 034_operator_preferences.sql
-- Adds per-operator configurable preferences:
--   - default trip approval mode
--   - review request delay
--   - review redirect threshold
--   - notification opt-in toggles
-- ================================================

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS default_requires_approval  BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_request_delay_hours INT      NOT NULL DEFAULT 2
                           CHECK (review_request_delay_hours >= 0 AND review_request_delay_hours <= 48),
  ADD COLUMN IF NOT EXISTS review_redirect_threshold  INT      NOT NULL DEFAULT 5
                           CHECK (review_redirect_threshold >= 1 AND review_redirect_threshold <= 5),
  ADD COLUMN IF NOT EXISTS notify_on_guest_register   BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_trip_start       BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_trip_end         BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_weather_alert    BOOLEAN  NOT NULL DEFAULT true;

COMMENT ON COLUMN operators.default_requires_approval  IS 'If true, new trips default to requiring manual guest approval';
COMMENT ON COLUMN operators.review_request_delay_hours IS 'Hours after trip end to wait before sending a review request to guests';
COMMENT ON COLUMN operators.review_redirect_threshold  IS 'Redirect guests to external review platform when rating >= this value';
COMMENT ON COLUMN operators.notify_on_guest_register   IS 'Send operator notification when a new guest registers for any trip';
COMMENT ON COLUMN operators.notify_on_trip_start       IS 'Send operator notification when a trip is started by the captain';
COMMENT ON COLUMN operators.notify_on_trip_end         IS 'Send operator notification when a trip is ended by the captain';
COMMENT ON COLUMN operators.notify_on_weather_alert    IS 'Send operator notification for weather alerts on active trips';
