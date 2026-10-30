/* Speaker notes for elasticon-sf-2026 ("Search is test-time compute", ElasticON AI San Francisco, Nov 4 2026).
   window.NOTES[i] = {n, title, sec, note}. Exactly one entry per slide, keep 1:1 with ../index.html.
   Annotations: line break = breathe   *word* = stress   // = a longer beat.   No dashes. Total sec = 1680 (28 min). */
window.NOTES = [
   { n: 1, sec: 30, title: "Search is test-time compute",
     note: `Good morning, everyone, and thanks for coming.
My name is Han Xiao, I run AI at Elastic.
Search *is* test-time compute.
I will show four small demos, all training-free. //` },

   { n: 2, sec: 30, title: "Training harder",
     note: `For most of its history, search got better by *training harder*.
Bigger encoders, cleaner data, faster indexes and stronger rerankers.
All of that happens *before* the first query.` },

   { n: 3, sec: 45, title: "The second axis",
     note: `Then large language models found a *second axis*.
You keep the model and let it do more work per query.
You spend compute at inference, and quality climbs along a smooth curve.
Noam Brown put it nicely for poker.
Twenty seconds of thinking gave the same boost as scaling the model a hundred thousand times. //` },

   { n: 4, sec: 35, title: "Search lives on that axis",
     note: `Here is the fun part.
Search has *always* lived on that axis.
Embed, retrieve, rerank, expand, fuse.
All of it runs after the user presses Enter.
So the real question is where to spend it. //` },

   { n: 5, sec: 35, title: "A currency, not a KPI",
     note: `So what changes when you think this way?
Until now, inference time was a *KPI*.
A latency number in the SLA, a line you stay under.
If you wanted better accuracy, you needed a bigger model.
In this talk, inference time is a *currency*.
Keep the weights, and raise the budget from 10 to 100 milliseconds.
What does it buy? //
Two things.
Relevance, the same task ranked better.
And a new capability, tasks the model was never trained for.` },

   { n: 6, sec: 45, title: "Four demos",
     note: `I will walk through four demos.
One, score functions that get higher relevance from the same frozen encoder.
Two, a tagger that annotates photos with any words.
Three, a reranker that highlights the passages that match.
Four, an agent that builds small search pipelines and reuses them in long-horizon tasks.
No training anywhere.` },

   { n: 7, sec: 50, title: "Three ways to spend compute",
     note: `On a frozen model there are three ways to spend compute.
*A*, a deeper pass. Read every token or patch vector of the pass you already ran.
*B*, more passes. Run the encoder again on new views, such as a sentence or a crop.
*C*, calibration. Move the vectors you already have toward a global prior.
All three keep the weights fixed.
They differ in where *new information* comes from. //` },

   { n: 8, sec: 10, title: "Section 01",
     note: `Demo one. Score functions on a frozen encoder.` },

   { n: 9, sec: 45, title: "Scoring spectrum",
     note: `On the left, plain cosine. One vector per document.
On the right, ColBERT, which needs a multi-vector model.
In the middle is the trick.
Same single-vector encoder, but split the document into sentences and keep the best match.
That is test-time compute on a model you already have.` },

   { n: 10, sec: 50, title: "The loop",
     note: `So we let an agent do the research.
Opus 4.6 writes one Python score function over the frozen jina-embeddings-v5-nano.
An evaluator scores it on 14 retrieval tasks.
The result goes into a memory file, and the memory conditions the next score function.
Keep it if it improves, revert if not.
After 144 rounds we have 144 scored functions.
Anything that smuggles in hyperparameters or a learned model is rejected automatically.` },

   { n: 11, sec: 40, title: "Setup",
     note: `The setup matters.
The loop only ever sees one encoder and 14 tasks.
We test on 19 *other* tasks and three other encoders.
One from the same family, and two families it has never seen, Gemma and Qwen.
That is the real test of whether a score function generalizes.` },

   { n: 12, sec: 40, title: "Pareto curve",
     note: `First we told the loop to spend compute.
Cosine is the baseline, at the origin.
Each dot is one of 144 score functions, in order of cost.
And it does exactly what you hope.
A clean Pareto curve, 12 functions, from plus 0.07 to plus 0.24 mean nDCG improvement.
It looks just like test-time scaling in LLMs.
But these are in-search numbers.
The held-out test comes next. //` },

   { n: 13, sec: 45, title: "Heatmap",
     note: `Here is every cell.
Twelve score functions, nineteen tasks, four encoders.
About half the cells improve, 485 of 912.
But look at the deep pink ones. The worst falls to minus 0.98.
So the pooled mean is minus 0.016.
Spending compute helps often, and when it fails, it fails hard.` },

   { n: 14, sec: 45, title: "Classical IR",
     note: `What did the search actually find?
Classical information retrieval, re-derived in embedding space.
Reciprocal rank fusion and the Fisher discriminant appeared without any seed.
Rocchio feedback and sentence MaxSim grew out of seeded ideas.
They all rely on cosine geometry, which every encoder shares.
That is why they carry over.` },

   { n: 15, sec: 10, title: "Section 02",
     note: `Demo two. A retrieval model tags images.` },

   { n: 16, sec: 50, title: "Tags for free",
     note: `These tags come from an embedding model.
No training, no second model, no dictionary, no part-of-speech tagger.
Every tag here is verbatim output.
Some are in other languages, because the label set is the model's own vocabulary.` },

   { n: 17, sec: 40, title: "One space",
     note: `The model is jina-embeddings-v5-omni-nano, about one billion parameters.
Images and text land in the same 768-dimensional space.
It is a retrieval encoder. It has no tagging head and was never trained to tag.
But because both paths share one space, any patch can be scored against any word.` },

   { n: 18, sec: 45, title: "The tagger",
     note: `Here is the whole tagger.
Offline, we encode all 128,260 tokens of the tokenizer once. That is the label matrix.
We estimate a background prior and gate to 25,465 whole words.
Per image, one forward pass gives patches and a global vector.
Score, subtract the prior, deduplicate, take the top tags.
This bear runs through every step and comes out as fur, bear, muzzle. It comes back on the crops slide.` },

   { n: 19, sec: 40, title: "Score every patch",
     note: `This is lever A, the deeper pass.
The pooled vector is dominated by the biggest object.
But the patch vectors are already in the forward pass.
Let each label keep its best patch, like ColBERT.
mAP goes from 0.264 to 0.635. *For free.*` },

   { n: 20, sec: 45, title: "Crops",
     note: `This is lever B, more passes.
We run 14 crops through the same model.
Watch the layers lift: nine crops, then four, then the center.
A small object fills its own crop, so weak evidence becomes strong.
mAP goes from 0.635 to 0.710 for 14 times the passes.
One pass reads wolf. With crops, it reads bear.` },

   { n: 21, sec: 35, title: "One recursive scoring function",
     note: `Here is the whole tagger as one formula.
Three terms: calibration on the pooled vector, patch evidence from the same pass, and the crops.
Look at the crop term.
The score of each crop is this *same function*, called again on the crop as a new image.
So the scorer is recursive.
To spend more compute, we run it again on new views. //` },

   { n: 22, sec: 40, title: "The ladder",
     note: `Patches give the big step.
Crops give the next one, at higher latency.
And down at the bottom, the calibration methods.
Same 75 milliseconds as the patch pipeline, and they collapse.` },

   { n: 23, sec: 10, title: "Section 03",
     note: `Demo three. Semantic highlighting.` },

   { n: 24, sec: 25, title: "The task",
     note: `Here is the task.
You have a query and a long document.
Split the document into passages, score every passage against the query, and highlight the best ones *in place*.
No index. Just the page and the question. //` },

   { n: 25, sec: 25, title: "Bi-encoder",
     note: `The classic way is a bi-encoder.
The query and each passage are encoded *separately*, so the passages can even be done offline.
The score is a cosine.
But each passage is scored alone. "That blue reaches us from all sides" does not know what *that* refers to.
So it ranks the sentence that only mentions the color of the sky.` },

   { n: 26, sec: 25, title: "Listwise",
     note: `A listwise reranker packs the query and all passages into *one* context.
jina-reranker-v3, 0.6 billion parameters, up to 64 passages in a 131K window.
Every passage attends to the query and to every other passage, and its score comes from its last token.
Now "that blue" makes sense, and the two right sentences light up.
On BEIR it scores 61.94, against about 56 for two rerankers of the same size. //` },

   { n: 27, sec: 25, title: "Extra compute",
     note: `So where does the extra compute go?
The bi-encoder fills only the diagonal blocks, and the passage blocks can run offline.
At query time it is one short query plus N dot products.
Listwise fills the *whole* matrix, all at query time. Order N squared L squared.
The pink blocks are the extra: query to passage, and passage to passage.
That is where the quality comes from. //` },

   { n: 28, sec: 10, title: "Section 04",
     note: `Demo four. An agent builds the pipeline.` },

   { n: 29, sec: 50, title: "Long-horizon agents",
     note: `In 2025, deep research was one loop. Search, read, reason, until the budget runs out.
In 2026, long-horizon agents split the work.
First research, with web access, to build a corpus.
Then an offline agent loop that works from that corpus.
Research and execution want different tokens.
Use cheap local tokens to build the corpus, and save frontier tokens for the work that needs them.` },

   { n: 30, sec: 40, title: "dataroom",
     note: `dataroom is the first half.
A local model searches, reads and writes in a loop,
until the knowledge sits in one cited zip file.
It stops when coverage reaches a measured floor.
The zip goes to searchbox, or to a frontier model.` },

   { n: 31, sec: 40, title: "searchbox",
     note: `searchbox is the second half.
We lock an agent in with one dataroom and no web.
It can only answer by composing its own pipeline from local tools.
Grep, embed, rerank, cluster.
And we get to ask real questions. Which tool comes first? When does grep win? Does more budget help?` },

   { n: 32, sec: 40, title: "knowledge-graph",
     note: `To measure any of this you need hard questions.
If one grep finds the answer, every method looks the same.
So we turn the corpus into a graph, walk two or three hops, and hide the bridge.
A question stays only if a closed-book model fails and a retrieval agent succeeds.
That gives us a private verifier.` },

   { n: 33, sec: 50, title: "What the demos share",
     note: `All of them are training-free, on frozen models.
Compute buys quality. Score functions, a tagger, an index replaced by one call.
Gains come only when *new information* enters. Patches and crops, yes. Calibration, no.
And always check out of domain.
Plus 0.24 in search became minus 0.016 on held-out tasks. //` },

   { n: 34, sec: 50, title: "Elasticsearch",
     note: `Fuse rankings with the rrf retriever, which the score-function search rediscovered.
Rerank the top hits with the text similarity reranker, and let the candidates see each other.
With semantic text chunking, rank each document by its best chunk.
And give your agents a token budget, and test them on private multi-hop questions before you raise it.` },

   { n: 35, sec: 25, title: "Closing",
     note: `So, to close.
Search has always been test-time compute.
Spend it where *new information* enters. //` },

   { n: 36, sec: 15, title: "Thank you",
     note: `Thank you.
Happy to take questions.` }
];
