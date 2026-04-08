-- ==========================================
-- 002 — Update boat_type CHECK constraint
-- Phase 2 Fix: 9 boat types for template system
-- ==========================================

-- STEP 1: Drop old constraint FIRST (before any updates)
ALTER TABLE boats DROP CONSTRAINT IF EXISTS boats_boat_type_check;

-- STEP 2: Migrate existing rows to new type values
UPDATE boats SET boat_type = 'motor_yacht'      WHERE boat_type = 'yacht';
UPDATE boats SET boat_type = 'motor_yacht'      WHERE boat_type = 'motorboat';
UPDATE boats SET boat_type = 'fishing_charter'  WHERE boat_type = 'fishing';
UPDATE boats SET boat_type = 'sailing_yacht'    WHERE boat_type = 'sailboat';
-- catamaran, pontoon, speedboat, other → same keys, no migration needed

-- STEP 3: Add new constraint
ALTER TABLE boats ADD CONSTRAINT boats_boat_type_check
  CHECK (boat_type IN (
    'motor_yacht',
    'fishing_charter',
    'catamaran',
    'pontoon',
    'snorkel_dive',
    'sailing_yacht',
    'speedboat',
    'sunset_cruise',
    'other'
  ));

-- STEP 4: Add new columns for Phase 2 Fix wizard data
ALTER TABLE boats
  ADD COLUMN IF NOT EXISTS operating_area TEXT,
  ADD COLUMN IF NOT EXISTS captain_license_type TEXT,
  ADD COLUMN IF NOT EXISTS captain_certifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specific_fields JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_details JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS standard_rules TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS donts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_rule_sections JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS what_not_to_bring TEXT,
  ADD COLUMN IF NOT EXISTS safety_points TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS uscg_doc_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_state TEXT;
