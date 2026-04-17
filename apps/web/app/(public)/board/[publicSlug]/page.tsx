import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { rateLimit } from "@/lib/security/rate-limit";
import { getBoatBoardingState } from "@/lib/board/getBoatBoardingState";
import { verifyKnownGuestCookie, cookieName } from "@/lib/board/knownGuestCookie";
import { NoTripsState } from "./components/NoTripsState";
import { SingleTripJoinState } from "./components/SingleTripJoinState";
import { BoardingPassState } from "./components/BoardingPassState";
import { TripPickerState } from "./components/TripPickerState";
import { NextResponse } from "next/server";

/** 32-char hex slug from the migration trigger */
const SLUG_REGEX = /^[a-f0-9]{32}$/;

export const dynamic = "force-dynamic"; // near-realtime: never statically cache
export const revalidate = 0;

// Page-level cache: private, 30s. CDN won't cache; browser re-validates after 30s.
// Actual data is fresh on every visit (dynamic SSR); header only prevents redundant reloads.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}): Promise<Metadata> {
  const { publicSlug } = await params;
  if (!SLUG_REGEX.test(publicSlug)) return {};

  return {
    title: "Boarding Pass · BoatCheckin",
    description: "Scan or tap to check in for your boat trip.",
    robots: { index: false, follow: false }, // no crawl — unique per-vessel
  };
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;

  // 1. Validate slug format — fail early before any DB call
  if (!SLUG_REGEX.test(publicSlug)) {
    return notFound();
  }

  // 2. Rate limit: 60 req/min per IP per boat slug
  //    In a Server Component we can't return a NextResponse directly,
  //    so we read headers for IP and use early reject pattern.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const limited = await rateLimit(
    { headers: { get: (k: string) => (k === "x-forwarded-for" ? ip : null) } } as never,
    { max: 60, window: 60, key: `board:${publicSlug}:${ip}` }
  );

  if (limited.blocked) {
    // Cannot throw NextResponse.json from a Server Component; return a simple 429 page:
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[22px] font-bold text-[#0B1D3A] mb-2">Slow down ✋</p>
          <p className="text-[15px] text-[#5C6E82]">Too many requests. Please wait a moment and try again.</p>
        </div>
      </div>
    );
  }

  // 3. Read the known-guest cookie. We don't know the boat ID yet, so we
  //    resolve the boarding state first to get it, then verify the cookie.
  //    Cookie verification is intentionally done after the boat lookup so we
  //    have the boatId needed for HMAC scope check.
  const cookieStore = await cookies();

  // 4. Fetch boarding state (boat lookup + today's trips)
  //    First pass: no recognized guest (we verify cookie after we have boat.id)
  const prelimState = await getBoatBoardingState(publicSlug, null);
  if (!prelimState) return notFound();

  // 5. Now that we have the boat, check the known-guest cookie
  const boatId = prelimState.boat.id;
  const rawCookie = cookieStore.get(cookieName(boatId))?.value ?? null;
  const recognizedGuestId = rawCookie
    ? verifyKnownGuestCookie(rawCookie, boatId)
    : null;

  // 6. If we have a recognized guest and it's a single-trip state, re-fetch with guest context
  const state =
    recognizedGuestId && prelimState.kind === "single_trip"
      ? await getBoatBoardingState(publicSlug, recognizedGuestId) ?? prelimState
      : prelimState;

  // 7. Render appropriate UI state
  switch (state.kind) {
    case "no_trips":
      return <NoTripsState boatName={state.boat.boatName} marinaName={state.boat.marinaName} />;

    case "single_trip":
      if (state.recognizedGuest) {
        return (
          <BoardingPassState
            boat={state.boat}
            trip={state.trip}
            guest={state.recognizedGuest}
          />
        );
      }
      return <SingleTripJoinState boat={state.boat} trip={state.trip} />;

    case "multi_trip":
      return <TripPickerState boat={state.boat} trips={state.trips} />;
  }
}
