"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Anchor, Users, HardHat, Check, UserPlus,
  Loader2, AlertTriangle, Ship,
} from "lucide-react";
import { ContinueButton } from "@/components/ui/ContinueButton";
import type { WizardData } from "../types";
import type { CaptainProfile } from "@/types";

interface Step3Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

const ROLE_ICON: Record<string, typeof Shield> = {
  captain:    Shield,
  first_mate: Anchor,
  crew:       Users,
  deckhand:   HardHat,
};

const ROLE_LABEL: Record<string, string> = {
  captain:    "Captain",
  first_mate: "First Mate",
  crew:       "Crew",
  deckhand:   "Deckhand",
};

export function Step3LinkCrew({ data, onNext }: Step3Props) {
  const router = useRouter();
  const [captains, setCaptains] = useState<CaptainProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState<string[]>(data.linkedCaptainIds ?? []);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    fetch("/api/dashboard/captains")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json) => {
        // API may return { data: [...] } or [...] depending on version
        const list: CaptainProfile[] = Array.isArray(json) ? json : (json.data ?? []);
        setCaptains(list);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleContinue() {
    onNext({ linkedCaptainIds: selected });
  }

  // ── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 72,
              borderRadius: "var(--r-1)",
              background:
                "linear-gradient(90deg, var(--color-bone) 25%, var(--color-line-soft) 50%, var(--color-bone) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s ease-in-out infinite",
            }}
          />
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  // ── Fetch error ─────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div
        style={{
          padding: "var(--s-5)",
          borderRadius: "var(--r-2)",
          border: "1px solid rgba(180,60,60,0.2)",
          background: "rgba(180,60,60,0.04)",
          textAlign: "center",
        }}
      >
        <AlertTriangle size={20} style={{ color: "var(--color-status-err)", margin: "0 auto 8px" }} />
        <p style={{ fontSize: 14, color: "var(--color-ink)", fontWeight: 600, marginBottom: 4 }}>
          Could not load crew roster
        </p>
        <p style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
          Check your connection and try again.
        </p>
        <button
          onClick={() => {
            setFetchError(false);
            setLoading(true);
            fetch("/api/dashboard/captains")
              .then((r) => r.json())
              .then((json) => {
                const list: CaptainProfile[] = Array.isArray(json) ? json : (json.data ?? []);
                setCaptains(list);
              })
              .catch(() => setFetchError(true))
              .finally(() => setLoading(false));
          }}
          className="btn btn--ghost"
          style={{ marginTop: "var(--s-3)", fontSize: 13 }}
        >
          <Loader2 size={13} /> Retry
        </button>
      </div>
    );
  }

  // ── Empty — no crew created yet ─────────────────────────────────────
  if (captains.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
        <div
          style={{
            textAlign: "center",
            padding: "var(--s-6) var(--s-5)",
            border: "1px dashed var(--color-line)",
            borderRadius: "var(--r-2)",
            background: "var(--color-bone)",
          }}
        >
          <div
            style={{
              width: 52, height: 52, borderRadius: "var(--r-1)",
              background: "var(--color-paper)",
              border: "1px solid var(--color-line)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--s-3)",
            }}
          >
            <Ship size={24} strokeWidth={1.25} style={{ color: "var(--color-ink-muted)" }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)", marginBottom: 6 }}>
            No crew added yet
          </p>
          <p style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.5, marginBottom: "var(--s-4)" }}>
            Add captains and crew via the <strong>Crew</strong> tab first, then link them to this boat here.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/captains")}
            className="btn btn--ink"
            style={{ fontSize: 13, height: 40, paddingInline: 16, gap: 6 }}
          >
            <UserPlus size={14} strokeWidth={2} />
            Go to Crew →
          </button>
        </div>

        {/* Skip — can link later */}
        <p
          className="mono"
          style={{ fontSize: 11, color: "var(--color-ink-muted)", textAlign: "center", letterSpacing: "0.02em" }}
        >
          Optional you can link crew to this boat anytime from Crew settings
        </p>

        <ContinueButton onClick={handleContinue}>Skip for now →</ContinueButton>
      </div>
    );
  }

  // ── Main picker ─────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>

      {/* Intro */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: "var(--r-1)",
            background: "var(--color-ink)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Users size={16} strokeWidth={1.5} style={{ color: "var(--color-paper)" }} />
        </div>
        <p style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.5, paddingTop: 6 }}>
          Select which crew members operate this vessel. Multiple captains can be linked each will appear on guest boarding passes.
        </p>
      </div>

      {/* Crew list */}
      <div
        style={{
          background: "var(--color-paper)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--r-2)",
          overflow: "hidden",
        }}
      >
        {captains.map((c, i) => {
          const isSelected = selected.includes(c.id);
          const Icon = ROLE_ICON[c.defaultRole] ?? Shield;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "var(--s-3)",
                padding: "var(--s-3) var(--s-4)",
                borderBottom:
                  i < captains.length - 1 ? "1px solid var(--color-line-soft)" : "none",
                background: isSelected ? "var(--color-bone)" : "transparent",
                borderLeft: isSelected ? "3px solid var(--color-ink)" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s, border-left-color 0.12s",
              }}
            >
              {/* Avatar or photo */}
              {c.photoUrl ? (
                <img
                  src={c.photoUrl}
                  alt={c.fullName}
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0,
                    border: "1.5px solid var(--color-line)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: isSelected ? "var(--color-ink)" : "var(--color-bone)",
                    border: "1.5px solid var(--color-line)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    transition: "background 0.12s",
                  }}
                >
                  <Icon
                    size={16} strokeWidth={1.5}
                    style={{ color: isSelected ? "var(--color-brass)" : "var(--color-ink-muted)" }}
                  />
                </div>
              )}

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 14, fontWeight: 600,
                  color: "var(--color-ink)", margin: 0, lineHeight: 1.2,
                }}>
                  {c.fullName}
                  {c.isDefault && (
                    <span
                      style={{
                        marginLeft: 6, fontSize: 10, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 9999,
                        background: "var(--color-brass)",
                        color: "var(--color-paper)",
                        verticalAlign: "middle",
                        letterSpacing: "0.04em",
                      }}
                    >
                      DEFAULT
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-ink-muted)", margin: "2px 0 0" }}>
                  {ROLE_LABEL[c.defaultRole] ?? c.defaultRole}
                  {c.licenseType ? ` · ${c.licenseType}` : ""}
                  {c.yearsExperience ? ` · ${c.yearsExperience}y exp` : ""}
                </p>
              </div>

              {/* Checkmark */}
              <div
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: isSelected ? "none" : "1.5px solid var(--color-line)",
                  background: isSelected ? "var(--color-ink)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.12s, border-color 0.12s",
                }}
              >
                {isSelected && <Check size={12} strokeWidth={3} style={{ color: "var(--color-paper)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <p
          className="mono"
          style={{
            fontSize: 11, color: "var(--color-ink-muted)",
            letterSpacing: "0.03em", textAlign: "center",
          }}
        >
          {selected.length} crew member{selected.length !== 1 ? "s" : ""} linked to this vessel
        </p>
      )}

      {/* Add more crew CTA */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/captains")}
        className="btn btn--ghost"
        style={{ fontSize: 13, height: 40, gap: 6 }}
      >
        <UserPlus size={13} strokeWidth={2} />
        Add more crew to roster →
      </button>

      <p
        className="mono"
        style={{ fontSize: 11, color: "var(--color-ink-muted)", textAlign: "center", letterSpacing: "0.02em" }}
      >
        Optional crew can be linked or unlinked anytime
      </p>

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
