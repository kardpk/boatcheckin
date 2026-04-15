# BoatCheckin — Design System Agent
# @DESIGN

## Role
You are the design system enforcer for BoatCheckin.
Every UI decision must follow this document.
Reference before writing any component styles.
No deviations without explicit approval.

---

## Design Philosophy

BoatCheckin uses a **unified design system** with two rendering contexts:

| Context | Surface | Identity |
|---------|---------|----------|
| **Homepage & Marketing** | Deep ink backgrounds | Navy ink layers, gold accents, editorial luxury, scroll reveals |
| **Dashboard & App** | Paper white backgrounds | White cards on `#F5F7FA`, deep navy headings, gold CTAs, mobile-first |

Both contexts share the **same font, icon system, colour palette, and spacing** — only the background context flips.

### Core Principles
- **Mobile-first** — every screen works at 390px before scaling up
- **Consistent cards** — one standard `.card` component for all content
- **No emojis** — use Lucide icons exclusively
- **Less dead space** — tight 16px padding, 10px card gaps
- **Bottom navigation** — 5-tab bottom bar, no sidebar on app screens
- **Paper white + Deep Navy + Gold** — the three-colour gravity

---

## Colour Palette

### App Surface (Dashboard, Guest Flows, Captain iPad)

```css
:root {
  /* ── Backgrounds ── */
  --bg:          #F5F7FA;   /* page background    */
  --white:       #FFFFFF;   /* card surfaces       */

  /* ── Brand — Deep Navy ── */
  --navy:        #0B1D3A;   /* headings, top bar, avatars, trip header cards */
  --navy-mid:    #1A3A5C;   /* secondary headings, inline links             */

  /* ── Brand — Gold ── */
  --gold:        #B8882A;   /* primary CTAs, active tab, badges, kickers     */
  --gold-hi:     #D4A84B;   /* hover/pressed state for gold CTAs             */
  --gold-dim:    rgba(184,136,42,0.06);  /* gold tint bg (badges, alert bg)  */
  --gold-line:   rgba(184,136,42,0.22);  /* gold border (dashed link-boat)   */

  /* ── Text Hierarchy ── */
  --text:        #1E2A3A;   /* body copy, primary text                       */
  --text-mid:    #5C6E82;   /* secondary text, descriptions, meta            */
  --text-dim:    #8E9EB0;   /* captions, placeholders, inactive nav          */

  /* ── Structure ── */
  --border:      #E2E8F0;   /* card borders, table dividers, input borders   */
  --border-dark: #C8D5E3;   /* focused borders, hover states                 */

  /* ── Status ── */
  --teal:        #1D9E75;   /* success, signed, boarded, confirmed, USCG     */
  --teal-dim:    rgba(29,158,117,0.06);  /* teal tint bg                     */
  --teal-line:   rgba(29,158,117,0.2);   /* teal border                      */
  --warn:        #D4860A;   /* warning, pending, license expiry              */
  --warn-dim:    rgba(212,134,10,0.05);  /* warning tint bg                  */
  --error:       #C93030;   /* error, destructive, compliance block          */
  --error-dim:   rgba(201,48,48,0.05);   /* error tint bg                    */

  /* ── Foundation ── */
  --font:        'BL Melody', system-ui, -apple-system, sans-serif;
  --card-radius: 14px;
  --card-pad:    16px;
}
```

### Dark Maritime Surface (Homepage & Marketing)

```css
:root {
  /* ── Ink Layers (backgrounds) ── */
  --ink:         #07101C;   /* primary page background */
  --ink2:        #0B1624;   /* alternate section bg    */
  --ink3:        #0F1E30;   /* elevated sections       */

  /* ── Brand ── */
  --navy:        #0B3660;   /* deep navy — nav CTA bg, stat cards */
  --gold:        #B8882A;   /* primary accent — headlines, CTAs    */
  --gold-hi:     #D4A84B;   /* hover state                         */
  --gold-dim:    rgba(184,136,42,0.1);   /* gold tint bg            */
  --gold-line:   rgba(184,136,42,0.28);  /* gold border             */

  /* ── Text ── */
  --white:       #FFFFFF;   /* headings on dark                    */
  --text:        #DCE5F0;   /* body copy on dark bg                */
  --text-mid:    #9AADC4;   /* secondary text, nav links           */
  --text-dim:    #5A7090;   /* meta text, kickers, footer          */

  /* ── Structure ── */
  --rule:        rgba(255,255,255,0.07);   /* section dividers    */
  --rule-gold:   rgba(184,136,42,0.2);     /* gold-tinted dividers */
}
```

