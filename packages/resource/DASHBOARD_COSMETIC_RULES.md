# Dashboard Cosmetic Rules
**Quick-reference checklist for all dashboard pages.**
Derived from the `/dashboard/boats` redesign (April 2026) which is the canonical visual reference.
For deeper token specs, see `MASTER_DESIGN.md`.

---

## 1. Page Container

Every dashboard page uses the same wrapper. Copy this exactly.

```tsx
<div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>
```

| Rule | Value |
|------|-------|
| Max width | `660px` |
| Horizontal padding | `var(--s-5)` (20px) |
| Top padding | `var(--s-6)` (24px) |
| Bottom padding | `120px` (clearance for mobile bottom nav) |
| Centering | `margin: 0 auto` |

> Do NOT use Tailwind `max-w-[560px]` or `max-w-[640px]` — those are the old values.

---

## 2. Page Header (Title + Count + CTA)

```tsx
<div style={{
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginBottom: 'var(--s-8)',
  gap: 'var(--s-4)',
}}>
  <div>
    <h1 className="font-display" style={{
      fontSize: 'clamp(28px, 5vw, 36px)',
      fontWeight: 500,
      letterSpacing: '-0.03em',
      color: 'var(--color-ink)',
      lineHeight: 1.0,
    }}>
      Page title
    </h1>
    <p className="font-mono" style={{
      fontSize: 'var(--t-mono-xs)',   // 10px — NOT 13px
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-ink-muted)',  // NOT --ink-soft
      marginTop: 6,
    }}>
      5 vessels  {/* short, factual, no sentence */}
    </p>
  </div>
  <Link href="..." className="btn btn--rust" style={{ flexShrink: 0 }}>
    <Plus size={14} strokeWidth={2.5} />
    Add thing
  </Link>
</div>
```

**Rules:**
- Count label: `--t-mono-xs` (10px), `--ink-muted`, weight 600, 0.1em spacing
- Count text: short noun phrase only — `5 vessels`, `1 upcoming`, `3 members`
- CTA button: always `btn--rust`, always `flexShrink: 0`
- Header `marginBottom`: `var(--s-8)` (32px)

---

## 3. Section Kicker (Divider Before a List)

The soft hairline that appears between the page header and a list of items.
Also used between role groups (Captains / First Mates / Crew).

```tsx
<div style={{
  fontFamily: 'var(--mono)',
  fontSize: 'var(--t-mono-xs)',       // 10px
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',    // NOT --ink
  paddingBottom: 'var(--s-3)',        // 12px
  borderBottom: '1px solid var(--color-line-soft)',  // SOFT — not ink
  marginBottom: 'var(--s-4)',         // 16px
}}>
  Registered vessels
</div>
```

**Rules:**
- Border: `1px solid var(--color-line-soft)` — NEVER `1.5px solid var(--color-ink)` here
- Color: `--ink-muted` — NEVER hard `--ink`
- Font: `--t-mono-xs` (10px), weight 600, uppercase, 0.12em spacing
- Gap after: `var(--s-4)` (16px) before first list item

> The hard `1.5px --ink` border is reserved for **major page section dividers** on marketing pages only.

---

## 4. Row Tiles (List Items)

### 4a. Clean tile (no icon)
Used for: boats, any entity list where name is the primary identifier.

```tsx
<Link
  href={`/dashboard/thing/${id}`}
  className="vessel-row"           // add CSS class for hover
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--s-4)',
    padding: '18px 22px',          // generous — not 12px 16px
    background: 'var(--color-paper)',
    border: '1.5px solid var(--color-line-soft)',
    borderRadius: 'var(--r-1)',
    textDecoration: 'none',
    cursor: 'pointer',
    borderLeft: hasAlert
      ? '4px solid var(--color-brass)'       // active/scheduled asset
      : '1.5px solid var(--color-line-soft)', // idle — no stripe at all
  }}
>
  {/* Eyebrow */}
  <div className="font-mono" style={{
    fontSize: 10, fontWeight: 600,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--color-ink-muted)',
    marginBottom: 4,
  }}>
    TYPE · SUBTYPE
  </div>

  {/* Name — hero element */}
  <div className="font-display" style={{
    fontSize: 22, fontWeight: 500,
    color: 'var(--color-ink)',
    lineHeight: 1.15, letterSpacing: '-0.02em',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  }}>
    Entity Name
  </div>

  {/* Meta — single muted line */}
  <div className="font-mono" style={{
    fontSize: 12, color: 'var(--color-ink-muted)',
    marginTop: 5, letterSpacing: '0.02em',
  }}>
    Location  ·  Detail  ·  More detail
  </div>
</Link>
```

### 4b. Tile with left time column
Used for: trips, schedules.

- Left column: fixed `width: 52px`, mono departure time 20px bold
- Gap between columns: `var(--s-4)` (16px, was --s-3)
- Card padding: `16px 20px` (was 12px 16px)
- Entity name: `--t-tile` (22px, was 19px)
- Meta line below name: mono 11px, `--ink-muted`

### 4c. Rich tile (avatar + name + badges)
Used for: crew members, people cards.

- Left stripe: `4px solid` only for status alerts (expired = red, expiring = amber)
- Idle / healthy: `4px solid var(--color-line-soft)` — barely visible, not navy
- DO NOT use hard `4px --ink` stripe on non-status tiles

---

## 5. Left Accent Stripe Rules

The 4px left border on tiles communicates **status**, not decoration.

