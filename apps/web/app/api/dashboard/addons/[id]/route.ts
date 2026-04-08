import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const addonUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    emoji: z.string().max(4).optional(),
    price_cents: z.number().int().min(0).optional(),
    currency: z.string().length(3).optional(),
    max_quantity: z.number().int().min(1).max(100).optional(),
    is_available: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .strict();

/**
 * PATCH /api/dashboard/addons/[id]
 * Update an addon the operator owns.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  const body = await req.json();
  const parsed = addonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("addons")
    .select("id")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("addons")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/dashboard/addons/[id]
 * Soft-disable an addon (set is_available = false).
 */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  // Verify ownership
  const { data: existing } = await supabase
    .from("addons")
    .select("id")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("addons")
    .update({ is_available: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
