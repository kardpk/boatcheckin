-- ==========================================
-- 20260408230000_audit_actor_system.sql
-- Add Actor identifiers to audit log
-- ==========================================

ALTER TABLE audit_log
  ADD COLUMN actor_type TEXT CHECK (actor_type IN ('operator', 'captain', 'guest', 'system')),
  ADD COLUMN actor_identifier TEXT;

-- Create an index to quickly find actions performed by a specific actor
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_type, actor_identifier);

-- Make audit logs immutable (soft-delete is not even an option, prevent updates/deletes)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
