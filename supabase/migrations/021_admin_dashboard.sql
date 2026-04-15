-- ==========================================
-- Migration 021: Founder Admin Dashboard
--
-- 1. Add admin_role enum to operators (replaces is_admin boolean)
-- 2. Add default_image_url to global_safety_dictionary
-- 3. Create platform_config table
-- 4. Create private safety-assets storage bucket
-- ==========================================

-- ── 1. Admin role column ──────────────────────────────────────────────────────
ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS admin_role TEXT
  CHECK (admin_role IN ('founder', 'admin', 'member', 'support'));

COMMENT ON COLUMN public.operators.admin_role IS
  'Platform admin role. NULL = regular operator (no admin access).
   founder = full control, admin = manage content, member = view pulse, support = view guests.';

-- Migrate existing is_admin = true rows → admin
UPDATE public.operators
  SET admin_role = 'admin'
  WHERE is_admin = true AND admin_role IS NULL;

-- ── 2. Default image URL for safety dictionary ───────────────────────────────
ALTER TABLE public.global_safety_dictionary
  ADD COLUMN IF NOT EXISTS default_image_url TEXT;

COMMENT ON COLUMN public.global_safety_dictionary.default_image_url IS
  'Platform-level default image for this safety topic (Supabase Storage signed URL path).
   Captain can override per-boat in boats.safety_cards JSONB.';

-- ── 3. Platform config table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES public.operators(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Public read (feature flags needed on client-side)
CREATE POLICY "Anyone can read config"
  ON public.platform_config
  FOR SELECT
  USING (true);

-- Admin-only write (founder + admin roles)
CREATE POLICY "Admins manage config"
  ON public.platform_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.operators
      WHERE operators.id = auth.uid()
        AND operators.admin_role IN ('founder', 'admin')
    )
  );

-- Seed initial config
INSERT INTO public.platform_config (key, value, description) VALUES
  ('default_waiver_text', '"By participating in this charter, you acknowledge and accept all risks associated with boating activities. You agree to follow all safety instructions from the captain and crew."', 'Default waiver text pre-filled for new boats'),
  ('maintenance_mode', 'false', 'Global maintenance mode — shows banner on all pages'),
  ('max_free_boats', '1', 'Maximum boats allowed on Solo (free) tier'),
  ('feature_audio_safety', 'true', 'Enable audio playback in guest safety cards')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.platform_config IS
  'Platform-wide configuration (feature flags, defaults). Public read, admin write.';

-- ── 4. Update safety dictionary RLS for role-based access ─────────────────────
-- Drop the old admin policy and recreate with role-based check
DROP POLICY IF EXISTS "Admins can manage safety dictionary" ON public.global_safety_dictionary;

CREATE POLICY "Admins can manage safety dictionary"
  ON public.global_safety_dictionary
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.operators
      WHERE operators.id = auth.uid()
        AND operators.admin_role IN ('founder', 'admin')
    )
  );
