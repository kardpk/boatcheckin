# MASTER_DESIGN.md
### Boatcheckin Design System · v1.0 · Canonical Reference

> **Purpose of this document.** This is the single source of truth for Boatcheckin's design language across every surface: marketing homepage, operator dashboard, boat wizard, captain snapshot, guest join flow, admin console, emails, and printed assets. Your agent — and any human engineer — must consult this file before building or modifying UI.
>
> **How to use this document.** When working on a feature (e.g. "boat wizard Step 4"), `grep` for the relevant section, then read the full "Primitives" and "Rules" sections first. Never invent new colors, new font sizes, or new spacing values that aren't tokenized here. If you genuinely need a new token, add it to the Design System CSS file first, then use it.
>
> **Stack.** Next.js 16 (App Router) · React 19 · TailwindCSS v4 · TypeScript · lucide-react for icons · Fraunces + Inter + JetBrains Mono from Google Fonts.

---

## Table of Contents

1. [Design Principles (Read First)](#1-design-principles-read-first)
2. [Rules of the Road (Non-Negotiable)](#2-rules-of-the-road-non-negotiable)
3. [Design Tokens](#3-design-tokens)
4. [Typography System](#4-typography-system)
5. [Iconography](#5-iconography)
6. [Layout & Grid](#6-layout--grid)
7. [Primitives Library](#7-primitives-library)
8. [Form System](#8-form-system)
9. [Tile & Card System](#9-tile--card-system)
10. [Data Display](#10-data-display)
11. [Feedback & Status](#11-feedback--status)
12. [Navigation Patterns](#12-navigation-patterns)
13. [Mobile & Responsive Rules](#13-mobile--responsive-rules)
14. [Surface-Specific Guidance](#14-surface-specific-guidance)
15. [Accessibility Requirements](#15-accessibility-requirements)
16. [Animation & Motion](#16-animation--motion)
17. [Anti-Patterns (What Not to Do)](#17-anti-patterns-what-not-to-do)
18. [Migration Playbook](#18-migration-playbook)
19. [File Structure & Code Conventions](#19-file-structure--code-conventions)
20. [Appendix: Complete Token CSS](#20-appendix-complete-token-css)

---

## 1. Design Principles (Read First)

Every design decision in this system derives from one of five principles. When in doubt, return here.

### 1.1 Editorial, Not Corporate

Boatcheckin visually presents as a maritime trade publication meets Coast Guard document meets modern SaaS. Serif display headlines (Fraunces), monospace for technical data (JetBrains Mono), clean sans-serif for body (Inter). We use paper-toned backgrounds, deep navy ink, and rust/brass accents. We reject generic SaaS aesthetics: no purple-on-white gradients, no rounded-everything, no stock boat photography, no "playful" illustrated mascots.

### 1.2 Compliance is the Hero

Our competitive moat is regulatory rigor (SB 606, 46 CFR §185.506, FWC Chapter 327). UI should reinforce seriousness. Legal language should look like legal language. Audit data should look like audit data. Safety gates should feel consequential — not like a modal that dismisses with a smile.

### 1.3 Conservative Buyers, Bold Design

Our users are 45–65 year old Florida charter captains and marina managers. They are skeptical of software. They trust documents. The design must read as *credible and permanent*, not *trendy and ephemeral*. Hard edges over rounded. Flat surfaces over gradients. Explicit labels over clever metaphors.

### 1.4 Operational First

Captains use Boatcheckin at the helm, with wet hands, in bright sun. Dashboard surfaces are scanned, not read. Every screen should answer three questions within 3 seconds: *What needs my attention? What's ready to go? What's next?*

### 1.5 Cohesion Across Surfaces

Homepage, webapp, guest flow, and admin must feel like one product. If a pill is green-on-cream with rust-red text on the dashboard, it's green-on-cream with rust-red text on the snapshot. No surface-specific visual languages.

---

## 2. Rules of the Road (Non-Negotiable)

These rules are absolute. If an agent or engineer breaks one, the PR is rejected.

**R1. No emojis.** Anywhere. Not in tabs, not in empty states, not in alerts, not in marketing copy, not in captain notes UI. We use lucide-react icons instead. Emojis are decorative noise in a compliance product.

**R2. Icons are lucide-react only.** No inline SVG icons invented ad-hoc. No Heroicons, no Phosphor, no Tabler. If lucide-react doesn't have what you need, extend via the mappings in Section 5.

**R3. Serif for display, sans-serif for body, monospace for data.** Fraunces for headlines and emphasis only. Inter for all body copy, labels, buttons. JetBrains Mono for numbers, codes, timestamps, keys, technical identifiers. Never mix these roles.

**R4. Use tokens, never literals.** `color: var(--ink)` not `color: #0B1E2D`. `padding: var(--s-4)` not `padding: 16px`. If you need a value that doesn't exist in the token system, add it to the tokens first.

**R5. No rounded-full except for pills and avatars.** Default radius is `var(--r-1)` which is 2px. Form fields are `var(--r-2)` which is 4px. Pills and avatars are `var(--r-pill)` which is 9999px. Cards and tiles are `var(--r-1)`. Nothing else.

**R6. No drop shadows on cards by default.** Cards use borders, not shadows. The only shadows are `--shadow-lift` (deliberate editorial emphasis, as on the homepage hero card) and `--shadow-float` (modals, toasts, elevated overlays only).

**R7. No gradient fills.** Anywhere. Gradients are a generic SaaS tell. Our accents are flat solid colors.

**R8. Buttons are sharp, with 1.5px borders.** Never pill-shaped buttons. Never unbordered text buttons that could be mistaken for links.

**R9. Every interactive element has a visible focus state.** Using `--focus-ring` token. Never rely on browser default.

**R10. Do not invent new status colors.** We have `status-ok`, `status-warn`, `status-err`, `status-info`. That is the full set. A "neutral" pill uses `pill--ghost`. A "brand" pill uses `pill--rust` or `pill--brass`.

**R11. Dates and times are always mono-formatted.** `08:30` not `8:30 AM`. `17 Apr 2026` not `April 17, 2026`. Exception: long-form prose.

**R12. No emojis in placeholder text.** `placeholder="Your full name"` not `placeholder="✨ Your full name ✨"`.

**R13. Error messages are specific.** "Email is required" not "Please fill this out." "Trip code must be 4 characters" not "Invalid input."

**R14. Loading states are explicit.** Use skeleton placeholders that match the final layout. Never spinners on full page sections.

**R15. Match the editorial tone in copy.** Title case for headlines. Sentence case for body. Do NOT use em dashes (—) in body copy — the codebase has been cleaned of these. Compliance citations always italicized on first reference: *46 CFR §185.506*.

---

## 3. Design Tokens

All tokens are defined as CSS custom properties on `:root`. Tailwind v4 config extends these via `@theme`. Agents must not hard-code color or spacing values.

### 3.1 Core Palette

| Token | Value | Usage |
|---|---|---|
| `--ink` | `#0B1E2D` | Primary navy. Headlines, body text, borders, dark surfaces. |
| `--ink-soft` | `#1A2F42` | Softer navy. Secondary text, hover-darkened ink. |
| `--ink-muted` | `#3D5568` | Muted body text, captions, disabled states. |
| `--bone` | `#F4EFE6` | Paper/card fill on dark surfaces. Footer text. |
| `--bone-warm` | `#EDE6D8` | Warmer paper. Section backgrounds. |
| `--paper` | `#FAF7F0` | Primary page background. |
| `--paper-warm` | `#F6F0E4` | Elevated surface on paper. Form field fill. |

### 3.2 Accent Palette

| Token | Value | Usage |
|---|---|---|
| `--rust` | `#B84A1F` | Primary action color. CTAs, accents, active nav. |
| `--rust-deep` | `#8A3515` | Rust hover/pressed state. |
| `--rust-soft` | `#E8A585` | Rust tint for backgrounds (rare). |
| `--brass` | `#C8A14A` | Regulatory/highlight accent. Compliance badges, premium tier. |
| `--brass-deep` | `#9E7D2E` | Brass hover state. |
| `--sea` | `#2D5D6E` | Deep water. Trust signals, weather tiles. |
| `--sea-deep` | `#1A3F4D` | Insurance/protection sections. |
| `--sand` | `#D9CFB8` | Subtle divider, decorative neutral. |

### 3.3 Status Palette

Used strictly for feedback (alerts, pills, borders). Never invent alternatives.

| Token | Value | Usage |
|---|---|---|
| `--status-ok` | `#1F6B52` | Success state text/border |
| `--status-ok-soft` | `#D4E5DC` | Success state background |
| `--status-warn` | `#B5822A` | Warning state text/border |
| `--status-warn-soft` | `#F2E4C4` | Warning state background |
| `--status-err` | `#A8361E` | Error/danger state text/border |
| `--status-err-soft` | `#F2D5CC` | Error/danger state background |
| `--status-info` | `#2D5D6E` | Info/neutral state text/border |
| `--status-info-soft` | `#CBD9DD` | Info/neutral state background |

### 3.4 Lines & Borders

| Token | Value | Usage |
|---|---|---|
| `--line` | `#0B1E2D` | Primary border color (same as `--ink`) |
| `--line-soft` | `rgba(11, 30, 45, 0.12)` | Subtle dividers inside cards |
| `--line-softer` | `rgba(11, 30, 45, 0.06)` | Very subtle hairlines |
| `--border-width` | `1.5px` | Default border width |
| `--border-width-heavy` | `2px` | Heavy emphasis border |

### 3.5 Spacing Scale

Base unit 4px. Use tokens, not pixels.

| Token | Value | Common use |
|---|---|---|
| `--s-1` | `4px` | Inline tight gaps |
| `--s-2` | `8px` | Component internal gaps |
| `--s-3` | `12px` | Field internal padding |
| `--s-4` | `16px` | Default block padding |
| `--s-5` | `20px` | Card padding (sm) |
| `--s-6` | `24px` | Card padding (default) |
| `--s-8` | `32px` | Section content padding |
| `--s-10` | `40px` | Card padding (lg) |
| `--s-12` | `48px` | Section inner spacing |
| `--s-16` | `64px` | Section vertical padding (compact) |
| `--s-20` | `80px` | Section vertical padding (default) |
| `--s-24` | `96px` | Section vertical padding (generous) |
| `--s-30` | `120px` | Homepage hero section padding |

### 3.6 Radii

| Token | Value | Usage |
|---|---|---|
| `--r-0` | `0px` | Hard edges — official documents, print-style |
| `--r-1` | `2px` | Default — buttons, tiles, cards, alerts |
| `--r-2` | `4px` | Soft — form fields, chips |
| `--r-pill` | `9999px` | Pills, avatars, dots |

### 3.7 Shadows

Use sparingly. Most surfaces use borders instead.

| Token | Value | Usage |
|---|---|---|
| `--shadow-doc` | `none` | Flat inline content (default) |
| `--shadow-lift` | `8px 8px 0 var(--ink)` | Editorial emphasis (homepage hero) |
| `--shadow-float` | `0 4px 24px rgba(11, 30, 45, 0.08)` | Modals, toasts, dropdowns |
| `--shadow-inset` | `inset 0 1px 0 rgba(11, 30, 45, 0.04)` | Pressed button state |

### 3.8 Motion

| Token | Value | Usage |
|---|---|---|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Entry animations only |
| `--duration-fast` | `150ms` | Micro-interactions, focus, hover |
| `--duration` | `250ms` | Default transitions |
| `--duration-slow` | `400ms` | Entry animations, modal enter |

### 3.9 Focus Ring

| Token | Value | Usage |
|---|---|---|
| `--focus-ring` | `0 0 0 3px rgba(184, 74, 31, 0.25)` | All focusable elements |
| `--focus-ring-error` | `0 0 0 3px rgba(168, 54, 30, 0.25)` | Fields in error state |

---

## 4. Typography System

### 4.1 Font Families

- **Display:** Fraunces (variable font, opsz 9–144, wghts 400/500/600/700/900). Used for headlines, section titles, tile titles, and emphasized spans. Italic variant for editorial emphasis.
- **Body:** Inter (wghts 400/500/600/700). All body copy, buttons, labels, nav.
- **Mono:** JetBrains Mono (wghts 400/500/600). Codes, timestamps, numeric data, technical identifiers, small labels.

Load all three via a single Google Fonts link in the Next.js `<head>`.

### 4.2 Type Scale

Use these tokens explicitly. Never invent new sizes.

| Token | Size | Line height | Font | Usage |
|---|---|---|---|---|
| `--t-mono-xs` | `10px` | 1.3 | Mono | Smallest labels, stamps |
| `--t-mono-sm` | `11px` | 1.4 | Mono | Section eyebrows, card labels |
| `--t-mono-md` | `13px` | 1.5 | Mono | Inline data, timestamps |
| `--t-body-sm` | `13px` | 1.5 | Body | Card body, captions, meta |
| `--t-body-md` | `15px` | 1.6 | Body | Default body text |
| `--t-body-lg` | `17px` | 1.55 | Body | Emphasized body, form inputs |
| `--t-lede` | `19px` | 1.55 | Body | Hero ledes, section subheadings |
| `--t-tile` | `22px` | 1.25 | Display | Tile titles, FAQ questions |
| `--t-card` | `28px` | 1.15 | Display | Card titles, medium headings |
| `--t-sub` | `36px` | 1.1 | Display | Subsection headings |
| `--t-section` | `48px` | 1.05 | Display | Section titles |
| `--t-hero` | `86px` | 0.98 | Display | Hero headline only |

### 4.3 Weight & Letter-Spacing Rules

- **Headlines (display):** weight 500, `letter-spacing: -0.025em`. Italic variants are weight 400.
- **Body:** weight 400. Emphasized body is weight 500. Bold only at weight 600–700.
- **Mono:** weight 500 default, 600 for emphasis. Always UPPERCASE with `letter-spacing: 0.15em` when used as a label.
- **Buttons:** weight 600, `letter-spacing: 0.01em`.

### 4.4 Editorial Italic Pattern

We emphasize a single concept per headline using Fraunces italic in rust color. Example:

```html
<h2>The paper clipboard is <em>finally retired.</em></h2>
```

```css
h2 em {
  font-style: italic;
  font-weight: 400;
  color: var(--rust);
}
```

Use this sparingly — one italic phrase per headline max, and not on every headline. Reserve for moments of genuine editorial emphasis.

### 4.5 Line Height by Context

- Headlines (`--t-section` and up): 0.95–1.1
- Tile titles, FAQ: 1.15–1.25
- Body text: 1.5–1.6
- Dense data (tables, lists): 1.4

---

## 5. Iconography

### 5.1 Library

**lucide-react** is the only icon library. Install:

```bash
npm install lucide-react
```

### 5.2 Import Pattern

```tsx
import { Anchor, Ship, Compass, ShieldCheck } from "lucide-react";
```

Never use the bundled `<LucideIcon />` wrapper component. Import specific icons for tree-shaking.

### 5.3 Icon Sizes

| Context | Size | Stroke width |
|---|---|---|
| Button inline icon | `14px` | `2.5` |
| Nav item icon | `18px` | `2` |
| Tile label icon | `16px` | `2` |
| Empty state icon | `48px` | `1.5` |
| Status pill icon | `12px` | `2.5` |

Use the `size` and `strokeWidth` props:

```tsx
<Anchor size={18} strokeWidth={2} />
```

### 5.4 Canonical Icon Mappings

Use these exact icons for these concepts. Do not substitute.

| Concept | Icon | Context |
|---|---|---|
| Boat / vessel | `Ship` | Default boat icon |
| Anchor / dock | `Anchor` | Marina, boat detail |
| Captain / crew | `UserRound` | Captain avatar fallback |
| Guest | `Users` | Guest count, guest manifest |
| Trip | `MapPin` | Trip location indicator |
| Weather | `Sun`, `Cloud`, `CloudRain`, `Wind` | Weather tile |
| Safety | `ShieldCheck` | Safety briefing, compliance |
| Waiver / legal | `FileSignature` | Waiver signed |
| Warning | `AlertTriangle` | Compliance warnings |
| Danger / error | `AlertOctagon` | Hard errors |
| Success | `CheckCircle2` | Approved, ready |
| Info | `Info` | Info alerts |
| Clock / time | `Clock` | Departure time, duration |
| Calendar | `Calendar` | Trip date |
| Check | `Check` | Simple checkmark in lists |
| Close / cancel | `X` | Modal close only |
| Menu (mobile) | `Menu` | Hamburger |
| Chevron right | `ChevronRight` | List item "view" |
| Arrow right | `ArrowRight` | CTA button arrow |
| QR code | `QrCode` | QR-related UI |
| Download | `Download` | PDF, export |
| Print | `Printer` | Print actions |
| Search | `Search` | Search inputs |
| Filter | `SlidersHorizontal` | Filter/sort controls |
| Settings | `Settings` | Settings nav |
| Eye / view | `Eye` | Preview/view action |
| Edit | `Pencil` | Edit action |
| Delete | `Trash2` | Delete action |
| Add | `Plus` | Add/new action |
| External link | `ExternalLink` | Off-platform links |
| Copy | `Copy` | Copy-to-clipboard |
| Email | `Mail` | Email link/field |
| Phone | `Phone` | Phone link/field |
| Location | `MapPinned` | Address field |
| Language | `Languages` | Language selector |
| Lock / secure | `Lock` | Security indicators |
| Unlock | `LockOpen` | (rare) |
| Loading | `Loader2` | With `className="animate-spin"` |

### 5.5 Icon Color Rules

- Inside a `--ink`-colored button: inherit (`currentColor`)
- Inside a `--rust` button: inherit
- Standalone (e.g., in a tile): `--ink-muted` by default, `--rust` when representing an action state
- In alerts: matches the alert's text color

---

## 6. Layout & Grid

### 6.1 Container

Max width: `1320px`. Padding: `32px` (desktop), `20px` (mobile). Defined as `.container`.

```css
.container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 32px;
}
@media (max-width: 720px) {
  .container { padding: 0 20px; }
}
```

### 6.2 Grid System

Use CSS Grid, not Flexbox, for layouts with explicit column counts. Tailwind's `grid-cols-N` is fine for simple cases; for anything with irregular columns, write custom grid template.

### 6.3 Breakpoints

| Name | Width | Usage |
|---|---|---|
| `xs` | up to `480px` | Small phones |
| `sm` | `480–720px` | Large phones |
| `md` | `720–1024px` | Tablets, small laptops |
| `lg` | `1024–1320px` | Desktops |
| `xl` | `1320px+` | Large displays |

Breakpoint targets for design: primarily 375px (iPhone SE), 768px (tablet), 1280px (default desktop).

### 6.4 Section Padding Rhythm

| Density | Vertical padding | When |
|---|---|---|
| Compact | `var(--s-16)` (64px) | Dense dashboard sections, mobile-first flows |
| Default | `var(--s-20)` (80px) | Standard webapp sections |
| Generous | `var(--s-24)` (96px) | Marketing pages |
| Hero | `var(--s-30)` (120px) | Homepage hero only |

### 6.5 Border-Driven Layouts

Our signature layout pattern: sections divided by 1.5px solid `--ink` lines. No shadows, no rounded cards-within-cards. This creates an editorial document feel.

```css
.section-divider {
  border-top: var(--border-width) solid var(--ink);
  border-bottom: var(--border-width) solid var(--ink);
}
```

When dividing a row into cells, use single borders, not double:

```css
.grid-cell { border-right: 1px solid var(--line-soft); }
.grid-cell:last-child { border-right: none; }
```

### 6.6 Section Kicker (Section Title Divider)

Within dense forms and single-column flows (dashboard pages), sections are separated by a **SectionKicker** — a mono label followed by a soft `1px solid var(--line-soft)` bottom border. **This is intentionally faded/soft, not hard black.**

```tsx
function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 'var(--t-mono-xs)',    // 10px
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-muted)',
        paddingBottom: 'var(--s-3)',     // 12px
        borderBottom: '1px solid var(--color-line-soft)',  // SOFT — not ink
        marginBottom: 'var(--s-4)',      // 16px
      }}
    >
      {children}
    </div>
  )
}
```

**Rules:**
- SectionKicker uses `--line-soft` (rgba 12% opacity) NOT `--ink`. Hard black dividers are for major page sections only.
- Font: mono, uppercase, 10px, weight 600, `--ink-muted`
- Always `marginBottom: var(--s-4)` (16px) to separate from first child
- Used in: dashboard forms, boat wizard steps, trip create form, captain profile
- NOT used in: marketing pages (use `<hr class="divider">` there), data tables

**Spacing between form sections:**
Forms using SectionKicker should have `gap: var(--s-8)` (32px) between `<section>` elements. This creates the breathing room that makes each section feel scannable.

---

## 7. Primitives Library

These are the atomic building blocks. Everything in the product is composed from these.

### 7.1 Button

Base class `.btn`. Required props: none. Variant via modifier classes.

```html
<!-- Default (outline ink) -->
<button class="btn">Cancel</button>

<!-- Primary (solid ink) -->
<button class="btn btn--primary">Save</button>

<!-- Rust CTA (the hero action) -->
<button class="btn btn--rust">Start Free</button>

<!-- Ghost (no border, hover underline) -->
<button class="btn btn--ghost">View details</button>

<!-- Small -->
<button class="btn btn--sm">Edit</button>

<!-- Destructive -->
<button class="btn btn--danger">Delete Boat</button>
```

**Sizes:**
- `.btn` default: padding `11px 22px`, font-size `14px`
- `.btn--sm`: padding `8px 14px`, font-size `13px`
- `.btn--lg`: padding `14px 28px`, font-size `15px`

**Rules:**
- Always 1.5px border
- Always `--r-1` (2px) radius
- Weight 600, `letter-spacing: 0.01em`
- Icon-text buttons use `gap: 8px` and icon size 14px
- Arrow right icon on primary CTAs: `<ArrowRight size={14} strokeWidth={2.5} />`

### 7.2 Pill (Status)

Used for trip status, guest approval, compliance flags, role indicators.

```tsx
<span className="pill pill--ok">
  <span className="pill-dot"></span>
  Ready
</span>

<span className="pill pill--warn">
  <span className="pill-dot"></span>
  2 waivers pending
</span>

<span className="pill pill--err">
  Declined
</span>
```

**Variants:** `pill--ok`, `pill--warn`, `pill--err`, `pill--info`, `pill--ghost`, `pill--rust`, `pill--brass`.

**Rules:**
- Always mono font, uppercase, `letter-spacing: 0.12em`, font-size 10–11px
- Padding: `4px 10px`
- Optional leading dot (`<span class="pill-dot"></span>`) for strong visual status
- Optional trailing lucide icon for clarification
- Never stack pills against each other with less than 6px gap

### 7.3 Tile

The most-used composition primitive. Three sizes.

```html
<div class="tile">
  <span class="tile-label">Today's Trips</span>
  <div class="tile-title">Sunrise Charter</div>
  <p>Departure 08:30 · 6 guests · Slip 14</p>
</div>
```

**Variants:**
- `.tile--sm` — padding 20px, for dense grids
- `.tile` (default) — padding 24px
- `.tile--lg` — padding 32px, for hero tiles
- `.tile--dark` — dark navy fill, bone text
- `.tile--hover` — hover state (tile becomes bone-colored)

**Rules:**
- Always `--r-1` radius
- Always 1.5px ink border (never shadow)
- Internal typography follows the tile label/title/body pattern below
- Never nest tiles inside tiles
- Never use shadows on tiles (except `--tile--featured` which is a rare exception)

### 7.4 Tile Internal Typography

Every tile uses this pattern:

```html
<div class="tile">
  <!-- Optional label (mono, uppercase) -->
  <span class="tile-label">Section Label</span>

  <!-- Optional title (Fraunces, 22px) -->
  <div class="tile-title">Main Content</div>

  <!-- Optional metric value (Fraunces, 28–48px) -->
  <div class="tile-value">42 <span class="unit">trips</span></div>

  <!-- Optional body text -->
  <p class="tile-body">Supporting prose.</p>

  <!-- Optional meta rows -->
  <div class="meta-row">
    <span class="label">Captain</span>
    <span class="value">Reyes</span>
  </div>
</div>
```

### 7.5 Alert Banner

Used for inline notices — system messages, warnings, confirmations.

```tsx
<div className="alert alert--warn">
  <AlertTriangle size={18} strokeWidth={2} />
  <div>
    <strong>2 guests have not signed waivers.</strong>
    They cannot board until completed.
  </div>
</div>
```

**Variants:** `alert--ok`, `alert--warn`, `alert--err`, `alert--info`.

**Rules:**
- Left border 4px solid in current color
- Soft-colored background (e.g., `--status-warn-soft`)
- Padded 16–20px
- Always include a lucide icon
- Body text weight 500; emphasized portions in `<strong>`

### 7.6 Meta Row

Label-value pairs for detail panes.

```html
<div class="meta-stack">
  <div class="meta-row">
    <span class="label">Captain</span>
    <span class="value">Reyes</span>
  </div>
  <div class="meta-row">
    <span class="label">Slip</span>
    <span class="value">14</span>
  </div>
</div>
```

**Rules:**
- Label: `--t-body-sm`, `--ink-muted`, body font
- Value: `--t-tile` (22px), Fraunces, weight 600, `--ink`
- Border-bottom `1px dashed var(--line-soft)` between rows
- Last row has no bottom border
- For inline numeric units, wrap in `<span class="unit">` (mono, small, muted)

### 7.7 Divider

Horizontal rule with editorial weight.

```html
<!-- Heavy section divider -->
<hr class="divider divider--heavy" />

<!-- Soft dashed divider -->
<hr class="divider divider--dashed" />

<!-- Default hairline -->
<hr class="divider" />
```

### 7.8 Badge (Metadata Tag)

Used for small category tags. Lighter than a pill.

```html
<span class="badge">Bareboat</span>
<span class="badge badge--rust">New</span>
<span class="badge badge--brass">Regulatory</span>
```

### 7.9 Avatar

For captain/operator/guest representations.

```tsx
<div className="avatar avatar--md">
  {photoUrl ? (
    <img src={photoUrl} alt={name} />
  ) : (
    <UserRound size={18} strokeWidth={2} />
  )}
</div>
```

**Sizes:** `.avatar--sm` (24px), `.avatar--md` (40px), `.avatar--lg` (64px), `.avatar--xl` (96px).

**Rules:**
- Always circular (`--r-pill`)
- 1.5px ink border
- Fallback to lucide `UserRound` icon on `--bone-warm` bg
- Never use generic initials in a colored circle — looks like a LinkedIn default

### 7.10 Anchor-Style Editorial Link

Distinct from regular nav/button. Used for mid-prose links and secondary CTAs.

```html
<a href="/earn" class="editorial-link">
  See how operators benefit
  <ArrowRight size={12} />
</a>
```

**Rules:**
- Mono font, uppercase, `--t-mono-sm`, weight 600
- Color `--rust`, bottom border `1px solid --rust`
- Hover: color `--rust-deep`, translateX(4px)

---

## 8. Form System

Forms are where Boatcheckin's design credibility lives or dies. Every form uses the same primitives.

### 8.1 Field Anatomy

```html
<div class="field">
  <label class="field-label" for="boatName">Boat Name</label>
  <input id="boatName" type="text" class="field-input" placeholder="M/V Dockside" />
  <span class="field-hint">This appears on waivers and manifests.</span>
</div>
```

For errors:

```html
<div class="field field--error">
  <label class="field-label" for="email">Email</label>
  <input id="email" type="email" class="field-input" value="bad@" aria-invalid="true" />
  <span class="field-error">
    <AlertOctagon size={12} />
    Enter a valid email address
  </span>
</div>
```

### 8.2 Field Specs

**Label:**
- Mono font, uppercase, `letter-spacing: 0.12em`
- Font-size `--t-mono-sm` (11px), weight 600
- Color `--ink-soft`
- Margin-bottom 8px

**Input/Select/Textarea:**
- Font-family body (Inter)
- Font-size `--t-body-md` (15px)
- Padding `12px 14px`
- Background `--paper-warm`
- Border `1.5px solid var(--ink)`
- Radius `--r-2` (4px)
- Color `--ink`
- Transition 250ms ease on focus

**Focus state:**
- Border color `--rust`
- Background `--paper`
- Focus ring: `box-shadow: var(--focus-ring)`

**Disabled state:**
- Background `--bone-warm`
- Color `--ink-muted`
- Cursor `not-allowed`
- Opacity 0.7

**Error state:**
- Border color `--status-err`
- Focus ring: `var(--focus-ring-error)`
- Error message below in `--status-err`, 13px, with lucide `AlertOctagon` icon

**Hint text:**
- Font-size `--t-body-sm` (13px)
- Color `--ink-muted`
- Below input, margin-top 6px

### 8.3 Checkbox & Radio

Custom-styled to match the design system. Never use native browser appearance.

```html
<label class="check">
  <input type="checkbox" />
  <span class="check-box"></span>
  <span class="check-label">I have read and agree to the waiver</span>
</label>
```

**Checkbox visual:**
- 18px × 18px square
- 1.5px ink border
- Radius `--r-1`
- Checked: background `--rust`, white lucide `Check` icon inside
- Focus: `--focus-ring`

**Radio:**
- Same size and border
- Circular (`--r-pill`)
- Checked: inner dot in `--rust`

### 8.4 Toggle Switch

For on/off settings.

```html
<label class="toggle">
  <input type="checkbox" />
  <span class="toggle-track">
    <span class="toggle-thumb"></span>
  </span>
  <span class="toggle-label">Require operator approval for new guests</span>
</label>
```

**Specs:**
- Track: 40px × 22px, bg `--line-soft` (off) / `--rust` (on)
- Thumb: 18px circle, bg `--paper`, positioned left (off) / right (on)
- Transition: 250ms ease
- Radius `--r-pill` on track and thumb

### 8.5 Field Groupings

**Grid of fields:**

```html
<div class="field-grid field-grid--2">
  <div class="field">...</div>
  <div class="field">...</div>
</div>
```

- `.field-grid--2`: two equal columns, gap 16px
- `.field-grid--3`: three equal columns
- `.field-grid--2-1`: two-thirds + one-third
- On mobile, always collapses to 1 column

**Fieldset (grouped section):**

```html
<fieldset class="fieldset">
  <legend class="fieldset-legend">Vessel Details</legend>
  <div class="field-grid field-grid--2">...</div>
</fieldset>
```

### 8.6 File Upload

```html
<div class="field">
  <label class="field-label">FWC Boater Safety ID</label>
  <div class="upload">
    <Upload size={18} strokeWidth={2} />
    <div>
      <strong>Click to upload</strong> or drag and drop
      <span>PNG or JPG · max 10MB</span>
    </div>
  </div>
</div>
```

**Specs:**
- Dashed 1.5px ink border
- Padding 24px
- Background `--paper-warm`
- Hover: border solid, background `--bone-warm`
- Drag-over state: border `--rust`, background `--bone`
- Success state: green left border, show uploaded filename

### 8.7 Form Actions Footer

Fixed row of actions at the bottom of a form.

```html
<div class="form-actions">
  <button class="btn">Cancel</button>
  <div class="form-actions-spacer"></div>
  <button class="btn">Save Draft</button>
  <button class="btn btn--primary">Submit</button>
</div>
```

**Specs:**
- Top border `1px solid var(--line-soft)`
- Padding `20px 32px`
- Background `--bone`
- Spacer pushes secondary actions to the right

### 8.8 Selectable Card (Choice Button)

The canonical pattern for when the user must pick one option from a small set (2–6 options). Used in trip type, booking type, boat picker, captain picker, duration selector.

**Two sub-variants:**

**A — Icon + Label card** (trip type, booking type — typically 2–3 cols):
```tsx
<button
  type="button"
  onClick={() => setForm(p => ({ ...p, tripPurpose: value }))}
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--s-2)',
    padding: 'var(--s-3)',          // 12px
    background: isActive ? 'var(--bone)' : 'var(--paper)',
    border: isActive
      ? '2px solid var(--rust)'        // active: 2px rust
      : '1.5px solid var(--line-soft)',// inactive: soft border
    borderRadius: 'var(--r-1)',       // 2px
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: 72,
    transition: 'border-color 150ms ease, background 150ms ease',
  }}
>
  <IconComponent size={18} strokeWidth={isActive ? 2.5 : 2} />
  <div style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600 }}>{label}</div>
  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{description}</div>
</button>
```

**B — Row card** (boat picker, captain picker — single column list):
```tsx
<button
  type="button"
  onClick={() => handleSelect(id)}
  className="tile"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--s-3)',
    padding: 'var(--s-4)',           // 16px
    cursor: 'pointer',
    borderLeft: isActive
      ? '4px solid var(--rust)'       // selected accent stripe
      : '1.5px solid var(--line)',    // default tile border
    background: isActive ? 'var(--bone)' : 'var(--paper)',
    textAlign: 'left',
    width: '100%',
    transition: 'border-color 150ms ease, background 150ms ease',
  }}
>
  <Icon size={20} strokeWidth={1.8} style={{ color: isActive ? 'var(--rust)' : 'var(--ink-muted)' }} />
  <div style={{ flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 600, color: 'var(--ink)' }}>{name}</p>
    <p style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--ink-muted)', fontFamily: 'var(--mono)' }}>{meta}</p>
  </div>
  {isActive && <Check size={18} strokeWidth={2.5} style={{ color: 'var(--rust)' }} />}
</button>
```

**Rules:**
- Active state always: `--bone` background + `2px --rust` border (icon cards) OR `4px --rust` left stripe (row cards)
- Inactive state always: `--paper` background + `1.5px --line-soft` border
- Active icon: strokeWidth 2.5, rust color. Inactive icon: strokeWidth 2, ink-muted
- Row card active gets a trailing `<Check>` icon in rust
- Transition BOTH border-color and background at 150ms (not just one)
- Never use `background: transparent` — always explicit paper or bone
- Gap between cards in a column list: `var(--s-2)` (8px)
- Grid cards: 2–3 columns on desktop, 1 column mobile

### 8.9 Pill Toggle Buttons (Compact Selector)

For selecting values from a compact set where full cards would be too large. Used for duration, quantity increments, filter chips.

```tsx
<button
  type="button"
  className="mono"
  style={{
    padding: 'var(--s-2) var(--s-4)',     // 8px 16px
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    borderRadius: 'var(--r-1)',
    border: isActive
      ? '2px solid var(--ink)'
      : '1.5px solid var(--line-soft)',
    background: isActive ? 'var(--ink)' : 'var(--paper)',
    color: isActive ? 'var(--bone)' : 'var(--ink)',
    cursor: 'pointer',
    minHeight: 40,                         // touch target
    transition: 'all 150ms ease',
  }}
>
  {label}
</button>
```

**Rules:**
- Active: `--ink` fill + `--bone` text (inverted). NOT rust — this is a **data selector**, not an action CTA
- Inactive: paper + ink text + soft border
- Font: mono, uppercase, 12px, weight 600
- Min height 40px (touch target)
- Use `display: flex; flex-wrap: wrap; gap: var(--s-2)` on the container

### 8.10 Numeric Stepper

For bounded integer inputs (guest count, quantity). Never use a raw `<input type="number">` alone.

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  border: '1.5px solid var(--ink)',
  borderRadius: 'var(--r-2)',
  overflow: 'hidden',
}}>
  <button style={{ width: 48, height: 48, background: 'var(--paper)', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
    <Minus size={16} strokeWidth={2.5} />
  </button>
  <input type="number" className="font-mono" style={{
    width: 56, height: 48, textAlign: 'center',
    fontSize: '18px', fontWeight: 700, color: 'var(--ink)',
    border: 'none', borderLeft: '1px solid var(--line-soft)', borderRight: '1px solid var(--line-soft)',
    background: 'transparent',
  }} />
  <button style={{ width: 48, height: 48, background: 'var(--paper)', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}>
    <Plus size={16} strokeWidth={2.5} />
  </button>
</div>
```

**Rules:**
- Outer border: 1.5px ink, `--r-2` radius, clip with `overflow: hidden`
- Inner dividers between +/−/value: `1px solid var(--line-soft)` (NOT ink — those would double-border)
- Center value: mono, 18px bold, centered
- Buttons: 48×48px (touch target), no border of their own, paper background
- Always pair with a meta label showing constraint: `"Max 6 for this vessel"`

---

## 9. Tile & Card System

### 9.1 Size Conventions

| Name | Padding | Used for |
|---|---|---|
| Small tile | 20px | KPI grid cells, dense list items |
| Medium tile | 24px | Trip rows, guest cards, default |
| Large tile | 32–40px | Featured content, pricing tiers |

### 9.2 KPI Tile

For dashboard stat cells.

```html
<div class="kpi">
  <span class="kpi-label">Trips This Month</span>
  <div class="kpi-value">47</div>
  <div class="kpi-delta">↑ 18% vs last month</div>
</div>
```

**Specs:**
- Label: mono, uppercase, 10px, `--ink-muted`, weight 600, margin-bottom 10px
- Value: Fraunces, 32px, weight 600, `--ink`, letter-spacing -0.025em
- Delta: mono, 11px, `--status-ok` (up) or `--status-err` (down), weight 600
- Unit in value: `<span class="unit">/5</span>` — mono, 12px, muted, margin-left 4px

### 9.3 Trip Row Tile

The dashboard's primary data row. Grid of: time | info | guests | status | action.

```tsx
<div className="trip-row">
  <div className="trip-time">
    <span className="tt-label">Departs</span>
    08:30
  </div>
  <div className="trip-info">
    <div className="trip-name">M/V Dockside — Sunrise Charter</div>
    <div className="trip-meta">Captain Reyes · Slip 14 · 4h trip · Code A4FR</div>
  </div>
  <div className="trip-guests">
    6<span className="gl-total">/6</span>
  </div>
  <span className="pill pill--ok">
    <span className="pill-dot"></span>
    Ready
  </span>
  <a href="..." className="trip-cta">Snapshot →</a>
</div>
```

### 9.4 Guest Card

Used in captain snapshot and trip detail.

```tsx
<div className="guest-card">
  <div className="guest-card-hdr">
    <div className="avatar avatar--md">...</div>
    <div>
      <div className="guest-name">Sarah Martinez</div>
      <div className="guest-meta">Age 34 · English · +1 555-0112</div>
    </div>
    <span className="pill pill--ok">Approved</span>
  </div>
  <div className="guest-card-alerts">
    <span className="pill pill--err">Non-swimmer</span>
    <span className="pill pill--warn">Gluten-free</span>
  </div>
</div>
```

### 9.5 Boat Card

Operator fleet view.

```tsx
<article className="boat-card">
  <figure className="boat-photo">
    <img src={boat.photoUrl} alt={boat.name} />
  </figure>
  <div className="boat-card-body">
    <span className="tile-label">Motor Yacht · 38ft</span>
    <h3 className="tile-title">M/V Dockside</h3>
    <div className="meta-row">
      <span className="label">Marina</span>
      <span className="value">Municipal Marina</span>
    </div>
    <div className="boat-card-actions">
      <a className="btn btn--sm">Edit</a>
      <a className="btn btn--sm btn--primary">Dock QR</a>
    </div>
  </div>
</article>
```

### 9.6 Color Banner List

Used when categorized content must be **instantly distinguishable** by type — rules vs. guidance vs. prohibitions, permit tiers, grouped checklists. This is the primary pattern for guest-facing compliance lists and any surface where the user must process categorized items quickly.

**Structure:** Each category is a separate `.tile` with a **full-width solid-color banner header** and a **tinted body** containing striped item cards.

```tsx
{/* House Rules — Navy banner, neutral body */}
<div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
  <div style={{
    background: 'var(--ink)',
    padding: 'var(--s-3) var(--s-4)',
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
  }}>
    <Anchor size={14} strokeWidth={2.5} style={{ color: '#fff' }} />
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: '13px', fontWeight: 800,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: '#fff',
    }}>
      House Rules
    </span>
    <span className="font-mono" style={{
      marginLeft: 'auto', fontSize: '10px',
      color: 'rgba(255,255,255,0.5)',
    }}>
      8 rules
    </span>
  </div>
  <div style={{ padding: 'var(--s-2) var(--s-3) var(--s-3)' }}>
    {/* Item cards here */}
  </div>
</div>
```

**Banner color assignments** (non-negotiable):

| Category | Banner background | Body background | Stripe color | Icon |
|---|---|---|---|---|
| **House Rules / Authority** | `--ink` (navy) | `--paper` | `--ink` | `Anchor` |
| **DOs / Encouraged** | `--status-ok` (green) | `--status-ok-soft` | `--status-ok` | `Check` |
| **DON'Ts / Prohibited** | `--rust` (rusty red) | `--status-err-soft` | `--rust` | `X` |
| **Custom / Neutral** | `--bone` | `--paper` | `--line` | (varies) |

**Banner header specs:**
- Full-width solid background in the category color
- Padding `var(--s-3) var(--s-4)`
- Inter font, 13px, weight 800, `letter-spacing: 0.08em`, uppercase, white
- Leading lucide icon (14px, strokeWidth 2.5, white)
- Trailing item count right-aligned (mono, 10px, `rgba(255,255,255,0.5)`)

**Item card specs:**
- Each item is a individual bordered card (not inline text)
- Background `--paper`, border `1px solid var(--line-soft)`, radius `--r-1`
- Left border `3px solid` in the category stripe color
- Padding `var(--s-2) var(--s-3)`, min-height 40px
- Leading icon: `Check` (12px, green) for DOs, `X` (12px, rust) for DON'Ts, numbered index (mono, 11px) for House Rules
- Text: `--t-body-sm` (13px), `--ink`, `line-height: 1.45`

**When to use:**
- Guest trip page → boat rules, safety points
- Boat Wizard preview → rules summary (read-only mirror of the edit view)
- Captain snapshot → guest verification requirements
- Any list where 3+ categories of items must be visually separated at a glance

**When NOT to use:**
- Simple bulleted lists with one category → use `10.2 List (Simple)` instead
- Status-only displays → use pills (Section 7.2)
- Editable lists → use DraggableList (Boat Wizard internal component)

**Rules:**
- Never mix categories inside one tile — each category gets its own tile
- Categories must stack vertically with `var(--s-3)` gap between them
- Banner must always include the icon + uppercase label + item count
- Item cards must always have the 3px left stripe (never omit)
- Body area must use the tinted background for double color-coding reinforcement
- House Rules always use numbered items; DOs always use `Check`; DON'Ts always use `X`

### 9.7 Status Accent Stripe

A **4px solid left border** on `.tile` cards that communicates entity status or category at a glance — without requiring the user to read text or find a pill. This is the primary scanning affordance across all dashboard list views.

```tsx
<div className="tile" style={{ borderLeft: '4px solid var(--status-ok)' }}>
  {/* Card content */}
</div>
```

**Status color assignments:**

| Status | Stripe color | Token | Used on |
|---|---|---|---|
| **Active / Ready** | Green | `--status-ok` | Trip cards (active status) |
| **Upcoming / Pending** | Brass | `--brass` | Trip cards (upcoming status) |
| **Default / Base entity** | Navy | `--ink` | Boat cards, Crew cards (healthy) |
| **Expiring Soon** | Amber | `--status-warn` | Crew cards (license expiring within 30 days) |
| **Cancelled / Expired / Error** | Red | `--status-err` | Trip cards (cancelled), Crew cards (license expired) |
| **Completed / Archived** | Muted | `--ink-muted` | Trip cards (completed) |

**Specs:**
- Width: exactly `4px` — thinner looks insignificant, thicker competes with content
- Applied via `borderLeft` on the `.tile` element — not a pseudo-element
- Replaces the default 1.5px `--ink` left border on the tile
- The rest of the tile border stays at default (`1.5px solid var(--line)`)

**Rules:**
- Every card in a dashboard list view **must** have a status accent stripe
- The stripe color must map to one of the assignments above — never invent new stripe colors
- Do not use stripes on nested tiles (e.g., boat picker dropdowns inside a card)
- Do not combine with the Color Banner List pattern (§9.6) on the same tile — they serve different purposes
- The stripe is independent of any pill or badge on the card — both coexist

---

### 9.8 DashTile Component System

**The canonical reusable tile primitive across all dashboard pages.** All main dashboard surfaces — Today board, Boats, Crew, Trips, Revenue, Fulfillment — use `<DashTile>` as their primary data display unit. Raw `<div className="tile">` is still used for static content and marketing pages; `DashTile` is the interactive, status-driven version.

**File:** `apps/web/components/ui/DashTile.tsx`

#### Three Variants

| Variant | Layout | Used on |
|---|---|---|
| `vessel` | Square grid cell — 3px top bar, eyebrow, title, meta, progress bars | Today board, Boats grid, Crew grid, Trips grid |
| `row` | Horizontal list row — 4px left stripe, icon, content, right badge | Trips compact list, Fulfillment boat headers |
| `kpi` | Metric cell — label + large Fraunces value + delta | Revenue KPIs, Boats KPI strip |

#### Status → Color Table

One `status` prop drives all color-coding. Never hard-code colors on individual tiles.

| Status | Bar / stripe color | Soft background | Text color | Semantic meaning |
|---|---|---|---|---|
| `ok` | `#059669` Green | `#ECFDF5` | `#059669` | Active, ready, valid, all good |
| `warn` | `#D97706` Amber | `#FFFBEB` | `#D97706` | Pending, partial, expiring soon |
| `err` | `#DC2626` Red | `#FEF2F2` | `#DC2626` | Error, flagged, expired, critical |
| `grey` | `#9CA3AF` Grey | `#F9FAFB` | `#9CA3AF` | No trip, inactive, quiet, no data |
| `brass` | `#C8A14A` Brass | `#FDF8EE` | `#C8A14A` | Upcoming, scheduled, new |
| `info` | `#2D5D6E` Sea | `#EBF2F4` | `#2D5D6E` | Data, informational, fleet |

#### Usage Examples

```tsx
// Vessel tile (fleet grid, crew grid, trip grid)
<DashTile
  variant="vessel"
  status="ok"
  eyebrow="CAPTAINED · MOTORBOAT"
  title="White Rose"
  meta="Slip 16A · 09:00 · 6 guests"
  pill={{ label: 'READY' }}
  bars={[
    { label: 'Waivers', value: 6, max: 6, color: '#059669' },
    { label: 'Boarded', value: 4, max: 6 },
  ]}
  href="/dashboard/trips/abc123"
/>

// Row tile (compact trip list, fulfillment boat header)
<DashTile
  variant="row"
  status="warn"
  eyebrow="A4FR · APR 22"
  title="White Rose"
  meta="09:00 · 4h · 3/6 guests · Slip 16A"
  pill={{ label: 'PENDING' }}
  rightSlot={<ChevronRight size={15} strokeWidth={2} />}
  href="/dashboard/trips/abc123"
/>

// KPI tile (revenue stats, fleet header strip)
<DashTile
  variant="kpi"
  status="ok"
  label="Add-on revenue"
  value="$1,240"
  sub="this month"
  delta="↑ 18% vs last month"
  deltaPositive={true}
  icon={<DollarSign size={14} />}
/>
```

#### Grid Layout Rules

| Context | Grid template | Min tile width |
|---|---|---|
| Today board (fleet) | `repeat(auto-fill, minmax(160px, 1fr))` | 160px |
| Boats page | `repeat(auto-fill, minmax(180px, 1fr))` | 180px |
| Crew page | `repeat(auto-fill, minmax(195px, 1fr))` | 195px |
| Trips page | `repeat(auto-fill, minmax(190px, 1fr))` | 190px |
| KPI strip (3-col) | `repeat(3, 1fr)` | — |
| KPI strip (2-col) | `repeat(2, 1fr)` | — |

Always use `gap: var(--s-3)` (12px) between tiles. On mobile, `auto-fill` naturally collapses to 2-col.

#### Rules

- **One `status` prop controls everything** — bar color, soft background, pill class, text color. Do not override individual colors.
- **`vessel` tiles never exceed ~220px wide** in their minimum — they are deliberately compact.
- **`row` tiles are always full-width** within their container.
- **`kpi` tiles always appear in a grid strip** above page content — never inline with `vessel` or `row` tiles.
- **Progress bars on `vessel` tiles**: use `bar.color` override only for waivers/check-in (where green vs amber matters). Otherwise inherit status color.
- **Never nest DashTile inside DashTile.** Inner expandable content uses standard `div.tile` nesting.
- **All click/navigation uses `href` prop** (renders as `<Link>`) not wrapper elements. Never wrap `DashTile` in an `<a>` or `<Link>`.
- **Hover states are built into the component.** Do not add external hover overrides.

---

## 10. Data Display

### 10.1 Tables

Tables are rare in our UI — we prefer tile-based layouts. But when tables are used (guest manifests, audit logs, admin panels), follow these rules.

```html
<table class="table">
  <thead>
    <tr>
      <th>Guest</th>
      <th>Waiver</th>
      <th>Safety</th>
      <th>Registered</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Sarah Martinez</strong></td>
      <td><span class="pill pill--ok">Signed</span></td>
      <td><span class="mono">5/5</span></td>
      <td class="mono">08:12 EDT</td>
      <td><a class="editorial-link">View</a></td>
    </tr>
  </tbody>
</table>
```

**Specs:**
- Header row: background `--bone-warm`, mono 11px uppercase labels, weight 600
- Cell padding `14px 18px`
- Row border-bottom `1px solid var(--line-soft)`
- Hover row: background `--bone`
- No zebra striping
- Numeric cells use mono font, right-aligned
- Text cells use body font, left-aligned

### 10.2 List (Simple)

For bulleted or numbered content inside prose.

```html
<ul class="list">
  <li>Captain must attest safety briefing before departure</li>
  <li>Guest waivers archived with SHA-256 hash</li>
</ul>
```

**Specs:**
- Bullet: rust-colored, small solid circle (custom ::before)
- Line-height 1.6
- Gap between items 12px

### 10.3 Stepper (Progress)

For multi-step flows (boat wizard, guest join).

```html
<div class="stepper">
  <span class="stepper-pill stepper-pill--done">Vessel</span>
  <span class="stepper-pill stepper-pill--done">Marina</span>
  <span class="stepper-pill stepper-pill--active">Captain</span>
  <span class="stepper-pill">Equipment</span>
  <span class="stepper-pill">Rules</span>
</div>
```

**Specs:**
- Pills: mono 10px uppercase, padding 6px 10px, `--r-pill` radius
- Done: color `--status-ok`, leading dot in ok color
- Active: background `--ink`, color `--paper`
- Pending: color `--ink-muted`, dot in muted color
- Leading dot 6px, circular, in current color

### 10.4 QR Code Display

QR codes appear in: boat dock QR, guest boarding pass, captain snapshot share.

**Specs:**
- Always on white background (not paper color — for max scan reliability)
- Minimum render size: 120px
- Recommended render size: 200–280px
- Error correction level M (15%)
- Use `qrcode.react` library already in the project
- Always paired with a label (boat name, guest name, trip ID)

```tsx
import { QRCodeSVG } from "qrcode.react";

<div className="qr-display">
  <div className="qr-frame">
    <QRCodeSVG value={url} size={240} level="M" includeMargin={false} />
  </div>
  <div className="qr-caption">
    <div className="qr-title">M/V Dockside</div>
    <div className="qr-meta mono">boatcheckin.com/board/{publicSlug}</div>
  </div>
</div>
```

### 10.5 Timestamp

Always mono. Always include timezone for operational data.

```html
<span class="mono">08:12 EDT</span>
<span class="mono">17 Apr 2026 · 08:12 EDT</span>
```

For "time ago" (recent events only):

```html
<span class="mono">2m ago</span>
<span class="mono">3h ago</span>
```

---

## 11. Feedback & Status

### 11.1 Toast Notifications

Ephemeral feedback for user actions.

```tsx
<div className="toast toast--ok" role="status">
  <CheckCircle2 size={18} />
  <div>
    <strong>Trip created.</strong>
    <span>Invite link copied to clipboard.</span>
  </div>
  <button className="toast-close"><X size={14} /></button>
</div>
```

**Specs:**
- Position: bottom-right on desktop, bottom-center on mobile
- Width: 360px (desktop), full-width minus 16px (mobile)
- Shadow: `--shadow-float`
- Border-left 4px in status color
- Auto-dismiss after 4 seconds (unless error — requires manual dismiss)
- Stack multiple with 12px gap

### 11.2 Modal Dialog

For confirmations and focused actions.

```tsx
<div className="modal-overlay">
  <div className="modal" role="dialog" aria-modal="true">
    <header className="modal-hdr">
      <h2>Cancel this trip?</h2>
      <button className="modal-close"><X size={18} /></button>
    </header>
    <div className="modal-body">
      <p>All 6 registered guests will be notified. This cannot be undone.</p>
    </div>
    <div className="modal-footer">
      <button className="btn">Keep Trip</button>
      <button className="btn btn--danger">Yes, Cancel Trip</button>
    </div>
  </div>
</div>
```

**Specs:**
- Overlay: `rgba(11, 30, 45, 0.55)` backdrop with blur 4px
- Modal: max-width 520px, `--r-1` radius, 1.5px ink border
- Header: padding 24px 28px, border-bottom `1px solid var(--line-soft)`
- Body: padding 24px 28px
- Footer: padding 20px 28px, `--bone` background, border-top `1px solid var(--line-soft)`
- Title: Fraunces, `--t-card`, weight 600
- Buttons align right, destructive action last

### 11.3 Empty States

When data is missing or zero.

```tsx
<div className="empty-state">
  <ShipIcon size={48} strokeWidth={1.5} className="empty-icon" />
  <h3>No boats yet</h3>
  <p>Add your first boat to start creating trip links.</p>
  <a href="/dashboard/boats/new" className="btn btn--primary">
    <Plus size={14} />
    Add a Boat
  </a>
</div>
```

**Specs:**
- Centered content, padding 48–64px
- Icon: 48px lucide with strokeWidth 1.5, color `--ink-muted`
- Heading: Fraunces `--t-card`
- Body: `--t-body-md`, `--ink-muted`, max-width 360px
- Single primary CTA

### 11.4 Loading States

**Skeleton placeholders** (preferred):

```html
<div class="skeleton skeleton--text" style="width: 60%"></div>
<div class="skeleton skeleton--text" style="width: 40%"></div>
<div class="skeleton skeleton--tile"></div>
```

Skeletons use `--bone-warm` with a subtle shimmer animation.

**Spinner** (only for buttons during submit):

```tsx
<button className="btn btn--primary" disabled>
  <Loader2 size={14} className="animate-spin" />
  Saving…
</button>
```

Never use a spinner for full-page loads. Always use skeletons.

### 11.5 Inline Validation

As the user types, show validation per-field with a small mono caption:

- Valid: nothing (don't clutter)
- Pending (e.g., async username check): `<Loader2 />` + "Checking availability…"
- Invalid: red error message with `AlertOctagon` icon

---

## 12. Navigation Patterns

### 12.1 Public Nav (Marketing)

As on the homepage.

- Sticky top, frosted `rgba(250, 247, 240, 0.92)` with 12px backdrop-filter blur
- Border-bottom `1px solid var(--line-soft)`
- Brand + 5 links max + 2 CTAs (Sign In + Get Started)
- Mobile: hamburger menu with slide-down panel

### 12.2 Authenticated Dashboard Nav

For the operator webapp, use a **two-level** nav:

**Top bar:**
- Brand on left
- User menu, notifications, search on right
- Height 64px, `--bone` background, border-bottom

**Side nav (desktop) / Bottom bar (mobile):**

Desktop sidebar (240px wide):
- Brand at top
- Primary navigation (Dashboard, Trips, Boats, Captains, Guests, Reviews, Settings)
- Each item: `18px` lucide icon + label
- Active state: rust left-border 3px, `--bone-warm` background

Mobile bottom bar:
- 5 primary icons: Dashboard, Trips, Boats, Captains, More
- Active: rust color
- Inactive: `--ink-muted`

### 12.3 Breadcrumbs

For deep pages.

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/dashboard">Dashboard</a>
  <ChevronRight size={12} />
  <a href="/dashboard/boats">Boats</a>
  <ChevronRight size={12} />
  <span aria-current="page">M/V Dockside</span>
</nav>
```

**Specs:**
- Mono 11px uppercase
- `--ink-muted` for parent links, `--ink` for current
- Hover: `--rust`
- Chevron icons in `--ink-muted`, size 12px

### 12.4 Tabs

Used to switch views within a page (as on the homepage "Three Tiers" section).

```html
<div class="tabs">
  <button class="tab tab--active">Marina Manager</button>
  <button class="tab">Charter Captain</button>
  <button class="tab">Solo Operator</button>
</div>
```

**Specs:**
- Border-bottom `1.5px solid var(--ink)`
- Individual tab: padding `16px 28px`, mono 12px uppercase
- Active tab: `--rust` bottom border `3px`, `--paper` background, `--ink` text
- Inactive: `--ink-muted`, hover to `--ink`

---

## 13. Mobile & Responsive Rules

### 13.1 Mobile-First Philosophy

Many of our users — captains, guests — will see Boatcheckin primarily on phones. Design for 375px viewport first, then enhance for larger screens.

### 13.2 Touch Targets

Minimum touch target: **44px × 44px**. Always. Buttons must meet this even if visual size is smaller (use `min-height: 44px` and `padding`).

### 13.3 Phone-First Components

For the guest flow and captain snapshot, design the phone view as the canonical view. Desktop should feel like a larger phone, not a different product.

### 13.4 Collapsing Grids

All multi-column grids must have explicit mobile collapses. Default pattern:
- 4 cols → 2 cols (tablet) → 1 col (mobile)
- 3 cols → 1 col (mobile)
- 2 cols → 1 col (mobile)

Always preserve borders/dividers correctly when collapsing (e.g., last-child rules change).

### 13.5 Sticky Actions on Mobile

Primary CTAs on forms should be sticky-to-bottom on mobile to prevent scroll-to-submit frustration.

```css
@media (max-width: 720px) {
  .form-actions {
    position: sticky;
    bottom: 0;
    background: var(--paper);
    border-top: 1px solid var(--line);
    box-shadow: 0 -4px 12px rgba(11, 30, 45, 0.05);
  }
}
```

### 13.6 Mobile Typography Scale

Reduce hero and section sizes on mobile:
- `--t-hero`: 86px → 44px
- `--t-section`: 48px → 34px
- `--t-sub`: 36px → 28px

Body text stays the same.

---

## 14. Surface-Specific Guidance

### 14.1 Boat Wizard

The wizard is our most complex form flow. 9 steps. Must feel calm and authoritative, not cluttered.

**Layout:**
- Max width 960px, centered
- Frame: white-paper fill, 1.5px ink border, `--shadow-lift` (this is one of few places we use the shadow)
- Header bar: dark ink background, brass label, Fraunces step title, mono step counter
- Stepper below header (see Section 10.3)
- Content area: **two-column grid** — left 40% is explanatory copy and tips, right 60% is the form

**Left column pattern:**
```html
<div class="wz-left">
  <h3>Tell us about the vessel.</h3>
  <p>Brief explanatory context. No jargon.</p>
  <div class="wz-left-tip">
    <strong>Why it matters</strong>
    One-sentence reason the current step is important.
  </div>
</div>
```

**Right column pattern:**
Use standard form fields with `field-grid` for multi-column fields.

**Step-specific patterns:**

- **Step 1 Vessel:** `.wz-type-grid` (3-col on desktop, 2-col on mobile) of boat type cards. Each card: lucide icon (36px), mono label. Selected state: ink background, paper text.
- **Step 2 Marina:** single-column. Include map preview (Mapbox) below address field.
- **Step 3 Captain:** two-column. License type select, expiry date picker, languages multi-select.
- **Step 4 Equipment:** accordion sections per equipment category. Each section collapsible.
- **Step 5 Rules:** two sub-sections: "Dos" (green-accented) and "Don'ts" (rust-accented). Each is a textarea with dynamic line-add.
- **Step 6 Packing:** same two-column pattern as Step 5.
- **Step 7 Safety Cards:** card-based builder. Each card is editable inline. Add/remove controls per card.
- **Step 8 Waiver:** choice — Firma template OR manual textarea. Radio toggle at top.
- **Step 9 Photos:** drag-and-drop grid, max 10 photos, reorderable.

**Footer (sticky):**
- Left: "Draft saved · Xs ago" with pulsing ok-colored dot
- Right: "Save & Exit" (outline) + "Next: [next step name] →" (primary)
- Progress bar at bottom edge: 9 segments, filled in rust as steps complete

**Validation:**
- Never block navigation between steps — but mark incomplete steps in the stepper as `stepper-pill--incomplete` with rust dot
- On final submission, show a summary review before committing

### 14.2 Operator Dashboard

See the `/preview` page for the canonical layout.

**Above-the-fold priorities:**
1. Greeting with count of today's trips + first departure countdown
2. KPI grid (4 tiles)
3. Today's trips list
4. Today's weather bar (per-trip)

**Sections below:**
- Upcoming trips (next 7 days)
- Recent guest registrations
- Pending approvals (if requires_approval is set)
- Alerts (expired captain licenses, unsigned waivers, etc.)

**Alerts surface:**
Use `.alert` component. Group by severity. Max 3 visible, rest collapse under "View all alerts".

### 14.3 Captain Snapshot

The on-the-phone view. Design mobile-first, max-width 420px on desktop (centered, surrounded by neutral space).

**Sections in order:**
1. Boat name + trip meta header
2. Guest alerts (non-swimmers, children, dietary)
3. **Compliance gate** (the primary CTA until attested)
4. Weather tile
5. Guest list (collapsible, tap to expand each)
6. Crew assignments
7. Captain notes (editable textarea, auto-saves)
8. Action footer: "Start Trip" (disabled until gate attested), "End Trip", "Cancel Trip"

**Compliance gate treatment:**
- Dark ink background, brass label
- Fraunces heading ~18px
- Body in bone-color at 75% opacity
- Full-width rust button at bottom
- When attested: gate collapses to a green-accented confirmation pill at the top

### 14.4 Guest Join Flow

7-step progressive bottom sheet on mobile. Overlays the trip page.

**Visual treatment per step:**
- Step indicator at top: mono text "Step 2 of 6" + progress bar
- Fraunces title
- Form fields
- Primary button at bottom (sticky)
- Back button top-left as lucide `ChevronLeft`

**Transitions:**
- Use Framer Motion (already in project per audit) to slide steps left/right
- Duration 300ms ease
- Scroll reset on each step transition

**Step 3 Safety cards:**
- Card swipe interface. Each card is full-screen on mobile.
- Leading mono "Card 1 of 5"
- Fraunces title
- Body explanation
- Audio play button if available (lucide `PlayCircle`)
- Acknowledgment checkbox + "Next card →" button

**Step 4 Waiver:**
- Scrollable text area with scroll-progress bar at top (must reach 90% to enable signature)
- Signature input at bottom (type your name)
- Checkbox: "I have read and agree"
- Primary: "Sign & Continue →" (disabled until above conditions met)

**Final boarding pass:**
- QR code, large
- Guest name in Fraunces
- Trip code in mono
- "Show this at the dock" hint

### 14.5 Admin Console (Founder/Admin)

For internal use, higher density OK.

**Layout:**
- Side nav as dashboard
- Higher-density tables (use Section 10.1 specs but with padding 10px 14px per cell)
- Per-row inline actions (edit, deactivate, view audit)
- Heavy use of pills for status
- Audit log surface: mono-heavy, timestamps prominent, filterable

### 14.8 Trip Create Form (Canonical Dense-Form Reference)

The `/dashboard/trips/new` form is the **canonical pattern for all dense dashboard forms**. When building any new multi-section dashboard form, match its structure exactly.

**Key characteristics that make this page feel authentic and clickable:**

1. **SectionKicker separation** (see §6.6): soft gray hairline under mono uppercase label. Not a hard rule — a soft breath between sections.

2. **Selectable Cards for all choice inputs** (see §8.8): no dropdowns for small option sets. Every choice is a clickable card — boat picker, captain picker, trip type, booking type.

3. **Compact Pill Toggles for value selection** (see §8.9): duration options are pill toggles (mono, 12px, 40px tall), not a select. "More options" is a dotted-underline rust link, not another button.

4. **Active state contrast is strong but not harsh**: active card = `--bone` background + `2px --rust` border. The rust signals action without screaming.

5. **Form sections stack vertically with `gap: var(--s-8)` (32px)**: wide enough to visually group each section, tight enough to keep vertical scrolling manageable.

6. **Hint text is 11px `--ink-muted`**: present but non-competitive with the field labels.

7. **Left accent stripe (4px rust) on single-selected row cards**: when there's only one boat, the vessel tile gets a left border `4px solid var(--rust)` to visually confirm selection without a radio button.

8. **Compliance micro-labels inside selectable cards**: a 9px mono uppercase status line (e.g., "FULL COMPLIANCE") inside the trip-type cards. Color: `--status-ok` for safe states, `--ink-muted` for neutral.

**Form max-width:** `640px`, centered with `margin: 0 auto` and `padding-bottom: 144px` (leaves space for sticky action bar).

**Submit button treatment:**
```tsx
<button
  type="submit"
  disabled={isPending}
  style={{
    width: '100%',
    padding: 'var(--s-4) var(--s-6)',
    background: isPending ? 'var(--ink-muted)' : 'var(--ink)',
    color: 'var(--bone)',
    fontSize: 'var(--t-body-md)',
    fontWeight: 700,
    letterSpacing: '0.02em',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--r-1)',
    cursor: isPending ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--s-2)',
    transition: 'transform 120ms ease, box-shadow 120ms ease',
    // On hover: translateY(-2px) + shadow-lift
  }}
>
  {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={2.5} />}
  {isPending ? 'Creating trip…' : 'Create Trip'}
</button>
```

### 14.6 Emails (Transactional)

For Resend-powered emails (waiver confirmations, trip reminders, captain snapshots).

- Max width 560px, centered, `--paper` background
- Use web-safe serif fallback (Fraunces won't load in most email clients): stack `Fraunces, Georgia, serif`
- Body Inter with Arial fallback
- Preserve brand colors — `--ink`, `--rust`, `--brass`
- Single primary CTA per email
- Include plain-text version

### 14.7 Printed Assets (QR PDFs, Manifests)

- Ink, brass, and paper only
- Always include boat/trip identifier as mono
- USCG manifest: adhere to federal manifest format specs
- QR PDF: see the `PER_BOAT_QR_BUILD_SPEC.md` for layout

---

## 15. Accessibility Requirements

Non-negotiable. Every UI must meet WCAG 2.1 AA minimum.

### 15.1 Color Contrast

- Body text on paper background: must meet 4.5:1 (our `--ink` on `--paper` is 15:1, well above)
- Body on bone: 4.5:1 (15:1 actual)
- Body on ink: must meet 4.5:1 (`--bone` on `--ink` is 14:1)
- Muted text (`--ink-muted`) on paper: must meet 4.5:1 (currently 7:1, OK)
- Status colors on their soft backgrounds: must meet 4.5:1 — all pass

### 15.2 Focus States

- All interactive elements: visible focus ring via `--focus-ring`
- Never remove focus via `outline: none` without replacing
- Focus ring contrast ≥ 3:1 against the background

### 15.3 Keyboard Navigation

- All actions keyboard-accessible (Tab, Enter, Space, Escape)
- Modals: trap focus within, Escape closes, focus returns to trigger
- Dropdowns: arrow keys navigate, Enter selects
- Tab order follows visual order

### 15.4 Screen Reader Requirements

- Every interactive element has an accessible name
- Icons used alone have `aria-label`
- Form fields have associated `<label>` (for/id) or `aria-labelledby`
- Alerts use `role="alert"` or `role="status"` as appropriate
- Modals use `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Loading states announced via `aria-live="polite"`
- Error messages associated via `aria-describedby`

### 15.5 Reduced Motion

Respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 15.6 Text Scaling

UI must remain usable at 200% browser zoom. Fixed widths should not truncate content.

---

## 16. Animation & Motion

### 16.1 Principles

- **Animation has a reason.** Every motion confirms an action, draws attention, or explains a state change. Decorative motion is forbidden.
- **Snappy over smooth.** 150–250ms is the default range. 400ms for entry-from-nothing only.
- **Never block user action.** Motion should not delay responsiveness.

### 16.2 Allowed Animations

**Hover:**
- Background color change (250ms)
- Border color change (250ms)
- TranslateX(4px) for editorial links

**Entry (page load / modal open):**
- Fade-in + translateY(24px → 0), 400ms ease, staggered by 100ms

**Press:**
- Scale(0.98) on active (150ms)

**Status change:**
- Color transition 250ms
- Pulse animation for "saved recently" indicators (2s infinite)

### 16.3 Forbidden Animations

- Bounce on every click
- Rotating gradients
- Parallax scrolling
- Text typing effects
- Particle effects
- Floating/drifting decorative elements

### 16.4 Framer Motion Usage

Framer Motion is already in the project. Use it for:
- Guest flow step transitions (slide)
- Modal enter/exit
- Toast enter/exit
- List item stagger on first load

For hover and press, prefer CSS transitions — Framer is overhead for these.

---

## 17. Anti-Patterns (What Not to Do)

These specific mistakes have been common in prior iterations. Do not make them.

### 17.1 Visual Anti-Patterns

❌ Purple-to-blue gradient buttons
❌ Rounded-full cards (pill-shaped cards)
❌ White cards on white backgrounds with drop shadows
❌ Double borders (inner + outer)
❌ Emoji-decorated labels ("⚓ Marina Manager")
❌ Stock photos of smiling people on boats
❌ Hero illustrations of abstract shapes
❌ Neon or saturated accent colors
❌ Multiple typefaces beyond our three
❌ Glass morphism (frosted translucent cards)
❌ Neumorphism

### 17.2 Copy Anti-Patterns

❌ "Awesome!" / "Amazing!" / "🎉" in confirmation messages
❌ "Oops! Something went wrong." (specific is better)
❌ "Click here" link text (describe what happens)
❌ Marketing superlatives ("the best", "revolutionary") in product UI
❌ Exclamation points in body copy
❌ All-caps sentences (reserve for mono labels only)

### 17.3 Interaction Anti-Patterns

❌ Auto-dismissing error toasts (user might miss them)
❌ Modal-on-modal stacking
❌ Hover-only tooltips on mobile
❌ Disabled buttons without explanation of why
❌ Forms that reset on error
❌ Infinite scroll on critical data (use pagination)
❌ Autoplay videos
❌ Intrusive newsletter popups

### 17.4 Information Architecture Anti-Patterns

❌ Hidden navigation items under hover menus on desktop (bad discoverability)
❌ More than 7 items in a primary nav
❌ Icons without labels (unless universally understood — search, close)
❌ Tooltips as the only place key info exists
❌ Action buttons far from the data they act on

---

## 18. Migration Playbook

How to transform existing Boatcheckin surfaces to this design system.

### 18.1 Order of Migration

Tackle surfaces in this priority:

1. **Boat wizard** — most complex, most benefit from systemization
2. **Operator dashboard** — highest-traffic internal view
3. **Captain snapshot** — the "aha" moment
4. **Guest join flow** — most customer-visible
5. **Boat/trip detail pages** — content surfaces
6. **Admin console** — internal, can trail
7. **Auth flows** — simple, quick migration
8. **Email templates** — separate concern

### 18.2 Per-Surface Migration Steps

For each surface:

1. **Import the design system CSS.** Make sure `:root` tokens are loaded globally.
2. **Replace hard-coded colors** with tokens. `grep` for hex codes in the target files.
3. **Replace hard-coded spacing** with tokens. `grep` for pixel values in padding/margin.
4. **Replace font declarations.** All display headings → Fraunces. All data → Mono. All else → Inter.
5. **Replace icons.** Any non-lucide icons → lucide-react equivalents per Section 5.4.
6. **Remove emojis from UI text.**
7. **Audit buttons.** Ensure all use `.btn` + variants. Remove custom button classes.
8. **Audit form fields.** Ensure all use the `.field` pattern.
9. **Audit status indicators.** Replace inline badges with `.pill` + variant.
10. **Audit typography.** Ensure no font sizes exist outside the scale.
11. **Run Lighthouse accessibility audit.** Fix issues.
12. **Visual QA** at 375px, 768px, 1280px. All layouts collapse cleanly.

### 18.3 Migration Commit Convention

Use structured commits per surface:

```
refactor(wizard): migrate boat wizard to MASTER_DESIGN system

- Replace hard-coded colors with design tokens
- Convert step components to .tile + .field primitives
- Swap emoji icons for lucide-react
- Adopt stepper component from design system
- Ensure 44px min touch targets on mobile
```

### 18.4 Don't Rewrite What Already Works

Don't touch:
- Underlying business logic
- API endpoints
- Database schema
- State management
- Validation rules

Only touch the presentation layer: components, styles, copy.

---

## 19. File Structure & Code Conventions

### 19.1 File Organization

```
apps/web/
├── app/                        # Next.js routes
├── components/
│   ├── primitives/             # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Pill.tsx
│   │   ├── Tile.tsx
│   │   ├── Field.tsx
│   │   ├── Alert.tsx
│   │   ├── Modal.tsx
│   │   ├── Stepper.tsx
│   │   └── index.ts            # Re-exports
│   ├── compositions/           # Business-specific compositions
│   │   ├── TripRow.tsx
│   │   ├── GuestCard.tsx
│   │   ├── BoatCard.tsx
│   │   └── CaptainSnapshotHeader.tsx
│   └── layouts/                # Page shells
│       ├── DashboardLayout.tsx
│       └── PublicLayout.tsx
├── styles/
│   ├── tokens.css              # CSS custom properties (design tokens)
│   ├── base.css                # Reset + base typography
│   ├── primitives.css          # Primitive component styles
│   ├── utilities.css           # Utility classes
│   └── globals.css             # Imports all of above
├── lib/                        # Business logic (unchanged)
└── types/                      # Types (unchanged)
```

### 19.2 Component Conventions

**One component per file.** File name matches export.

**Props interface always exported:**

```tsx
export interface ButtonProps {
  variant?: 'default' | 'primary' | 'rust' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function Button({ variant = 'default', size = 'md', icon, iconPosition = 'right', children, ...rest }: ButtonProps) {
  return (
    <button className={cn('btn', `btn--${variant}`, size !== 'md' && `btn--${size}`)} {...rest}>
      {iconPosition === 'left' && icon}
      {children}
      {iconPosition === 'right' && icon}
    </button>
  );
}
```

### 19.3 Tailwind v4 Integration

Use `@theme` directive in `globals.css` to expose tokens to Tailwind:

```css
@import "tailwindcss";

@theme {
  --color-ink: #0B1E2D;
  --color-rust: #B84A1F;
  --color-brass: #C8A14A;
  --color-paper: #FAF7F0;
  --color-bone: #F4EFE6;
  /* ...etc */

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Then use Tailwind utilities: `bg-ink`, `text-rust`, `font-display`, etc.

### 19.4 Preferred: CSS-in-CSS

Despite Tailwind being available, prefer semantic class names (`.btn`, `.tile`, `.pill`) defined in `primitives.css` for design system components. Tailwind utilities are fine for layout-only adjustments (`grid grid-cols-3 gap-6`) but not for component styling.

This gives us:
- Consistent primitives that don't drift across pages
- Easier systemic refactors
- Smaller class name soup in JSX

### 19.5 Naming Conventions

- Component files: `PascalCase.tsx`
- CSS class names: `kebab-case`, BEM-ish modifiers (`.pill--ok`)
- Design tokens: `--kebab-case`
- Props: `camelCase`
- Boolean props: prefixed `is`, `has`, `can` (e.g., `isDisabled`, `hasError`)

### 19.6 Utility Helpers

Define a `cn` helper (class-name combiner):

```ts
// lib/ui/cn.ts
export function cn(...args: (string | undefined | false | null)[]): string {
  return args.filter(Boolean).join(' ');
}
```

Use everywhere for conditional classes.

---

## 20. Appendix: Complete Token CSS

Below is the full `tokens.css` file that must live at `styles/tokens.css` and be imported globally. This is the canonical source. Copy this verbatim.

```css
/* ─────────────────────────────────────────────────────────
   BOATCHECKIN DESIGN TOKENS · v1.0
   Canonical source. Do not edit without updating MASTER_DESIGN.md.
   ───────────────────────────────────────────────────────── */

:root {
  /* CORE PALETTE */
  --ink: #0B1E2D;
  --ink-soft: #1A2F42;
  --ink-muted: #3D5568;
  --bone: #F4EFE6;
  --bone-warm: #EDE6D8;
  --paper: #FAF7F0;
  --paper-warm: #F6F0E4;

  /* ACCENTS */
  --rust: #B84A1F;
  --rust-deep: #8A3515;
  --rust-soft: #E8A585;
  --brass: #C8A14A;
  --brass-deep: #9E7D2E;
  --sea: #2D5D6E;
  --sea-deep: #1A3F4D;
  --sand: #D9CFB8;

  /* STATUS */
  --status-ok: #1F6B52;
  --status-ok-soft: #D4E5DC;
  --status-warn: #B5822A;
  --status-warn-soft: #F2E4C4;
  --status-err: #A8361E;
  --status-err-soft: #F2D5CC;
  --status-info: #2D5D6E;
  --status-info-soft: #CBD9DD;

  /* BORDERS */
  --line: #0B1E2D;
  --line-soft: rgba(11, 30, 45, 0.12);
  --line-softer: rgba(11, 30, 45, 0.06);
  --border-width: 1.5px;
  --border-width-heavy: 2px;

  /* RADII */
  --r-0: 0px;
  --r-1: 2px;
  --r-2: 4px;
  --r-pill: 9999px;

  /* SHADOWS */
  --shadow-doc: none;
  --shadow-lift: 8px 8px 0 var(--ink);
  --shadow-float: 0 4px 24px rgba(11, 30, 45, 0.08);
  --shadow-inset: inset 0 1px 0 rgba(11, 30, 45, 0.04);

  /* SPACING */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 20px;
  --s-6: 24px;
  --s-8: 32px;
  --s-10: 40px;
  --s-12: 48px;
  --s-16: 64px;
  --s-20: 80px;
  --s-24: 96px;
  --s-30: 120px;

  /* TYPOGRAPHY */
  --display: 'Fraunces', Georgia, serif;
  --body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', 'Courier New', monospace;

  --t-mono-xs: 10px;
  --t-mono-sm: 11px;
  --t-mono-md: 13px;
  --t-body-sm: 13px;
  --t-body-md: 15px;
  --t-body-lg: 17px;
  --t-lede: 19px;
  --t-tile: 22px;
  --t-card: 28px;
  --t-sub: 36px;
  --t-section: 48px;
  --t-hero: 86px;

  /* MOTION */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration: 250ms;
  --duration-slow: 400ms;

  /* FOCUS */
  --focus-ring: 0 0 0 3px rgba(184, 74, 31, 0.25);
  --focus-ring-error: 0 0 0 3px rgba(168, 54, 30, 0.25);
}

/* Mobile typography adjustments */
@media (max-width: 720px) {
  :root {
    --t-hero: 44px;
    --t-section: 34px;
    --t-sub: 28px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Final Instructions to the Agent

When you open this file to begin work:

1. **Read the entire document once.** Do not skim. The consistency we need depends on you internalizing the rules.

2. **Before touching any UI file, grep for hard-coded colors, spacing, or font sizes.** Replace with tokens.

3. **Use the `/components/primitives/` library** — don't reinvent Button, Tile, Pill, Field. If you find yourself writing styles that match an existing primitive, use the primitive.

4. **If you need a pattern that isn't here, stop and add it to this document first.** The design system is the contract. Don't break it silently.

5. **When the instructions you received conflict with this document, escalate.** Example: if asked to "add a purple accent to the button," come back and ask before adding anything purple — it violates Rule R10.

6. **Preserve the compliance feel.** This product's entire credibility rests on looking like a serious maritime tool, not another SaaS dashboard. Every micro-decision either builds that feel or erodes it.

7. **Test on mobile first.** If it doesn't work at 375px, it doesn't work.

8. **Commit small, describe clearly.** Each migrated surface gets its own commit with a structured message.

---

*End of MASTER_DESIGN.md · v1.0*
*Last updated: April 2026*
*Maintained by: Boatcheckin design (Oakmont Logic LLC)*
