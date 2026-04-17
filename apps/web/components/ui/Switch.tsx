"use client";

/**
 * Switch — MASTER_DESIGN toggle primitive
 *
 * Uses CSS `left` positioning (not translateX) so the thumb is
 * mathematically clamped and NEVER overflows the track capsule —
 * regardless of pixel density, zoom level, or animation timing.
 *
 * Track: 44 × 26px
 * Thumb: 22 × 22px
 * OFF:   left: 2px
 * ON:    left: calc(100% - 24px)   ← (44 - 22 - 2) = 20px from right
 */

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, id, disabled = false }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        // Track
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        width: 44,
        height: 26,
        borderRadius: 9999,
        background: checked ? "var(--color-ink)" : "var(--color-line)",
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.18s ease",
        // Ensure the thumb never clips outside this element
        overflow: "hidden",
      }}
    >
      {/* Thumb */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 2,
          // CSS calc-based left clamped to [2px, track - thumb - 2px]
          left: checked ? "calc(100% - 24px)" : 2,
          width: 22,
          height: 22,
          borderRadius: 9999,
          background: "var(--color-paper)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
          transition: "left 0.18s ease",
          // No translateX — pure left positioning
        }}
      />
    </button>
  );
}
