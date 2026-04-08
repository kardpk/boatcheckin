import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { z } from "zod";

const addonCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  emoji: z.string().max(4).default("🎁"),
  price_cents: z.number().int().min(0),
  currency: z.string().length(3).default("usd"),
  max_quantity: z.number().int().min(1).max(100).default(10),
  sort_order: z.number().int().default(0),
});

/**
 * POST /api/dashboard/boats/[id]/addons
 * Create an addon for a boat the operator owns.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: boatId } = await params;
  const { operator, supabase } = await requireOperator();

  // Verify boat ownership
  const { data: boat } = await supabase
    .from("boats")
    .select("id")
    .eq("id", boatId)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = addonCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { data: addon, error } = await supabase
    .from("addons")
    .insert({
      ...parsed.data,
      boat_id: boatId,
      operator_id: operator.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: addon }, { status: 201 });
}
