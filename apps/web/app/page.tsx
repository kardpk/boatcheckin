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
  --rust: #B84A1F; --rust-deep: #8A3515;
  --brass: #C8A14A; --brass-deep: #9E7D2E;
  --sea: #2D5D6E; --sea-deep: #1A3F4D;
  
  --line: #0B1E2D;
  --line-soft: rgba(11,30,45,0.12); --line-softer: rgba(11,30,45,0.06);
  
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'JetBrains Mono', 'Courier New', monospace;
  
  --r-card: 8px;
  --r-btn: 6px;
  --ease: cubic-bezier(0.4,0,0.2,1);
}

.hp *, .hp *::before, .hp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.hp { font-family: var(--font); font-size: 16px; line-height: 1.6; color: var(--ink); background: var(--paper); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
.hp a { color: inherit; text-decoration: none; }
.hp-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
@media(max-width:720px){ .hp-container { padding: 0 20px; } }

/* Primitives */
.eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--rust); margin-bottom: 20px; display: block; }
.eyebrow.light { color: var(--brass); }
.eyebrow.brass { color: var(--brass); }
.eyebrow.sea { color: var(--sea); }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; font-family: var(--font); font-size: 14px; font-weight: 600; border: 1.5px solid var(--ink); border-radius: var(--r-btn); background: transparent; color: var(--ink); cursor: pointer; transition: all 200ms var(--ease); white-space: nowrap; }
.btn svg { width: 18px; height: 18px; }
.btn:hover { background: var(--ink); color: var(--paper); }
.btn-primary { background: var(--rust); color: #fff; border-color: var(--rust); }
.btn-primary:hover { background: var(--rust-deep); border-color: var(--rust-deep); }
.btn-lg { padding: 14px 28px; font-size: 16px; }

/* Nav */
.hp-nav { position: sticky; top: 0; z-index: 1000; background: rgba(250,247,240,0.8); backdrop-filter: blur(12px); border-bottom: 1.5px solid var(--line); height: 72px; display: flex; align-items: center; }
.nav-inner { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; }
.brand { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 700; color: var(--ink); }
.brand-mark { width: 32px; height: 32px; display: flex; }
.brand-mark svg { width: 100%; height: 100%; }

.nav-links { display: flex; gap: 28px; font-size: 14px; font-weight: 600; color: var(--ink-soft); }
.nav-links a:hover { color: var(--rust); }
.nav-cta { display: flex; align-items: center; gap: 12px; }
.nav-toggle { display: none; }

@media(max-width:960px) {
  .nav-links { display: none; }
  .nav-links.open { display: flex; position: absolute; top: 72px; left: 0; right: 0; background: var(--paper); flex-direction: column; padding: 32px; border-bottom: 1.5px solid var(--line); }
  .nav-toggle { display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
  .nav-toggle span { width: 24px; height: 2px; background: var(--ink); }
}

/* Dateline */
.dateline { border-bottom: 1px solid var(--line-soft); padding: 12px 0; background: var(--paper); }
.dateline-inner { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--ink-muted); text-transform: uppercase; }
.dl-dot { color: var(--rust); margin-right: 6px; }

/* Hero */
.hero { padding: 96px 0 80px; }
.hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
@media(max-width:900px){ .hero-grid { grid-template-columns: 1fr; gap: 48px; } }
.hero h1 { font-size: clamp(40px, 6vw, 68px); font-weight: 700; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 24px; color: var(--ink); }
.hero h1 em { font-style: italic; color: var(--rust); }
.hero-lede { font-size: 18px; line-height: 1.6; color: var(--ink-soft); margin-bottom: 24px; }
.hero-footnote { font-family: var(--mono); font-size: 11px; color: var(--ink-muted); margin-top: 16px; }
.hero-stats { display: flex; gap: 40px; margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.hs-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-muted); display: block; margin-bottom: 6px; }
.hs-value { font-size: 15px; font-weight: 600; color: var(--ink); }

/* Dossier */
.dossier { position: relative; background: var(--paper-warm); border: 1.5px solid var(--ink); border-radius: var(--r-card); padding: 32px; box-shadow: 12px 12px 0 var(--bone-warm); }
.dossier-tag { position: absolute; top: -10px; left: 24px; background: var(--bone); border: 1.5px solid var(--ink); padding: 4px 10px; font-family: var(--mono); font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 4px; }
.dossier-header { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px dashed var(--line-soft); }
.dossier-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: var(--ink); }
.dossier-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px dashed var(--line-softer); font-size: 14px; font-weight: 500; }
.dossier-check { width: 18px; height: 18px; color: var(--rust); flex-shrink: 0; margin-top: 2px; }
.d-mono { font-family: var(--mono); font-size: 12px; color: var(--ink-muted); }
.dossier-footer { margin-top: 24px; padding-top: 20px; border-top: 1.5px solid var(--ink); display: flex; justify-content: space-between; align-items: baseline; }
.dossier-cleared { font-size: 20px; font-weight: 700; color: var(--rust); font-style: italic; }
.dossier-time { font-family: var(--mono); font-size: 12px; color: var(--ink-muted); }
.stamp { position: absolute; top: 24px; right: 24px; width: 64px; height: 64px; border: 2px solid var(--rust); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-12deg); color: var(--rust); font-family: var(--mono); font-size: 9px; font-weight: 700; text-align: center; opacity: 0.6; }