| Stripe color | Meaning | Use case |
|---|---|---|
| `--color-brass` | Scheduled / active asset | Boat with upcoming trips |
| `--color-status-ok` | Live / in progress | Active trip |
| `--color-status-err` | Alert / blocked | Expired license, cancelled trip |
| `--color-status-warn` | Warning / soon | License expiring within 30d |
| `--color-line-soft` | Idle / default | No trips, no alerts |
| No stripe | Clean idle | Boats page idle state (no stripe at all — border is uniform 1.5px) |

> **Key rule:** Never use `4px solid --ink` (hard navy) as a decorative stripe. That was the old pattern — it is now retired.

---

## 6. Hover State (Server Component pattern)

Since most dashboard list pages are Server Components (no `'use client'`), use an inline `<style>` tag for hover.

```tsx
<style>{`
  .vessel-row {
    transition: background 140ms ease, border-color 140ms ease;
  }
  .vessel-row:hover {
    background: var(--color-bone) !important;
    border-color: var(--color-ink) !important;
  }
  .vessel-row:hover .vessel-caret {
    color: var(--color-rust) !important;
    transform: translateX(2px);
  }
  .vessel-caret {
    transition: color 140ms ease, transform 140ms ease;
  }
`}</style>
```

**Rules:**
- Hover background: `--bone` (one step warmer than `--paper`)
- Hover border: darkens to `--ink` (from `--line-soft`)
- Chevron: transitions to `--rust`, nudges 2px right
- Duration: `140ms ease` (slightly faster than default 200ms)

---

## 7. Chevron (Navigation Affordance)

Every clickable row tile ends with a chevron.

```tsx
<ChevronRight
  size={16}
  strokeWidth={2}
  className="vessel-caret"
  style={{ color: 'var(--color-line)', flexShrink: 0, transition: 'color 140ms ease, transform 140ms ease' }}
/>
```

- Default color: `--color-line` (muted gray, barely visible)
- Hover: transitions to `--rust` via CSS class (see §6)
- Size: 16px, strokeWidth 2

---

## 8. Status Badges / Pills

### Trip count on a boat tile
```tsx
{tripCount > 0 && (
  <span className="font-mono" style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 'var(--r-pill)',
    background: 'var(--color-status-warn-soft)',
    color: 'var(--color-status-warn)',
    border: '1px solid var(--color-status-warn)',
    whiteSpace: 'nowrap',
  }}>
    <Calendar size={10} strokeWidth={2.5} />
    {tripCount} {tripCount === 1 ? 'trip' : 'trips'}
  </span>
)}
```

### Status badge system
| Badge class | Color | Use when |
|---|---|---|
| `pill--ok` | Green | Completed, checked in, verified |
| `pill--warn` | Amber/brass | Upcoming, pending, expiring soon |
| `pill--err` | Red | Cancelled, expired, blocked |
| `pill--ink` | Navy | Role label (Captain, First Mate) |
| `pill--ghost` | Outline only | Counts, neutral info |

---

## 9. Icons

**DO:**
- 10px icons paired with 10px mono meta text
- 12px icons in section kickers
- 14px icons in buttons
- 16px chevron at end of row tiles
- `strokeWidth={1.5}` for decorative/empty-state icons (large, 32px+)
- `strokeWidth={2}` for standard UI icons
- `strokeWidth={2.5}` for buttons and active state icons

**DO NOT:**
- Put icons in a colored square box on list items (this was retired)
- Use icon as primary content identifier in a tile
- Use icons larger than 20px inline with text

---

## 10. Empty State

```tsx
<div className="tile" style={{
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  textAlign: 'center',
  padding: 'var(--s-16) var(--s-8)',
  gap: 'var(--s-4)',
  borderStyle: 'dashed',
}}>
  {/* Optional: lucide icon 32px strokeWidth 1.5 --ink-muted */}
  <h2 className="font-display" style={{
    fontSize: 24, fontWeight: 500,
    color: 'var(--color-ink)', letterSpacing: '-0.02em',
  }}>
    No things yet
  </h2>
  <p style={{
    fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)',
    maxWidth: 280, lineHeight: 1.6,
  }}>
    One sentence explaining what to do next.
  </p>
  <Link href="..." className="btn btn--rust" style={{ marginTop: 'var(--s-2)' }}>
    Create first thing
    <ArrowRight size={14} strokeWidth={2.5} />
  </Link>
</div>
```

---

## 11. Pages Already Compliant

| Page | Status | Notes |
|---|---|---|
| `/dashboard/boats` | ✅ Done | Canonical reference |
| `/dashboard/trips` | ✅ Done | TripCard updated |
| `/dashboard/captains` | ✅ Done | CrewRosterClient + CaptainCard updated |

## 12. Pages Needing Audit

Run this checklist on each page below. Check each item:

- [ ] Container is `maxWidth: 660`, `padding: var(--s-6) var(--s-5) 120px`
- [ ] Header count is `--t-mono-xs`, `--ink-muted`, not 13px `--ink-soft`
- [ ] Section kickers use `1px --line-soft` not `1.5px --ink`
- [ ] Row tiles have `padding: 18px 22px` (not 12px 16px)
- [ ] No colored icon boxes on tiles
- [ ] Left stripes carry semantic meaning only (no decorative hard navy)
- [ ] Hover state implemented

| Page | Audited | Compliant |
|---|---|---|
| `/dashboard` (home) | ☐ | ☐ |
| `/dashboard/trips/[id]` | ☐ | ☐ |
| `/dashboard/boats/[id]` | ☐ | ☐ |
| `/dashboard/boats/new/*` | ☐ | ☐ |
| `/dashboard/captains/[id]` | ☐ | ☐ |
| `/dashboard/guests` | ☐ | ☐ |
| `/dashboard/settings` | ☐ | ☐ |
