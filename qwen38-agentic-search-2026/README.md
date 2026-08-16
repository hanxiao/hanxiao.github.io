# Qwen3.8 Agentic Search Evaluation on Private Data

Talk deck by Han Xiao (VP of AI, Elastic). 23 slides, ~16.5 minutes.
Self-contained HTML, Elastic brand palette, projector-tuned (high contrast), MathJax math.
Built in the same style/engine as [`ttc-embedding-image-tagging-2026-slides`](https://github.com/hanxiao/ttc-embedding-image-tagging-2026-slides).

Framing: a **head-to-head replacement decision**, not a solo evaluation. Qwen3.8-27B landed last
week against Qwen3.6-35B-A3B, the model Han uses by default for agentic search. Both are already
deployed and measured on a single NVIDIA L4. The benchmark they are compared on is built out of
Han's own corpus (his papers plus the Jina website material), mined into multi-hop questions by a
local model, and audited edge by edge. Private data, private verifier, no data leaves the premises.

## The load-bearing constraint

**The Qwen3.8-vs-verifier evaluation has not been run.** There is no Qwen3.8 accuracy on this
verifier anywhere, and none is shown. Slides 18 to 21 present the *designed* experiment: the axes,
the conditions, the metric definitions, and a result table whose row and column labels are filled
in while every cell is explicitly marked pending (hatched cells in the foil colour, plus an
"awaiting measurement" banner). No chart is drawn from data that does not exist.

Every other number on a slide is traceable to a real artifact:

| Source | Used for |
| --- | --- |
| [`hanxiao/Qwen3.6-35B-A3B-MTP-L4`](https://github.com/hanxiao/Qwen3.6-35B-A3B-MTP-L4) README | per-workload decode 90.6-98.8 tok/s, 56,320 context, +45% over the 63 tok/s stock config, ~73 tok/s raw ceiling, MTP 1.27-1.37x, full-residency +28% / ECC-off +10%, ~21.3 GiB resident, 8 of 256 experts, ~$0.24/hr spot on g2-standard-8 |
| `jina-dataroom-harness` `corpus/README.md` + `corpus/meta.json` | the 218-file manifest by group, snapshot 2026-08-13 |
| `out/chunks.jsonl` + `out/embeddings.meta.json` | 7,777 chunks over 210 documents, median 91 units, longest 195 units at 2.1 KB, 768 dims, L2-normalized (counted directly, not quoted) |
| `~/.openclaw/workspace/paper/private-verifier/` (`main.tex`, `tab_profiles.tex`, `tab_corr.tex`) | 207-document corpus, 10 graphs, 18,615 audited edges, the provenance/assertion inversion, r = -0.74, usable(q), the solver ladder, n=40 per graph, the 35B-A3B serving table |
| [`hanxiao/Qwen3.8-27B-UD-Q4_K_XL-L4`](https://github.com/hanxiao/Qwen3.8-27B-UD-Q4_K_XL-L4) README | VRAM vs context, the 104,192 ceiling, the 101,815-token load test, per-workload decode tok/s and MTP acceptance, the 16.8 tok/s bandwidth bound |
| `jina-dataroom-harness` README | Pi in `--mode rpc`, `search_corpus` over `embeddings.npz` + `chunks.jsonl`, web tools off by default, the 15-combination equivalence check, 117 ms load / 4.3 ms per search |
| `searchbox` / `searchbox-ttc-eval` READMEs | per-turn answer snapshot, per-turn LLM judge, accuracy vs turn and vs cumulative fresh-prefill input tokens |

Slides awaiting measurement: **17, 18, 19, 20**. The speaker notes say so out loud on each.

## Files
- `index.html` - the deck. Open directly in any browser (no server, no network needed).
- `data.js` - table and chart data, transcribed from the artifacts above with per-block provenance
  comments. Nothing in it is estimated.
- `vendor/tex-svg.js` - self-hosted MathJax (SVG output), so the usable(q) equation renders offline.
- `img/` - five QR codes (this deck, both serving repos, dataroom, searchbox), two GitHub README
  screenshots captured headless and cropped to the top 470px, and the dataroom / searchbox banners
  copied from those repos. No imagery from the previous talk.
- `slides.pdf` - 23-page export for sharing.
- `speaker-notes/` - the teleprompter/presenter page. `index.html` is the presenter UI (timer +
  pace meter); it shows the deck in an `<iframe src="../index.html">`, so the slides are NEVER
  copied here. `notes.js` is the spoken script, keyed 1:1 by slide number (23 entries).
- `sync.js` - cross-device slide sync (loaded by both the deck and the presenter page).
  `sync-worker.js` - optional Cloudflare Worker, a 3rd sync channel.
- `tools/genqr.py` - regenerate a QR in the house style (blue finders, gapped modules) with a scan check.

## The one chart
Slide 7 `drawAxes`: provenance (x) against assertion (y), one point per constructed graph, drawn
client-side into SVG from `DATA.graphs`. Teal marks the graph that is last on provenance and first
on assertion; foil marks the two that are 100% verbatim and assert almost nothing. This is the only
chart in the deck, because it is the only place with measured two-dimensional data.

## Single source of truth
The slides live in exactly one file, `index.html`. The presenter page embeds it live (iframe), so
there is only ever ONE slide version. `speaker-notes/notes.js` is the only parallel artifact: 23
entries, one per slide. When you edit a slide's facts, numbers, order, or count, update the matching
`notes.js` entry in the same pass. Cloudflare edge-caches `notes.js`, so after editing it bump the
cache-bust version in the presenter page (`<script src="notes.js?v=N">`, currently v=1).

## Present
Open `index.html`, then: Right/Space/click = next, Left = previous, `f` = fullscreen,
`Home`/`End` = first/last, `#n` deep-links a slide.

## Remote control (phone drives the projector)
On the projector laptop, open the deck with `?follow`. On your phone, open
`/qwen38-agentic-search-2026/speaker-notes/`, tap **Remote**, then tap Back / Next.
The sync topic is deck-specific, so this deck does not collide with the other decks.

## Source of truth + deploy
THIS repo (`~/qwen38-agentic-search-slides`) is the ONLY place to edit the deck. The live copy at
`https://hanxiao.io/qwen38-agentic-search-2026/` is a deploy artifact inside the
`hanxiao/hanxiao.github.io` Pages repo - never edit it there. To deploy:

```
rsync -a --delete --exclude '.git' ~/qwen38-agentic-search-slides/ \
  ~/Documents/hanxiao.github.io/qwen38-agentic-search-2026/
cd ~/Documents/hanxiao.github.io && git add qwen38-agentic-search-2026 \
  && git commit -m "Add qwen38-agentic-search-2026 deck" && git push
```

GitHub Pages goes live in ~1 min. Commit this repo in the same pass so source and deploy never
diverge. Cloudflare edge-caches `notes.js` and `data.js`: after editing either, bump the `?v=N`
cache-bust in the file that references it (deck `index.html` for data.js, presenter `index.html`
for notes.js).

## Re-export the PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```

## Palette (Elastic)
Canvas #FCFCFD, ink #1C1E23, blue #0B64DD (structure / the thing that works), teal #00BFB3 dark
#0A7B74, pink #F04E98 dark #C2186A (the foil that fails, and here also the "not yet measured"
treatment). Projector rule: no grey or dim ink anywhere.

Register: academic/professional throughout, no emojis, no em dashes, lean titles, no "A: B" colon
constructions, no conclusion disclosed before its evidence slide.

## Slide map (23)
1 Title · 2 Why I am running this (the head-to-head question, in the first person) · 3 The two
backends, README screenshots + QRs + measured serving numbers + why an L4 · 4 dataroom and searchbox ·
5 What the private corpus actually is · 6 How the verifier is built · 7 The acceptance problem ·
8 Provenance vs assertion · 9 The inversion (the one chart, real audit data) · 10 usable(q) ·
11 The solver ladder · 12 Do acceptance checks predict usability (r = -0.74) · 13 What the verifier
buys · 14 The harness · 15 The tool surface · 16 The trade side by side · 17 The context ceilings ·
**18 Experiment design (pending)** · **19 Scoring (pending)** · **20 The pending result table** ·
**21 What each outcome would mean** · 22 Limits · 23 Close.

## Two corpus snapshots, deliberately not merged
The audited graphs come from an **earlier 207-file snapshot**; the agentic harness indexes the
**218-file snapshot** of the same material (2026-08-13). Slide 5 states both and says which is
which, and the speaker note says it out loud. Do not collapse them into one number.
