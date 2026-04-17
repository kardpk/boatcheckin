"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TripInfo, BoatInfo, GuestInfo } from "@/lib/board/getBoatBoardingState";

interface Props {
  boat: BoatInfo;
  trip: TripInfo;
  guest: GuestInfo;
}

/** MASTER_DESIGN R11: 24hr time */
function fmtTime(time: string): string {
  const [h, m] = time.split(":");
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function BoardingPassState({ boat, trip, guest }: Props) {
  const firstName = guest.fullName.split(" ")[0] ?? guest.fullName;

  return (
    <div style={{
      minHeight: "100svh",
      background: "var(--color-ink)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Header */}
      <div style={{
        width: "100%",
        padding: "var(--s-12) var(--s-6) var(--s-6)",
        textAlign: "center",
        borderBottom: "1px solid rgba(244,239,230,0.12)",
      }}>
        {/* Eyebrow — mono brass §4.3 */}
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-sm)",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-brass)",
          marginBottom: "var(--s-2)",
        }}>
          Boarding Pass
        </p>

        {/* Guest name — Fraunces display §4.1 */}
        <h1 style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: "var(--t-sub)",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          color: "var(--color-bone)",
          marginBottom: "var(--s-2)",
        }}>
          Welcome aboard, {firstName}.
        </h1>

        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--t-body-sm)",
          color: "var(--color-ink-muted)",
        }}>
          {boat.boatName} — {boat.marinaName}
        </p>
      </div>

      {/* QR card — white tile, ink border §10.4 */}
      <div style={{
        margin: "var(--s-6) var(--s-4)",
        width: "100%",
        maxWidth: 380,
      }}>
        <div style={{
          background: "var(--color-paper)",
          border: "var(--border-w) solid var(--color-line)",
          borderRadius: "var(--r-1)",
          padding: "var(--s-6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          {/* QR code — always on white, min 120px, ECL M §10.4 */}
          <div style={{
            padding: "var(--s-3)",
            background: "#FFFFFF",
            border: "var(--border-w) solid var(--color-line-soft)",
            borderRadius: "var(--r-1)",
            marginBottom: "var(--s-4)",
          }}>
            <QRCodeSVG
              value={trip.tripCode}
              size={200}
              level="M"
              fgColor="#0B1E2D"
              bgColor="#FFFFFF"
            />
          </div>

          {/* Caption — per §10.4 */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--t-body-sm)",
            color: "var(--color-ink-muted)",
            textAlign: "center",
            marginBottom: "var(--s-4)",
          }}>
            Show this to the captain at the dock.
          </p>

          {/* Trip details — meta-row pattern §7.6 */}
          <div style={{
            width: "100%",
            borderTop: "1px dashed var(--color-line-soft)",
            paddingTop: "var(--s-4)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}>
              <div>
                <p style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "var(--t-mono-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                  marginBottom: 4,
                }}>
                  Departure
                </p>
                <p style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "var(--t-tile)",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                }}>
                  {fmtTime(trip.departureTime)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "var(--t-mono-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-muted)",
                  marginBottom: 4,
                }}>
                  Trip code
                </p>
                <p style={{
                  fontFamily: "var(--font-jetbrains)",
                  fontSize: "var(--t-tile)",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  color: "var(--color-ink)",
                }}>
                  {trip.tripCode}
                </p>
              </div>
            </div>

            {boat.captainName && (
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--t-body-sm)",
                color: "var(--color-ink-muted)",
                marginTop: "var(--s-3)",
                borderTop: "1px dashed var(--color-line-soft)",
                paddingTop: "var(--s-3)",
              }}>
                Captain:{" "}
                <span style={{ fontWeight: 600, color: "var(--color-ink)" }}>
                  {boat.captainName}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* "Not you?" secondary link — editorial-link style §7.10 */}
      <div style={{ textAlign: "center", paddingBottom: "var(--s-10)" }}>
        <Link
          href={`/trip/${trip.slug}`}
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "var(--t-mono-sm)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-rust-soft)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--s-1)",
          }}
        >
          Not {firstName}? Start a new registration
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

      {/* Footer */}
      <p style={{
        fontFamily: "var(--font-jetbrains)",
        fontSize: "var(--t-mono-xs)",
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "rgba(244,239,230,0.3)",
        paddingBottom: "var(--s-6)",
      }}>
        BoatCheckin
      </p>
    </div>
  );
}