/* Ticker */
.ticker { background: var(--ink); color: var(--bone); padding: 14px 0; overflow: hidden; white-space: nowrap; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.ticker-track { display: inline-flex; gap: 64px; animation: ticker-scroll 60s linear infinite; }
.ticker-item { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; }
@keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Sections */
.block { padding: 112px 0; }
.section-header { max-width: 640px; margin-bottom: 64px; }
.section-title { font-size: clamp(32px, 5vw, 48px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 24px; color: var(--ink); }
.section-title em { font-style: italic; color: var(--rust); }
.section-sub { font-size: 18px; line-height: 1.6; color: var(--ink-soft); }

/* Old/New Compare */
.compare-list { border-bottom: 1px solid var(--line-soft); }
.compare-row { display: grid; grid-template-columns: 48px 1fr 32px 1.2fr; gap: 32px; padding: 32px 0; border-top: 1px solid var(--line-soft); align-items: start; }
@media(max-width:720px){ .compare-row { grid-template-columns: 1fr; gap: 12px; } }
.cmp-num { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--ink-muted); }
.cmp-old { font-size: 18px; font-weight: 600; color: var(--ink-muted); text-decoration: line-through; opacity: 0.6; }
.cmp-arr { color: var(--rust); font-weight: 700; }
.cmp-new { font-size: 16px; line-height: 1.6; color: var(--ink); font-weight: 500; }

/* Flow */
.flow-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
.flow-cell { padding: 32px; background: var(--paper); border: 1.5px solid var(--line); border-radius: var(--r-card); }
.fc-num { font-size: 44px; font-weight: 700; color: var(--rust); line-height: 1; margin-bottom: 20px; display: block; }
.fc-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--ink-muted); display: block; margin-bottom: 12px; }
.fc-title { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: var(--ink); }
.fc-body { font-size: 14px; color: var(--ink-soft); line-height: 1.6; }

/* Compliance */
.compliance-section { background: var(--ink); color: var(--bone); padding: 112px 0; }
.statute-item { display: grid; grid-template-columns: 240px 1fr; gap: 64px; padding: 48px 0; border-top: 1px solid rgba(244,239,230,0.1); align-items: start; }
@media(max-width:800px){ .statute-item { grid-template-columns: 1fr; gap: 24px; } }
.statute-badge { background: var(--brass); color: var(--ink); padding: 4px 10px; font-family: var(--mono); font-size: 10px; font-weight: 700; border-radius: 4px; display: inline-block; margin-bottom: 16px; }
.statute-name { font-size: 24px; font-weight: 700; line-height: 1.2; }
.statute-body { font-size: 16px; line-height: 1.6; color: rgba(244,239,230,0.8); margin-bottom: 20px; }
.statute-tag { font-family: var(--mono); font-size: 11px; text-transform: uppercase; color: var(--brass); font-weight: 600; }

/* Advisory */
.advisory { background: var(--paper-warm); border-top: 1.5px solid var(--line); border-bottom: 1.5px solid var(--line); padding: 16px 0; font-size: 12px; line-height: 1.5; color: var(--ink-soft); }

/* Audiences / Tabs */
.audiences { background: var(--paper); padding: 112px 0; }
.tabs { display: flex; gap: 16px; margin-bottom: 48px; border-bottom: 1.5px solid var(--line-soft); }
.tab { padding: 16px 32px; font-size: 14px; font-weight: 700; background: none; border: none; cursor: pointer; color: var(--ink-muted); border-bottom: 3px solid transparent; transition: all 200ms; }
.tab.active { color: var(--ink); border-bottom-color: var(--rust); }
.tab-content { display: none; grid-template-columns: 1.2fr 1fr; gap: 80px; align-items: start; }
.tab-content.active { display: grid; }
@media(max-width:900px){ .tab-content.active { grid-template-columns: 1fr; gap: 48px; } }

.tc-scope { font-family: var(--mono); font-size: 11px; color: var(--ink-muted); text-transform: uppercase; margin-bottom: 16px; }
.tc-heading { font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 20px; }
.tc-heading em { font-style: italic; color: var(--rust); }
.tc-body { font-size: 17px; margin-bottom: 24px; }
.tc-list { list-style: none; margin-bottom: 32px; }
.tc-list li { position: relative; padding-left: 24px; margin-bottom: 12px; font-size: 15px; }
.tc-list li::before { content: "→"; position: absolute; left: 0; color: var(--rust); font-weight: 700; }

