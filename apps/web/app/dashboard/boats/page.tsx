import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getToday } from "@/lib/utils/tripStatus";
import { Plus, Ship, ChevronRight, MapPin, ArrowRight, Users, Calendar } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fleet — BoatCheckin" };

export default async function BoatsPage() {
  const { operator } = await requireOperator();
  const supabase = createServiceClient();

  // Fetch boats with marina info
  const { data: boats } = await supabase
    .from("boats")
    .select("id, boat_name, boat_type, charter_type, max_capacity, marina_name, slip_number, is_active, created_at")
    .eq("operator_id", operator.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const activeBoats = boats ?? [];

  // Fetch upcoming trip counts per boat (single query)
  let tripCountMap: Record<string, number> = {};
  if (activeBoats.length > 0) {
    const boatIds = activeBoats.map((b) => b.id);
    const { data: tripCounts } = await supabase
      .from("trips")
      .select("boat_id")
      .in("boat_id", boatIds)
      .in("status", ["upcoming", "active"])
      .gte("trip_date", getToday());

    if (tripCounts) {
      tripCountMap = tripCounts.reduce<Record<string, number>>((acc, t) => {
        acc[t.boat_id] = (acc[t.boat_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 pb-[100px]" style={{ paddingTop: "var(--s-4)" }}>

      {/* ── Hover styles (Server Component pattern) ──────── */}
      <style>{`
        .boat-card { transition: background 150ms ease, border-color 150ms ease; }
        .boat-card:hover { background: var(--color-bone) !important; }
        .boat-card:hover .boat-chevron { color: var(--color-rust) !important; }
        .boat-card:hover .boat-name { color: var(--color-ink) !important; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s-5)" }}>
        <div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(26px, 4vw, 32px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              lineHeight: 1.1,
            }}
          >
            Your fleet
          </h1>
          <p
            className="font-mono"
            style={{
              fontSize: "var(--t-mono-xs)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-ink-soft)",
              marginTop: "var(--s-1)",
            }}
          >
            {activeBoats.length > 0
              ? `${activeBoats.length} vessel${activeBoats.length === 1 ? "" : "s"} registered`
              : "Get started below"}
          </p>
        </div>
        <Link href="/dashboard/boats/new" className="btn btn--rust">
          <Plus size={14} strokeWidth={2.5} />
          Add boat
        </Link>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      {activeBoats.length > 0 ? (
        <>
          {/* SectionKicker — §6.6 pattern */}
          <div style={{
            fontFamily: "var(--mono)",
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
            paddingBottom: "var(--s-3)",
            borderBottom: "1px solid var(--color-line-soft)",
            marginBottom: "var(--s-4)",
          }}>
            Registered vessels
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            {activeBoats.map((boat) => {
              const tripCount = tripCountMap[boat.id] ?? 0;
              const typeLabel = boat.boat_type?.replace(/_/g, " ") ?? "vessel";
              const charterLabel = boat.charter_type?.replace(/_/g, " ") ?? "";

              // §9.7 — status-driven left stripe
              const leftStripe = tripCount > 0
                ? "4px solid var(--color-brass)"   // active asset: brass
                : "4px solid var(--color-ink)";     // idle asset: default navy

              return (
                <Link
                  key={boat.id}
                  href={`/dashboard/boats/${boat.id}`}
                  className="tile boat-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s-3)",
                    padding: "var(--s-4)",           // 16px — matches trips/new row cards
                    textDecoration: "none",
                    cursor: "pointer",
                    borderLeft: leftStripe,
                    background: "var(--color-paper)",
                  }}
                >
                  {/* §8.8 Row card icon — bare, no box, ink-muted */}
                  <Ship
                    size={20}
                    strokeWidth={1.5}
                    style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
                  />

                  {/* Info — flex-1 */}
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* Type label — mono uppercase */}
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "var(--t-mono-xs)",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--color-ink-muted)",
                      }}
                    >
                      {typeLabel}
                      {charterLabel ? ` · ${charterLabel}` : ""}
                    </span>

                    {/* Boat name — Fraunces display */}
                    <p
                      className="font-display boat-name"
                      style={{
                        fontSize: "var(--t-tile)",    // 22px — elevated from 19px
                        fontWeight: 500,
                        color: "var(--color-ink)",
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        margin: "2px 0 0",
                      }}
                    >
                      {boat.boat_name}
                    </p>

                    {/* Meta row — §8.8, mono 10px, --ink-muted, 10px icons */}
                    <div
                      style={{
                        marginTop: "var(--s-2)",
                        paddingTop: "var(--s-2)",
                        borderTop: "1px solid var(--color-line-soft)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--s-4)",
                        flexWrap: "wrap",
                      }}
                    >
                      {boat.marina_name && (
                        <span
                          className="font-mono"
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: "var(--t-mono-xs)", fontWeight: 600,
                            letterSpacing: "0.04em",
                            color: "var(--color-ink-muted)",
                          }}
                        >
                          <MapPin size={10} strokeWidth={2} />
                          {boat.marina_name}
                          {boat.slip_number ? ` · ${boat.slip_number}` : ""}
                        </span>
                      )}

                      <span
                        className="font-mono"
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: "var(--t-mono-xs)", fontWeight: 600,
                          letterSpacing: "0.04em",
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        <Users size={10} strokeWidth={2} />
                        {boat.max_capacity} pax
                      </span>

                      {/* §7.2 Trip count pill — warn-soft (brass/amber) */}
                      {tripCount > 0 && (
                        <span
                          className="font-mono"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: "var(--t-mono-xs)", fontWeight: 700,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: "var(--r-pill)",
                            background: "var(--color-status-warn-soft)",
                            color: "var(--color-status-warn)",
                            border: "1px solid var(--color-status-warn)",
                          }}
                        >
                          <Calendar size={10} strokeWidth={2} />
                          {tripCount} {tripCount === 1 ? "trip" : "trips"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron — rust on hover via CSS */}
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className="boat-chevron"
                    style={{ color: "var(--color-ink-muted)", flexShrink: 0, transition: "color 150ms ease" }}
                  />
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state — unchanged */
        <div
          className="tile text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "var(--s-16) var(--s-8)",
            gap: "var(--s-4)",
            borderStyle: "dashed",
          }}
        >
          <Ship size={32} strokeWidth={1.5} style={{ color: "var(--color-ink-muted)" }} />
          <h2
            className="font-display"
            style={{ fontSize: "22px", fontWeight: 500, color: "var(--color-ink)", letterSpacing: "-0.02em" }}
          >
            No vessels yet
          </h2>
          <p style={{ fontSize: "var(--t-body-sm)", color: "var(--color-ink-muted)", maxWidth: 280 }}>
            Set up your first boat to start creating trips and checking in guests.
          </p>
          <Link href="/dashboard/boats/new" className="btn btn--rust" style={{ marginTop: "var(--s-2)" }}>
            Set up my first boat
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