### Colour Bridge (Shared Between Surfaces)

| Token | App Surface | Dark Surface | Usage |
|-------|-------------|--------------|-------|
| Gold accent | `#B8882A` | `#B8882A` | Primary CTA, active states ← **unified** |
| Body text | `#1E2A3A` | `#DCE5F0` | Paragraph copy |
| Muted text | `#5C6E82` | `#9AADC4` | Labels, captions |
| Dividers | `#E2E8F0` | `rgba(255,255,255,0.07)` | Section borders |

---

## Typography

### Font: BL Melody

```css
/* Single font family — full weight range */
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-ExtraLight.otf'); font-weight: 200; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-Light.otf');      font-weight: 300; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-Regular.otf');    font-weight: 400; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-Book.otf');       font-weight: 450; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-Medium.otf');     font-weight: 500; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-SemiBold.otf');   font-weight: 600; }
@font-face { font-family: 'BL Melody'; src: url('/fonts/BLMelody-Bold.otf');       font-weight: 700; }

/* Font stack */
--font: 'BL Melody', system-ui, -apple-system, sans-serif;

/* Source files location */
/* packages/resource/fonts/BLMelody-*.otf */
/* Copy to: apps/web/public/fonts/ for web access */
```

### App Type Scale (Dashboard)

| Token | Size | Weight | Spacing | Usage |
|-------|------|--------|---------|-------|
| `page-title` | 26px | 700 (Bold) | -0.02em | Page headers: "Crew Roster", "Trips" |
| `section-label` | 18px | 700 | -0.01em | Section headers: "Captains", "Guests" |
| `card-head` | 18px | 700 | -0.01em | Card section heads with icon |
| `card-name` | 18px | 700 | -0.02em | Crew names, boat names |
| `body` | 15px | 400 | — | Body text, descriptions |
| `body-sm` | 14px | 400 | — | Meta text, secondary info |
| `meta` | 13px | 400–500 | — | Captions, inline details |
| `badge` | 11px | 700 | 0.04em | Badge text, uppercase labels |
| `nav-label` | 10.5px | 500/700 | — | Bottom nav tab labels |
| `micro` | 11px | 600 | 0.02em | Kickers, sublabels |

### Homepage Type Scale (Dark Surface)

| Token | Size | Weight | Spacing | Usage |
|-------|------|--------|---------|-------|
| `hero-h` | `clamp(48px, 5.8vw, 78px)` | 700 | -0.03em | Hero headline |
| `sh` | `clamp(28px, 3.5vw, 46px)` | 700 | -0.025em | Section headline |
| `sb-h` | `clamp(22px, 3vw, 38px)` | 600 | -0.02em | Statement break |
| `hero-body` | 16px | 400 | — | Hero body copy |
| `kicker` | 11px | 600 | 0.2em | Section kicker (uppercase) |
| `CTA button` | 14px | 600 | 0.04em | Action buttons |

### Special Typography

```css
/* Waiver signature field */
.text-signature {
  font-family: 'Satisfy', cursive; /* Google Font */
  font-size: 24px;
  color: var(--navy);
  border: none;
  border-bottom: 2px solid var(--navy);
}
```

---

## Spacing (4px base unit)

```
4px   — micro: between inline elements
8px   — tight: related items (badge gap, chip gap)
10px  — card-gap: between cards
12px  — standard: status pill padding, small gaps
16px  — page-pad: horizontal page padding (mobile), card internal padding
18px  — section: between card sections (boats area, actions row)
24px  — deck: major section breaks inside page
32px  — large: page header bottom margin
44px  — desktop-pad: horizontal padding (desktop)
```

