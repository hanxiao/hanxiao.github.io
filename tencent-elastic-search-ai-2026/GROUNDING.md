# Grounding inventory: test-time compute / inference-time scaling

Everything found on this machine that belongs to the "search is test-time compute" thesis.
Collected 2026-08-15 before revising the deck. Sources are local repos, the live site, the
paper tree, Omni index and the English channel (topic-44980).

**Nothing here is recalled from memory. Every line has a path or a URL.**

---

## 0. The thesis, in Han's own words

The single most important source. From the `searchbox` README, section "Why"
(`~/.openclaw/workspace/dataroom/repos/searchbox/README.md`, and the longer draft recovered from
topic-44980 `18abdcc7`):

> "Everyone who knows me knows I'm super test-time-compute-pilled. In my view, **search is
> test-time compute (TTC)**: you wire trained embeddings, rerankers, single-/multi-vector
> retrievers, and query expanders into a pipeline to squeeze out relevancy. Don't scale TTC, say a
> keyword search hands you the answer, and it's probably not good enough. Scale it, say add
> embedding search then filter with a reranker, and you most likely get a better one."

The three open questions he attaches to the thesis, verbatim:

> - "Model preferences: which tool does it reach for in agentic search?"
> - "Is grep really all you need, i.e. where does a dense retriever add nothing to search quality?"
>   (cites arXiv:2605.15184)
> - "Does scaling test-time compute via token budget forcing give better answers, especially on the
>   hard questions?"

And the reason for the airgap:

> "I made searchbox an airgapped harness, because I don't want the model cheating with web
> information. I want to lock search in the box and it should exhaustively and exclusively use
> what's in the box."

Note the structure he uses himself: **claim, then the don't-scale/do-scale contrast, then the
projects that were built to test it.** The deck should mirror this, because it is his own argument
order.

---

## 1. Projects, by layer

Ordered the way the argument wants them: inside the model first, then outside.

### Layer A: inside the model, recombine the geometry

| Project | Repo / path | What it establishes |
| --- | --- | --- |
| **embedding-ttc** (autoresearch) | `github.com/hanxiao/embedding-ttc`, arXiv:2605.11374 | A frozen 239M encoder gains at inference when an agent searches for the program. 144 programs / 144 generations. |
| **image tagging** | `github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging`, deck at `/ttc-embedding-image-tagging-2026` | Test-time compute buys a capability the model was never trained for: open-vocab multi-label tagging, mAP 0.710 on COCO-150. |
| **topk × jina-v4 multivec** | `hanxiao.github.io/topk-jina-v4-multivec` | The same axis in product form: N×128 token/patch vectors + MaxSim late interaction instead of one pooled vector. Text and images in one index. |
| **jina-reranker-v3.5 in-page search** | `github.com/hanxiao/jina-reranker-v3.5-in-page-search` | The cheapest possible TTC: one listwise rerank call over a whole page. **No index, no vector store, no chunk database.** 104 sentences, 52 chunks, 271 ms, one request. |
| **omni-macos** | `github.com/hanxiao/omni-macos`, paper in `~/Documents/omni-odi2026` | Where the tagging work shipped. Encoder, index and store all on the Mac holding the files. |

### Layer B: outside the model, compose the tools

| Project | Repo | What it establishes |
| --- | --- | --- |
| **dataroom** | `github.com/hanxiao/dataroom` | "Give a query, get a dataroom." Agentic crawl on a self-hosted Qwen3.6 on one L4, output is a cited `.zip`. Buys recall with cheap local tokens. |
| **searchbox** | `github.com/hanxiao/searchbox` | Airgapped closed-corpus QA. Agent must compose its own pipeline from local tools. Buys precision. |
| **knowledge-graph-extractor** | `github.com/hanxiao/knowledge-graph-extractor` | Facts to edges, walk longest paths, get multi-hop questions no single passage answers. The private verifier. |

### Supporting infrastructure (the reason the above is affordable)

These are not talk topics but they are the substrate, and one line each is worth having:
`Qwen3.6-35B-A3B-MTP-L4` (~91-99 tok/s decode on one L4), `Qwen3.8-27B-UD-Q4_K_XL-L4`
(23 tok/s at 104K context), `qwen3.5-35b-a3b-turbo3-1m-context`, `jina-grep-cli`, `qmd`,
`jina-airgap`. All at `github.com/hanxiao`.

