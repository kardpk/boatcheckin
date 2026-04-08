-- ── TRIP MESSAGES ────────────────────────
-- Guest-captain chat messages per trip.
-- Scoped to trip_id. Auto-deletes after 90 days.
CREATE TABLE IF NOT EXISTS trip_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  operator_id   UUID NOT NULL REFERENCES operators(id),

  -- Sender identity
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,
  sender_type   TEXT NOT NULL
                CHECK (sender_type IN (
                  'guest', 'captain', 'operator', 'system'
                )),
  sender_name   TEXT NOT NULL,

  -- Content
  body          TEXT NOT NULL
                CHECK (char_length(body) >= 1
                   AND char_length(body) <= 500),
  is_quick_chip BOOLEAN NOT NULL DEFAULT false,
  chip_key      TEXT,

  -- Read tracking
  read_at       TIMESTAMPTZ,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- Index: fetch chat history for a trip fast
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_time
  ON trip_messages (trip_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index: unread messages for operator/captain
CREATE INDEX IF NOT EXISTS idx_trip_messages_unread
  ON trip_messages (trip_id, read_at)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- ── ENABLE REALTIME ──────────────────────
ALTER PUBLICATION supabase_realtime
  ADD TABLE trip_messages;

-- Verify existing tables already in publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'guests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'operator_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE operator_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trips;
  END IF;
END $$;

-- ── RLS POLICIES ─────────────────────────

-- Guests can insert their own messages
DROP POLICY IF EXISTS "messages_guest_insert" ON trip_messages;
CREATE POLICY "messages_guest_insert" ON trip_messages
  FOR INSERT WITH CHECK (
    sender_type = 'guest'
    AND guest_id IS NOT NULL
  );

-- Operators can insert as captain/operator/system
DROP POLICY IF EXISTS "messages_operator_insert" ON trip_messages;
CREATE POLICY "messages_operator_insert" ON trip_messages
  FOR INSERT WITH CHECK (
    auth.uid() = operator_id
    AND sender_type IN ('captain', 'operator', 'system')
  );

-- Operators can read all messages on their trips
DROP POLICY IF EXISTS "messages_operator_read" ON trip_messages;
CREATE POLICY "messages_operator_read" ON trip_messages
  FOR SELECT USING (auth.uid() = operator_id);

-- Service role for guest message reads (guests have no auth.uid())
DROP POLICY IF EXISTS "messages_service_all" ON trip_messages;
CREATE POLICY "messages_service_all" ON trip_messages
  FOR ALL USING (auth.role() = 'service_role');
