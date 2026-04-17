"use client";

import Link from "next/link";
import { Clock, Users, ArrowRight } from "lucide-react";
import type { TripInfo, BoatInfo } from "@/lib/board/getBoatBoardingState";

interface Props {
  boat: BoatInfo;
  trips: TripInfo[];
}

/** MASTER_DESIGN R11: 24hr time — "08:30" */
function fmtTime(time: string): string {
  const [h, m] = time.split(":");
  return `${String(h).padStart(2, "0")}:${m}`;
}

function fmtDuration(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

export function TripPickerState({ boat, trips }: Props) {
  return (
    <div style={{
      minHeight: "100svh",
      background: "var(--color-paper)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header — dark ink §14.1 */}
      <div style={{
        background: "var(--color-ink)",
        padding: "var(--s-12) var(--s-6) var(--s-8)",
        borderBottom: "var(--border-w) solid var(--color-line)",
      }}>
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-sm)",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-brass)",
          marginBottom: "var(--s-1)",
        }}>
          {boat.boatName}
        </p>
        <h1 style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: "var(--t-sub)",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          color: "var(--color-bone)",
          marginBottom: "var(--s-2)",
        }}>
          Which trip are you on?
        </h1>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--t-body-sm)",
          color: "var(--color-ink-muted)",
        }}>
          {trips.length} departures scheduled today — {boat.marinaName}
        </p>
      </div>

      {/* Trip list */}
      <div style={{
        flex: 1,
        padding: "var(--s-5) var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
      }}>
        {trips.map((trip, idx) => {
          const isFull = trip.guestCount >= trip.maxGuests;
          const spotsLeft = trip.maxGuests - trip.guestCount;
          const isUrgent = spotsLeft <= 2 && !isFull;

          return (
            /* Trip tile — §7.3 tile pattern: ink border, --r-1, no shadows */
            <div
              key={trip.id}
              style={{
                background: "var(--color-paper)",
                border: "var(--border-w) solid var(--color-line)",
                borderRadius: "var(--r-1)",
                overflow: "hidden",
              }}
            >
              {/* Top accent bar — brass for first, sea for subsequent §7.3 */}
              <div style={{
                height: 3,
                background: idx === 0 ? "var(--color-brass)" : "var(--color-sea)",
              }} />

              <div style={{ padding: "var(--s-5)" }}>
                {/* Departure time — tile-title, Fraunces, very prominent §7.4 */}
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "var(--s-3)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                    <Clock size={16} strokeWidth={2} color="var(--color-brass)" />
                    <span style={{
                      fontFamily: "var(--font-fraunces)",
                      fontSize: "var(--t-tile)",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      color: "var(--color-ink)",
                    }}>
                      {fmtTime(trip.departureTime)}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: "var(--t-mono-md)",
                      fontWeight: 500,
                      color: "var(--color-ink-muted)",
                    }}>
                      · {fmtDuration(trip.durationHours)}
                    </span>
                  </div>

                  {/* Status pill — §7.2 pill pattern */}
                  {isFull ? (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: "var(--t-mono-xs)",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-status-err)",
                      background: "var(--color-status-err-soft)",
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-status-err)" }} />
                      Full
                    </span>
                  ) : isUrgent ? (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: "var(--t-mono-xs)",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-status-warn)",
                      background: "var(--color-status-warn-soft)",
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-status-warn)" }} />
                      {spotsLeft} left
                    </span>
                  ) : (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: "var(--t-mono-xs)",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-status-ok)",
                      background: "var(--color-status-ok-soft)",
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-status-ok)" }} />
                      Open
                    </span>
                  )}
                </div>

                {/* Guest count meta */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                  marginBottom: "var(--s-4)",
                }}>
                  <Users size={13} strokeWidth={2} color="var(--color-ink-muted)" />
                  <span style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "var(--t-mono-md)",
                    fontWeight: 500,
                    color: "var(--color-ink-muted)",
                  }}>
                    {trip.guestCount}/{trip.maxGuests} guests registered
                  </span>
                </div>

                {/* Trip code — JetBrains Mono per §4.1 + §R11 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                  marginBottom: "var(--s-4)",
                }}>
                  <span style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: "var(--t-mono-xs)",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--color-brass-deep)",
                    background: "var(--color-bone-warm)",
                    border: "1px solid var(--color-sand)",
                    borderRadius: "var(--r-1)",
                    padding: "3px 10px",
                  }}>
                    Code
                  </span>
                  <span style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    color: "var(--color-ink)",
                  }}>
                    {trip.tripCode}
                  </span>
                </div>

                {/* CTA */}
                {isFull ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    border: "var(--border-w) solid var(--color-line-soft)",
                    borderRadius: "var(--r-1)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--t-body-md)",
                    fontWeight: 600,
                    color: "var(--color-ink-muted)",
                    background: "var(--color-bone-warm)",
                  }}>
                    This trip is full
                  </div>
                ) : (
                  <Link
                    href={`/trip/${trip.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "var(--s-2)",
                      height: 44,
                      background: "var(--color-ink)",
                      color: "var(--color-bone)",
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--t-body-md)",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      border: "var(--border-w) solid var(--color-line)",
                      borderRadius: "var(--r-1)",
                      textDecoration: "none",
                    }}
                  >
                    Join this trip
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        textAlign: "center",
        padding: "var(--s-6)",
        fontFamily: "var(--font-jetbrains)",
        fontSize: "var(--t-mono-xs)",
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "var(--color-ink-muted)",
      }}>
        BoatCheckin
      </p>
    </div>
  );
}