---

## Border Radius

```
Cards:         14px  (var(--card-radius))
Buttons (CTA): 10px
Buttons (sm):   8px
Badges:         5px
Chips:          8px  (boat chips, trip chips)
Avatars:       50%   (full circle)
Bottom sheet:  20px  (top corners only)
Inputs:        10px
```

---

## Card System

### Standard Card

Every content block in the dashboard uses the same card component:

```css
.card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--card-radius);       /* 14px */
  padding: var(--card-pad);                /* 16px */
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}
```

### Card State Indicators

Cards use a **3px top bar** for state. The card design stays identical — only the top bar changes:

```css
/* Warning (license expiry, pending items) */
.card.warn::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--warn);     /* #D4860A */
}

/* Error (expired, compliance block) */
.card.error::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--error);    /* #C93030 */
}

/* Info / Success (safety confirmed, manifest ready) */
.card.info::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--teal);     /* #1D9E75 */
}
```

### Alert Card

For prominent warnings (license expiry banner, compliance alerts):

```css
.alert-card {
  background: var(--warn-dim);
  border: 1px solid rgba(212,134,10,0.15);
  border-radius: var(--card-radius);
  padding: 14px var(--card-pad);
  position: relative;
  overflow: hidden;
}
.alert-card::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: var(--warn);
}
```

### Card Internal Layout

```css
/* Card head — title + action button */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-head h2 {
  font-size: 18px; font-weight: 700;
  color: var(--navy);
  display: flex; align-items: center; gap: 7px;
}

/* Card sections separated by top border */
.card-section + .card-section {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 10px;
}
```

---

## Navigation

### Top Bar (Sticky, Navy)

```css
.topbar {
  position: sticky; top: 0; z-index: 20;
  background: var(--navy);       /* #0B1D3A */
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

**Contents:**
- Left: Gold-bordered anchor logo + "BoatCheckin" (BL Melody Bold 17px, white)
- Right: User avatar circle (32px, `rgba(255,255,255,0.12)`, white initials)

### Bottom Navigation (5 Tabs)

```css
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  z-index: 20;
  background: var(--white);
  border-top: 1px solid var(--border);
  display: flex;
  max-width: 520px;
  margin: 0 auto;
  padding: 6px 0 env(safe-area-inset-bottom, 8px);
}
```

| Tab | Icon | Label |
|-----|------|-------|
| Home | `Home` | Home |
| Boats | `Ship` | Boats |
| Trips | `Anchor` | Trips |
| Crew | `Users` | Crew |
| More | `Settings` | More |

#### Nav Tab States

```css
/* Inactive — dim grey */
.nav-tab {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 8px 0;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--navy);             /* dark navy icons when inactive */
}
.nav-tab i { width: 22px; height: 22px; stroke-width: 2; }