---

## 2. Numbers, with their exact conditions

Only numbers with a verifiable source. Anything not on this list does not go in the deck.

### Autoresearch (`data.js` `window.A`, from `aie-sf-2026/data.js`)

| Number | Exact condition |
| --- | --- |
| 144 programs / 144 generations | discovery on jina-embeddings-v5-nano (239M, frozen), 14 MMTEB Tier-1 tasks |
| 12 Pareto-optimal | cost ratio c from 1.2 to 14.7 |
| +0.07 to +0.24 in-domain mean ΔnDCG@10 | in-domain only, the compute rubric |
| 6 transferable programs, c = 1.00 to 1.50 | transfer rubric; admitted only if validation improves and no task regresses past 0.05 |
| Transpose-Consensus: c=1.50, median +0.0043, win rate 83.3%, mean +0.0219, worst cell 0.0000 | best transfer program |
| ZeroCost-Consensus: c=1.00, median +0.0051, 68.4% win | zero extra forward passes |
| held-out gains largest on gemma-300m (+0.0182 mean) and qwen3-0.6b (+0.0089 mean) | families never seen during discovery |
| 19 held-out tasks, 4 encoders | 3 of the 4 never seen in discovery |

Rediscovered structures (not seeded): Reciprocal Rank Fusion, Fisher Linear Discriminant.
Operationalized from a seeded idea: Rocchio pseudo-relevance feedback, sentence-level MaxSim.

### Image tagging (`data.js` `window.B`, from `ttc-embedding-image-tagging-2026/data.js`)

| Number | Exact condition |
| --- | --- |
| mAP 0.264 | global pooled vector, COCO-150 |
| mAP 0.635 | 0.7 × patch-max + 0.3 × global (A: deeper read, same forward) |
| mAP 0.710 | + CWR 14-crop re-encode (B: new pixels) |
| P@1 0.813, P@3 0.476, R@5 0.680 | at mAP 0.710 |
| 128,260 → 25,465 | tokenizer vocab gated to candidates by word-initial filter |
| 75 ms vs 1016 ms per image | measured latency, patch fuse vs 14-crop |
| ~4% overhead | tagging rides the embedding forward already being run, in omni-macos |
| P@1 0.847 (HQ) vs 0.773 baseline | Swift/bf16 port, 5-crop CWR |
| 32 frames | video, sampled per 240s segment, patch-max across space and time |

### Model facts (authoritative: `~/Documents/website/webapp/public/models/llms.txt`)

jina-embeddings-v5-nano 239M / 768d · v5-small 677M / 1024d · v5-omni-nano ~1.04B ·
v5-omni-small 1.74B / 1024d / 32768 ctx · jina-reranker-v3 597M.

### Third-party anchor

Noam Brown, OpenAI, 2024: 20 seconds of thinking in one hand of poker ≈ scaling the model 100,000×
and training it 100,000× longer. (Used in `aie-sf-2026` slide 2.)

---

## 3. What the argument actually needs

The chain, and which asset carries each link:

1. **Search looks finished** — bigger encoder, cleaner data, faster ANN, higher reranker scores.
   All four are the training axis. (No asset needed; this is the setup.)
2. **There is a second axis** — test-time compute. Definition + Noam Brown.
3. **Search already lives on that axis** — you assemble a pipeline at inference. Han's own
   don't-scale/do-scale sentence is the cleanest statement of this.
4. **You spend inference time and you buy things** — relevance, and capability.
5. **Proof inside the model** — autoresearch (relevance), image tagging (capability),
   in-page rerank and multi-vector as the product-shaped versions.
6. **Proof outside the model** — dataroom (recall), searchbox (precision), knowledge-graph (the
   verifier that makes the other two measurable).
7. **Return to the claim** — the axis is real, it is cheap at the low end, and the pipeline itself
   can be discovered rather than designed.

---

## 4. Style constraints for the rewrite

From `~/Documents/omni-odi2026/paper/STYLE.md`, the rules that bind slide prose:

