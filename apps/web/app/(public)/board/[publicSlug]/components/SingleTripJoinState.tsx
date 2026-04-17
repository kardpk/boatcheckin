"use client";

import Link from "next/link";
import { Clock, Users, Calendar, ArrowRight } from "lucide-react";
import type { TripInfo, BoatInfo } from "@/lib/board/getBoatBoardingState";

interface Props {
  boat: BoatInfo;
  trip: TripInfo;
}

/** Format time as 24hr per MASTER_DESIGN R11 — "08:30" not "8:30 AM" */
function fmtTime(time: string): string {
  const [h, m] = time.split(":");
  return `${String(h).padStart(2, "0")}:${m}`;
}

/** Format date as "17 Apr 2026" per MASTER_DESIGN R11 */
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function fmtDuration(hours: number): string {
  if (hours < 1) return `${hours * 60}min`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100svh",
    background: "var(--color-paper)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "var(--color-ink)",
    padding: "var(--s-12) var(--s-6) var(--s-8)",
    borderBottom: "var(--border-w) solid var(--color-line)",
  },
  eyebrow: {
    fontFamily: "var(--font-jetbrains)",
    fontSize: "var(--t-mono-sm)",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--color-brass)",
    marginBottom: "var(--s-1)",
  },
  heading: {
    fontFamily: "var(--font-fraunces)",
    fontSize: "var(--t-sub)",
    fontWeight: 500,
    letterSpacing: "-0.025em",
    lineHeight: 1.1,
    color: "var(--color-bone)",
  },
  subhead: {
    fontFamily: "var(--font-body)",
    fontSize: "var(--t-body-sm)",
    color: "var(--color-ink-muted)",
    marginTop: "var(--s-2)",
  },
  body: {
    flex: 1,
    padding: "var(--s-5) var(--s-4) 0",
    marginTop: -4,
  },
  tile: {
    background: "var(--color-paper)",
    border: "var(--border-w) solid var(--color-line)",
    borderRadius: "var(--r-1)",
    overflow: "hidden" as const,
  },
  tileAccent: {
    height: 3,
    background: "var(--color-brass)",
  },
  tilePadding: {
    padding: "var(--s-5)",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--s-2)",
    marginBottom: "var(--s-5)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "var(--s-3)",
    marginBottom: "var(--s-5)",
  },
  statCell: {
    border: "var(--border-w-heavy) solid var(--color-line-soft)",
    borderRadius: "var(--r-1)",
    padding: "var(--s-3)",
    textAlign: "center" as const,
    background: "var(--color-paper-warm)",
  },
  statLabel: {
    fontFamily: "var(--font-jetbrains)",
    fontSize: "var(--t-mono-xs)",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--color-ink-muted)",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "var(--font-fraunces)",
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--color-ink)",
  },
  codeBox: {
    border: "var(--border-w) solid var(--color-line)",
    borderLeft: "4px solid var(--color-brass)",
    borderRadius: "var(--r-1)",
    padding: "var(--s-4)",
    background: "var(--color-bone-warm)",
    marginBottom: "var(--s-5)",
  },
  codeLabel: {
    fontFamily: "var(--font-jetbrains)",
    fontSize: "var(--t-mono-xs)",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--color-brass)",
    marginBottom: "var(--s-1)",
  },
  codeValue: {
    fontFamily: "var(--font-jetbrains)",
    fontSize: 36,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "var(--color-ink)",
    lineHeight: 1,
  },
  codeHint: {
    fontFamily: "var(--font-body)",
    fontSize: "var(--t-body-sm)",
    color: "var(--color-ink-muted)",
    marginTop: "var(--s-1)",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--s-2)",
    width: "100%",
    height: 48,
    background: "var(--color-rust)",
    color: "var(--color-bone)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--t-body-md)",
    fontWeight: 600,
    letterSpacing: "0.01em",
    border: "var(--border-w) solid var(--color-rust-deep)",
    borderRadius: "var(--r-1)",
    textDecoration: "none",
    cursor: "pointer",
    transition: "background var(--dur-fast) var(--ease)",
  },
  btnFull: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    background: "var(--color-bone-warm)",
    color: "var(--color-ink-muted)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--t-body-md)",
    fontWeight: 600,
    border: "var(--border-w) solid var(--color-line-soft)",
    borderRadius: "var(--r-1)",
  },
  footer: {
    textAlign: "center" as const,
    padding: "var(--s-6)",
    fontFamily: "var(--font-jetbrains)",
    fontSize: "var(--t-mono-xs)",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--color-ink-muted)",
  },
};

