/**
 * DashTile — Universal Dashboard Tile Component
 *
 * Three variants:
 *   vessel  — square grid card with top color bar, status pill, optional progress bars
 *   row     — horizontal list row with left accent stripe
 *   kpi     — metric cell with large Fraunces value
 *
 * One status prop drives all color-coding across every page.
 * Reference: MASTER_DESIGN.md §9.8
 */

import Link from 'next/link'
import React from 'react'

// ─── Status → color mapping ───────────────────────────────────────────────────

export type TileStatus = 'ok' | 'warn' | 'err' | 'grey' | 'brass' | 'info'

export const TILE_STATUS_COLORS: Record<TileStatus, {
  bar:   string
  soft:  string
  text:  string
  pill:  string
}> = {
  ok:    { bar: '#059669', soft: '#ECFDF5', text: '#059669', pill: 'pill--ok'    },
  warn:  { bar: '#D97706', soft: '#FFFBEB', text: '#D97706', pill: 'pill--warn'  },
  err:   { bar: '#DC2626', soft: '#FEF2F2', text: '#DC2626', pill: 'pill--err'   },
  grey:  { bar: '#9CA3AF', soft: '#F9FAFB', text: '#9CA3AF', pill: 'pill--ghost' },
  brass: { bar: '#C8A14A', soft: '#FDF8EE', text: '#C8A14A', pill: 'pill--brass' },
  info:  { bar: '#2D5D6E', soft: '#EBF2F4', text: '#2D5D6E', pill: 'pill--info'  },
}

// ─── Progress Bar (shared) ────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 100 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{
      height: 3,
      background: 'var(--color-line-soft)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 3,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

// ─── Prop types ────────────────────────────────────────────────────────────────

export interface DashTileBar {
  label: string
  value: number
  max:   number
  color?: string   // defaults to status bar color
}

export interface DashTilePill {
  label:   string
  variant?: string  // CSS class e.g. 'pill--ok' — defaults to status pill class
}

// ── Vessel variant ─────────────────────────────────────────────────────────────

interface VesselTileProps {
  variant: 'vessel'
  status:  TileStatus
  eyebrow?: string
  title:   string
  meta?:   string
  pill?:   DashTilePill
  bars?:   DashTileBar[]
  badge?:  string    // small flag chip (FLAGS, ADD-ONS PENDING, etc.)
  badgeStatus?: TileStatus
  href?:   string
  onClick?: () => void
}

// ── Row variant ────────────────────────────────────────────────────────────────

interface RowTileProps {
  variant: 'row'
  status:  TileStatus
  eyebrow?: string
  title:   string
  meta?:   string
  pill?:   DashTilePill
  rightSlot?: React.ReactNode
  href?:   string
  onClick?: () => void
}

// ── KPI variant ────────────────────────────────────────────────────────────────

interface KpiTileProps {
  variant:  'kpi'
  status?:  TileStatus   // optional — gives the bar accent color
  label:    string
  value:    string
  sub?:     string       // secondary small text
  delta?:   string       // trend line e.g. '↑ 18%'
  deltaPositive?: boolean
  icon?:    React.ReactNode
}

export type DashTileProps = VesselTileProps | RowTileProps | KpiTileProps

// ─── Component ────────────────────────────────────────────────────────────────

export function DashTile(props: DashTileProps) {
  if (props.variant === 'vessel') return <VesselTile {...props} />
  if (props.variant === 'row')    return <RowTile    {...props} />
  return <KpiTile {...props} />
}

// ─── Vessel Tile ──────────────────────────────────────────────────────────────

