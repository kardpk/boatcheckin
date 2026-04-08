import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";

/**
 * GET /api/dashboard/boats
 * List all boats belonging to the authenticated operator, with addon counts.
 */
export async function GET() {
  const { operator, supabase } = await requireOperator();

  const { data: boats, error } = await supabase
    .from("boats")
    .select(
      `
      id, boat_name, boat_type, charter_type, max_capacity,
      marina_name, marina_address, slip_number,
      captain_name, captain_photo_url,
      photo_urls, is_active, deactivated_at,
      created_at, updated_at,
      addons ( id )
    `
    )
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten addon count
  const mapped = (boats ?? []).map((boat) => ({
    ...boat,
    addon_count: Array.isArray(boat.addons) ? boat.addons.length : 0,
    addons: undefined, // strip raw join
  }));

  return NextResponse.json({ data: mapped });
}