.stats-card { background: var(--paper-warm); border: 1.5px solid var(--line); border-radius: var(--r-card); padding: 32px; }
.stats-card-head { font-family: var(--mono); font-size: 11px; text-transform: uppercase; color: var(--ink-muted); border-bottom: 1px dashed var(--line-soft); padding-bottom: 16px; margin-bottom: 24px; }
.stat-row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; border-bottom: 1px dashed var(--line-softer); }
.stat-lbl { font-size: 14px; font-weight: 500; color: var(--ink-soft); }
.stat-val { font-size: 20px; font-weight: 700; color: var(--ink); }
.stat-unit { font-size: 12px; font-weight: 600; color: var(--ink-muted); margin-left: 4px; }

/* Protection */
.protection { background: var(--ink); color: var(--bone); padding: 112px 0; }
.coverage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
@media(max-width:800px){ .coverage-grid { grid-template-columns: 1fr; } }
.coverage-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(244,239,230,0.1); border-radius: var(--r-card); padding: 40px; }
.cov-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--brass); margin-bottom: 16px; }
.cov-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
.cov-body { font-size: 15px; color: rgba(244,239,230,0.7); margin-bottom: 32px; line-height: 1.6; }
.cov-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid rgba(244,239,230,0.1); font-size: 13px; }
.cov-row-lbl { color: rgba(244,239,230,0.5); }
.cov-row-val { font-weight: 600; color: var(--bone); }
.protection-disclosure { margin-top: 48px; font-size: 11px; line-height: 1.6; color: rgba(244,239,230,0.4); max-width: 900px; }

/* Pricing */
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
.plan { padding: 40px 32px; background: var(--paper); border: 1.5px solid var(--line); border-radius: var(--r-card); display: flex; flex-direction: column; }
.plan.featured { box-shadow: 12px 12px 0 var(--bone-warm); }
.plan-tag { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 12px; }
.plan-name { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.plan-price { font-size: 48px; font-weight: 700; margin-bottom: 16px; line-height: 1; }
.plan-price.rust { color: var(--rust); }
.plan-price.brass { color: var(--brass-deep); }
.plan-price .curr { font-size: 20px; vertical-align: top; margin-top: 8px; display: inline-block; }
.plan-price .per { font-size: 14px; font-weight: 500; color: var(--ink-muted); }
.plan-desc { font-size: 14px; color: var(--ink-soft); margin-bottom: 32px; flex-grow: 1; min-height: 60px; }
.plan-features { list-style: none; margin-bottom: 32px; padding-top: 24px; border-top: 1px dashed var(--line-soft); }
.plan-features li { display: flex; gap: 10px; font-size: 13px; margin-bottom: 12px; font-weight: 500; }
.pf-check { color: var(--rust); font-weight: 700; }

.pricing-note { margin-top: 64px; padding: 32px; background: var(--paper-warm); border-radius: var(--r-card); border: 1.5px solid var(--line); display: grid; grid-template-columns: 180px 1fr; gap: 32px; align-items: center; }
@media(max-width:720px){ .pricing-note { grid-template-columns: 1fr; } }
.pricing-note-tag { font-family: var(--mono); font-size: 11px; text-transform: uppercase; background: var(--ink); color: var(--bone); padding: 4px 12px; border-radius: 4px; text-align: center; }

/* Integrations */
.integrations { background: var(--bone); border-top: 1.5px solid var(--line); border-bottom: 1.5px solid var(--line); padding: 96px 0; }
.int-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
@media(max-width:900px){ .int-grid { grid-template-columns: 1fr; gap: 48px; } }
.int-platform-list { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.int-badge { padding: 8px 16px; background: var(--paper); border: 1.5px solid var(--line); border-radius: 4px; font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--ink-soft); }

/* Early Adopter */
.early-strip { background: var(--paper-warm); padding: 96px 0; }
.early-grid { display: grid; grid-template-columns: 1fr 240px; gap: 80px; align-items: center; }
@media(max-width:900px){ .early-grid { grid-template-columns: 1fr; gap: 64px; } }
.early-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: var(--ink); color: var(--bone); border-radius: 4px; font-family: var(--mono); font-size: 11px; text-transform: uppercase; margin-bottom: 24px; }
.early-h { font-size: 36px; font-weight: 700; margin-bottom: 20px; line-height: 1.1; }
.early-h em { font-style: italic; color: var(--rust); }
.early-body { font-size: 17px; margin-bottom: 24px; color: var(--ink-soft); }
.early-perks { list-style: none; }
.early-perks li { position: relative; padding-left: 24px; margin-bottom: 12px; font-size: 14px; font-weight: 500; }
.early-perks li::before { content: "●"; position: absolute; left: 0; color: var(--brass); font-size: 10px; top: 2px; }
.early-count { text-align: center; border: 2px solid var(--line); padding: 40px 20px; border-radius: 50%; width: 240px; height: 240px; display: flex; flex-direction: column; justify-content: center; background: var(--paper); box-shadow: 12px 12px 0 var(--brass); }
.ec-num { font-size: 72px; font-weight: 700; line-height: 1; color: var(--rust); }
.ec-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 8px; }
.ec-sub { font-size: 11px; font-style: italic; }

