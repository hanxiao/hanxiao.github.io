# Search is test-time compute

Han Xiao (VP of AI, Elastic), ElasticON AI San Francisco, November 4, 2026. 36 slides.

Live: https://hanxiao.io/elasticon-sf-2026/ · Speaker notes: https://hanxiao.io/elasticon-sf-2026/speaker-notes/

Self-contained HTML deck on the aie-sf-2026 engine (1280x720 stage scaled by `fit()`, keyboard/click nav,
`#n` deep links, `?follow` remote), restyled to the ElasticON FY27 template: Inter + Space Mono (self-hosted
in `fonts/`), navy / blue / teal / pink palette, template cover, divider, statement and thank-you art
(`img/bg-*.jpg`), elastic logo in the footer.

Story (slides 1-7): search has always been test-time compute, and inference time is a currency, not a KPI.
Four training-free demos:
1. Score functions on a frozen encoder (slides 8-14), ported from `aie-sf-2026`
2. A retrieval model tags images (slides 15-22), ported from `ttc-embedding-image-tagging-2026`
3. Semantic highlighting (slides 23-27): the task, a cross-encoder scoring each passage alone (context lost),
   jina-reranker-v3 scoring all passages in one context, and where the extra compute goes
4. An agent builds the pipeline (slides 28-32): dataroom, searchbox, knowledge-graph

Close (slides 33-36): lessons from the four demos, test-time compute in Elasticsearch today, closing, thank you.

## Files
- `index.html` - the deck. All slides in one file. Charts are drawn client-side into SVG from `data.js`.
- `data.js` - `window.DATA` (program-search figures, verbatim from aie-sf-2026) and `window.DATA_TTC`
  (image-tagging figures, verbatim from ttc-embedding-image-tagging-2026).
- `speaker-notes/` - presenter page (iframes `../index.html`) + `notes.js`, exactly one entry per slide (36).
- `sync.js` (+ optional `sync-worker.js`) - phone remote. Projector opens `?follow`, phone taps Remote.
- `vendor/tex-svg.js` - self-hosted MathJax. `fonts/` - Inter (variable) and Space Mono subsets.
- `img/` - template art, screenshots, QR codes. `tools/genqr.py` regenerates QRs (decode-verified).
- `slides.pdf` - 36-page export, one 960x540 pt page per slide (final animation frames).

## Maintenance
- After editing `notes.js` or `sync.js`, bump `?v=` where they are loaded (Cloudflare caches them).
- Stage explicit file paths only (never `git add elasticon-sf-2026/`).
- Runtime-measured pieces (pipeline connectors, braces and the recursion arrow) are laid out by `layoutSlide()`;
  for PDF export call `window.layoutAll()` under print media.
- Animations restart from `show()` via `ANIM.start(slide)`: JS-timed ones (tag-card shuffle, isometric crops,
  pipeline hops) and CSS ones keyed on `--d` (`.eqslide.go` for the recursive scoring function, `.shl.go` for the
  four semantic-highlighting slides). The default style of every CSS-animated element is its final frame, so
  print media and reduced motion show the full slide.
- Template protocol: `template-audit.md` in the source workspace lists every ElasticON FY27 rule and the fix. Cover
  and thank-you slides carry no QR code or self links.
