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