/* FAQ */
.faq-section { padding: 112px 0; }
.faq-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 80px; }
@media(max-width:900px){ .faq-grid { grid-template-columns: 1fr; gap: 64px; } }
.faq-list { border-top: 1.5px solid var(--line); }
.faq-item { border-bottom: 1.5px solid var(--line-soft); }
.faq-item summary { list-style: none; padding: 24px 0; font-size: 18px; font-weight: 700; color: var(--ink); cursor: pointer; display: flex; justify-content: space-between; align-items: center; outline: none; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-toggle::before { content: "+"; font-size: 24px; color: var(--rust); transition: transform 200ms; display: block; }
.faq-item[open] .faq-toggle::before { content: "−"; transform: rotate(180deg); }
.faq-item div { padding-bottom: 24px; font-size: 15px; line-height: 1.6; color: var(--ink-soft); }

/* Final CTA */
.final-cta { background: var(--rust); color: #fff; padding: 112px 0; text-align: center; border-top: 1.5px solid var(--ink); }
.fca-grid { max-width: 800px; margin: 0 auto; }
.fca-h { font-size: clamp(36px, 6vw, 64px); font-weight: 700; line-height: 1.1; margin-bottom: 20px; }
.fca-h em { font-style: italic; opacity: 0.9; }
.fca-sub { font-size: 19px; opacity: 0.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
.fca-stack { display: flex; justify-content: center; gap: 16px; }
.fca-stack .btn { border-color: #fff; color: #fff; }
.fca-stack .btn:hover { background: #fff; color: var(--rust); }


@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

/* Footer */
.hp-footer { background: var(--bone); padding: 96px 0 48px; border-top: 1.5px solid var(--line); color: var(--ink); }
.footer-grid { display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 48px; margin-bottom: 80px; }
@media(max-width:1000px){ .footer-grid { grid-template-columns: 1fr 1fr; } }
@media(max-width:600px){ .footer-grid { grid-template-columns: 1fr; } }

.footer-brand { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
.footer-desc { font-size: 14px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 24px; max-width: 320px; }
.footer-contact-item { font-size: 13px; margin-bottom: 12px; }
.fci-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--ink-muted); display: block; margin-bottom: 2px; }
.footer-contact-item a { font-weight: 600; color: var(--rust); }
.footer-contact-item address { font-style: normal; line-height: 1.6; color: var(--ink-soft); }

.footer-col h4 { font-family: var(--mono); font-size: 11px; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 24px; }
.footer-col ul { list-style: none; }
.footer-col ul li { margin-bottom: 12px; }
.footer-col ul li a { font-size: 14px; color: var(--ink-soft); font-weight: 500; }
.footer-col ul li a:hover { color: var(--rust); }

.footer-bottom { border-top: 1px solid var(--line-soft); padding-top: 48px; }
.fb-meta { font-size: 12px; color: var(--ink-muted); margin-bottom: 16px; }
.fb-sep { margin: 0 8px; opacity: 0.5; }
.footer-bottom-links { display: flex; flex-wrap: wrap; gap: 4px; font-size: 12px; font-weight: 600; margin-bottom: 32px; }
.footer-bottom-links a { color: var(--ink-soft); }
.footer-bottom-links a:hover { color: var(--rust); }
.footer-legal { font-size: 11px; line-height: 1.6; color: var(--ink-muted); max-width: 900px; }
.footer-legal p { margin-bottom: 16px; }

/* Nav Additions */
.nav-dropdown-wrap { position: relative; }
.nav-dropdown-trigger { display: flex; align-items: center; cursor: pointer; }
.nav-dropdown { position: absolute; top: 100%; left: 0; background: var(--paper); border: 1.5px solid var(--line); border-radius: 4px; padding: 12px 0; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); margin-top: 8px; }
.nav-dropdown-item { display: block; padding: 10px 20px; font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.nav-dropdown-item:hover { background: var(--paper-warm); color: var(--rust); }
.nav-mobile-group { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.nav-mobile-label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 12px; display: block; }
.nav-mobile-sub { display: block; padding: 8px 0; font-size: 13px; font-weight: 600; color: var(--rust); }
`
;


// ─── Client component for interactive behaviour ───────────────────────────────
import HomepageBody from './HomepageBody'
