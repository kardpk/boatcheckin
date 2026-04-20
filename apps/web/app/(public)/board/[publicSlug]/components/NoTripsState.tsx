"use client";

import { Anchor, MapPin } from "lucide-react";

interface Props {
  boatName: string;
  marinaName: string;
}

export function NoTripsState({ boatName, marinaName }: Props) {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--color-paper)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-6)",
      }}
    >
      {/* Empty state icon — 48px, strokeWidth 1.5 per MASTER_DESIGN §11.3 */}
      <div
        style={{
          width: 80,
          height: 80,
          border: "var(--border-w) solid var(--color-line)",
          borderRadius: "var(--r-pill)",
          background: "var(--color-bone)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--s-6)",
        }}
      >
        <Anchor size={48} strokeWidth={1.5} color="var(--color-ink-muted)" />
      </div>

      {/* Eyebrow label — mono, uppercase §4.3 */}
      <p
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-sm)",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-brass)",
          marginBottom: "var(--s-2)",
          textAlign: "center",
        }}
      >
        {boatName}
      </p>

      {/* Heading — Fraunces display §4.1 */}
      <h1
        style={{
          fontFamily: "var(--font-fraunces)",
          fontSize: "var(--t-card)",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
          color: "var(--color-ink)",
          textAlign: "center",
          marginBottom: "var(--s-3)",
          maxWidth: 340,
        }}
      >
        No trips scheduled<br />on this vessel right now.
      </h1>

      {/* Body — Inter §4.1 */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--t-body-md)",
          color: "var(--color-ink-muted)",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 300,
          marginBottom: "var(--s-10)",
        }}
      >
        Check with your captain or marina manager for the next departure time.
      </p>

      {/* Marina tile — ink border, --r-1 radius §7.3 */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          border: "var(--border-w) solid var(--color-line)",
          borderRadius: "var(--r-1)",
          background: "var(--color-paper-warm)",
          padding: "var(--s-5)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
          marginBottom: "var(--s-3)",
        }}
      >
        <MapPin size={18} strokeWidth={2} color="var(--color-ink-muted)" />
        <div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--t-body-sm)",
            fontWeight: 600,
            color: "var(--color-ink)",
            marginBottom: 2,
          }}>
            {marinaName}
          </p>
          <p style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
          }}>
            Home marina
          </p>
        </div>
      </div>

      {/* Explainer tile — info style §7.5 */}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          border: "var(--border-w) solid var(--color-line-soft)",
          borderLeft: "4px solid var(--color-status-info)",
          borderRadius: "var(--r-1)",
          background: "var(--color-status-info-soft)",
          padding: "var(--s-4)",
        }}
      >
        <p style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-xs)",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-status-info)",
          marginBottom: "var(--s-1)",
        }}>
          What is this page?
        </p>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--t-body-sm)",
          color: "var(--color-ink)",
          lineHeight: 1.6,
        }}>
          You scanned a QR code affixed to <strong>{boatName}</strong>.
          This code is permanently attached to the vessel when a trip is scheduled
          it appears here automatically, so guests can board without a daily printed QR.
        </p>
      </div>

      {/* Footer mark */}
      <p
        style={{
          fontFamily: "var(--font-jetbrains)",
          fontSize: "var(--t-mono-xs)",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--color-sand)",
          marginTop: "var(--s-10)",
        }}
      >
        BoatCheckin
      </p>
    </div>
  );
}