- **Lean and mean. Final state, never process. No negative results.** Removal beats rewriting.
- **No blog tone.** Titles like "What X is", "Where X overtakes Y", "How the pieces fit together"
  are rejected forms. No bold paragraph lead-ins as structure.
- **The four banned patterns**: clipped fragments ("A, single-word" appositive tails), riddle
  metaphors (sentences that must be decoded), staccato fragment lists (verbless lists after a
  colon), casual idioms.
- **No overused contrastives**: "rather than", "A not B", "instead of" doing work a plain sentence
  could do.
- **First person for what we did.** Say the real technique, not a poetic paraphrase.
- **Never guess numbers.** Every figure traceable to a result file.
- **No em dashes, no emojis.**
- **Proportionality**: trivial things get few words.

Applied to a talk rather than a paper, the operative reading is: state the finding, not the search
for it; every claim carries its condition; and if a sentence has to be decoded, delete it.

---

## 5. Sweep round two (2026-08-15, after autoresearch was cut)

autoresearch / embedding-ttc / arXiv:2605.11374 is **out of the talk**. The evidence below
replaces it, and it is stronger for this thesis because every item is a stage someone actually
ships in a search system.

### Reranking as the canonical test-time spend
`~/Documents/jina-reranker-v3/README.md`, arXiv:2509.25085. 0.6B, "last but not late" interaction:
query plus up to 64 documents in one 131K context, causal self-attention across all of them, score
read from each document's last token. BEIR nDCG@10 **61.94**, against bge-reranker-v2-m3 (same
0.6B) 56.51 and Qwen3-Reranker-0.6B 56.28. MIRACL 66.83, MKQA 67.84, CoIR 63.28.
The point for the talk: a bi-encoder scores each document *blind to the others* because its vector
was computed before the others existed. Reranking is the extra inference that lets candidates be
compared.

### Deleting the index when the corpus is one page
`~/Documents/jina-reranker-v3.5-in-page-search/`, model arXiv:2607.18152. The inverse trade, and
the sharpest slide in the set. An index amortizes over many queries; a single page view never
amortizes it. So drop the index and spend one listwise pass over the whole document.
**271 ms** for 104 sentences / 52 chunks / ~3.5K tokens, one request, M3 Ultra via MLX.
345-sentence page: 1.35 s cold, 1.09 s prefetched, ranking unchanged.
Assets: `docs/img/ui-top1.png` (used), plus pipeline.png, ui-prefetch.png, ui-wikipedia.png.

### The two-stage funnel in Omni
`~/Documents/omni-odi2026/paper/main.tex` sec:funnel; `~/Documents/omni-macos/Sources/OmniKit/VectorStore.swift`.
Scan a 4-bit quantized replica, take top-C, rescore that shortlist exactly in bf16. Final scores
are exact either way and cost tracks the shortlist, not the corpus. Candidate set is
`min(4096, max(1024, topK*32))`. Funnel speedup vs exhaustive scan at 500k rows: **1.76×** on
M3 Pro 14c, 1.73× on M2 10c (`~/Documents/omni-odi2026/data/measurements.md`). Text query p50
**9.7 ms** on M3 Ultra over a real personal corpus. Figure: `figures/funnel.png` (used).

### Correction to a number already in the deck
The tagging overhead was written as "~4%". The measurement file
(`~/Documents/omni-odi2026/data/measurements.md`) records **+1.29 / +1.52 ms per image, about 3%
of embed cost**, and the ODI paper gives the per-machine range as −5.4% to +2.4% with no machine
separating it from noise. Use the measurement file, not the older slide.

### Deliberately left out
Multi-vector late interaction demo (`hanxiao.github.io/topk-jina-v4-multivec`) and the BoF /
EMNLP tutorial decks: Han judged the first too thin to carry a slide, and the tutorials are
landscape surveys rather than evidence for this claim.

---

## 6. Per-slide fact check (2026-08-15, third pass)

Every claim on every slide re-verified against a source, local or online. Result of that pass:

**Verified against source, unchanged**
- Noam Brown, 20 s of poker thinking ≈ 100,000× model scale and 100,000× training. Confirmed
  online across TED AI Conference coverage and Reuters, 2024.
