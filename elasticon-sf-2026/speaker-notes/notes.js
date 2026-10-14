/* Speaker notes for elasticon-sf-2026 ("Search is test-time compute", ElasticON AI San Francisco, Nov 4 2026).
   window.NOTES[i] = {n, title, sec, note}. Exactly one entry per slide, keep 1:1 with ../index.html.
   Annotations: line break = breathe   *word* = stress   // = a longer beat.   No dashes. Total sec = 1680 (28 min). */
window.NOTES = [
   { n: 1, sec: 40, title: "Search is test-time compute",
     note: `Good morning, everyone, and thanks for coming.
My name is Han Xiao, I run AI at Elastic.
Today I want to convince you of one simple idea.
Search *is* test-time compute.
I will show four small demos, all training-free.
And if you want the slides, scan the code in the corner. //` },

   { n: 2, sec: 30, title: "Training harder",
     note: `For most of its history, search got better by *training harder*.
Bigger encoders, cleaner data, faster indexes, stronger rerankers.
All of that happens *before* the user types anything.` },

   { n: 3, sec: 50, title: "The second axis",
     note: `Then large language models found a *second axis*.
Instead of a bigger model, you let the same model do more work per query.
You spend compute at inference, and quality climbs along a smooth curve.
Noam Brown put it nicely for poker.
Twenty seconds of thinking gave the same boost as scaling the model a hundred thousand times.
That is test-time scaling. //` },

   { n: 4, sec: 35, title: "Search lives on that axis",
     note: `Here is the fun part.
Search has *always* lived on that axis.
Embed, retrieve, rerank, expand, fuse.
None of it is training. All of it runs after the user presses Enter.
So the question is not whether search uses test-time compute.
It is where to spend it. //` },

   { n: 5, sec: 45, title: "Four demos",
     note: `I will walk through four demos.
One, an LLM writes retrieval programs over a frozen encoder, and some of them transfer.
Two, a frozen retrieval model becomes an image tagger.
Three, one reranker call over a page replaces the whole index.
Four, an agent builds its own search pipeline, per query.
No training anywhere.` },

   { n: 6, sec: 60, title: "Three ways to spend compute",
     note: `Before the demos, a small map.
On a frozen model there are three ways to spend compute.
*A*, a deeper pass. Read more of what you already computed, every token or patch, not only the pooled vector.
*B*, more passes. Run the encoder again on new views, a crop, a sentence.
*C*, calibration. Transform the vectors you already have.
The weights are identical in all three.
What differs is whether *new information* enters. //
Keep this in mind, it comes back at the end.` },

   { n: 7, sec: 10, title: "Section 01",
     note: `Demo one. Programs on a frozen encoder.` },

   { n: 8, sec: 40, title: "Distilled embedders",
     note: `People say test-time compute belongs to big reasoning models.
But look at today's small embedders.
E5 and NV-Embed come from Mistral, jina-embeddings-v5 from Qwen3, EmbeddingGemma from Gemma.
They are distilled from LLMs.
So maybe they inherit the same ability.
We first asked this in December 2024 on the Jina blog.` },

   { n: 9, sec: 45, title: "Scoring spectrum",
     note: `On the left, plain cosine. One vector per document.
On the right, ColBERT, which needs a multi-vector model.
In the middle is the trick.
Same single-vector encoder, but split the document into sentences and keep the best match.
That is test-time compute on a model you already have.
Our rules were strict. No external LLM, no second retriever, no learned parameters.` },

   { n: 10, sec: 55, title: "The loop",
     note: `So we let an agent do the research.
Opus 4.6 writes one Python program over the frozen jina-embeddings-v5-nano.
An evaluator scores it on 14 retrieval tasks.
The result goes into a memory file, and the memory conditions the next program.
Keep it if it improves, revert if not.
This is autoresearch.
After 144 rounds we have 144 scored programs.
Anything that smuggles in hyperparameters or a learned model is rejected automatically.` },

   { n: 11, sec: 40, title: "Setup",
     note: `The setup matters.
The loop only ever sees one encoder and 14 tasks.
We test on 19 *other* tasks and three other encoders.
One from the same family, and two families it has never seen, Gemma and Qwen.
That is the real test of whether a program generalizes.` },

   { n: 12, sec: 40, title: "Pareto curve",
     note: `First we told the loop to spend compute.
And it does exactly what you hope.
A clean Pareto curve, from plus 0.07 to plus 0.24 mean nDCG improvement.
It looks just like test-time scaling in LLMs.
But these are in-search numbers.
The held-out test comes next. //` },

   { n: 13, sec: 30, title: "Twelve programs",
     note: `These are the twelve programs on that frontier.
Z-scoring, sentence MaxSim, rank fusion, Rocchio, graph centrality.
All of them recombine the same frozen vectors.
The cost goes from 1.2 to 14.7 times the baseline.` },

   { n: 14, sec: 55, title: "Held-out",
     note: `Now the held-out encoders.
The pink line is the compute search.
Its median never goes above plus 0.003, no matter how much you spend.
The blue dots are a second search I will explain in a moment.
The best one costs *nothing* extra, c equals one.
And it beats the program that spends 14.7 times the compute. //
Compute alone did not transfer.` },

   { n: 15, sec: 45, title: "Heatmap",
     note: `Here is every cell.
Twelve programs, nineteen tasks, four encoders.
About half the cells improve, 485 of 912.
But look at the deep pink ones. The worst falls to minus 0.98.
So the pooled mean is minus 0.016.
Spending compute helps often, and when it fails, it fails hard.` },

   { n: 16, sec: 55, title: "Transfer search",
     note: `So we changed the rubric.
A program is admitted only if a held-out validation split improves,
and no single task gets worse by more than 0.05.
Six programs pass, and all of them are cheap, 1.5 times or less.
Their gains are largest on the families the search never saw.
Transpose-Consensus never loses a task.
And on French and Greek, unmodified, the median is plus 0.016 with an 86 percent win rate. //` },

   { n: 17, sec: 40, title: "Learned head",
     note: `A fair question. Why not just train a small head on the same data?
We tried linear, low-rank and MLP heads.
In-domain they look great, plus 0.20 to plus 0.25.
On every held-out encoder they fall *below* baseline.
They memorize. Structure transfers.` },

   { n: 18, sec: 45, title: "Classical IR",
     note: `What did the search actually find?
Classical information retrieval, re-derived in embedding space.
Reciprocal rank fusion and Fisher's discriminant appeared without any seed.
Rocchio feedback and sentence MaxSim grew out of seeded ideas.
They all rely on cosine geometry, which every encoder shares.
That is why they carry over.` },

   { n: 19, sec: 10, title: "Section 02",
     note: `Demo two. A retrieval model tags images.` },

   { n: 20, sec: 40, title: "Tags for free",
     note: `These tags come from an embedding model.
No training, no second model, no dictionary, no part-of-speech tagger.
Every tag here is verbatim output.
Some are in other languages, because the label set is the model's own vocabulary.` },

   { n: 21, sec: 40, title: "One space",
     note: `The model is jina-embeddings-v5-omni-nano, about one billion parameters.
Images and text land in the same 768-dimensional space.
It is a retrieval encoder. It has no tagging head and was never trained to tag.
But because both paths share one space, any patch can be scored against any word.` },

   { n: 22, sec: 50, title: "The tagger",
     note: `Here is the whole tagger.
Offline, we encode all 128,260 tokens of the tokenizer once. That is the label matrix.
We estimate a background prior and gate to 25,465 whole words.
Per image, one forward pass gives patches and a global vector.
Score, subtract the prior, deduplicate, take the top tags.
Every box is either the frozen model or plain arithmetic.` },

   { n: 23, sec: 40, title: "Score every patch",
     note: `This is lever A, the deeper pass.
The pooled vector is dominated by the biggest object.
But the patch vectors are already in the forward pass.
Let each label keep its best patch, like ColBERT.
mAP goes from 0.264 to 0.635. *For free.*` },

   { n: 24, sec: 40, title: "Per-label prior",
     note: `Some words, like bed or cat, sit close to every image.
So we compare each label with its own prior, estimated once from neutral images.
No calibration set, no labels.
A word-start gate keeps whole words,
and embedding NMS merges cat, kitty and its Russian twin into one tag.` },

   { n: 25, sec: 40, title: "Crops",
     note: `This is lever B, more passes.
We run 14 crops through the same model.
A small object fills its own crop, so weak evidence becomes strong.
mAP goes from 0.635 to 0.710 for 14 times the passes.
One pass reads wolf. With crops, it reads bear.` },

   { n: 26, sec: 45, title: "The ladder",
     note: `Put it together.
Reading more of the pass gives the big step.
Re-encoding new views gives the next one, at higher latency.
And down at the bottom, the calibration methods.
Same 75 milliseconds as the patch pipeline, and they collapse.` },

   { n: 27, sec: 50, title: "Calibration levers",
     note: `This is lever C.
The recent training-free literature bets heavily on calibration.
Optimal transport, label propagation, whitening, Bayesian priors.
We implemented them on this encoder.
The open circle is the pipeline each lever starts from, the filled dot is where it ends.
The crops gain. Everything in the calibration group is flat or collapses. //` },

   { n: 28, sec: 25, title: "Only new information",
     note: `So the lesson of demo two.
Only *new information* moves accuracy.
Calibration rearranges what the model has already seen.
Patches and crops give it more to look at.` },

   { n: 29, sec: 40, title: "Omni",
     note: `And it ships.
In Omni, our on-device search app, tagging reuses the patch rows of the embedding pass.
About 0.6 milliseconds per image, roughly 4 percent of the embed step.
The prior calibrates itself on the first 64 images.
Tags become snippets, so photos, video and scanned PDFs become searchable by keyword.` },

   { n: 30, sec: 10, title: "Section 03",
     note: `Demo three. One call replaces an index.` },

   { n: 31, sec: 55, title: "Listwise",
     note: `A bi-encoder scores every document alone.
Each vector was computed before the other documents existed.
A listwise reranker puts the query and up to 64 documents into one context.
The candidates see each other before they are scored.
jina-reranker-v3 does this at 0.6 billion parameters.
On BEIR it scores 61.94, against about 56 for two strong rerankers of the same size. //
Same size. The gain comes from extra compute across candidates.` },

   { n: 32, sec: 45, title: "Drop the index",
     note: `Now push that further.
An index pays off over many queries.
But a web page lives for one visit.
So skip chunking, embedding and indexing, and run one listwise pass over the whole page.
jina-reranker-v3.5 does a 53-chunk page in 143 milliseconds.
The answer is highlighted right in the page.` },

   { n: 33, sec: 45, title: "search_web_deep",
     note: `Same idea for web search.
The engine gives you a 20-word snippet. Sometimes that is not enough.
search_web_deep reads the top 20 pages, chunks them,
and reranks every chunk and snippet in one listwise call.
Then it keeps the best chunk per URL.
That is extra inference, spent at query time, where it matters.` },

   { n: 34, sec: 10, title: "Section 04",
     note: `Demo four. An agent builds the pipeline.` },

   { n: 35, sec: 50, title: "Long-horizon agents",
     note: `In 2025, deep research was one loop. Search, read, reason, until the budget runs out.
In 2026, long-horizon agents split the work.
First research, with web access, to build a corpus.
Then an offline agent loop that works from that corpus.
Research and execution want different tokens.
Use cheap local tokens to build the corpus, and save frontier tokens for the work that needs them.` },

   { n: 36, sec: 40, title: "dataroom",
     note: `dataroom is the first half.
A local model searches, reads and writes in a loop,
until the knowledge sits in one cited zip file.
It stops when coverage is good enough, not after a fixed number of tokens.
The zip goes to searchbox, or to a frontier model.` },

   { n: 37, sec: 40, title: "searchbox",
     note: `searchbox is the second half.
We lock an agent in with one dataroom and no web.
It can only answer by composing its own pipeline from local tools.
Grep, embed, rerank, cluster.
And we get to ask real questions. Which tool comes first? When does grep win? Does more budget help?` },

   { n: 38, sec: 40, title: "knowledge-graph",
     note: `To measure any of this you need hard questions.
If one grep finds the answer, every method looks the same.
So we turn the corpus into a graph, walk two or three hops, and hide the bridge.
A question stays only if a closed-book model fails and a retrieval agent succeeds.
That gives us a private verifier.` },

   { n: 39, sec: 60, title: "What the demos share",
     note: `So what do the four demos share?
All of them are training-free. Same frozen models.
Compute buys quality. Programs, a tagger, an index replaced by one call.
But it converts only when *new information* enters. Patches and crops, yes. Calibration, no.
And always check out of domain.
Plus 0.24 in search became minus 0.016 on held-out tasks. //` },

   { n: 40, sec: 60, title: "Elasticsearch",
     note: `Here is how this maps to Elasticsearch today.
Fuse rankings with the rrf retriever. The program search rediscovered exactly that.
Rerank the top hits with the text similarity reranker, and let the candidates see each other.
With semantic text chunking, rank by the best chunk instead of one pooled vector.
And give your agents a budget and a private multi-hop eval before you give them more tokens.` },

   { n: 41, sec: 25, title: "Closing",
     note: `So, to close.
Search has always been test-time compute.
Spend it where *new information* enters. //` },

   { n: 42, sec: 20, title: "Thank you",
     note: `Thank you.
The paper is on arXiv, and the slides are at the QR code.
Happy to take questions.` }
];
