import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/dashboard/boats/[id]/reactivate
 * Reactivate a soft-deactivated boat, subject to plan boat limit.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { operator } = await requireOperator();
  const supabase = createServiceClient();

  // Verify ownership
  const { data: boat } = await supabase
    .from("boats")
    .select("id, is_active, operator_id")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  if (boat.is_active) {
    return NextResponse.json(
      { error: "Boat is already active" },
      { status: 400 }
    );
  }

  // Check plan boat limit
  const { count } = await supabase
    .from("boats")
    .select("id", { count: "exact", head: true })
    .eq("operator_id", operator.id)
    .eq("is_active", true);

  const activeCount = count ?? 0;
  if (activeCount >= operator.max_boats) {
    return NextResponse.json(
      {
        error: `Boat limit reached (${activeCount}/${operator.max_boats}). Upgrade your plan or deactivate another boat.`,
      },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("boats")
    .update({
      is_active: true,
      deactivated_at: null,
      deactivated_by: null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
