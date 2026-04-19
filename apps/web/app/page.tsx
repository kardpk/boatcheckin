import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boatcheckin — The record of every charter trip, kept in order',
  description:
    'Recordkeeping software for Florida charter operators. Document waivers, safety briefings, manifests, and the audit trail regulators ask for. Free for solo captains and small charters.',
  openGraph: {
    title: 'Boatcheckin — The record of every charter trip, kept in order',
    description:
      'One link. Every guest documented, every waiver hashed, every briefing recorded.',
    type: 'website',
    url: 'https://boatcheckin.com',
    siteName: 'Boatcheckin',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boatcheckin — The record of every charter trip',
    description:
      'Documentation software for Florida charter operators. Aligned with SB 606, 46 CFR §185.506, FWC Ch. 327. Free for solo captains.',
  },
}

export default function HomePage() {
  return (
    <>
      <style>{homepageCSS}</style>
      <HomepageBody />
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const homepageCSS = `
:root {
  --ink: #0B1E2D; --ink-soft: #1A2F42; --ink-muted: #3D5568;
  --bone: #F4EFE6; --bone-warm: #EDE6D8;
  --paper: #FAF7F0; --paper-warm: #F6F0E4;
  --rust: #B84A1F; --rust-deep: #8A3515; --rust-soft: #E8A585;
  --brass: #C8A14A; --brass-deep: #9E7D2E;
  --sea: #2D5D6E; --sea-deep: #1A3F4D; --sand: #D9CFB8;
  --status-ok: #1F6B52; --status-ok-soft: #D4E5DC;
  --status-warn: #B5822A; --status-warn-soft: #F2E4C4;
  --status-err: #A8361E; --status-err-soft: #F2D5CC;
  --status-info: #2D5D6E; --status-info-soft: #CBD9DD;
  --line: #0B1E2D;
  --line-soft: rgba(11,30,45,0.12); --line-softer: rgba(11,30,45,0.06);
  --border-width: 1.5px;
  --shadow-lift: 8px 8px 0 var(--ink);
  --display: 'Fraunces', Georgia, serif;
  --body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', 'Courier New', monospace;
  --ease: cubic-bezier(0.4,0,0.2,1);
}
.hp *, .hp *::before, .hp *::after { box-sizing: border-box; }
.hp { font-family: var(--body); font-size: 16px; line-height: 1.6; color: var(--ink); background: var(--paper); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
.hp a { color: inherit; text-decoration: none; }
.hp-container { max-width: 1320px; margin: 0 auto; padding: 0 32px; }
@media(max-width:720px){ .hp-container { padding: 0 20px; } }

/* Paper grain */
.hp::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:0.035; mix-blend-mode:multiply; background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>"); }

/* Eyebrows */
.eyebrow { font-family:var(--mono); font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--rust); display:flex; align-items:center; gap:12px; margin-bottom:20px; }
.eyebrow::before { content:''; width:32px; height:1px; background:var(--rust); flex-shrink:0; }
.eyebrow.brass { color:var(--brass-deep); }
.eyebrow.brass::before { background:var(--brass-deep); }
.eyebrow.sea { color:var(--sea); }
.eyebrow.sea::before { background:var(--sea); }
.eyebrow.light { color:var(--brass); }
.eyebrow.light::before { background:var(--brass); }

/* Pills */
.pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; font-family:var(--mono); font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; border-radius:9999px; border:1px solid transparent; white-space:nowrap; }
.pill--ok { background:var(--status-ok-soft); color:var(--status-ok); border-color:var(--status-ok); }
.pill-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }

/* Buttons */
.btn { display:inline-flex; align-items:center; gap:10px; padding:14px 22px; font-family:var(--body); font-size:15px; font-weight:600; letter-spacing:-0.005em; border:var(--border-width) solid var(--ink); border-radius:2px; background:transparent; color:var(--ink); cursor:pointer; transition:all 200ms var(--ease); white-space:nowrap; text-decoration:none; }
.btn:hover { background:var(--ink); color:var(--paper); transform:translate(-2px,-2px); box-shadow:4px 4px 0 var(--ink); }
.btn-primary { background:var(--rust); color:var(--paper); border-color:var(--rust); }
.btn-primary:hover { background:var(--rust-deep); border-color:var(--rust-deep); box-shadow:4px 4px 0 var(--ink); }
.btn-outline { background:transparent; color:var(--paper); border-color:var(--paper); }
.btn-outline:hover { background:var(--paper); color:var(--rust); }
.btn-lg { padding:18px 28px; font-size:17px; }
.btn svg { width:18px; height:18px; flex-shrink:0; }

/* Nav */
.hp-nav { position:sticky; top:0; z-index:100; background:rgba(250,247,240,0.94); backdrop-filter:blur(12px); border-bottom:1px solid var(--line-soft); }
.nav-inner { display:flex; align-items:center; justify-content:space-between; padding:16px 32px; gap:32px; max-width:1320px; margin:0 auto; }
.brand { display:flex; align-items:center; gap:8px; font-family:var(--display); font-size:22px; font-weight:700; letter-spacing:-0.02em; color:var(--ink); }
.brand-mark { width:28px; height:28px; border:1.5px solid var(--ink); border-radius:50%; display:flex; align-items:center; justify-content:center; }
.brand-mark svg { width:18px; height:18px; }
.nav-links { display:flex; align-items:center; gap:32px; flex:1; justify-content:center; }
.nav-links a { font-size:14px; font-weight:500; color:var(--ink-soft); transition:color 200ms; position:relative; padding:4px 0; }
.nav-links a:hover { color:var(--rust); }
.nav-cta { display:flex; align-items:center; gap:10px; }
.nav-toggle { display:none; background:none; border:none; cursor:pointer; padding:4px; }
.nav-toggle span { display:block; width:22px; height:2px; background:var(--ink); margin:4px 0; }
@media(max-width:900px){ .nav-links { display:none; } }
@media(max-width:720px){ .nav-toggle { display:block; } .nav-cta .btn:first-child { display:none; } }
@media(max-width:400px){ .nav-inner { padding:14px 16px; } }
.nav-links.open { display:flex !important; flex-direction:column; position:absolute; top:60px; left:0; right:0; background:var(--paper); padding:16px 20px 24px; border-bottom:1px solid var(--line-soft); z-index:99; }

/* Dateline */
.dateline { border-top:1px solid var(--line-soft); border-bottom:1px solid var(--line-soft); padding:14px 0; background:var(--paper); }
.dateline-inner { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; font-family:var(--mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-muted); }
.dateline-inner > div:nth-child(2) { text-align:center; }
.dateline-inner > div:nth-child(3) { text-align:right; }
.dl-dot { color:var(--rust); }
@media(max-width:600px){ .dateline-inner { grid-template-columns:1fr; gap:6px; } .dateline-inner > div:nth-child(2),.dateline-inner > div:nth-child(3){ text-align:left; } }

/* Hero */
.hero { padding:80px 0 72px; position:relative; }
.hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start; }
@media(max-width:900px){ .hero-grid { grid-template-columns:1fr; gap:48px; } }
.hero h1 { font-family:var(--display); font-size:clamp(48px,8.5vw,86px); font-weight:500; line-height:0.98; letter-spacing:-0.04em; margin-bottom:28px; font-variation-settings:'opsz' 144; animation:fadeUp 0.8s ease 0.2s both; }
.hero h1 em { font-style:italic; color:var(--rust); font-weight:400; }
.hero-lede { font-size:18px; line-height:1.58; color:var(--ink-soft); max-width:560px; margin-bottom:32px; animation:fadeUp 0.8s ease 0.35s both; }
.hero-lede strong { color:var(--ink); font-weight:600; }
.hero-cta-row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:40px; animation:fadeUp 0.8s ease 0.5s both; }
.hero-footnote { font-family:var(--mono); font-size:11px; color:var(--ink-muted); letter-spacing:0.04em; display:flex; align-items:center; gap:6px; }
.hero-footnote::before { content:'◉'; color:var(--status-ok); font-size:9px; }
.hero-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin-top:44px; padding-top:24px; border-top:1px solid var(--line-soft); animation:fadeUp 0.8s ease 0.65s both; }
.hero-stat { padding:0 20px 0 0; border-right:1px solid var(--line-soft); }
.hero-stat:first-child { padding-left:0; }
.hero-stat:last-child { border-right:none; }
.hs-label { font-family:var(--mono); font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-muted); display:block; margin-bottom:6px; }
.hs-value { font-family:var(--display); font-size:18px; font-weight:600; letter-spacing:-0.015em; color:var(--ink); }

/* Dossier */
.dossier { position:relative; background:var(--paper-warm); border:var(--border-width) solid var(--ink); border-radius:2px; padding:32px; box-shadow:var(--shadow-lift); animation:fadeUp 0.9s ease 0.4s both; }
.dossier-tag { position:absolute; top:-10px; left:24px; background:var(--bone); border:1px solid var(--line-soft); padding:3px 10px; font-family:var(--mono); font-size:9px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:var(--ink-muted); }
.dossier-header { display:flex; justify-content:space-between; align-items:center; padding-bottom:16px; border-bottom:1px dashed var(--line-soft); margin-bottom:20px; font-family:var(--mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
.dossier-title { font-family:var(--display); font-size:20px; font-weight:600; letter-spacing:-0.015em; margin-bottom:16px; }
.stamp { position:absolute; top:20px; right:20px; width:64px; height:64px; border:2px solid var(--rust); border-radius:50%; color:var(--rust); display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:8px; font-weight:700; letter-spacing:0.06em; text-align:center; text-transform:uppercase; transform:rotate(-12deg); opacity:0.72; line-height:1.1; padding:4px; }
.dossier-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px dashed var(--line-soft); font-size:13px; }
.dossier-row:last-of-type { border-bottom:none; }
.dossier-check { flex-shrink:0; color:var(--status-ok); width:18px; height:18px; }
.d-mono { font-family:var(--mono); font-size:11px; color:var(--ink-muted); }
.dossier-footer { margin-top:20px; padding-top:18px; border-top:1.5px solid var(--ink); display:flex; justify-content:space-between; align-items:baseline; }
.dossier-cleared { font-family:var(--display); font-style:italic; font-size:22px; font-weight:500; color:var(--rust); letter-spacing:-0.01em; }
.dossier-time { font-family:var(--mono); font-size:11px; color:var(--ink-muted); letter-spacing:0.1em; }

/* Ticker */
.ticker { background:var(--ink); color:var(--bone); padding:14px 0; overflow:hidden; white-space:nowrap; border-top:1px solid var(--ink); border-bottom:1px solid var(--ink); }
.ticker-track { display:inline-flex; gap:48px; animation:scroll 42s linear infinite; padding-right:48px; }
.ticker-item { font-family:var(--mono); font-size:11px; letter-spacing:0.18em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; }
.ticker-item::after { content:'✦'; margin-left:48px; opacity:0.35; color:var(--brass); }
@keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* Sections */
.block { padding:112px 0; }
.block-tight { padding:72px 0; }
.section-header { max-width:720px; margin-bottom:64px; }
.section-title { font-family:var(--display); font-weight:500; font-size:clamp(36px,5vw,62px); line-height:1; letter-spacing:-0.03em; margin-bottom:24px; font-variation-settings:'opsz' 144; }
.section-title em { font-style:italic; color:var(--rust); font-weight:400; }
.section-title .brass { color:var(--brass-deep); }
.section-title .sea { color:var(--sea); }
.section-sub { font-size:18px; line-height:1.55; color:var(--ink-soft); max-width:560px; }
@media(max-width:720px){ .block{padding:72px 0;} .block-tight{padding:56px 0;} }

/* Compare */
.compare-list { display:flex; flex-direction:column; }
.compare-row { display:grid; grid-template-columns:56px 1fr 28px 1fr; gap:24px; align-items:start; padding:24px 0; border-top:1px solid var(--line-soft); }
.compare-row:last-child { border-bottom:1px solid var(--line-soft); }
.cmp-num { font-family:var(--mono); font-size:11px; letter-spacing:0.12em; color:var(--ink-muted); padding-top:4px; }
.cmp-old { font-family:var(--display); font-size:19px; font-weight:500; line-height:1.25; color:var(--ink-muted); text-decoration:line-through; text-decoration-color:var(--rust); text-decoration-thickness:1.5px; }
.cmp-arr { font-family:var(--mono); color:var(--rust); padding-top:4px; font-size:13px; }
.cmp-new { font-size:14px; line-height:1.55; color:var(--ink); }
@media(max-width:720px){ .compare-row { grid-template-columns:40px 1fr; gap:16px; } .cmp-arr { display:none; } .cmp-new { grid-column:2; margin-top:8px; } }

/* Flow */
.flow-grid { display:grid; grid-template-columns:1fr 1fr; border-top:1.5px solid var(--ink); border-left:1.5px solid var(--ink); }
@media(max-width:720px){ .flow-grid { grid-template-columns:1fr; } }
.flow-cell { padding:44px 32px; border-right:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink); background:var(--paper); transition:background 200ms var(--ease); }
.flow-cell:hover { background:var(--paper-warm); }
.fc-num { font-family:var(--display); font-size:52px; font-weight:500; color:var(--rust); line-height:1; letter-spacing:-0.03em; display:block; margin-bottom:20px; font-variation-settings:'opsz' 144; }
.fc-label { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:10px; display:block; }
.fc-title { font-family:var(--display); font-size:22px; font-weight:600; letter-spacing:-0.02em; margin-bottom:10px; line-height:1.1; }
.fc-body { font-size:14px; line-height:1.55; color:var(--ink-soft); }

/* Compliance */
.compliance-section { background:var(--ink); color:var(--bone); padding:112px 0; position:relative; overflow:hidden; }
.compliance-section::before { content:'§'; position:absolute; right:-2%; top:50%; transform:translateY(-50%); font-family:var(--display); font-size:600px; font-weight:900; color:rgba(244,239,230,0.025); line-height:1; pointer-events:none; letter-spacing:-0.05em; }
.compliance-section .section-title { color:var(--bone); }
.compliance-section .section-title em { color:var(--brass); }
.compliance-section .section-sub { color:rgba(244,239,230,0.7); }
.statute-stack { position:relative; z-index:1; }
.statute-item { padding:44px 0; border-top:1px solid rgba(244,239,230,0.15); display:grid; grid-template-columns:200px 1fr; gap:48px; }
.statute-item:last-child { border-bottom:1px solid rgba(244,239,230,0.15); }
.statute-badge { font-family:var(--mono); font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--ink); background:var(--brass); padding:6px 12px; display:inline-block; border-radius:1px; margin-bottom:16px; }
.statute-name { font-family:var(--display); font-size:28px; font-weight:600; letter-spacing:-0.02em; color:var(--bone); line-height:1.1; }
.statute-body { font-size:16px; line-height:1.65; color:rgba(244,239,230,0.85); margin-bottom:16px; }
.statute-tag { font-family:var(--mono); font-size:11px; font-weight:500; color:var(--brass); letter-spacing:0.12em; display:block; padding-top:14px; border-top:1px solid rgba(200,161,74,0.3); }
@media(max-width:720px){ .statute-item { grid-template-columns:1fr; gap:16px; } }

/* Advisory */
.advisory { background:var(--bone); border-top:1px solid var(--line-soft); border-bottom:1px solid var(--line-soft); padding:10px 0; text-align:center; font-family:var(--mono); font-size:10px; letter-spacing:0.05em; color:var(--ink-muted); line-height:1.6; }
.advisory strong { color:var(--ink); }

/* Audiences */
.audiences { padding:112px 0; background:var(--bone-warm); border-top:1px solid var(--ink); border-bottom:1px solid var(--ink); }
.tabs { display:flex; gap:0; margin-bottom:48px; border-bottom:1.5px solid var(--ink); flex-wrap:wrap; }
.tab { padding:16px 28px; font-family:var(--mono); font-size:12px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; background:transparent; border:none; cursor:pointer; color:var(--ink-soft); border-bottom:3px solid transparent; margin-bottom:-1.5px; transition:all 200ms; }
.tab.active { color:var(--ink); border-bottom-color:var(--rust); background:var(--paper); }
.tab:hover:not(.active) { color:var(--ink); }
.tab-content { display:none; grid-template-columns:1.2fr 1fr; gap:64px; align-items:start; }
.tab-content.active { display:grid; }
@media(max-width:900px){ .tab-content.active { grid-template-columns:1fr; gap:40px; } }
.tc-scope { font-family:var(--mono); font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--rust); margin-bottom:16px; }
.tc-heading { font-family:var(--display); font-size:clamp(28px,4vw,44px); font-weight:500; line-height:1.05; letter-spacing:-0.025em; margin-bottom:20px; }
.tc-heading em { font-style:italic; color:var(--rust); }
.tc-body { font-size:17px; line-height:1.55; color:var(--ink-soft); margin-bottom:28px; }
.tc-list { list-style:none; margin-bottom:32px; }
.tc-list li { padding:12px 0 12px 24px; position:relative; border-bottom:1px solid var(--line-soft); font-size:14px; line-height:1.5; color:var(--ink-soft); }
.tc-list li::before { content:'→'; position:absolute; left:0; color:var(--rust); font-weight:600; }
.stats-card { background:var(--paper); border:var(--border-width) solid var(--ink); padding:28px; }
.stats-card-head { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--ink-muted); padding-bottom:16px; border-bottom:1px dashed var(--line-soft); margin-bottom:4px; }
.stat-row { display:flex; justify-content:space-between; align-items:baseline; padding:12px 0; border-bottom:1px dashed var(--line-softer); }
.stat-row:last-child { border-bottom:none; }
.stat-lbl { font-size:13px; color:var(--ink-soft); }
.stat-val { font-family:var(--display); font-size:22px; font-weight:600; letter-spacing:-0.02em; }
.stat-unit { font-family:var(--mono); font-size:10px; color:var(--ink-muted); margin-left:4px; }

/* Protection */
.protection { background:var(--sea-deep); color:var(--bone); padding:112px 0; }
.protection .section-title { color:var(--bone); }
.protection .section-sub { color:rgba(244,239,230,0.72); }
.coverage-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
@media(max-width:720px){ .coverage-grid { grid-template-columns:1fr; } }
.coverage-card { background:rgba(244,239,230,0.05); border:1px solid rgba(244,239,230,0.18); padding:32px; }
.cov-label { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--brass); margin-bottom:16px; }
.cov-title { font-family:var(--display); font-size:26px; font-weight:500; line-height:1.1; letter-spacing:-0.02em; margin-bottom:18px; color:var(--bone); }
.cov-body { font-size:14px; line-height:1.65; color:rgba(244,239,230,0.78); margin-bottom:24px; }
.cov-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px dashed rgba(244,239,230,0.14); font-size:13px; }
.cov-row:last-of-type { border-bottom:none; padding-bottom:0; }
.cov-row-lbl { color:rgba(244,239,230,0.6); }
.cov-row-val { font-family:var(--mono); font-size:12px; color:var(--brass); font-weight:600; }
.protection-disclosure { margin-top:48px; padding:20px 24px; border:1px dashed rgba(244,239,230,0.22); font-family:var(--mono); font-size:11px; line-height:1.75; color:rgba(244,239,230,0.55); letter-spacing:0.01em; }

/* Pricing */
.pricing-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:0; border:1.5px solid var(--ink); }
@media(max-width:720px){ .pricing-grid { grid-template-columns:1fr; } }
.plan { padding:44px 36px; border-right:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink); background:var(--paper); position:relative; }
.plan:nth-child(2n) { border-right:none; }
.plan:nth-last-child(-n+2) { border-bottom:none; }
.plan.featured { background:var(--paper-warm); }
@media(max-width:720px){ .plan { border-right:none; } .plan:nth-last-child(-n+2) { border-bottom:1.5px solid var(--ink); } .plan:last-child { border-bottom:none; } }
.plan-tag { font-family:var(--mono); font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--ink-muted); margin-bottom:16px; display:block; }
.plan-name { font-family:var(--display); font-size:32px; font-weight:600; letter-spacing:-0.02em; margin-bottom:12px; line-height:1; }
.plan-price { font-family:var(--display); font-size:60px; font-weight:500; line-height:1; letter-spacing:-0.035em; margin-bottom:20px; }
.plan-price .curr { font-size:26px; vertical-align:22px; margin-right:2px; color:var(--ink-muted); }
.plan-price .per { font-family:var(--body); font-size:15px; font-weight:400; color:var(--ink-muted); margin-left:6px; letter-spacing:0; }
.plan-price.rust { color:var(--rust); }
.plan-price.brass { color:var(--brass-deep); }
.plan-desc { font-size:14px; color:var(--ink-soft); line-height:1.5; margin-bottom:24px; padding-bottom:20px; border-bottom:1px dashed var(--line-soft); }
.plan-features { list-style:none; margin-bottom:32px; }
.plan-features li { padding:9px 0; font-size:13px; color:var(--ink-soft); display:flex; align-items:start; gap:10px; line-height:1.5; border-bottom:1px dashed var(--line-softer); }
.plan-features li:last-child { border-bottom:none; }
.pf-check { color:var(--status-ok); flex-shrink:0; margin-top:2px; font-size:14px; }
.pricing-note { margin-top:32px; padding:20px 28px; border:1.5px solid var(--line-soft); background:var(--bone); display:flex; align-items:center; gap:24px; }
@media(max-width:720px){ .pricing-note { flex-direction:column; align-items:start; gap:12px; } }
.pricing-note-tag { flex-shrink:0; padding:6px 12px; border:1.5px solid var(--ink); font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; font-weight:600; background:var(--paper); }
.pricing-note p { font-size:14px; color:var(--ink-soft); line-height:1.55; }
.pricing-note strong { color:var(--ink); }

/* Integrations */
.integrations { padding:72px 0; background:var(--paper-warm); border-top:1px solid var(--line-soft); border-bottom:1px solid var(--line-soft); }
.int-grid { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center; }
@media(max-width:720px){ .int-grid { grid-template-columns:1fr; gap:32px; } }
.int-platform-list { display:flex; flex-wrap:wrap; gap:12px; }
.int-badge { padding:8px 16px; border:1.5px solid var(--line-soft); font-family:var(--mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-muted); background:var(--paper); display:flex; align-items:center; gap:8px; }

/* FAQ */
.faq-section { padding:112px 0; }
.faq-grid { display:grid; grid-template-columns:1fr 2fr; gap:80px; align-items:start; }
@media(max-width:900px){ .faq-grid { grid-template-columns:1fr; gap:40px; } }
.faq-list { border-top:1.5px solid var(--line); }
details.faq-item { border-bottom:1px solid var(--line-soft); }
details.faq-item summary { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:22px 0; cursor:pointer; list-style:none; font-family:var(--display); font-size:clamp(17px,2vw,21px); font-weight:600; letter-spacing:-0.015em; color:var(--ink); line-height:1.3; transition:color 200ms; }
details.faq-item summary:hover { color:var(--rust); }
details.faq-item summary::-webkit-details-marker { display:none; }
.faq-toggle { flex-shrink:0; width:24px; height:24px; position:relative; border:1.5px solid var(--line-soft); border-radius:50%; }
.faq-toggle::before,.faq-toggle::after { content:''; position:absolute; background:var(--ink-muted); left:50%; top:50%; transform:translate(-50%,-50%); transition:transform 300ms var(--ease); }
.faq-toggle::before { width:10px; height:2px; }
.faq-toggle::after { width:2px; height:10px; }
details[open] .faq-toggle::after { transform:translate(-50%,-50%) scaleY(0); }
details[open] summary { color:var(--rust); }
details > div { padding:0 0 24px; font-size:15px; line-height:1.65; color:var(--ink-soft); max-width:640px; }
details > div p+p { margin-top:12px; }

/* Early adopter */
.early-strip { background:var(--bone-warm); border-top:1.5px solid var(--ink); border-bottom:1.5px solid var(--ink); padding:56px 0; }
.early-grid { display:grid; grid-template-columns:1.4fr 0.6fr; gap:48px; align-items:center; }
@media(max-width:720px){ .early-grid { grid-template-columns:1fr; gap:24px; } }
.early-badge { display:inline-flex; align-items:center; gap:10px; background:var(--ink); color:var(--bone); padding:8px 16px; font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; font-weight:600; margin-bottom:20px; }
.early-badge span { color:var(--brass); }
.early-h { font-family:var(--display); font-size:clamp(28px,3.5vw,40px); font-weight:500; letter-spacing:-0.025em; line-height:1.05; margin-bottom:16px; }
.early-h em { font-style:italic; color:var(--rust); }
.early-body { font-size:16px; line-height:1.6; color:var(--ink-soft); }
.early-perks { list-style:none; margin-top:24px; display:flex; flex-direction:column; gap:10px; }
.early-perks li { font-size:14px; color:var(--ink-soft); display:flex; align-items:center; gap:10px; }
.early-perks li::before { content:'⚓'; font-size:12px; }
.early-count { text-align:center; }
.ec-num { font-family:var(--display); font-size:72px; font-weight:500; letter-spacing:-0.04em; color:var(--ink); line-height:1; }
.ec-label { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:var(--ink-muted); margin-top:8px; }
.ec-sub { font-size:13px; color:var(--ink-muted); margin-top:6px; }

/* Final CTA */
.final-cta { background:var(--rust); color:var(--paper); padding:96px 0; border-top:1.5px solid var(--ink); position:relative; overflow:hidden; }
.final-cta::before { content:'⚓'; position:absolute; right:-40px; top:50%; transform:translateY(-50%); font-size:360px; opacity:0.08; line-height:1; }
.fca-grid { display:grid; grid-template-columns:2fr 1fr; gap:48px; align-items:center; position:relative; z-index:1; }
@media(max-width:720px){ .fca-grid { grid-template-columns:1fr; gap:32px; } }
.fca-h { font-family:var(--display); font-size:clamp(36px,5vw,64px); font-weight:500; line-height:1; letter-spacing:-0.03em; margin-bottom:16px; font-variation-settings:'opsz' 144; }
.fca-h em { font-style:italic; color:var(--brass); }
.fca-sub { font-size:18px; line-height:1.5; opacity:0.9; max-width:500px; }
.fca-stack { display:flex; flex-direction:column; gap:14px; }
.fca-stack .btn { background:var(--paper); color:var(--ink); border-color:var(--paper); }
.fca-stack .btn:hover { background:var(--ink); color:var(--paper); border-color:var(--ink); }
.fca-stack .btn-outline { background:transparent; color:var(--paper); border-color:var(--paper); }
.fca-stack .btn-outline:hover { background:var(--paper); color:var(--rust); }

/* Footer */
.hp-footer { background:var(--ink); color:var(--bone); padding:80px 0 32px; }
.footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:48px; margin-bottom:56px; }
@media(max-width:900px){ .footer-grid { grid-template-columns:1fr 1fr; gap:32px; } }
@media(max-width:500px){ .footer-grid { grid-template-columns:1fr; } }
.footer-brand { font-family:var(--display); font-size:26px; font-weight:700; letter-spacing:-0.02em; margin-bottom:14px; }
.footer-desc { font-size:13px; line-height:1.6; color:rgba(244,239,230,0.6); max-width:300px; margin-bottom:24px; }
.footer-contact-item { margin-bottom:16px; }
.fci-label { font-family:var(--mono); font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--brass); font-weight:600; display:block; margin-bottom:4px; }
.footer-contact-item a { font-size:13px; color:var(--bone); transition:color 200ms; }
.footer-contact-item a:hover { color:var(--brass); }
.footer-contact-item address { font-style:normal; font-size:12px; line-height:1.6; color:rgba(244,239,230,0.65); }
.footer-col h4 { font-family:var(--mono); font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:var(--brass); margin-bottom:18px; font-weight:600; }
.footer-col ul { list-style:none; }
.footer-col li { padding:5px 0; font-size:13px; }
.footer-col a { color:rgba(244,239,230,0.65); transition:color 200ms; }
.footer-col a:hover { color:var(--bone); }
.footer-bottom { padding-top:28px; border-top:1px solid rgba(244,239,230,0.12); font-family:var(--mono); font-size:10px; color:rgba(244,239,230,0.45); letter-spacing:0.04em; line-height:1.7; }
.fb-meta { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:16px; }
.fb-sep { color:rgba(244,239,230,0.25); }
.footer-legal { max-width:900px; font-size:10px; color:rgba(244,239,230,0.38); line-height:1.8; margin-top:12px; }
.footer-legal p+p { margin-top:10px; }

@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
`

// ─── Client component for interactive behaviour ───────────────────────────────
import HomepageBody from './HomepageBody'
