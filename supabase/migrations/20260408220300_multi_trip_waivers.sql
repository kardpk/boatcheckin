-- Supabase Migration: Multi-Trip Waivers & Operator Profiles
-- Modifying structure to support "Sign Once, Rent Often" model.

-- 1. Create a global customer profiles table spanning trips
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NULL,
    phone TEXT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create customer_waivers table (annual/seasonal waivers specific to an operator)
CREATE TABLE IF NOT EXISTS public.customer_waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL, -- references Operator, assume UUID
    firma_document_id TEXT NOT NULL,
    signed_pdf_url TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy queries during the Guest join flow
CREATE INDEX IF NOT EXISTS customer_waivers_cust_op_idx ON public.customer_waivers (customer_id, operator_id);

-- 3. Modify guests table to link to customer profiles
ALTER TABLE public.guests
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL;

-- 4. Extend operators table for Firma workspaces
ALTER TABLE public.operators
    ADD COLUMN IF NOT EXISTS firma_workspace_id TEXT NULL;

-- 5. Extend boat_profiles for Template assignment & toggle
ALTER TABLE public.boat_profiles
    ADD COLUMN IF NOT EXISTS firma_template_id TEXT NULL,
    ADD COLUMN IF NOT EXISTS requires_annual_waiver BOOLEAN NOT NULL DEFAULT false;

