import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/push/subscription
 * Handles browser push subscription rotation.
 * Called by the service worker's `pushsubscriptionchange` event.
 *
 * Body:
 *   - oldEndpoint: string (previous endpoint to deactivate)
 *   - newSubscription: PushSubscription JSON (new endpoint + keys)
 */
export async function POST(req: NextRequest) {
  try {
    const { oldEndpoint, newSubscription } = await req.json();

    if (!newSubscription?.endpoint) {
      return NextResponse.json(
        { error: "Missing newSubscription.endpoint" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // If we have an old endpoint, mark it as inactive
    if (oldEndpoint) {
      await supabase
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("endpoint", oldEndpoint);
    }

    // Upsert the new subscription
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: newSubscription.endpoint,
        keys: newSubscription.keys,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("[push/subscription] Upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