/* Active — gold, bold icon */
.nav-tab.active {
  color: var(--gold);             /* #B8882A */
  font-weight: 700;
}
.nav-tab.active i { stroke-width: 2.5; }   /* bolder icon stroke */
```

> **Important:** Bottom nav icons must be **dark navy (`--navy`)** when inactive and **gold (`--gold`)** when active. Icons should feel bold — use `stroke-width: 2` for inactive, `stroke-width: 2.5` for active.

### Logo Mark

```css
.topbar-logo {
  width: 34px; height: 34px;
  border: 1.5px solid var(--gold);
  border-radius: 50%;
  display: grid; place-items: center;
  color: var(--gold);
}
/* Uses: Lucide <Anchor> at 17px */
```

---

## Icon System — Lucide

**Library:** [`lucide-react`](https://lucide.dev/) (MIT, tree-shakeable, 1000+ icons)

```bash
# Already installed:
import { Ship, Anchor, Users, Shield } from "lucide-react";
```

### Critical Rule: No Emojis

**Never use emoji in UI.** Every icon must be a Lucide `<Icon>` component.

### Sizing Rules

```
size={13}  — micro:   inline with meta text, crew-meta, badges
size={14}  — small:   inline with form labels, check items
size={16}  — body:    back links, alert icons, chip icons
size={18}  — card:    card-head h2 icons, section icons
size={20}  — nav:     bottom nav tabs, action bar buttons
size={22}  — feature: action grid icons, weather
size={32}  — hero:    weather icon, empty state
size={48}  — display: completion screens
```

### Colour Rules

```
var(--navy)      — inactive bottom nav, primary icons, card-head icons
var(--gold)      — active bottom nav, badges, CTAs, kickers
var(--text-mid)  — secondary icons, meta, chevrons
var(--text-dim)  — placeholder icons, captions
var(--teal)      — success, confirmed, USCG
var(--warn)      — warning, pending, expiry
var(--error)     — destructive, remove, expired
#FFFFFF          — icons on navy bg (top bar, trip header)
```

### Icon Registry — By Category

#### Navigation (Bottom Nav + Top Bar)

| Context | Icon | Import | Colour |
|---------|------|--------|--------|
| Home | `Home` | `Home` | `--navy` / `--gold` active |
| Boats | `Ship` | `Ship` | `--navy` / `--gold` active |
| Trips | `Anchor` | `Anchor` | `--navy` / `--gold` active |
| Crew | `Users` | `Users` | `--navy` / `--gold` active |
| More | `Settings` | `Settings` | `--navy` / `--gold` active |
| Logo | `Anchor` | `Anchor` | `--gold` always |

#### Maritime & Boats

| Context | Icon | Import |
|---------|------|--------|
| Boat name / chip | `Sailboat` | `Sailboat` |
| Ship (list/card) | `Ship` | `Ship` |
| Linked boats label | `Ship` | `Ship` |
| Link boat CTA | `Link` | `Link` |
| Unlink boat | `X` | `X` |
| Compass | `Compass` | `Compass` |
| Map pin | `MapPin` | `MapPin` |
| Waves | `Waves` | `Waves` |
| Wind | `Wind` | `Wind` |
| Weather | `CloudSun` | `CloudSun` |

#### Crew & Roles

| Context | Icon | Import |
|---------|------|--------|
| Captain badge | `Shield` | `Shield` |
| First Mate badge | `Anchor` | `Anchor` |
| Deckhand badge | `HardHat` | `HardHat` |
| License/ID card | `IdCard` | `IdCard` |
| Experience | `Briefcase` | `Briefcase` |
| Crew assignment | `UserCog` | `UserCog` |

#### Actions

| Context | Icon | Import |
|---------|------|--------|
| Add / Plus | `Plus` | `Plus` |
| Remove / Close | `X` | `X` |
| Confirm / Check | `Check` | `Check` |
| Edit | `Pencil` | `Pencil` |
| Delete | `Trash2` | `Trash2` |
| Back | `ChevronLeft` | `ChevronLeft` |
| Forward | `ChevronRight` | `ChevronRight` |
| Expand | `ChevronDown` | `ChevronDown` |
| Copy | `Copy` | `Copy` |
| Play / Start | `Play` | `Play` |
| Drag handle | `GripVertical` | `GripVertical` |

#### Status & Feedback

| Context | Icon | Import |
|---------|------|--------|
| Success | `CheckCircle` | `CheckCircle` |
| Warning | `AlertTriangle` | `AlertTriangle` |
| Error | `AlertCircle` | `AlertCircle` |
| Safety / Shield | `ShieldCheck` | `ShieldCheck` |
| Info | `Info` | `Info` |
| Clipboard check | `ClipboardCheck` | `ClipboardCheck` |

#### Contact & Communication

| Context | Icon | Import |
|---------|------|--------|
| Phone | `Phone` | `Phone` |
| Email | `Mail` | `Mail` |
| Globe / Language | `Globe` | `Globe` |
| Message / WhatsApp | `MessageCircle` | `MessageCircle` |
| Calendar | `Calendar` | `Calendar` |
| Clock / Time | `Clock` | `Clock` |
| Timer / Duration | `Timer` | `Timer` |
| File / Manifest | `FileText` | `FileText` |

---

## Button System

### Primary CTA (Gold)

```css
.btn-gold {
  font-family: var(--font);
  font-size: 14px; font-weight: 600;
  color: #FFFFFF;
  background: var(--gold);       /* #B8882A */
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center; gap: 6px;
  transition: background 0.2s;
  letter-spacing: 0.02em;
}
.btn-gold:hover { background: var(--gold-hi); }
```

### Full-Width CTA (Start Trip, Submit)

```css
.btn-start {
  font-family: var(--font);
  font-size: 15px; font-weight: 600;
  color: #FFFFFF;
  background: var(--gold);
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center; gap: 7px;
}
```

### Small Button (Swap, Assign)

```css
.btn-sm {
  font-size: 12px; font-weight: 500;
  color: var(--text-mid);
  background: var(--white);
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center; gap: 4px;
}
.btn-sm:hover { border-color: var(--navy); color: var(--navy); }

