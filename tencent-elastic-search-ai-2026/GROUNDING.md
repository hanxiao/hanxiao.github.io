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
