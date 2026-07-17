# Test-time compute for a frozen embedding model: emergent image tagging

Talk deck by Han Xiao (VP of AI, Elastic). 20 slides, ~13 minutes.
Self-contained HTML, Elastic brand palette, projector-tuned (high contrast), MathJax math.
Built in the same style/engine as [`aie-sf-2026-slides`](https://github.com/hanxiao/aie-sf-2026-slides).

Storyline: the last talk showed *search is test-time compute over a frozen encoder*. This talk
pushes the idea from "more relevance" to "a new task". A ~1B retrieval model
([`jina-embeddings-v5-omni-nano`](https://github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging))
was never trained to tag images. With zero training and no second model, a tagger is manufactured
entirely out of test-time compute over its existing geometry: the tokenizer vocabulary becomes the
open label space, patches are scored against it, a background prior is subtracted, and multi-crop
re-encoding recovers small objects. The scientific punchline: we implemented the whole 2024-2026
training-free playbook (layer swap, whitening, softmax-over-classes, ZLaP, OTTER, BCA, EM-Dirichlet,
soft-trim) and *only* CWR multi-crop beats the baseline. Re-processing good features does nothing;
feeding the model new pixels is the only real test-time compute.

Companion project repo (the code + full grounded findings):
`github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging`.

## Files
- `index.html` - the deck. Open directly in any browser (no server, no network needed).
- `data.js` - chart data (COCO-150 numbers), extracted verbatim from the project result files.
- `vendor/tex-svg.js` - self-hosted MathJax (SVG output), so math renders offline.
- `img/` - pipeline.png (the method diagram from the project repo), cat/zebra/photo demo images,
  aie-worldsfair.svg, qr-repo.png.
- `slides.pdf` - 20-page export for sharing.
- `speaker-notes/` - the teleprompter/presenter page. `index.html` is the presenter UI (timer +
  pace meter); it shows the deck in an `<iframe src="../index.html">`, so the slides are NEVER
  copied here. `notes.js` is the spoken script, keyed 1:1 by slide number (20 entries).
- `sync.js` - cross-device slide sync (loaded by both the deck and the presenter page).
  `sync-worker.js` - optional Cloudflare Worker, a 3rd sync channel.
- `tools/genqr.py` - regenerate a QR in the house style (blue finders, gapped modules) with a scan check.

## Two charts (drawn client-side into SVG from data.js)
- Slide 13 `drawLadder`: the 3-step mAP story, global (0.264) -> patch (0.635) -> +CWR (0.710).
- Slide 16 `drawLevers`: a diverging bar chart of 10 test-time levers around the patch baseline
  (0.635). Blue bars extend right (win), pink extend left (collapse), grey are flat.

## Single source of truth
The slides live in exactly one file, `index.html`. The presenter page embeds it live (iframe), so
there is only ever ONE slide version. `speaker-notes/notes.js` is the only parallel artifact: 20
entries, one per slide. When you edit a slide's facts, numbers, order, or count, update the matching
`notes.js` entry in the same pass. Cloudflare edge-caches `notes.js`, so after editing it bump the
cache-bust version in the presenter page (`<script src="notes.js?v=N">`).

## Present
Open `index.html`, then: Right/Space/click = next, Left = previous, `f` = fullscreen,
`Home`/`End` = first/last, `#n` deep-links a slide. Live vector-diagram animations (the marching-dash
edges on slides 9 and 11) freeze to a static frame in the PDF.

## Remote control (phone drives the projector)
On the projector laptop, open the deck with `?follow`. On your phone, open
`/ttc-embedding-image-tagging-2026/speaker-notes/`, tap **Remote**, then tap Back / Next.

## Re-export the PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```

## Palette (Elastic)
Canvas #FCFCFD, ink #1C1E23, blue #0B64DD (structure / the thing that works), pink #F04E98
(the foil that fails / collapses), teal #00BFB3 (secondary positive).

## Slide map (20)
1 Title (repo QR + AIE badge) · 2 Recap: search is test-time compute over a frozen encoder ·
3 The move: point the same lens at a task the model was never trained on (emergent skill) ·
4 The task (open-vocabulary, multi-label tagging) · 5 The rules (zero training, no second model) ·
6 The model (one frozen omni encoder, image+text one space) ·
7 Pipeline overview (the project's pipeline.png) ·
8 Step 1: vocabulary as label space (encode_text, not embed_tokens) ·
9 Step 2: patch beats global (mAP 0.264 -> 0.635) ·
10 Step 3: subtract the per-label prior · 11 Step 4: word-start gate + embedding-NMS ·
12 Step 5: CWR multi-crop (the one real lever) · 13 Results (COCO-150 table + mAP ladder chart) ·
14 In the wild (demo photos) · 15 The scientific question (does it scale with compute?) ·
16 The levers table (diverging bar chart, only CWR wins) ·
17 The meta-conclusion (re-processing vs feeding new info) · 18 Synthesis (back to TTC, two talks one thesis) ·
19 What is new here (vs RAM / TagCLIP / PIAA / 2025 calibration) · 20 Close (repo QR + AIE badge).

Pace the framing fast; the payoff is slides 16-18 (only CWR wins, and why). All numbers were checked
against the project result files (docs/findings-v5omni-nano.md, docs/accuracy-design-memo.md,
docs/ttc-paper-eval.md); nothing is estimated.
