-- Phase 3H: Weather + Alerts
-- Track alert deduplication + guest reminder state

-- Track last weather alert sent per trip
-- Prevents duplicate alerts on re-check
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS weather_alert_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track the severity at time of last alert
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS weather_alert_severity
    TEXT DEFAULT NULL
    CHECK (weather_alert_severity IN (
      'fair', 'poor', 'dangerous'
    ));

-- Track whether trip day reminder has been sent
-- Prevents duplicate reminders
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS trip_reminder_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track whether waiver reminder has been sent
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS waiver_reminder_sent_at
    TIMESTAMPTZ DEFAULT NULL;

-- Index: trips needing weather check (next 48 hrs)
CREATE INDEX IF NOT EXISTS idx_trips_weather_check
  ON trips (trip_date, weather_checked_at)
  WHERE status IN ('upcoming', 'active');

-- Index: guests needing trip day reminder
CREATE INDEX IF NOT EXISTS idx_guests_reminder_pending
  ON guests (trip_id, trip_reminder_sent_at)
  WHERE deleted_at IS NULL
    AND trip_reminder_sent_at IS NULL;