/* Danger variant */
.btn-sm.danger { color: var(--error); border-color: rgba(201,48,48,0.2); }

/* Gold-fill variant */
.btn-sm.gold-fill {
  color: #FFF;
  background: var(--gold);
  border-color: var(--gold);
  font-weight: 600;
}
```

### Outline Button (Edit, Back)

```css
.btn-outline {
  font-size: 13px; font-weight: 500;
  color: var(--navy-mid);
  background: var(--white);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center; gap: 5px;
}
.btn-outline:hover { border-color: var(--navy); color: var(--navy); }
```

---

## Status Badges

```css
.status-pill {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 5px;
  display: inline-block;
}

/* Variants */
.pill-signed  { color: var(--teal); background: var(--teal-dim); }
.pill-pending { color: var(--warn); background: var(--warn-dim); }
.pill-boarded { color: var(--navy); background: #EBF0F7; border: 1px solid var(--border-dark); font-weight: 700; }
.pill-upcoming { color: var(--gold); background: var(--gold-dim); border: 1px solid var(--gold-line); }
```

### Role Badges

```css
.badge {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center; gap: 4px;
}
.badge-captain    { color: var(--gold); background: var(--gold-dim); border: 1px solid var(--gold-line); }
.badge-first-mate { color: var(--teal); background: var(--teal-dim); border: 1px solid rgba(29,158,117,0.2); }
.badge-deckhand   { color: #6B4C93; background: rgba(107,76,147,0.06); border: 1px solid rgba(107,76,147,0.18); }
.badge-default    { color: var(--gold); background: var(--gold-dim); border: 1px solid var(--gold-line); }
```

---

## Avatar System

```css
/* Standard avatar — navy bg, white initials */
.avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--navy);      /* #0B1D3A */
  display: grid; place-items: center;
  font-size: 17px; font-weight: 700;
  color: #FFFFFF;
  flex-shrink: 0;
}

