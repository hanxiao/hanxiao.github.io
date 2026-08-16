# Qwen3.8-27B Agentic Search Eval on Private Data

Talk deck by Han Xiao (VP of AI, Elastic). 6 slides, ~5 minutes.
Self-contained HTML, Elastic brand palette, projector-tuned (high contrast).
Built in the same style/engine as [`ttc-embedding-image-tagging-2026-slides`](https://github.com/hanxiao/ttc-embedding-image-tagging-2026-slides).

Framing: a head-to-head replacement decision. Qwen3.8-27B landed against Qwen3.6-35B-A3B, the
model Han serves by default for agentic search. Both are already deployed and measured on a
single NVIDIA L4. The evaluation is built from Han's own corpus, mined into multi-hop questions
by a local model and audited edge by edge. Private data, private verifier, on-premises.

## Facts and their sources

Every number on a slide is traceable to a real artifact.

| Source | Used for |
| --- | --- |
| [`hanxiao/Qwen3.6-35B-A3B-MTP-L4`](https://github.com/hanxiao/Qwen3.6-35B-A3B-MTP-L4) README | per-workload decode 90.6-98.8 tok/s, 56,320 context, +45% over the 63 tok/s stock config, ~73 tok/s raw ceiling, MTP 1.27-1.37x, ~21.3 GiB resident, 8 of 256 experts, ~$0.24/hr spot on g2-standard-8 |
| [`hanxiao/Qwen3.8-27B-UD-Q4_K_XL-L4`](https://github.com/hanxiao/Qwen3.8-27B-UD-Q4_K_XL-L4) README | 23 tok/s decode, the 104,192 binary-searched ceiling, the 101,815-token load test at 24.88 tok/s decode / 278 tok/s prefill / 24,082 MiB peak, 95-114 tok/s short-prompt prefill, the 16.8 tok/s bandwidth bound, hybrid attention and `full_attention_interval` 4 |
| `jina-dataroom-harness` `corpus/README.md` + `corpus/meta.json` | the 218-file manifest by group, snapshot 2026-08-13 |
| `out/chunks.jsonl` + `out/embeddings.meta.json` | 7,777 chunks over 210 documents, median 91 units, longest 195 units at 2.1 KB, 768 dims, L2-normalized |
| `~/.openclaw/workspace/paper/private-verifier/` | the 207-document snapshot, 10 graphs, 18,615 audited edges, 40 questions per graph |

The chunk count comes from the workspace clone
(`~/.openclaw/workspace/dataroom/repos/jina-dataroom-harness`), which is the one that backs the
live `https://dataroom.jina.ai` deployment: its `web/dist/assets` holds exactly the three
fingerprinted bundles the live page loads, and it carries `deploy/Caddyfile` and
`deploy/jdh.service`. The other clone (`~/jina-dataroom-harness`) is 142 commits behind and its
index holds 7,762 chunks.

The Qwen3.8-vs-Qwen3.6 head-to-head has not been run. No accuracy for either model on this
verifier appears anywhere in the deck. Slide 7 states the evaluation design once and leaves it.

## Files
- `index.html` - the deck. Open directly in any browser (no server, no network needed).
- `img/` - five QR codes (this deck, both serving repos, dataroom, searchbox), two GitHub README
  screenshots captured headless and cropped, the dataroom / searchbox banners copied from those
  repos, and `og.png`, the social card rendered from slide 1 (regenerate with a 1280x720 headless
  screenshot centre-cropped to 1200x630 whenever the title changes).
- `slides.pdf` - 8-page export for sharing.
- `speaker-notes/` - the presenter page. `index.html` is the presenter UI (timer + pace meter);
  it shows the deck in an `<iframe src="../index.html">`, so the slides are never copied here.
  `notes.js` is the spoken script, keyed 1:1 by slide number (8 entries).
- `sync.js` - cross-device slide sync (loaded by both the deck and the presenter page).
  `sync-worker.js` - optional Cloudflare Worker, a 3rd sync channel.
- `tools/genqr.py` - regenerate a QR in the house style (blue finders, gapped modules).

## Single source of truth
The slides live in exactly one file, `index.html`. The presenter page embeds it live (iframe), so
there is only ever one slide version. `speaker-notes/notes.js` is the only parallel artifact: 8
entries, one per slide. When you edit a slide, update the matching `notes.js` entry in the same
pass. Cloudflare edge-caches `notes.js`, so after editing it bump the cache-bust version in the
presenter page (`<script src="notes.js?v=N">`, currently v=3).

## Present
Open `index.html`, then: Right/Space/click = next, Left = previous, `f` = fullscreen,
`Home`/`End` = first/last, `#n` deep-links a slide.

## Remote control (phone drives the projector)
On the projector laptop, open the deck with `?follow`. On your phone, open
`/qwen38-agentic-search-2026/speaker-notes/`, tap **Remote**, then tap Back / Next.

## Source of truth + deploy
THIS repo (`~/qwen38-agentic-search-slides`) is the only place to edit the deck. The live copy at
`https://hanxiao.io/qwen38-agentic-search-2026/` is a deploy artifact inside the
`hanxiao/hanxiao.github.io` Pages repo, never edit it there. To deploy:

```
rsync -a --delete --exclude '.git' ~/qwen38-agentic-search-slides/ \
  ~/Documents/hanxiao.github.io/qwen38-agentic-search-2026/
cd ~/Documents/hanxiao.github.io && git add qwen38-agentic-search-2026 \
  && git commit -m "Update qwen38-agentic-search-2026 deck" && git push
```

GitHub Pages goes live in ~1 min. Commit this repo in the same pass so source and deploy never
diverge.

## Re-export the PDF
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=slides.pdf "file://$PWD/index.html"
```

## Palette (Elastic)
Canvas #FCFCFD, ink #1C1E23, blue #0B64DD, teal #00BFB3 dark #0A7B74, pink #F04E98 dark #C2186A.
Projector rule: no grey or dim ink anywhere.

Register: academic throughout, no emojis, no em dashes, no blog-tone headings, no kicker lines,
one heading convention (a noun phrase naming what the slide contains).

## Slide map (6)
1 Title · 2 The two serving backends · 3 dataroom and searchbox · 4 The private corpus ·
5 Verifier construction · 6 Close.