function VesselTile({
  status, eyebrow, title, meta, pill, bars, badge, badgeStatus, href, onClick,
}: VesselTileProps) {
  const c = TILE_STATUS_COLORS[status]
  const pillClass = pill?.variant ?? c.pill
  const badgeColor = badgeStatus ? TILE_STATUS_COLORS[badgeStatus] : null

  const card = (
    <div
      onClick={!href ? onClick : undefined}
      style={{
        background:   'var(--color-paper)',
        border:       '1px solid var(--color-line-soft)',
        borderRadius: 'var(--r-2)',
        overflow:     'hidden',
        cursor:       href || onClick ? 'pointer' : 'default',
        transition:   'border-color 140ms ease, background 140ms ease',
      }}
      onMouseEnter={e => {
        if (!href && !onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.background    = 'var(--color-bone)'
        el.style.borderColor   = 'var(--color-ink)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background    = 'var(--color-paper)'
        el.style.borderColor   = 'var(--color-line-soft)'
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 3, background: c.bar }} />

      <div style={{ padding: '13px 15px' }}>
        {/* Header: title + pill */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 6,
          marginBottom: 6,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {eyebrow && (
              <p className="font-mono" style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                margin: '0 0 3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {eyebrow}
              </p>
            )}
            <p style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-ink)',
              lineHeight: 1.2,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </p>
            {meta && (
              <p className="font-mono" style={{
                fontSize: 10,
                color: 'var(--color-ink-muted)',
                marginTop: 3,
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {meta}
              </p>
            )}
          </div>

          {/* Status pill */}
          {pill && (
            <span className={`font-mono ${pillClass}`} style={{
              fontSize: 9,
              fontWeight: 700,
              color: c.text,
              background: c.soft,
              padding: '3px 7px',
              borderRadius: 'var(--r-1)',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              textTransform: 'uppercase',
            }}>
              {pill.label}
            </span>
          )}
        </div>

        {/* Progress bars */}
        {bars && bars.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {bars.map(bar => (
              <div key={bar.label}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                    {bar.label}
                  </span>
                  <span className="font-mono" style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: bar.value === bar.max ? 'var(--color-teal)' : 'var(--color-ink)',
                  }}>
                    {bar.value}/{bar.max}
                  </span>
                </div>
                <ProgressBar
                  value={bar.value}
                  max={bar.max}
                  color={bar.color ?? c.bar}
                />
              </div>
            ))}
          </div>
        )}

        {/* Badge chip */}
        {badge && (
          <div style={{ marginTop: 7 }}>
            <span className="font-mono" style={{
              fontSize: 9,
              color:    badgeColor?.text ?? c.text,
              background: badgeColor?.soft ?? c.soft,
              borderRadius: 'var(--r-1)',
              padding:  '2px 6px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>
  return card
}

// ─── Row Tile ─────────────────────────────────────────────────────────────────

function RowTile({
  status, eyebrow, title, meta, pill, rightSlot, href, onClick,
}: RowTileProps) {
  const c = TILE_STATUS_COLORS[status]
  const pillClass = pill?.variant ?? c.pill

  const row = (
    <div
      onClick={!href ? onClick : undefined}
      className="dash-row-tile"
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          'var(--s-3)',
        padding:      '15px 18px',
        background:   'var(--color-paper)',
        border:       '1.5px solid var(--color-line-soft)',
        borderLeft:   `4px solid ${c.bar}`,
        borderRadius: 'var(--r-1)',
        cursor:       href || onClick ? 'pointer' : 'default',
        transition:   'border-color 140ms ease, background 140ms ease',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        if (!href && !onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = 'var(--color-bone)'
        el.style.borderColor = 'var(--color-ink)'
        el.style.borderLeft  = `4px solid ${c.bar}`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.background  = 'var(--color-paper)'
        el.style.borderColor = 'var(--color-line-soft)'
        el.style.borderLeft  = `4px solid ${c.bar}`
      }}
    >
      {/* Content block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <p className="font-mono" style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            margin: '0 0 3px',
          }}>
            {eyebrow}
          </p>
        )}
        <p className="font-display" style={{
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--color-ink)',
          lineHeight: 1.2,
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </p>
        {meta && (
          <p className="font-mono" style={{
            fontSize: 11,
            color: 'var(--color-ink-muted)',
            marginTop: 4,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {meta}
          </p>
        )}
      </div>

      {/* Right slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {pill && (
          <span className={`font-mono ${pillClass}`} style={{
            fontSize: 10,
            fontWeight: 700,
            color: c.text,
            background: c.soft,
            padding: '3px 9px',
            borderRadius: 'var(--r-1)',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>
            {pill.label}
          </span>
        )}
        {rightSlot}
      </div>
    </div>
  )

  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{row}</Link>
  return row
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  status, label, value, sub, delta, deltaPositive, icon,
}: KpiTileProps) {
  const c = status ? TILE_STATUS_COLORS[status] : null

  return (
    <div style={{
      background:   'var(--color-paper)',
      border:       '1px solid var(--color-line-soft)',
      borderRadius: 'var(--r-2)',
      overflow:     'hidden',
    }}>
      {/* Top accent bar */}
      {c && <div style={{ height: 3, background: c.bar }} />}

      <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="font-mono" style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}>
            {label}
          </span>
          {icon && (
            <span style={{ color: 'var(--color-ink-muted)', opacity: 0.6 }}>
              {icon}
            </span>
          )}
        </div>

        {/* Value */}
        <span className="font-display" style={{
          fontSize: 26,
          fontWeight: 600,
          color: 'var(--color-ink)',
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
        }}>
          {value}
        </span>

        {/* Sub / delta */}
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
            {sub}
          </span>
        )}
        {delta && (
          <span className="font-mono" style={{
            fontSize: 11,
            fontWeight: 700,
            color: deltaPositive ? '#059669' : '#DC2626',
          }}>
            {delta}
          </span>
        )}
      </div>
    </div>
  )
}