- jina-reranker-v3: BEIR 61.94, bge-reranker-v2-m3 56.51, Qwen3-Reranker-0.6B 56.28, 64 documents
  in a 131K context. `~/Documents/jina-reranker-v3/README.md`, arXiv:2509.25085.
- In-page search: 104 sentences / 52 chunks / ~3.5K tokens / 271 ms on M3 Ultra; 345-sentence page
  1.35 s cold vs 1.09 s prefetched. `~/Documents/jina-reranker-v3.5-in-page-search/README.md`,
  model arXiv:2607.18152 (title and BEIR 63.20 confirmed online).
- Funnel: 1.76× at 500k rows on M3 Pro 14c, text query p50 9.7 ms on M3 Ultra.
  `~/Documents/omni-odi2026/data/measurements.md` lines 262 / 311.
- Image tagging ladder 0.264 → 0.635 → 0.710, latency 75 ms / 1016 ms, Omni HQ P@1 0.847 vs 0.773.
  `data.js`, matching the source repo's eval output.
- Vocabulary 128,260 tokens gated to 25,465 words. Source repo README pipeline diagram.
- Searchbox tool list (grep, embed, rerank, similarity, cluster, select_diverse) and the airgap
  rationale. `dataroom/repos/searchbox/README.md`.
- Harness: 210 md documents, 7777 chunks, one external tool, 117 ms load / 4.3 ms per search.
  `dataroom/repos/jina-dataroom-harness/README.md`.

**Corrected in this pass**
- The closing slide still cited **arXiv:2605.11374**. That is the autoresearch paper, which was
  cut from the talk; no remaining slide draws on it. Replaced with hanxiao.io.
- "Qwen 27B、35B-A3B" was loose. The deployment serves `Qwen3.6-35B-A3B-Q4KXL-MTP` (default) and
  `Qwen3.8-27B-UD-Q4KXL-MTP`; the slide now names them properly.
- Searchbox did not say which model runs inside the box. It is the same self-hosted
  Qwen3.6-35B-A3B; now stated.
- The closing QR row was missing in-page search even though it has its own slide. Added.

---

## 7. Fourth pass (2026-08-15): funnel mechanism corrected, header aligned

### The funnel slide was describing the wrong tier
It said "用一份 4 bit 量化的副本在 GPU 上扫一遍". That is wrong on both counts, and the figure
was being captioned to match the wrong story. From `~/Documents/omni-odi2026/paper/main.tex`
sec:funnel (same text in `short.tex`):

- The store keeps **a one-bit replica** and the exact vectors. **The scan reads the one-bit
  replica.** A row costs `d/8` bytes against `2d` for bf16, a ratio of exactly sixteen, and that
  ratio is exact because the encoder output is a unit vector, so a sign code carries no scale,
  no bias and no per-row side data.
- One bit per coordinate works because of two things: the text towers are trained with a global
  orthogonal regularizer (akram2026jinav5text), and a **randomized Hadamard transform**
  (zandieh2025turboquant) is applied to a row before its signs are taken. The transform is
  orthogonal, so it changes no inner product and therefore no ranking; it only changes the basis
  the signs are taken in.
- **Four bits is the query side, not the store.** Only the stored side is reduced to one bit
  (gao2024rabitq); the rotated query is decomposed into four bit planes, and a Metal kernel scores
  a row as a fixed number of population counts over its code and those planes.
- The coarse tier does not need to be accurate: it only decides which rows enter the shortlist.
  Exact rescoring fixes the order.
- The replica is not unconditional: it is adopted when the exact matrix would claim more than a
  quarter of the memory cap, and past a row count calibrated for accelerator width. A small index
  on a large machine keeps no replica and scans the exact vectors.

The figure caption now states what the figure actually encodes: bar width is bytes per row, bar
height is rows, and the accent marks what one query reads.

### Header alignment
Measured, not eyeballed. Rendered all 36 pages and located the cloud mark's bounding box in the
top strip of each. Slides whose header title is empty (claim, trade, section dividers) had the
mark at y=19 while every titled slide had it at y=22: with no text in the row, the flex row lost
its text line box and the whole header rode up ~3px. Fixed by pinning the header row to a fixed
42px height and line-height. Re-measured: the cloud sits at y=22 on all 35 chromed pages, and a
pixel diff of the cloud region and the logo region between a titled slide and a divider is now
under the antialiasing floor (max 27 and 5 grey levels, zero pixels past threshold).

