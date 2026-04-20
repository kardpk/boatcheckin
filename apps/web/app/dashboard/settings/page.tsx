import { requireOperator } from "@/lib/security/auth";
import Link from "next/link";
import {
  ScrollText, CreditCard, FileText, Star, Users,
  Lock, Scale, ShieldCheck, BookOpen, Info,
  Mail, ChevronRight, LogOut,
} from "lucide-react";
import { signOutAction } from "@/app/dashboard/actions";

// ── Shared row tile component ──────────────────────────────
function SettingsRow({
  href,
  icon: Icon,
  label,
  desc,
  external = false,
  dim = false,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  desc?: string;
  external?: boolean;
  dim?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "13px 0",
        textDecoration: "none",
      }}
    >
      <Icon
        size={15}
        strokeWidth={1.8}
        style={{ color: dim ? "var(--color-ink-muted)" : "var(--color-ink)", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 15,
          fontWeight: 500,
          color: dim ? "var(--color-ink-muted)" : "var(--color-ink)",
          lineHeight: 1.2,
        }}>
          {label}
        </p>
        {desc && (
          <p className="font-mono" style={{
            fontSize: "var(--t-mono-xs)",
            color: "var(--color-ink-muted)",
            marginTop: 2,
            letterSpacing: "0.02em",
          }}>
            {desc}
          </p>
        )}
      </div>
      <ChevronRight
        size={14}
        strokeWidth={2}
        style={{ color: "var(--color-ink-muted)", flexShrink: 0 }}
      />
    </Link>
  );
}

// ── Section kicker (matches DASHBOARD_COSMETIC_RULES §3) ──
function SectionKicker({ label }: { label: string }) {
  return (
    <div style={{
      paddingBottom: "var(--s-2)",
      marginBottom: 0,
      borderBottom: "1px solid var(--color-line-soft)",
    }}>
      <span className="font-mono" style={{
        fontSize: "var(--t-mono-xs)",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-ink-muted)",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Row divider ──
function RowDivider() {
  return <div style={{ height: "1px", background: "var(--color-line-soft)" }} />;
}

// ── Helper: subscription status label ──
function statusPill(status: string | null | undefined) {
  if (status === "active") return { label: "Pro", cls: "pill pill--ok" };
  if (status === "trial")  return { label: "Trial", cls: "pill pill--warn" };
  return { label: "Free", cls: "pill" };
}

function trialLabel(operator: { subscription_status?: string | null; trial_ends_at?: string | null }) {
  if (operator.subscription_status !== "trial" || !operator.trial_ends_at) return null;
  const days = Math.ceil((new Date(operator.trial_ends_at).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Trial expired";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

// ─────────────────────────────────────────────────────────────
export default async function SettingsPage() {
  const { operator } = await requireOperator();

  const pill   = statusPill(operator.subscription_status);
  const trial  = trialLabel(operator as any);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto", padding: "var(--s-6) var(--s-5) 120px" }}>

      {/* ── IDENTITY HEADER ─────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "var(--s-6)",
      }}>
        <div>
          <div className="font-mono" style={{
            fontSize: "var(--t-mono-xs)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-ink-muted)",
            marginBottom: 4,
          }}>
            Account
          </div>
          <h1 className="font-display" style={{
            fontSize: "clamp(26px, 5vw, 32px)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "var(--color-ink)",
            lineHeight: 1.0,
          }}>
            {(operator as any).full_name ?? "Operator"}
          </h1>
          {trial && (
            <p className="font-mono" style={{
              fontSize: 11,
              color: "var(--color-status-warn)",
              fontWeight: 600,
              marginTop: 4,
              letterSpacing: "0.04em",
            }}>
              {trial}
            </p>
          )}
        </div>
        <span className={pill.cls} style={{ fontSize: "var(--t-mono-xs)", flexShrink: 0, marginTop: 6 }}>
          {pill.label}
        </span>
      </div>

      {/* ── SECTION: MANAGE ─────────────────────────────────── */}
      <section style={{ marginBottom: "var(--s-6)" }}>
        <SectionKicker label="Manage" />
        <SettingsRow
          href="/dashboard/settings/waivers"
          icon={ScrollText}
          label="Waiver Templates"
          desc="Create & manage signing waivers"
        />
        <RowDivider />
        <SettingsRow
          href="/dashboard/guests"
          icon={Users}
          label="Guest Records"
          desc="All guests across every trip"
        />
        <RowDivider />
        <SettingsRow
          href="/dashboard/revenue"
          icon={FileText}
          label="Revenue Reports"
          desc="Add-on revenue by boat & trip"
        />
        <RowDivider />
        <SettingsRow
          href="/dashboard/reviews"
          icon={Star}
          label="Reviews"
          desc="Guest ratings & feedback"
        />
      </section>

      {/* ── SECTION: ACCOUNT ────────────────────────────────── */}
      <section style={{ marginBottom: "var(--s-6)" }}>
        <SectionKicker label="Account" />
        <SettingsRow
          href="/dashboard/billing"
          icon={CreditCard}
          label="Subscription & Billing"
          desc="Plan, invoices & payment method"
        />
      </section>

      {/* ── SECTION: LEGAL & TRUST ──────────────────────────── */}
      <section style={{ marginBottom: "var(--s-6)" }}>
        <SectionKicker label="Legal & Trust" />
        <SettingsRow href="/privacy"         icon={Lock}       label="Privacy Policy"   desc="How we handle your data"         external />
        <RowDivider />
        <SettingsRow href="/terms"           icon={Scale}      label="Terms of Service" desc="Operator agreement"               external />
        <RowDivider />
        <SettingsRow href="/security"        icon={ShieldCheck} label="Security"         desc="Data practices & infrastructure" external />
        <RowDivider />
        <SettingsRow href="/acceptable-use"  icon={BookOpen}   label="Acceptable Use"   desc="Platform rules & standards"      external />
        <RowDivider />
        <SettingsRow href="/guest-notice"    icon={Info}       label="Guest Notice"     desc="What your guests are told"       external />
      </section>

      {/* ── SECTION: HELP ───────────────────────────────────── */}
      <section style={{ marginBottom: "var(--s-6)" }}>
        <SectionKicker label="Help" />
        <SettingsRow
          href="mailto:hello@boatcheckin.com"
          icon={Mail}
          label="Contact Support"
          desc="hello@boatcheckin.com"
          external
        />
        <RowDivider />
        {/* Version row — non-clickable */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
          padding: "13px 0",
        }}>
          <Info size={15} strokeWidth={1.8} style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-ink-muted)", lineHeight: 1.2 }}>
              Boatcheckin
            </p>
            <p className="font-mono" style={{ fontSize: "var(--t-mono-xs)", color: "var(--color-ink-muted)", marginTop: 2, letterSpacing: "0.02em" }}>
              v1.0 · Built in Miami 🌊
            </p>
          </div>
        </div>
      </section>

      {/* ── SIGN OUT ────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--color-line-soft)", paddingTop: "var(--s-4)" }}>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s-2)",
              padding: "13px 0",
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LogOut size={15} strokeWidth={1.8} style={{ color: "var(--color-status-err, #C0392B)", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-status-err, #C0392B)" }}>
              Sign out
            </span>
          </button>
        </form>
      </div>

    </div>
  );
}
