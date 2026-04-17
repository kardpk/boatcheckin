-- Fix: Grant farabijfa@gmail.com unlimited boats (fleet plan)
-- Run in Supabase Dashboard → SQL Editor

UPDATE operators
SET
  max_boats         = 999,
  subscription_tier = 'fleet',
  subscription_status = 'active',
  updated_at        = now()
WHERE email = 'farabijfa@gmail.com';

-- Verify
SELECT id, email, full_name, subscription_tier, subscription_status, max_boats, admin_role
FROM operators
WHERE email = 'farabijfa@gmail.com';