### The figure image was stale too
`figures/funnel.png` on disk was built 2026-08-04 and still rendered "4-bit replica" with
`d/2 bytes each`. `figures/funnel.tex` was updated 2026-08-12 to "1-bit replica" and `d/8`.
The deck had been shipping the old raster. Rebuilt from the current `.tex`:

```
cd /tmp && mkdir fnl && cd fnl
cat > f5.tex   # article class, paperwidth=20cm paperheight=8cm, tikz + arrows.meta,
               # \input the repo's figures/funnel.tex
/Library/TeX/texbin/pdflatex -interaction=nonstopmode f5.tex
pdftoppm -png -r 400 f5.pdf k     # then autocrop to the ink bbox with Pillow
```
Note: `standalone` document class fails on this machine (its preview hook errors), so the wrapper
uses `article` with a fixed small paper size and the raster is cropped to the ink bounding box.

---

## 8. QR codes (2026-08-15)

Han's personal WeChat QR was supplied directly. Cropped out of the contact card (the avatar,
name and footer text dropped), padded to a square with a quiet zone, and normalised with every
other QR in the deck to **720x720**.

All six decode. Verified with `zbarimg`, not by eye:

| file | decodes to |
| --- | --- |
| `qr-wechat.png` | `https://u.wechat.com/MLfXlZhyqjktXA0BFqc61AA?s=2` |
| `qr-inpage.png` | `github.com/hanxiao/jina-reranker-v3.5-in-page-search` |
| `qr-repo.png` | `github.com/hanxiao/jina-v5-omni-nano-test-time-image-tagging` |
| `qr-dataroom.png` | `github.com/hanxiao/dataroom` |
| `qr-omni.png` | `github.com/hanxiao/omni-macos` |
| `qr-searchbox.png` | `github.com/hanxiao/searchbox` |
| `qr-knowledge-graph.png` | `github.com/hanxiao/knowledge-graph-extractor` |

**Resampling trap, hit and fixed:** rescaling a QR with `Image.LANCZOS` blurs the module edges and
broke `qr-repo.png` outright — it stopped decoding while still looking fine to the eye. Use
`Image.NEAREST` for QR codes, and re-run `zbarimg` on every file after any resize. OpenCV's
`QRCodeDetector` is not a valid check here: it fails on all of these because of the logo in the
centre, so a negative from it means nothing. `zbarimg` reads them.

---

## 9. Reranking section rebuilt (2026-08-15)

Three changes Han asked for, and what each is grounded in.

**Section title.** "最熟的那笔算力：重排" did not parse. Now "重排：最熟悉的 test-time scaling",
which is also the pairing the closing slide lands on.

**Bi-encoder vs listwise, side by side.** The advantage was asserted in prose before; it is now
drawn. Left panel: query and four documents encoded separately, a dashed wall between them
labelled 互不可见, four independent cosines. Right panel: query plus up to 64 documents inside one
131K context box, animated attention arcs between the documents, score read from each document's
last token. The asymmetry is the argument, so it has to be visible, not described. Source for the
mechanism: `~/Documents/jina-reranker-v3/README.md` and arXiv:2509.25085 ("last but not late
interaction", causal self-attention between query and documents within the same context window,
contextual embeddings from the last token of each document, up to 64 documents in 131K).

**The Hadamard rotation is now animated rather than asserted.** Split into its own slide before
the funnel. Two bar charts of the same 32-coordinate unit vector: spiky on the left, flat on the
right. The right one is not drawn by hand, it is the **real Walsh-Hadamard transform** of the left
one computed in the page, so the demo cannot drift from the claim. Verified in node: norm 1.000000
before and after (orthogonality holds, which is why no inner product and no ranking changes), and
peak-to-RMS falls 4.00 to 1.47, which is exactly the "spreading what any one dimension carries
across all of them" the paper describes. Storage side keeps 1 bit per coordinate, query side keeps
four bit planes; that split now has a card each.

The funnel slide keeps the figure and the measured numbers, and picks up the paper's reason for
having no ANN index at all: a graph index at degree 32 stores 256 bytes of links per vector, which
is 0.95 GB at four million chunks, close to three times the matrix a query scans.

