-- Track when review request was sent per guest
-- Prevents duplicate review emails
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS review_requested_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track when guest submitted their review
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS reviewed_at
    TIMESTAMPTZ DEFAULT NULL;

-- Track email used for review request
-- (operator may add email after trip)
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS email
    TEXT DEFAULT NULL;

-- Index for finding guests needing review requests
CREATE INDEX IF NOT EXISTS idx_guests_review_pending
  ON guests (trip_id, review_requested_at)
  WHERE deleted_at IS NULL
    AND review_requested_at IS NULL;

-- Add review URL columns to boats
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS boatsetter_review_url TEXT,
  ADD COLUMN IF NOT EXISTS boatsetter_url TEXT;

-- RLS on trip_reviews: anyone can insert their own
DROP POLICY IF EXISTS "reviews_guest_insert" ON trip_reviews;
CREATE POLICY "reviews_guest_insert"
  ON trip_reviews
  FOR INSERT
  WITH CHECK (true);

-- RLS on postcards: anyone can insert their own
DROP POLICY IF EXISTS "postcards_guest_insert" ON postcards;
CREATE POLICY "postcards_guest_insert"
  ON postcards
  FOR INSERT
  WITH CHECK (true);

-- Operators see reviews on their trips
DROP POLICY IF EXISTS "reviews_operator_sees" ON trip_reviews;
CREATE POLICY "reviews_operator_sees"
  ON trip_reviews
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT operator_id FROM trips WHERE id = trip_id
    )
  );

-- Operators see postcards on their trips
DROP POLICY IF EXISTS "postcards_operator_sees" ON postcards;
CREATE POLICY "postcards_operator_sees"
  ON postcards
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT operator_id FROM trips
      WHERE id = trip_id
    )
  );