/* Role-colored variants */
.avatar.mate     { background: #1D6B50; }   /* teal-dark for First Mates */
.avatar.deckhand { background: #5A4A7C; }   /* purple for Deckhands     */

/* Sizes */
.avatar-sm { width: 34px; height: 34px; font-size: 12px; }  /* guest rows */
.avatar-md { width: 42px; height: 42px; font-size: 16px; }  /* crew assign */
.avatar-lg { width: 48px; height: 48px; font-size: 17px; }  /* crew cards  */
.avatar-xl { width: 58px; height: 58px; font-size: 20px; }  /* profile     */
```

---

## Section Labels

```css
/* Section divider — large text + count + gold underline bar */
.section-label {
  font-size: 18px; font-weight: 700;
  color: var(--navy);
  margin: 18px 0 6px;
  display: flex; align-items: center; gap: 8px;
}
.section-label .count {
  font-weight: 400; font-size: 14px; color: var(--text-dim);
}

/* Gold underline accent */
.section-bar {
  width: 28px; height: 2px;
  background: var(--gold);
  border-radius: 1px;
  margin-bottom: 12px;
}
```

---

## Chip System

### Boat Chips

```css
.boat-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; color: var(--navy);
  font-weight: 500;
  background: #F4F7FA;
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: 8px;
}
/* Unlink X icon: var(--text-dim) → var(--error) on hover */

.boat-add {
  font-size: 13px; color: var(--gold);
  font-weight: 600;
  background: var(--gold-dim);
  border: 1px dashed var(--gold-line);
  padding: 5px 12px;
  border-radius: 8px;
  display: inline-flex; align-items: center; gap: 4px;
}
```

### Trip Info Chips (on navy background)

```css
.trip-chip {
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.1);
  padding: 6px 14px;
  border-radius: 8px;
  display: inline-flex; align-items: center; gap: 5px;
}
```

---

## Trip Header Card

```css
.trip-header {
  background: var(--navy);          /* #0B1D3A */
  border-radius: var(--card-radius);
  padding: 20px var(--card-pad) 18px;
  position: relative;
  overflow: hidden;
}
/* Subtle gold radial glow */
.trip-header::after {
  content: '';
  position: absolute; top: -20px; right: -20px;
  width: 140px; height: 140px;
  background: radial-gradient(circle, rgba(184,136,42,0.08) 0%, transparent 70%);
  pointer-events: none;
}
/* Kicker: gold uppercase label */
/* Title: BL Melody Bold 24px white */
/* Chips: frosted white/10% */
/* Status pill: gold-dim bg */
```

---

## Action Grid

```css
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.action-btn {
  display: flex; flex-direction: column;
  align-items: center; gap: 5px;
  padding: 14px 4px;
  border-radius: 12px;
  font-size: 11px; font-weight: 500;
  border: 1px solid;
}