export function SingleTripJoinState({ boat, trip }: Props) {
  const isFull = trip.guestCount >= trip.maxGuests;
  const spotsLeft = trip.maxGuests - trip.guestCount;

  return (
    <div style={s.page}>
      {/* Header — dark ink per MASTER_DESIGN §14.1 operator-dark-header pattern */}
      <div style={s.header}>
        <p style={s.eyebrow}>{boat.boatName}</p>
        <h1 style={s.heading}>You are at the dock.</h1>
        <p style={s.subhead}>
          {boat.marinaName}{boat.slipNumber ? ` — Slip ${boat.slipNumber}` : ""}
        </p>
      </div>

      {/* Main tile */}
      <div style={s.body}>
        <div style={s.tile}>
          <div style={s.tileAccent} />
          <div style={s.tilePadding}>
            {/* Date meta */}
            <div style={s.metaRow}>
              <Calendar size={14} strokeWidth={2} color="var(--color-ink-muted)" />
              <span style={{
                fontFamily: "var(--font-jetbrains)",
                fontSize: "var(--t-mono-sm)",
                fontWeight: 500,
                color: "var(--color-ink-muted)",
              }}>
                {fmtDate(trip.tripDate)}
              </span>
            </div>

            {/* Stats grid */}
            <div style={s.statsGrid}>
              <div style={s.statCell}>
                <div style={s.statLabel}>Departs</div>
                <div style={{ ...s.statValue, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Clock size={14} strokeWidth={2} color="var(--color-brass)" />
                  <span style={s.statValue}>{fmtTime(trip.departureTime)}</span>
                </div>
              </div>
              <div style={s.statCell}>
                <div style={s.statLabel}>Duration</div>
                <div style={s.statValue}>{fmtDuration(trip.durationHours)}</div>
              </div>
              <div style={s.statCell}>
                <div style={{ ...s.statLabel, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Users size={12} strokeWidth={2} color="var(--color-ink-muted)" /> Guests
                </div>
                <div style={s.statValue}>
                  {trip.guestCount}
                  <span style={{ fontSize: 14, color: "var(--color-ink-muted)", fontFamily: "var(--font-jetbrains)" }}>
                    /{trip.maxGuests}
                  </span>
                </div>
              </div>
            </div>

            {/* Trip code — most prominent piece of information */}
            <div style={s.codeBox}>
              <p style={s.codeLabel}>Your trip code</p>
              <p style={s.codeValue}>{trip.tripCode}</p>
              <p style={s.codeHint}>You will need this code to register below.</p>
            </div>

            {/* Captain name if present — meta-row pattern §7.6 */}
            {boat.captainName && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-3)",
                borderTop: "1px dashed var(--color-line-soft)",
                paddingTop: "var(--s-4)",
                marginBottom: "var(--s-4)",
              }}>
                <div style={{
                  width: 36, height: 36,
                  border: "var(--border-w) solid var(--color-line)",
                  borderRadius: "var(--r-pill)",
                  background: "var(--color-bone-warm)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Users size={16} strokeWidth={2} color="var(--color-ink-muted)" />
                </div>
                <div>
                  <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--t-body-sm)",
                    fontWeight: 600,
                    color: "var(--color-ink)",
                  }}>
                    Capt. {boat.captainName}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "var(--t-mono-xs)",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-muted)",
                  }}>
                    {boat.boatType?.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            )}

            {/* CTA — btn--rust per §7.1 */}
            {isFull ? (
              <div style={s.btnFull}>Trip is full</div>
            ) : (
              <Link href={`/trip/${trip.slug}`} style={s.btn}>
                Register for this trip
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            )}
          </div>
        </div>

        {/* Spots remaining — pill--ok or pill--warn per §7.2 */}
        {!isFull && (
          <div style={{ textAlign: "center", marginTop: "var(--s-3)" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "var(--font-jetbrains)",
              fontSize: "var(--t-mono-sm)",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: spotsLeft <= 2 ? "var(--color-status-warn)" : "var(--color-status-ok)",
              padding: "4px 10px",
              border: `1px solid ${spotsLeft <= 2 ? "var(--color-status-warn)" : "var(--color-status-ok)"}`,
              borderRadius: "var(--r-pill)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: spotsLeft <= 2 ? "var(--color-status-warn)" : "var(--color-status-ok)",
              }} />
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} remaining
            </span>
          </div>
        )}
      </div>

      <p style={s.footer}>BoatCheckin</p>
    </div>
  );
}
