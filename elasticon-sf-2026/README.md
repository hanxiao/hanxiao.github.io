# Search is test-time compute

Han Xiao (VP of AI, Elastic), ElasticON AI San Francisco, November 4, 2026. 44 slides, about 28 minutes.

Live: https://hanxiao.io/elasticon-sf-2026/ · Speaker notes: https://hanxiao.io/elasticon-sf-2026/speaker-notes/

Self-contained HTML deck on the aie-sf-2026 engine (1280x720 stage scaled by `fit()`, keyboard/click nav,
`#n` deep links, `?follow` remote), restyled to the ElasticON FY27 template: Inter + Space Mono (self-hosted
in `fonts/`), navy / blue / teal / pink palette, template cover, divider, statement and thank-you art
(extracted from the template pptx media into `img/bg-*.jpg`), elastic logo in the footer.

Story: search has always been test-time compute, and inference time is a currency, not a KPI (slide 5,
ported from the Tencent deck). Four training-free demos
1. LLM-written retrieval programs over a frozen encoder ported from `aie-sf-2026`
2. A frozen retrieval model as an open-vocabulary image tagger, ported from `ttc-embedding-image-tagging-2026`
3. One listwise reranker call replaces an index (listwise diagram ported from `tencent-elastic-search-ai-2026`),
   opened by the Omni 1-bit funnel (slide 33, redrawn as a pure CSS/SVG animation, 8 s loop)
4. Agent-built pipelines: dataroom, searchbox, knowledge-graph

## Files
- `index.html` - the deck. All slides in one file. Charts are drawn client-side into SVG from `data.js`.
- `data.js` - `window.DATA` (program-search figures, verbatim from aie-sf-2026) and `window.DATA_TTC`
  (image-tagging figures, verbatim from ttc-embedding-image-tagging-2026). The ttc chart code lives in the
  `TTC` IIFE inside index.html and reads only `DATA_TTC`.
- `speaker-notes/` - presenter page (iframes `../index.html`) + `notes.js`, exactly 44 entries, 1680 s total.
- `sync.js` (+ optional `sync-worker.js`) - phone remote. Projector opens `?follow`, phone taps Remote.
- `vendor/tex-svg.js` - self-hosted MathJax. `fonts/` - Inter (variable) and Space Mono subsets.
- `img/` - template art, screenshots, QR codes. `tools/genqr.py` regenerates QRs (decode-verified).
- `slides.pdf` - 44-page export (print media, animations frozen).

## Maintenance
- After editing `notes.js` or `sync.js`, bump `?v=` where they are loaded (Cloudflare caches them).
- Stage explicit file paths only (never `git add elasticon-sf-2026/`).
- Runtime-measured pieces (pipeline connectors on slide 23, braces and recursion arrow on slide 27) are laid out by `layoutSlide()`; for PDF export
  call `window.layoutAll()` under print media.
- JS-timed animations restart from `show()` via `ANIM.start(slide)`: slide 21 shuffles the nine tag cards
  out of a deck two at a time (verbatim tags pop in), slide 26 lifts the 14 crops (3x3, 2x2, center) off the
  bear as isometric CSS-3D layers, lighting each region, then shows the per-label-max tags. Print media pins
  both to a static frame (cards 1 and 2 forward with tags; all layers lifted with both tag rows).
  Slide 27 (the recursive scoring function, ported from the Tencent deck #25, MathJax) reveals the three terms and
  their C / A / B braces in order, then draws the dashed recursion arrow from s_l(crop_c) back to S(l) and fades in
  the legend; `.eqslide.go` restarts it on every show, print media shows the full frame.
- Template protocol: `template-audit.md` in the source workspace lists every ElasticON FY27 rule and the fix. Cover
  and thank-you slides carry no QR code or self links.