---

## 10. The cross-encoder heatmap, reframed positive (2026-08-15)

aie-sf-2026 #20 was still missing. Ported it, and rewrote the reading of it.

The original English slide led with the failure: "Compute helps about half the cells, and
collapses the rest", pooled mean negative at −0.016, deep-pink cells to −0.98. That framing was
right for the paper's honest accounting but it is not what this talk is arguing, and Han's rule
is no negative framing.

What the same grid supports, verified by recomputing from `A.heatmap` rather than repeating the
old caption:

| encoder | seen in discovery | positive cells | best cell |
| --- | --- | --- | --- |
| j-v5-nano | yes | 108/228 (47%) | +0.129 |
| j-v5-small | no | 95/228 (42%) | +0.116 |
| gemma-300m | never | **141/228 (62%)** | +0.143 |
| qwen3-0.6b | never | **141/228 (62%)** | +0.156 |

Totals: 485 of 912 cells positive, and 52 of the 76 task-encoder pairs improve under at least one
program. The headline is the last two columns: the two families that never took part in discovery
have the *highest* share of positive cells. That is the transfer claim, shown per cell.

Colour scale capped at ±0.12 so the per-cell structure is legible; the legend states the cap.

---

## 11. Third reranking example: snippet selection (2026-08-15)

Sources, both read in full:
- `jina-ai/serp-api` README, section 深度搜索：正文级 snippet（`meta=deep`）. Private repo, fetched
  with `gh api repos/jina-ai/serp-api/readme`.
- `jina-ai/MCP` README, section "What is the difference between `search_web` and `search_web_deep`".

**Why it belongs in the reranking section.** `search_web` returns the snippet the engine picked,
about 20 words, often just the head of the page or a keyword-bearing fragment. `search_web_deep`
spends more inference: read each page via Reader, split the body into ~100-word passages at
sentence boundaries, then score **every passage from every page in one listwise
`jina-reranker-v3.5` call**. Same shape as the other two examples: extra inference at query time
buys a better answer, and nothing is retrained.

**The two design points worth a slide each, both from serp-api:**
- *One pooled call, not one per page.* Listwise scores are only comparable inside one context. Per
  page calls give trustworthy within-page order and near-arbitrary cross-page order: measured on 4
  real queries, per-page ordering never matched the pooled ordering (0/4), top-1 matched 2/4,
  Kendall tau 0.00 to 0.33. Pooling also drops the call count from N+1 to 1.
- *Let both snippet kinds compete.* Body extraction sometimes loses to the engine snippet (grabs a
  subheading, picks the question instead of the answer on StackOverflow). So each url enters both
  its body chunks and the raw engine snippet into the same call, highest score wins,
  `snippet_source` reports which. Same call, so no threshold is needed.

**Perf numbers pulled from the deck (2026-08-16).** Han cut every latency/throughput KPI box: the
143 ms vs 4194 ms slide is gone entirely, and the 271 ms / 0 index, +1.3 ms / 0.847 / 32-frame boxes
were removed from their slides. Reason: a macro talk, no audience appetite for isolated latency
numbers, and without a reference point they carry no meaning. The measurements below stay recorded
here as provenance, but must not be put back on a slide without asking.

**Numbers used, each with its condition:**
| number | condition |
| --- | --- |
| 143 ms vs 4194 ms (~29x) | median for one call over a 53-chunk page, jina-reranker-v3.5 vs jina-reranker-v2-base-multilingual |
| 72% | body chunk wins, among the 18 pairs where the two snippets actually differed |
| 36% | share of chunks discarded on one Chinese Wikipedia page when splitting by fixed sentence count; size-based splitting restores sentence coverage to 100% |
| 0.471-0.889 vs 0.480-0.742 | body-wins vs body-loses score ranges over 30 real (query, url) pairs, nearly fully overlapping, which is why there is no threshold constant |

Section order is now: 1-bit scan into exact rescoring, then listwise reranking (with in-page
search as its limit case), then snippet selection.

