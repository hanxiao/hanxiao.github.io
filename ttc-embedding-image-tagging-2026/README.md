# Test-time compute of jina-embeddings-v5-omni for image tagging

Talk deck by Han Xiao (VP of AI, Elastic). 26 slides, ~16.5 minutes.
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
- `img/` - cat/zebra/photo demo images, img/grid/g1-g9.jpg (slide-2 photos), qr-repo.png. (pipeline.png is no
  longer referenced: the pipeline and architecture diagrams are now hand-built HTML/SVG.)
- `slides.pdf` - 26-page export for sharing.
- `speaker-notes/` - the teleprompter/presenter page. `index.html` is the presenter UI (timer +
  pace meter); it shows the deck in an `<iframe src="../index.html">`, so the slides are NEVER
  copied here. `notes.js` is the spoken script, keyed 1:1 by slide number (26 entries).
- `sync.js` - cross-device slide sync (loaded by both the deck and the presenter page).
  `sync-worker.js` - optional Cloudflare Worker, a 3rd sync channel.
- `tools/genqr.py` - regenerate a QR in the house style (blue finders, gapped modules) with a scan check.

## Four charts (drawn client-side into SVG from data.js)
- Slide 14 `drawVocabHist`: ANIMATED histogram of the real score distribution over all 128,260
  tokens for cat.jpg (raw -> prior-centered -> gated -> NMS/top-k; data computed by the actual
  pipeline, stored as DATA.vhist). Runs one pass when the slide is shown, rests on the annotated
  final stage; falls back to the final stage in print/PDF (rAF probe).
- Slide 14 `drawLadder`: the 3-step mAP story, global (0.264) -> patch (0.635) -> +CWR (0.710).
- Slide 16 `drawCompute`: the test-time-scaling curve. Three compute regimes (1 pass / 1 pass +
  patch algebra / 15 passes) vs mAP, with the 8 re-processing methods as a countable pink cluster.
- Slide 17 `drawLevers`: DELTA chart: each lever's change in mAP relative to the pipeline it was
  applied to (OTTER/BCA ran on the CWR-augmented scores, soft-trim on 14-crop CWR; bases shown in
  the right column). Zero line = no effect; blue = the one gain, pink = collapses, ink = flat.

## Single source of truth
The slides live in exactly one file, `index.html`. The presenter page embeds it live (iframe), so
there is only ever ONE slide version. `speaker-notes/notes.js` is the only parallel artifact: 26
entries, one per slide. When you edit a slide's facts, numbers, order, or count, update the matching
`notes.js` entry in the same pass. Cloudflare edge-caches `notes.js`, so after editing it bump the
cache-bust version in the presenter page (`<script src="notes.js?v=N">`, currently v=5).

## Present
Open `index.html`, then: Right/Space/click = next, Left = previous, `f` = fullscreen,
`Home`/`End` = first/last, `#n` deep-links a slide. Live vector-diagram animations (the marching-dash
edges on slides 10 and 12) freeze to a static frame in the PDF.

## Remote control (phone drives the projector)
On the projector laptop, open the deck with `?follow`. On your phone, open
`/ttc-embedding-image-tagging-2026/speaker-notes/`, tap **Remote**, then tap Back / Next.

## Source of truth + deploy
THIS repo (`~/ttc-embedding-image-tagging-2026-slides`, pushed to
`github.com/hanxiao/ttc-embedding-image-tagging-2026-slides`) is the ONLY place to edit the deck.
The live copy at `https://hanxiao.io/ttc-embedding-image-tagging-2026/` is a deploy artifact
inside the `hanxiao/hanxiao.github.io` Pages repo - never edit it there. To deploy:

```
rsync -a --delete --exclude '.git' ~/ttc-embedding-image-tagging-2026-slides/ \
  ~/Documents/hanxiao.github.io/ttc-embedding-image-tagging-2026/
cd ~/Documents/hanxiao.github.io && git add ttc-embedding-image-tagging-2026 \
  && git commit -m "Update ttc-embedding-image-tagging-2026 deck" && git push
```

GitHub Pages goes live in ~1 min. Commit + push this repo in the same pass so source and
deploy never diverge. Cloudflare edge-caches `notes.js` and `data.js`: after editing either,
bump the `?v=N` cache-bust in the file that references it (deck `index.html` for data.js,
presenter `index.html` for notes.js).

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

Register note: academic/professional tone throughout - "training-free" (never "zero training"), no "squeeze", no "LLM cousin", no AIE
World's Fair badge (not presenting there). Title covers test-time compute + frozen
jina-embeddings-v5-omni + image tagging, no subtitle. The pipeline and architecture diagrams
carry a staggered arrow animation (data flow), disabled in print.

## Slide map (23)
1 Title · 2 The result first (3x3 grid of real files from this machine, tagged by the real
  algorithm in fast mode - images in img/grid/, tags verbatim from src/tag_image.py runs;
  vision_output source files; NEVER invent tags, re-run the tagger to change them) ·
3 Research questions RQ1-3 (vs RAM/Tag2Text, TagCLIP, PIAA, ZLaP/OTTER/BCA, with glosses) ·
4 Three families of test-time compute (A per-pass computation / B new passes / C re-process) ·
5 Problem setup (task + constraint chips, merged task+rules) ·
6 Architecture (ONE frozen jina-embeddings-v5-omni-nano block containing Qwen3-VL vision tower +
  EuroBERT-12L text tower as internal submodels; outputs P / g / E) ·
7 Pipeline (offline lane + per-image lane, A/B badges, animated data flow) ·
8 Step 1: label space via encode_text (gate forward-referenced) · 9 Step 2: patch beats global
  (truthful many-patches-max panels, PIAA credited) · 10 Step 3: per-label prior (per-bar mu ticks) ·
11 Step 4: word-start gate + embedding-NMS (tau 0.6) · 12 Step 5: CWR multi-crop (credited to
  TagCLIP, extended to 14-crop grid; crop-geometry glyphs) · 13 One annotated equation ·
14 Results (table + ladder) · 15 Qualitative demo photos · 16 Test-time scaling curve ·
17 Levers delta chart (10 levers vs their own baselines) · 18 Meta-conclusion ·
19 Prior-work table (Tag2Text/RAM/RAM++, TagCLIP, PIAA, OTTER/BCA) closing with RQ1-3 answers ·
20 Omni deployment (same-pass tagging, ~0.6 ms, app mock) · 21 Media shapes (image / HQ 5-crop
  production variant / video 32-frame segments / scanned pages) · 22 Synthesis · 23 Close.

Reviewed by a 49-agent workflow (per-slide review + adversarial verify + global flow /
related-work / design auditors); all confirmed findings applied. All numbers were checked against
the project result files (docs/findings-v5omni-nano.md, docs/accuracy-design-memo.md,
docs/ttc-paper-eval.md) and omni-macos OmniTagger.swift / IndexSettings.swift; nothing is estimated.
