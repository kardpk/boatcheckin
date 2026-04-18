import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { getToday } from "@/lib/utils/tripStatus";
import { Plus, Ship, ChevronRight, MapPin, ArrowRight } from "lucide-react";
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

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s-6)" }}>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(26px, 4vw, 32px)", fontWeight: 500, letterSpacing: "-0.025em", color: "var(--color-ink)", lineHeight: 1.1 }}
          >
            Your fleet
          </h1>
          <p
            className="font-mono"
            style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-ink-soft)", marginTop: "var(--s-1)" }}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          {activeBoats.map((boat) => {
            const tripCount = tripCountMap[boat.id] ?? 0;
            const typeLabel = boat.boat_type?.replace(/_/g, " ") ?? "vessel";
            const charterLabel = boat.charter_type?.replace(/_/g, " ") ?? "";

            return (
              <Link
                key={boat.id}
                href={`/dashboard/boats/${boat.id}`}
                className="tile"
                style={{
                  display: "flex",
                  gap: "var(--s-4)",
                  padding: "var(--s-4) var(--s-5)",
                  textDecoration: "none",
                  transition: "background var(--dur-fast) var(--ease)",
                  cursor: "pointer",
                }}
              >
                {/* Ship icon */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--color-bone)",
                    border: "var(--border-w) solid var(--color-line)",
                    borderRadius: "var(--r-1)",
                  }}
                >
                  <Ship size={20} strokeWidth={1.8} style={{ color: "var(--color-ink-muted)" }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Type label */}
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--color-ink-muted)",
                    }}
                  >
                    {typeLabel}
                    {charterLabel ? ` · ${charterLabel}` : ""}
                  </span>

                  {/* Boat name */}
                  <p
                    style={{
                      fontSize: "var(--t-body-md)",
                      fontWeight: 700,
                      color: "var(--color-ink)",
                      lineHeight: 1.2,
                      marginTop: 2,
                    }}
                  >
                    {boat.boat_name}
                  </p>

                  {/* Location + stats */}
                  <div
                    style={{
                      marginTop: "var(--s-2)",
                      paddingTop: "var(--s-2)",
                      borderTop: "1px dashed var(--color-line-soft)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--s-1)",
                    }}
                  >
                    {boat.marina_name && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s-1)",
                          fontSize: "var(--t-body-sm)",
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        <MapPin size={12} strokeWidth={2} />
                        <span>
                          {boat.marina_name}
                          {boat.slip_number ? ` · Slip ${boat.slip_number}` : ""}
                        </span>
                      </div>
                    )}

                    <div
                      className="font-mono"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--s-3)",
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "var(--color-ink-muted)",
                      }}
                    >
                      <span>{boat.max_capacity} guests</span>
                      {tripCount > 0 && (
                        <span style={{ color: "var(--color-ink)" }}>
                          {tripCount} upcoming trip{tripCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chevron */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                  <ChevronRight size={16} strokeWidth={2} style={{ color: "var(--color-ink-muted)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
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