**Slide layout (2026-08-16).** Left is a real Google SERP for `tencent elastic` (`img/serp-google.jpg`,
captured from the live page at 820px width, `udm=14` so no AI Overview), so the audience sees what an
engine snippet actually is. Right is the `meta=deep` pipeline as a six-step waterfall taken from the
serp-api README: 01 take SERP candidates (`read_num=20`), 02 Reader reads bodies concurrently
(dispatched on demand, no barrier), 03 split at sentence boundaries (100 words, overlap 25), 04 all
chunks from all pages plus the engine snippet enter one candidate pool, 05 one listwise
`jina-reranker-v3.5` call (143 ms), 06 each url keeps its highest-scoring chunk. Steps 02-05 sit
inside a dashed cyan marching box labelled TEST-TIME COMPUTE, which is the whole point of the slide.

---

## 12. Tagger pipeline and scoring equation (2026-08-15)

Replaced the hand-written four-step list with the two slides Han pointed at:
`ttc-embedding-image-tagging-2026` #7 (pipeline) and #13 (the scoring function).

**#7, the two-lane pipeline.** Offline lane: tokenizer vocab 128,260 → encode_text with the same
frozen tower → label matrix E (128,260 × 768), plus the background prior μ from neutral images and
the word-start gate down to 25,465 words. Per-image lane: one frozen forward → P, g → score
against E → subtract μ → gate + NMS → top-k. The dashed connectors from the offline lane down into
the per-image lane are ported too, since they carry the point that the expensive part is done once.
The B box (14 crops, per-label max, weight 1.3) hangs off the scoring step.

**#13, the scoring function.** This is the slide that makes the whole method auditable, which is
why it is worth a page:

S(ℓ) = 0.3(⟨g,e_ℓ⟩ − μᵍ_ℓ) + 0.7(max_p⟨p,e_ℓ⟩ − μ_ℓ) + 1.3(max_c s_ℓ(crop_c) − μ_ℓ)

with the three terms labelled global context / patch evidence (A, free, +0.371 mAP) / multi-crop
re-encode (B, 14 forwards, +0.075 mAP), then word-gated vocabulary → embedding-NMS (τ=0.6) → top-k.
No head, no logits, no learned threshold: three fixed weights, two background priors, and max
operations over frozen-model outputs.

Both were restyled for the dark template (the source deck is on a white Elastic palette): boxes
become dark panels with cyan/green accents, the A and B badges keep their meaning across the deck.

---

## 13. Full STYLE.md pass over all 44 slides (2026-08-15)

Re-read STYLE.md, then audited every line of copy. 40 edits. What was actually wrong:

**Process narrative (§4.1).** "能走多远，我们让 agent 搜了一遍" narrated the exploration instead
of stating the result; now it gives the number (域内 ΔnDCG@10 爬 0.17). Divider 06 read
"这几个项目跑完，我更相信这个判断了", a diary line, now "四块地方，同一笔账". Slide 25 ended with
"下面几页逐个看…", pure navigation, now states the two measured contributions.

**Riddle metaphors (§2.2).** "会重新变得有事可做" → "这条轴上还有大量空间，而它跟模型规模无关".
"往系统里灌进了新东西" → "让模型读到了上一步没读到的信息". "走到了原本得换模型才够得着的位置" →
names what it matches. "说了算的裁判" → "评测基准".

**Casual idiom (§2.4).** 拖下水 → 让任务退步; 弄坏 → 退步; 怪癖 → 特有性质; 拉满 → 做满;
捞出 → 取出; 伸手去拿 → 最先调用; 会挂掉 → 可能失效; 白花 → 回报差很多; 顺手 → 共用一次计算;
逼 agent → 让 agent; 拍脑袋 → removed; 攒料/干活 → 收集材料/执行.

**Vague or dangling (§2.1, §3).** "起点" → "最省算力的做法"; "得换一个多向量模型" → "需要专门的
多向量模型"; "停止条件看的是覆盖够不够，不是钱花完没有" → "覆盖度达标，而不是预算耗尽".

**A number that went missing.** Removing the three KPI blocks from the bi-encoder slide (as asked)
also removed the only hard evidence in the reranking section. BEIR 61.94 vs 56.51 vs 56.28 is now
one sentence under the diagram, which keeps the page uncluttered and keeps the claim grounded.
Re-checked every other figure is still present after the edit pass.