/* Variants */
.action-default { color: var(--text-mid); background: var(--white); border-color: var(--border); }
.action-teal    { color: var(--teal); background: var(--teal-dim); border-color: var(--teal-line); }
.action-gold    { color: #FFF; background: var(--gold); border-color: var(--gold); font-weight: 600; }
```

---

## Shadows

```css
/* Hover elevation — cards only */
.card:hover {
  box-shadow: 0 6px 24px rgba(11,29,58,0.06);
  border-color: var(--border-dark);
}

/* No drop shadows on buttons or badges */
/* No box-shadow on homepage (dark surface uses borders and tints) */
```

---

## Mobile Layout

### Page Container

```css
body {
  max-width: 520px;       /* mobile viewport feel */
  margin: 0 auto;         /* centered on desktop  */
  padding-bottom: 80px;   /* space for bottom nav */
}

.page {
  padding: 16px 16px 0;   /* tight horizontal padding */
}
```

### Responsive Rules

```css
/* Tablets and up (768px+) */
@media (min-width: 768px) {
  /* Consider side navigation for tablet landscape */
  /* Max-width remains 520px for consistency */
}

/* All screens */
@media (max-width: 520px) {
  /* Full width, no centering */
  body { max-width: 100%; }
}
```

---

## PDF Manifest Colours

```css
/* Used in lib/pdf/manifest.ts (pdf-lib) */
NAVY:  rgb(0.043, 0.114, 0.227)   /* #0B1D3A — header band */
GOLD:  rgb(0.722, 0.533, 0.165)   /* #B8882A — accent      */
TEAL:  rgb(0.114, 0.620, 0.459)   /* #1D9E75 — signed      */
WARN:  rgb(0.831, 0.525, 0.039)   /* #D4860A — pending      */
GREY:  rgb(0.361, 0.431, 0.510)   /* #5C6E82 — labels       */
DARK:  rgb(0.118, 0.165, 0.227)   /* #1E2A3A — body text    */
LIGHT: rgb(0.961, 0.969, 0.980)   /* #F5F7FA — section bg   */
```

---

## Do Not

```
✗ No emojis in UI — use Lucide icons exclusively
✗ No sidebar navigation — bottom nav only (app screens)
✗ No gradients in the dashboard UI
✗ No drop shadows (except card:hover elevation)
✗ No border radius > 14px (cards) or > 12px (action buttons)
✗ No font weight > 700
✗ No font size < 10.5px
✗ No colours outside the palette
✗ No decorative animations (only functional — hover transitions, state changes)
✗ No light backgrounds on homepage sections (always ink/ink2/ink3)
✗ No red for anything except genuine errors or compliance blocks
✗ No Google Fonts — use BL Melody exclusively (except Satisfy for signatures)
✗ No inconsistent card padding — always 16px (var(--card-pad))
✗ No inline style colours — always use CSS variables
✗ No large dead space — max 10px between cards, 16px page padding
✗ No table layouts on mobile — use row-based lists
```

---

## Migration Strategy

### How to Apply This Design Language to the Entire Codebase

#### Phase 1: Token Layer (Day 1)

1. **Create `apps/web/app/globals.css`** — add all CSS variables from this document under `:root`
2. **Copy fonts** from `packages/resource/fonts/` to `apps/web/public/fonts/`
3. **Add `@font-face` declarations** to `globals.css`
4. **Install `lucide-react`** if not already: `npm install lucide-react`

```
files to create/update:
  apps/web/app/globals.css      ← CSS variables + @font-face
  apps/web/public/fonts/        ← BL Melody .otf files
```

#### Phase 2: Shared Components (Day 2–3)

Build reusable React components that enforce the design system:

```
components/ui/Card.tsx          ← .card base + .warn/.error/.info variants
components/ui/Button.tsx        ← .btn-gold, .btn-sm, .btn-outline
components/ui/Badge.tsx         ← .badge + role variants, .status-pill
components/ui/Avatar.tsx        ← .avatar + size/role variants
components/ui/BottomNav.tsx     ← 5-tab bottom nav with active state
components/ui/TopBar.tsx        ← navy top bar with logo + avatar
components/ui/SectionLabel.tsx  ← section title + count + gold bar
components/ui/AlertCard.tsx     ← warning/error/info alert component
components/ui/ActionGrid.tsx    ← 4-column action buttons
components/layout/AppShell.tsx  ← TopBar + page content + BottomNav wrapper
```

#### Phase 3: Page-by-Page Migration (Day 4+)

Migrate screens in priority order — most-used first:

```
1. Layout (AppShell)     — wrap all /dashboard/* pages
2. Trips list + detail   — highest usage, most complex
3. Crew roster           — recently built, easy alignment
4. Boats list + detail   — boat cards, boat wizard
5. Home / Dashboard      — stat cards, quick actions
6. Settings              — forms, account
7. Guest flows           — trip join, waiver, boarding pass
```

#### Phase 4: Search-and-Replace Cleanup

```bash
# Find all hardcoded old colours and replace with CSS variables:
grep -rn "#0C447C" apps/web/        # old navy → var(--navy)
grep -rn "#0D1B2A" apps/web/        # old dark → var(--text)
grep -rn "#6B7C93" apps/web/        # old grey → var(--text-mid)
grep -rn "#D0E2F3" apps/web/        # old border → var(--border)
grep -rn "#E8F2FB" apps/web/        # old light-blue → remove/var(--bg)
grep -rn "#F5F8FC" apps/web/        # old off-white → var(--bg)

# Find all emoji usage and replace with Lucide imports:
grep -rn "🚢\|⚓\|👥\|📈\|⚙️\|🏠" apps/web/components/
```

#### Key Principles for Migration

1. **Never do a big-bang rewrite** — migrate one page at a time
2. **AppShell first** — once the layout wrapper is in place, every page gets TopBar + BottomNav for free
3. **CSS variables are the bridge** — old pages keep working while you swap values incrementally
4. **Component composition** — replace inline JSX with `<Card>`, `<Badge>`, `<Avatar>` components
5. **Test at 390px** — every migrated page must look correct on iPhone viewport before moving to the next
