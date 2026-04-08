-- Phase 3D: Enable Supabase Realtime on guests table
-- Required for live dashboard updates (TodayTripCard, GuestManagementTable)

ALTER PUBLICATION supabase_realtime ADD TABLE guests;
