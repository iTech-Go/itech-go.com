# Atlas-inspired visual increments (round 1: items 4 and 5)

Date: 2026-09-28. Reference: youratlas.com (Framer site). Goal: add visual energy
to the middle of the site without revisiting the v2 structure, content, or hero.

## Item 4 — Gradient feature block: "How we're different" (home page)

**What:** Wrap the existing "How we're different" section content in a full-width
rounded gradient panel (`.feature-band`), in the same family as `.cta-band`
(navy → brand blue → teal), with a faint grid texture and two radial glows.

- Layout unchanged: `.split` with copy left, 2×2 card grid right.
- Text turns white; eyebrow turns cyan; checkmarks stay brand-gradient.
- The four cards become "glass" cards: translucent white fill, white 14% border,
  `backdrop-filter: blur`, white icon boxes. Hover lifts as today.
- Primary button becomes white-on-dark like the CTA band button.
- Light and dark theme both supported via the existing `[data-theme]` selectors.
- Mobile: padding shrinks; grid collapses to one column via existing rules.

**Files:** `src/pages/index.html` (add wrapper div + class), `assets/css/style.css`.

## Item 5 — Isometric mockup on the AI & Agents page hero

**What:** Replace the flat Three.js "rings" scene on `/ai-agents.html` with a CSS
3D isometric stack of five agent-run "dashboard" cards that drift on scroll and
float gently, in the style of Atlas' tilted dashboard collage.

- Hero becomes a 2-column grid (`.page-hero.hero-iso`): copy left, `.iso-stack` right.
- `data-scene` attribute removed from this hero, so `scenes3d.js` does nothing
  on this page (it looks for `.page-hero[data-scene]`).
- `.iso-stack` = perspective container; `.iso-plane` rotated `rotateX(56deg) rotateZ(-36deg)`;
  five `.iso-card` children at different `translateZ` heights:
  1. Orchestrator run (status, step list)
  2. Tool calls (3 rows with latency)
  3. Eval suite (score ring + pass count)
  4. Guardrails (3 policy chips)
  5. Audit log (3 mono lines)
- Content is illustrative UI, no client names, no claims.
- Motion: each card floats (CSS keyframe, staggered); the plane translates
  vertically with scroll (`main.js`, rAF, factor 0.12) and tilts 2–3° with
  cursor position over the hero. Cards rise in on load.
- Guards: no motion under `prefers-reduced-motion`; under 900px the stack sits
  below the copy, scaled to 0.8, no parallax/tilt.
- Colors from existing tokens so light/dark both work.

**Files:** `src/pages/ai-agents.html`, `assets/css/style.css`, `assets/js/main.js`.

## Out of scope this round
Sticky CTA bar, timeline restyle, serif accents on all H2s, comparison table,
counters, ROI estimator (items 1–3, 6–8).

## Verification
`python3 build.py`, serve locally, check home + ai-agents in light and dark,
desktop and 390px, reduced-motion on; zero console errors; then commit and push
(`git fetch && git rebase origin/main` first).
