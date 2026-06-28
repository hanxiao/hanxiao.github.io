/* Speaker notes for aie-sf-2026. window.NOTES[i] = {n, title, sec, note}
   sec = per-slide delivery budget (seconds, INCLUDING deliberate pauses on visual slides).
   Sum ~19:17. Spoken-only is shorter (~17 min fast); the buffer is pause time - use the
   pace meter and slow down on the chart slides so you don't finish early. v2 (post-review). */
window.NOTES = [
{n:1, sec:35, title:"Title",
note:`Hi everyone, I'm Han Xiao, VP of AI at Elastic. This talk asks a stubborn little question: can a small retrieval model get better just by working harder at inference, the way large models lean on test-time compute? The answer is a qualified yes - it can, but through cheap structure, not the raw extra compute you'd reach for. I'll show you two ways to do it: an autoresearch loop over a frozen encoder - that's the embedding geometry and the loop - and then an agent composing search tools. Let's get into it.`},

{n:2, sec:40, title:"Test-time compute, defined",
note:`First, what test-time compute even is. Simple idea: instead of training a bigger model, you spend more compute at inference and get a better answer. Best-of-n, self-consistency, a verifier reranking candidates. Noam Brown put a number on it: a poker bot thinking for twenty seconds got the same boost as scaling the model a hundred thousand times. That's the promise. And the whole talk is one question: does that promise hold for retrieval?`},

{n:3, sec:35, title:"The reframe: search is test-time compute",
note:`Here's the reframe that makes it a retrieval talk. Search is already test-time compute. When you assemble a pipeline - trained embeddings, a reranker, a multi-vector retriever, query expansion - you're spending inference to buy relevance. You're not reaching for a bigger model, you're assembling more search at test time. So the real question isn't whether your model is big enough. It's how much search pipeline you assemble at inference, and whether it actually pays off.`},

{n:4, sec:40, title:"Two interpretations",
note:`There are two ways to manufacture that pipeline, and I'll show you both. Interpretation A, the core of the paper: an agentic loop writes programs over one frozen encoder - things like chunking, z-scoring, fusing channels, feeding results back - multi-pass embedding algebra. Interpretation B, later: a small agent wires retrieval tools - grep, embed, rerank - over a corpus under a budget. Same move at two altitudes. Let's start with A.`},

{n:5, sec:38, title:"Small models are distilled from LLMs",
note:`A runs over a small, frozen embedder - and the common belief is that small models have nothing to gain from test-time compute, that it belongs to the big reasoning models. But look at where today's embedders come from: E5-Mistral, Qwen3-Embed, EmbeddingGemma, our own jina-v5. They're all distilled or adapted from LLM backbones. That's the dominant recipe now, not the exception. So if test-time compute lives in the LLM's representation space, these distilled encoders should inherit it. Do they?`},

{n:6, sec:40, title:"The scoring spectrum",
note:`Here's the intuition for how a frozen model could gain. Scoring runs along a spectrum. On the left, a single cosine - one vector per document, the frozen baseline. On the right, ColBERT-style late interaction - every query token against every doc token, but that needs a multi-vector model you don't have. The middle is the interesting part: take the same frozen encoder, split the document into sentences, and max over them. That's test-time structure - you climb toward late interaction with no new model, just more work over the vectors you already have.`},

{n:7, sec:35, title:"The strict question",
note:`So let's make the question strict. How much can a frozen single-vector encoder gain at inference alone? And I mean strict: no retraining, no auxiliary model, no learned parameters, one frozen encoder API. The popular test-time methods all break one of these - HyDE puts an LLM in the query path, GQR adds a second retriever, MetaEmbed trains parameters at deployment. We forbid all three, and ask whether the gain scales with the compute you spend.`},

{n:8, sec:40, title:"Autoresearch",
note:`How do we search that space? Autoresearch. Instead of me hand-designing programs, an agent runs the research loop itself: change one file, run a short fixed-budget experiment, keep the change if the metric improved, otherwise revert - and repeat, overnight. It's hill-climbing, with an LLM as the mutation function. Karpathy described the same shift: you're not editing Python like a researcher, you're programming the markdown files that set up an autonomous research org. That loop generated everything you're about to see.`},

{n:9, sec:40, title:"The method loop",
note:`Here's the loop in one picture. A proposer - an LLM agent - writes a program over the frozen encoder. A harness scores it on a fixed task set. Memory logs the result, and that log conditions the next proposal. The registry collects everything: 144 programs over 144 generations. The key property is the feedback - memory conditions the next program, so each round builds on the last. Let me walk the four pieces quickly; a couple of them have a catch that bites later in the results.`},

{n:10, sec:35, title:"Proposer",
note:`One, the proposer. It's Opus 4.6, used purely as a mutation function: it reads the current best program and the memory ledger, edits one Python program, proposes the next. No human in the inner loop. The gotcha: it optimizes exactly the metric you hand it, not the one you mean. Reward the in-domain mean, reward spending compute, and that's exactly what it will chase. Whether the gain survives out of domain is a completely separate question. Hold that thought.`},

{n:11, sec:35, title:"Program",
note:`Two, the program. Arbitrary Python over the encoder, and the one primitive that matters is embed_fn - that's the test-time-compute budget. Every embed_fn call re-embeds text, switches a LoRA adapter, picks a Matryoshka dimension. One call is one unit of compute. And there are taboos: no hyperparameters, no task routing, no external models, no learned parameters. Those taboos force task-agnostic structure instead of a per-task tuned config.`},

{n:12, sec:38, title:"Evaluator",
note:`Three, the evaluator. Every program runs on the same fourteen MMTEB discovery tasks - legal, financial, long-document, general. We score delta-nDCG against the cosine baseline, plus a cost ratio I'll define in a minute. Same fixed budget every generation. And here's the catch that is the whole experiment: the loop only ever sees these fourteen. Nineteen more tasks are held out and never enter the loop. So a program can win in-domain and still fail out of domain - and that gap is the entire point.`},

{n:13, sec:30, title:"Memory",
note:`Four, memory. A JSONL ledger, one row per program - scores, cost, parent, a lesson - and the proposer reads it before each round, so the search compounds. But compounding cuts both ways: it builds on real wins, and it compounds whatever bias the objective has. A biased metric doesn't mislead one program, it steers the whole lineage.`},

{n:14, sec:42, title:"Setup",
note:`Now the rules of the game, because they decide everything. Same fourteen discovery tasks from the evaluator slide - what's new here is the model axis. We search on one encoder, jina-v5-nano, 239 million parameters. Everything else is held out: a bigger same-family model, and crucially two unseen families - Gemma and Qwen - that share no training data or tokenizer with the discovery model. Plus those nineteen evaluation tasks the loop never sees. The metric is delta-nDCG at ten versus cosine. One program is discovered here, and it has to generalize to all of it.`},

{n:15, sec:50, title:"The distinction: cost = extra forward passes",
note:`Before any result, the most important distinction in the talk - and it's one number. Cost, c, is just the number of extra forward passes through the encoder. Take two real programs that do the same move - mix neighbor information into the query and re-score. SoftCentroid averages the top document vectors you already computed - zero extra forward passes, c equals one. FirstSent re-embeds the first sentence of the top document - that's a new forward pass, c greater than one. One reuses geometry you already have; the other spends compute on new text. The whole question is which one converts into quality that actually transfers.`},

{n:16, sec:35, title:"Two admission rules",
note:`We run that same loop under two admission rules. The first, compute-spending, admits a program if its in-domain mean beats every prior one; it's actively encouraged to spend more inference. The second, transfer-selecting, admits only if an internal validation split improves with nothing regressing - no reward for spending compute. And to be clear: neither search ever touches the nineteen final evaluation tasks or the unseen encoders. Two objectives, same loop. Let's see what each one finds.`},

{n:17, sec:38, title:"In-search Pareto",
note:`Start with compute-spending. Told to spend compute, the search draws a beautiful, clean Pareto curve. 144 programs, twelve Pareto-optimal, cost from 1.2 to 14.7 times. In-search mean climbs from plus 0.07 to plus 0.24. This looks exactly like test-time-compute scaling - more compute, more quality. If I stopped here, you'd be sold. But this is in-search only. Quick look at the twelve programs, then we run them on held-out data - and that's where it turns.`},

{n:18, sec:25, title:"The twelve programs",
note:`Here are those twelve, drawn as little diagrams. Don't read each one - the point is they're all training-free recombinations of the same frozen vectors: chunking, z-scoring, feedback, fusion. Cost climbs left to right, 1.2 up to 14.7. It looks like a clean compute-scaling story. The gains do not.`},

{n:19, sec:55, title:"The money chart (held-out)",
note:`This is the money chart - the spine of the talk. We take all twelve compute programs and run them on the held-out evaluation, including encoders the search never optimized for. The pink line is that compute-spending frontier. It's flat. Its pooled mean is actually negative, minus 0.016, and its worst per-query case collapses all the way to minus 0.98. So all that compute - up to 14.7 times - buys nothing out of domain, and sometimes does real harm. Now look at the transfer-selecting program: it sits at c equals one, zero extra forward passes, and it already beats the most expensive 14.7-times program. So more compute did not transfer. Cheap structure did. That's the result; everything after this just explains it.`},

{n:20, sec:42, title:"Heatmap",
note:`Why is that mean flat? Here's the texture behind it - every single cell. Four encoders, three of them never seen during the search, by twelve programs by nineteen tasks. And it's not that compute does nothing everywhere: about half the cells are green, 485 of 912, and most task-encoder pairs improve under some program. But the deep-pink cells fall to minus 0.98, and those collapses drag the pooled mean negative. So flat-on-average is not harmless - it's real wins cancelled by catastrophic failures, and you can't know in advance which task will collapse.`},

{n:21, sec:40, title:"Transfer-selecting frontier",
note:`Now the other objective. The transfer-selecting rule admits a different six programs - not the twelve compute ones, and all at most 1.5 times. And it wins two ways. First, a much higher win-rate: 83 percent across the held-out set, versus about half for compute. And second, the part that really matters - it never nets negative on a single task, zero losing task-cells, and even its worst individual query only dips to minus 0.1, versus compute's minus 0.98 collapse. That's nearly ten times tighter. Transfer is mostly about not failing catastrophically.`},

{n:22, sec:40, title:"It transfers across encoders and languages",
note:`And it genuinely transfers. Discovered only on jina-nano, the mean gains are positive on all four encoders - and largest on the two families never seen during discovery, Gemma and Qwen. On the jina encoders the median sits near zero, so this is a positive tail, not a broad lift - but it follows general embedding geometry, not artifacts of the discovery model. It even survives a language switch it never searched on: applied unmodified to French and Greek, median plus 0.016, an 86 percent win-rate, every held-out cell positive on Gemma.`},

{n:23, sec:40, title:"Structure vs a learned head",
note:`The obvious objection: why not just train a head? So we did - matched budget, same fourteen tasks, a linear, low-rank, or MLP head. In-domain it looks great, plus 0.20 to 0.25. But on every held-out encoder it falls below baseline. That's the seductive in-domain win that does not transfer. The reference line is what real transfer looks like - structure, plus 0.018 on Gemma. Adding parameters at the same data budget memorizes. Recombining the frozen geometry generalizes.`},

{n:24, sec:40, title:"Rediscoveries: classical IR",
note:`So what is the structure that transfers? When you read the winning programs, they're not new - the search keeps re-deriving classical IR in embedding space. Reciprocal Rank Fusion, Fisher's discriminant, Rocchio feedback, sentence-level MaxSim. Two it rediscovered cold, two it operationalized from a seed. And that's exactly why they transfer: they're geometric - z-scoring, sub-document granularity, centroid feedback - they depend on cosine geometry, not on any one model's training. So the cheap forms carry to encoders we never touched. Fifty years of IR, re-derived by an agent overnight.`},

{n:25, sec:45, title:"The trend (2025 to 2026)",
note:`That's Interpretation A: a frozen encoder, where cheap structure transfers and raw compute doesn't. Now zoom out - because the same move, assemble a pipeline at inference instead of growing the model, is showing up one altitude up, in deep research and long-horizon agents. In 2025 it was one web-bound loop: search, read, reason, all over the web. In 2026 it's splitting in two - a research phase that hits the web and builds a local corpus, a dataroom, and an execution phase that runs offline against it. That two-tier split, dataroom then searchbox, is Interpretation B, and it's built from three small tools.`},

{n:26, sec:42, title:"dataroom",
note:`Stage one, dataroom. Give it a token budget and it spends it on local small models instead of a frontier model - search, read, write, repeat - until the knowledge is dumped into one cited zip. That dump is the open web distilled down to a small local corpus a machine can actually consume. And notice the economy: you build the corpus with cheap local tokens, and save the expensive frontier budget for the execution that actually needs it. It stops on an outcome - a coverage floor - not a fixed token count. That grounded zip goes to stage two.`},

{n:27, sec:42, title:"searchbox",
note:`Stage two, searchbox - the testbed for the whole search-is-test-time-compute idea, made airgapped on purpose. Lock an agent in a box with one zip dataroom and no web, and it can only answer by composing its own pipeline from local tools: grep, embed, rerank, cluster, select-diverse. Nothing leaks in. Now I can ask the real questions. Which tool does it reach for first? Is grep all you need - or does a dense retriever actually earn its place? And does forcing more token budget, scaling test-time compute, help on the hard ones? Those are open - searchbox is how we find out.`},

{n:28, sec:40, title:"knowledge-graph",
note:`And how do you even evaluate that? You need hard questions - that's the third tool, knowledge-graph. Trivial questions teach you nothing: if one grep finds the answer, every method scores the same. So we turn the corpus into a knowledge graph - every fact a subject-predicate-object edge - and walk its longest paths. Those chains become multi-hop questions no single passage answers; the agent has to actually search to connect the facts. It's a private, corpus-grounded verifier, grown from the same corpus searchbox is locked inside.`},

{n:29, sec:35, title:"Synthesis",
note:`So connect the dots. Both interpretations do the same thing - they manufacture a search pipeline at test time, and neither one grows the model. In A, the pipeline is multi-pass embedding algebra, and what scales is structure, not forward passes. In B, the pipeline is a chain of retrieval tools - you compose tools instead of adding parameters - and whether scaling that compute actually pays off is exactly what searchbox is built to test. Different altitudes, same move.`},

{n:30, sec:25, title:"Close",
note:`So here's the one line I'll leave you with: information retrieval is test-time compute. Don't reach for a bigger model - assemble more search at inference. The paper, the three tools, and these slides are all behind the codes up here. Thank you - and I'd love to take your questions.`},
];
