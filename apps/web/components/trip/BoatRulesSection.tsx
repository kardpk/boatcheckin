import { Check, X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { CustomRuleSection } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface BoatRulesSectionProps {
  houseRules: string | null
  customDos: string[]
  customDonts: string[]
  customRuleSections: CustomRuleSection[]
  tr: TripT
}

export function BoatRulesSection({
  houseRules,
  customDos,
  customDonts,
  customRuleSections,
  tr,
}: BoatRulesSectionProps) {
  const houseRuleLines = houseRules
    ? houseRules.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}>
      {/* ── HOUSE RULES tile ── */}
      {houseRuleLines.length > 0 && (
        <RulesCard
          heading={tr.rules}
          subheading="Non-negotiable vessel rules"
          pillLabel="Required"
          pillClass="pill pill--err"
          PillIcon={AlertCircle}
          stripeColor="var(--color-status-err)"
        >
          {houseRuleLines.map((rule, idx) => (
            <RuleItem key={idx} text={rule} stripeColor="var(--color-status-err)" />
          ))}
        </RulesCard>
      )}

      {/* ── DOs tile ── */}
      {customDos.length > 0 && (
        <RulesCard
          heading={tr.dos}
          subheading="Positive guidance for your trip"
          pillLabel="Encouraged"
          pillClass="pill pill--ok"
          PillIcon={CheckCircle2}
          stripeColor="var(--color-status-ok)"
        >
          {customDos.map((item, idx) => (
            <RuleItem key={idx} text={item} stripeColor="var(--color-status-ok)" icon={<Check size={12} strokeWidth={3} style={{ color: 'var(--color-status-ok)' }} />} />
          ))}
        </RulesCard>
      )}

      {/* ── DON'Ts tile ── */}
      {customDonts.length > 0 && (
        <RulesCard
          heading={tr.donts}
          subheading="Prohibited on this vessel"
          pillLabel="Prohibited"
          pillClass="pill pill--warn"
          PillIcon={AlertTriangle}
          stripeColor="var(--color-status-warn)"
        >
          {customDonts.map((item, idx) => (
            <RuleItem key={idx} text={item} stripeColor="var(--color-status-warn)" icon={<X size={12} strokeWidth={3} style={{ color: 'var(--color-status-warn)' }} />} />
          ))}
        </RulesCard>
      )}

      {/* ── Custom sections ── */}
      {customRuleSections.map((section) => (
        <RulesCard
          key={section.id}
          heading={section.title}
          pillLabel="Custom"
          pillClass="pill pill--ghost"
          PillIcon={AlertCircle}
          stripeColor="var(--color-line)"
        >
          {section.items.map((item, idx) => (
            <RuleItem
              key={idx}
              text={item}
              stripeColor="var(--color-line)"
              icon={
                section.type === 'numbered'
                  ? <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', minWidth: 16 }}>{idx + 1}.</span>
                  : section.type === 'check'
                    ? <Check size={12} strokeWidth={3} style={{ color: 'var(--color-ink)' }} />
                    : undefined
              }
            />
          ))}
        </RulesCard>
      ))}
    </div>
  )
}

/* ── Card wrapper — mirrors Boat Wizard's DraggableList tile ── */

function RulesCard({
  heading,
  subheading,
  pillLabel,
  pillClass,
  PillIcon,
  stripeColor,
  children,
}: {
  heading: string
  subheading?: string
  pillLabel: string
  pillClass: string
  PillIcon: typeof AlertCircle
  stripeColor: string
  children: React.ReactNode
}) {
  return (
    <div
      className="tile"
      style={{ padding: 0, overflow: 'hidden' }}
    >
      {/* Header — Fraunces heading + status pill */}
      <div
        style={{
          padding: 'var(--s-3) var(--s-4)',
          borderBottom: '1px solid var(--color-line-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s-3)',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="font-display"
            style={{
              fontSize: 'var(--t-body-lg)',
              fontWeight: 500,
              color: 'var(--color-ink)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            {heading}
          </h3>
          {subheading && (
            <p
              className="font-mono"
              style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2, margin: '2px 0 0' }}
            >
              {subheading}
            </p>
          )}
        </div>
        <span className={pillClass} style={{ fontSize: '10px', flexShrink: 0 }}>
          <PillIcon size={10} strokeWidth={2} />
          {pillLabel}
        </span>
      </div>

      {/* Items */}
      <div
        style={{
          padding: 'var(--s-2) var(--s-4) var(--s-3)',
          display: 'flex', flexDirection: 'column',
          gap: 'var(--s-1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Single rule item — left stripe card matching wizard ── */

function RuleItem({
  text,
  stripeColor,
  icon,
}: {
  text: string
  stripeColor: string
  icon?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-2)',
        background: 'var(--color-paper)',
        border: '1px solid var(--color-line-soft)',
        borderRadius: 'var(--r-1)',
        borderLeft: `3px solid ${stripeColor}`,
        minHeight: 40,
        padding: '0 var(--s-3)',
      }}
    >
      {icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span
        style={{
          fontSize: 'var(--t-body-sm)',
          color: 'var(--color-ink)',
          lineHeight: 1.45,
          padding: 'var(--s-2) 0',
        }}
      >
        {text}
      </span>
    </div>
  )
}
