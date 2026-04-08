import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-firma-signature") || req.headers.get("firma-signature");
    const secret = process.env.FIRMA_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Firma Webhook] FIRMA_WEBHOOK_SECRET is not configured");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    if (!signature) {
      console.error("[Firma Webhook] Missing signature header");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // HMAC validation (adjust crypto method if Firma.dev uses a different signature scheme)
    const hmac = crypto.createHmac("sha256", secret);
    const calculatedSignature = hmac.update(rawBody).digest("hex");

    if (signature !== calculatedSignature) {
      console.error("[Firma Webhook] Signature mismatch");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Event Filtering
    if (payload.event !== "document.completed") {
      // Ignore other events silently and acknowledge
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const {
      document_id,
      signed_pdf_url,
      metadata
    } = payload.data || payload; // Depending on Firm.dev payload structure

    const bookingId = metadata?.booking_id;
    const passengerId = metadata?.passenger_id;

    if (!bookingId || !passengerId) {
      console.error("[Firma Webhook] Missing booking_id or passenger_id in metadata");
      // Still return 200 so they don't retry a bad payload forever
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Asynchronous database update to prevent Firma timeout
    const syncToDatabase = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error("Missing Supabase Service Role Key or URL");
        }

        // Admin client bypasses RLS
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { error: bookingError } = await supabase
          .from("bookings")
          .update({
            firma_status: "signed",
            firma_document_id: document_id,
            signed_pdf_url: signed_pdf_url,
            signed_at: new Date().toISOString(),
          })
          .eq("id", bookingId); // or match on a specific 'booking_id' column if different than id

        if (bookingError) {
          console.error("[Firma Webhook] Bookings db update failed:", bookingError);
        }

        const { error: guestError } = await supabase
          .from("guests")
          .update({
            waiver_signed: true,
            waiver_signed_at: new Date().toISOString(),
          })
          .eq("id", passengerId);

        if (guestError) {
          console.error("[Firma Webhook] Guests db update failed:", guestError);
        } else {
          console.log(`[Firma Webhook] Successfully updated guest ${passengerId} and booking ${bookingId}`);
        }
      } catch (dbError) {
        console.error("[Firma Webhook] Database sync exception:", dbError);
      }
    };

    // Trigger async sync without awaiting
    syncToDatabase();

    // 200 OK fast acknowledge
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Firma Webhook] Unexpected extraction error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
export function PUT() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
export function DELETE() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
