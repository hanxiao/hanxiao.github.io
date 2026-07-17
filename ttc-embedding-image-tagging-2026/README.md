# Test-time compute for a frozen embedding model: emergent image tagging

Talk deck by Han Xiao (VP of AI, Elastic). 25 slides, ~15.5 minutes.
Self-contained HTML, Elastic brand palette, projector-tuned (high contrast), MathJax math.
Built in the same style/engine as [`aie-sf-2026-slides`](https://github.com/hanxiao/aie-sf-2026-slides).

Storyline: the last talk showed *search is test-time compute over a frozen encoder*. This talk
pushes the idea from "more relevance" to "a new task". A ~1B retrieval model
([`jina-embeddings-v5-omni-nano`](https://github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging))
was never trained to tag images. With zero training and no second model, a tagger is manufactured
entirely out of test-time compute over its existing geometry: the tokenizer vocabulary becomes the
open label space, patches are scored against it, a background prior is subtracted, and multi-crop
re-encoding recovers small objects.

The organizing device is the **compute menu** (slide 3): for an embedding model, test-time compute
is (A) more algebra on one forward pass, (B) new passes on new views, or (C) re-processing the
features. The scientific punchline: we implemented the whole 2024-2026 training-free playbook
(layer swap, whitening, softmax-over-classes, ZLaP, OTTER, BCA, EM-Dirichlet, soft-trim) and *only*
CWR multi-crop beats the baseline. A and B work; C is the mirage. The deck closes with the
production story: the study shipped in Omni (native macOS app), where the same label matrix tags
images (~4% overhead riding the embedding pass), HQ re-passes (5-crop CWR, P@1 0.773 -> 0.847 in
the Swift/bf16 port), video (32 frames per 240 s segment, patch-max over space and time), and
scanned PDF pages.

Companion project repo (the code + full grounded findings):
`github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging`.

## Files
- `index.html` - the deck. Open directly in any browser (no server, no network needed).
- `data.js` - chart data (COCO-150 numbers + compute-curve + Omni port numbers), extracted
  verbatim from the project result files and OmniTagger.swift.
- `vendor/tex-svg.js` - self-hosted MathJax (SVG output), so math renders offline.
- `img/` - cat/zebra/photo demo images, aie-worldsfair.svg, qr-repo.png. (pipeline.png is no
  longer referenced: the pipeline and architecture diagrams are now hand-built HTML/SVG.)
- `slides.pdf` - 25-page export for sharing.
- `speaker-notes/` - the teleprompter/presenter page. `index.html` is the presenter UI (timer +
  pace meter); it shows the deck in an `<iframe src="../index.html">`, so the slides are NEVER
  copied here. `notes.js` is the spoken script, keyed 1:1 by slide number (25 entries).
- `sync.js` - cross-device slide sync (loaded by both the deck and the presenter page).
  `sync-worker.js` - optional Cloudflare Worker, a 3rd sync channel.
- `tools/genqr.py` - regenerate a QR in the house style (blue finders, gapped modules) with a scan check.

## Three charts (drawn client-side into SVG from data.js)
- Slide 15 `drawLadder`: the 3-step mAP story, global (0.264) -> patch (0.635) -> +CWR (0.710).
- Slide 16 `drawCompute`: the compute-accuracy curve. Three compute regimes (1 pass / 1 pass +
  patch algebra / 15 passes) vs mAP, with the 8 re-processing methods as a pink cluster that all
  land at or below the 0.635 baseline. x positions are compute regimes; ms labels only where
  measured (75 ms, 1016 ms).
- Slide 19 `drawLevers`: a diverging bar chart of 10 test-time levers around the patch baseline
  (0.635). Blue extends right (win), pink extends left (collapse), ink bars are flat.

## Single source of truth
The slides live in exactly one file, `index.html`. The presenter page embeds it live (iframe), so
there is only ever ONE slide version. `speaker-notes/notes.js` is the only parallel artifact: 25
entries, one per slide. When you edit a slide's facts, numbers, order, or count, update the matching
`notes.js` entry in the same pass. Cloudflare edge-caches `notes.js`, so after editing it bump the
cache-bust version in the presenter page (`<script src="notes.js?v=N">`, currently v=2).

## Present
Open `index.html`, then: Right/Space/click = next, Left = previous, `f` = fullscreen,
`Home`/`End` = first/last, `#n` deep-links a slide. Live vector-diagram animations (the marching-dash
edges on slides 10 and 12) freeze to a static frame in the PDF.

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
Canvas #FCFCFD, ink #1C1E23, blue #0B64DD (structure / family A / the thing that works), teal
#00BFB3 dark #0A7B74 (family B, new passes), pink #F04E98 (family C, the foil that fails).
Projector rule: no grey or dim ink anywhere.

## Slide map (25)
1 Title (repo QR + AIE badge) · 2 Recap: search is test-time compute over a frozen encoder ·
3 The compute menu (A more algebra / B new passes / C re-process; two work, one is a mirage) ·
4 The move: point the same lens at a task the model was never trained on (emergent skill) ·
5 The task (open-vocabulary, multi-label tagging) · 6 The rules (zero training, no second model) ·
7 Architecture (custom diagram: two entrances, one frozen tower, outputs P / g / E) ·
8 Pipeline (custom two-lane diagram: offline cache lane + per-image lane with A/B badges) ·
9 Step 1: vocabulary as label space (E via encode_text, not embed_tokens) ·
10 Step 2: patch beats global (mAP 0.264 -> 0.635, family A) ·
11 Step 3: subtract the per-label prior (LaTeX) · 12 Step 4: word-start gate + embedding-NMS (tau 0.6) ·
13 Step 5: CWR multi-crop (14-crop geometry glyphs + bear photo + fusion math, family B) ·
14 The whole tagger as one annotated equation (underbraces mapped to A/A/B) ·
15 Results (COCO-150 table + mAP ladder chart) ·
16 The compute-accuracy curve (the TTC scaling read: first jump free, second 14x, C cluster flat) ·
17 In the wild (demo photos) · 18 The scientific question (family C vs family B) ·
19 The levers chart (10 levers, only CWR wins) ·
20 The meta-conclusion (re-processing vs feeding new info) ·
21 Shipped in Omni (same forward pass, ~0.6 ms/image, tags = searchable snippets, app-window mock) ·
22 Every media shape (image / HQ 5-crop / video 32-frame segments / scanned pages) ·
23 Synthesis (two talks, one thesis) · 24 What is new here (vs RAM / TagCLIP / PIAA / 2025 calibration) ·
25 Close (repo QR + AIE badge).

Pace the framing fast; the payoffs are slide 16 (the curve) and slides 19-20 (only CWR wins, and
why), then 21-22 land it in production. All numbers were checked against the project result files
(docs/findings-v5omni-nano.md, docs/accuracy-design-memo.md, docs/ttc-paper-eval.md) and
omni-macos OmniTagger.swift / IndexSettings.swift; nothing is estimated.
