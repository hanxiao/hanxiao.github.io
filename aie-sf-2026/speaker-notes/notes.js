/* Speaker notes for aie-sf-2026. window.NOTES[i] = {n, title, sec, note}
   v6: a teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   No title fragments, no bullet phrasing, no bare letters (say "version A", not "A").
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. This is a talk, not a paper. Keep 1:1 with index.html. */
window.NOTES = [
   {
      n: 1, sec: 51, title: "Title",
      note: `Good morning, everyone.
Thanks so much for being here.
My name is Han Xiao.
I founded and ran *Jina AI* between 2020-2025,
and last October, we were acquired by Elastic.
Now I run the model training and inference team there.//
Here's the question I want to answer today.
Big models get better by *thinking longer* at inference.
We call that test-time compute.
Can a *small retrieval model* do the same thing?
Can it get better just by working harder at inference,
without making the model any bigger?
To find out, I let an agent run *autoresearch* overnight. //
And the answer turned out to be more interesting than a simple *yes or no*.
So let me show you what I found.`},

   {
      n: 2, sec: 40, title: "Test-time compute, defined",
      note: `First, let me say what test-time compute is.
The idea is simple.
Instead of training a bigger model,
you spend *more compute at inference time*, and you get a *better answer* back.
It shows up in a few familiar forms,
like best-of-n, self-consistency, or a verifier that reranks candidates.
Noam Brown from OpenAI put a number on this.
He found that a poker bot thinking for *twenty seconds*
got the same boost as scaling the model *a hundred thousand times*.
That's the promise of test-time compute. //
So the real question for us is, does that promise hold for *search*?`},

   {
      n: 3, sec: 35, title: "The reframe: search is test-time compute",
      note: `Here's the reframe that turns this into a retrieval talk.
*Search is already test-time compute.*
Think about what you do when you build search.
You take trained embeddings, a reranker, a multi-vector retriever, a query expander,
and you wire them together into a *pipeline*.
You're spending inference to *buy relevance*.
You're not reaching for a bigger model.
You're *assembling more search* at test time.
So the real question isn't whether your model is big enough.
It's *how much pipeline* you assemble at inference, and whether that pays off.`},

   {
      n: 4, sec: 40, title: "Two versions",
      note: `There are *two ways* to build that pipeline, and I'll show you both.
The first one, *version A*, is the one I'll go deep on.
Here, an agent writes little programs over a single *frozen encoder*.
It might chunk the document, z-score and fuse the different scoring signals, or feed the results back.
Think of it as multi-pass algebra on embeddings.
The second one, *version B*, I'll come to later.
There, a small agent wires up retrieval tools like grep, embed, and rerank,
over a corpus, under a token budget.
It's the same idea, at two different *levels*.
So let's start with version A.`},

   {
      n: 5, sec: 35, title: "Small models are distilled from LLMs",
      note: `So, version A runs over a small, *frozen* encoder.
And there's a common belief that small models *can't improve* here,
that test-time compute belongs to the big reasoning models.//
But look at where today's embedders come from.
Models like E5-Mistral, Qwen3-Embed, EmbeddingGemma, and our own jina-v5.
They are all *distilled from LLM backbones*.
That's the dominant recipe now.
So if test-time compute lives in the LLM's representation space,
then these distilled encoders should *inherit* it. //
Do they?
That's exactly what I wanted to find out.`},

   {
      n: 6, sec: 57, title: "The scoring spectrum",
      note: `Here's the intuition for how a frozen model could improve.
Look at these three panels.
They go from the simplest way to score a match on the left, to the most detailed on the right.
On the left, you have a single cosine distance, one vector per document and one per query.
That's our *frozen baseline*.
On the right, you have ColBERT-style (say: Col-BERT) late interaction,
where every query token is matched against every document token.
One can consider it as an extreme case of test-time compute.
The interesting part is the *middle* panel, the one I've outlined in blue.
You take the same frozen encoder, split the document into sentences, and max over them.
That's what I mean by *test-time compute*.
You get closer to late interaction.
With *no new model* at all.
Just more work on the embedding model you already have.`},

   {
      n: 7, sec: 35, title: "The strict question",
      note: `So let me make the question *strict*.
How much can a frozen, single-vector encoder improve at inference *alone*?
And I do mean strict.
Just one frozen encoder, behind an API. 
You can call it as many times as you want,
But no retraining, no second model, and no learned parameters. //
The popular methods all break one of these rules.
HyDE (say: hide) puts an LLM in the query path.
GQR (say: G-Q-R) adds a second retriever.
And MetaEmbed trains new parameters.
So we forbid all three.`},

   {
      n: 8, sec: 43, title: "Autoresearch",
      note: `But even with the constraints, the search space is huge.
So how do you search it? 
With *autoresearch*.
Instead of me handcrafting the programs,
an agent runs the research loop by itself.
It changes one file, it runs a short experiment,
and if the metric improved, it keeps the change, otherwise it reverts.
It does that over and over, all night.
It's just *hill-climbing*, with an LLM as the mutation function.
Andrej Karpathy, from Anthropic, described it like this.
You're not editing Python the way a researcher would.
You're writing the markdown files that set up an autonomous research org.
And that loop generated *everything you're about to see*.`},

   {
      n: 9, sec: 35, title: "The method loop",
      note: `Here's the whole loop in one picture. Just follow the boxes, left to right.
A *proposer*, which is an LLM agent, writes a program over the frozen encoder.
The *evaluator* then scores that program.
*Memory* logs the result.
And the *registry*, the black box on the far right, collects all of them, 144 programs, one per generation.
Now see that dashed arrow looping back underneath?
That's the *feedback*. Memory conditions the next program, so every round builds on the last one.
Let me quickly walk through the four pieces.`},

   {
      n: 10, sec: 37, title: "Proposer",
      note: `First up is the proposer.
It's Opus 4.6, used purely as a *mutation function*.
It reads the current best program and the memory file,
and then it edits one Python file and proposes the next one.
There is no human in the inner loop.
Now, here's the catch. //
It optimizes *exactly the metric you give it*, not the metric you meant.
So if you reward in-domain performance, and you reward spending compute,
then that is exactly what it will chase.
Whether those improvements hold up *anywhere else* is a separate question.`},

   {
      n: 11, sec: 33, title: "Program",
      note: `Next is the program.
It's just arbitrary Python over the encoder.
And the one piece that matters is *embed_fn*.
That is the *compute budget*.
Every function call there re-embeds some text, or switches an adapter, or picks a smaller dimension.
So one call is one unit of compute.
There are also some *constraints*.
The program can't use hyperparameters, task routing, or external models.
Those constraints force the agent to find a *task-agnostic program*,
instead of a config that's secretly tuned for each task.`},

   {
      n: 12, sec: 38, title: "Evaluator",
      note: `Then comes the evaluator.
Every program runs on the same *fourteen* discovery tasks,
spanning legal, financial, long-document, and general retrieval.
We score it with delta-nDCG (say: delta n-D-C-G) against the cosine baseline,
plus a cost ratio, and I'll define cost in just a minute.
Now here's the design choice that matters most. //
The loop only ever sees these fourteen tasks.
There are *nineteen more* that are held out, and the loop never touches them.
So later we can ask a clean question. Does what wins *here* also hold up *there*?
And that gap is the whole experiment.`},

   {
      n: 13, sec: 31, title: "Memory",
      note: `And last is the memory.
It's a simple JSONL file, with one row per program.
Each row stores the scores, the cost, the parent, and a short lesson.
The proposer reads this file before every round,
so the whole search *compounds* over time.
But compounding cuts both ways.
It builds on real wins, yes,
but it also compounds whatever *bias* the objective has.
A biased metric doesn't just mislead one program.
It steers the *entire family tree*.`},

   {
      n: 14, sec: 44, title: "Setup",
      note: `Now let me set up the models we used here.
We run the search on a single encoder, jina-v5-nano, 
239M parameters, and state of the art on multilingual retrieval.
We choose nano as our discovery-phase model, because it is small and reduces the cycle time of each experiment.
We hold out a bigger model from the same family, plus two unseen families, Gemma and Qwen.
They share no training data and no tokenizer with the discovery model.
And we also hold out the nineteen evaluation tasks, the ones the loop never sees.
So one program gets discovered using jina-v5-nano,
and it has to *generalize to all the encoders and all the tasks*.`},

   {
      n: 15, sec: 52, title: "The distinction: cost = extra forward passes",
      note: `Now, before any results, let me define the cost of test-time compute.
It comes down to just *one number*, c.
That's just the number of *extra forward passes* through the encoder. //
Let me explain it with the two cards on the slide.
They do the same move. They mix in some neighbor information, then they re-score.
The card on the left is SoftCentroid.
It averages document vectors you've *already computed*, so there's no new forward pass.
That means its cost, c, equals one.
The card on the right is FirstSent.
It re-embeds the first sentence of the top document, which is a brand-new forward pass.
So there, c is *greater than one*.
One reuses geometry you already have.
The other spends compute on new text.`},

   {
      n: 16, sec: 48, title: "Two rubrics",
      note: `Now that we can *price* compute,
we run that exact same loop under *two different rubrics*.
The first is the *compute rubric*.
It admits a program only if its in-domain performance beats every program before it,
so it is actively pushed to spend more inference.
The second is the *transfer rubric*.
It keeps a program only if it improves on a *validation split*, with nothing getting worse,
and it gets *no reward at all* for spending compute.
And to be clear, that validation split still comes from what the loop *can* see.
Neither rubric ever touches the nineteen *final* held-out tasks, or the unseen encoders.
So that's two rubrics, running on the same loop.
Let's see what each one comes up with.`},

   {
      n: 17, sec: 49, title: "In-domain Pareto",
      note: `Let's start with the compute rubric.
When you tell it to spend compute, it draws this *beautiful, clean curve*.
The x-axis is the compute you spend, on a log scale; the y-axis is the score.
There are 144 programs, and twelve of them sit on the Pareto front,
with cost running from just over one all the way up to *almost fifteen times*.
And the in-domain score climbs nicely, it more than *triples* across that front.
This looks *exactly* like test-time-compute scaling. More compute, more quality.
If I stopped here, you would be sold. //
But this is all still *in-domain*. We haven't run the held-out test yet.
So let's take a quick look at those twelve programs, and then run them on held-out data.`},

   {
      n: 18, sec: 28, title: "The twelve programs",
      note: `So here are those twelve programs, drawn as little diagrams.
Don't try to read each one.
The only thing I want you to take away is this.
They are all *training-free recombinations* of the same frozen vectors,
just chunking, z-scoring, feedback, and fusion.
The cost climbs steadily from left to right.
It does look like a clean scaling story. //
But the improvements, as you'll see, do *not*.`},

   {
      n: 19, sec: 46, title: "Held-out results",
      note: `Now we run those twelve compute programs on the held-out data. //
Same chart as before.
Compute runs left to right. The score runs up and down.
The dashed line across the middle is the baseline.
Look at the pink line, the compute rubric.
It's basically *flat*, hugging zero the whole way out.
So out of domain, more compute buys you essentially *nothing*.
Now look at the blue dots, the transfer programs.
They all sit on the *left*, because they're *cheap*.
And every one is *above* the pink line.
The cheapest one adds *zero* extra compute.
And it still *beats* the most expensive program.
So more compute did *not* transfer.
The cheap structure did.`},

   {
      n: 20, sec: 37, title: "Heatmap",
      note: `If we plot every program against every held-out task, we get this heatmap.
The four blocks are the four encoders.
Three of them were never seen in discovery.
In each block, the rows are programs.
The columns are the nineteen tasks.
Green means an improvement. Pink means a drop.
The picture is genuinely *mixed*.
Compute helps in about *half* the cells.
But the improvements are uneven.
A few of them even drop sharply.
So on average, it comes out *flat*.
Compute does help in places.
It just doesn't help *reliably* on new encoders.`},

   {
      n: 21, sec: 49, title: "Transfer rubric",
      note: `Now let's look at the other rubric, the transfer rubric.
It picks six *completely different* programs.
These aren't the twelve compute ones.
And they're all cheap, at most one and a half times.
The best one wins on 83 percent of the held-out set.
And it never loses on a single task. //
Now, what do these programs actually do?
They only touch the query and document vectors you already have.
Then they add a little cheap math on top.
Some nudge the query toward the documents it already likes.
Some pick a few useful directions in the space, and re-score along them.
That small bit of structure is enough to pull the *right* documents up.
And it's all recombination. No new model.`},

   {
      n: 22, sec: 21, title: "It transfers across encoders and languages",
      note: `And this *transfers* across models and languages.
Remember, it was discovered only on jina-nano.
But the improvement is positive on *all four* encoders.
And the *biggest* bars are Gemma and Qwen.
Those are the two families it *never saw*.
So this isn't a quirk of one model.
It rides *general embedding geometry*.`},

   {
      n: 23, sec: 20, title: "Structure vs a learned head",
      note: `Now, the obvious objection. Why not just *train a head*?
So we tried that, at the same budget.
In-domain, it looks *fantastic*. //
But on *every* held-out encoder, it drops below the baseline.
So a learned head just *memorizes*.
The cheap structure *generalizes*.`},

   {
      n: 24, sec: 45, title: "Rediscoveries: classical IR",
      note: `So what is this structure that keeps transferring?
Look at the winning programs.
They are *not new*.
The search keeps re-deriving classical IR, right in embedding space.
Things like Reciprocal Rank Fusion and Fisher's discriminant.
Then Rocchio (say: ROH-kee-oh) feedback, and sentence-level MaxSim.
It rediscovered two of them cold.
And it built the other two up from a seed.
And that's exactly *why* they transfer.
They're all simple *geometric* moves.
Things like z-scoring, or centroid feedback.
They lean on cosine geometry.
Not on any one model's training.
So the cheap versions carry over.
Even to encoders we never touched. //
It's fifty years of IR, re-derived by an agent overnight.`},

   {
      n: 25, sec: 44, title: "The trend (2025 to 2026)",
      note: `So that was version A.
A frozen encoder, where cheap structure won and raw compute didn't.
And autoresearch is how we found that.
But let me move *one level up*, from the model layer to the search pipeline.
And you will see the same test-time compute reflected at the pipeline level.
In 2025, we had deep research and agentic search, which was *one loop* on the open web.
In 2026, we have long-horizon tasks, which add implementation, a sandbox, and evals on top of retrieval, running for hours.
Both patterns need more looping, and more compute at test time.
So to study agentic search at test time, I built three small open-source projects.`},

   {
      n: 26, sec: 40, title: "dataroom",
      note: `First is the *dataroom*.
You give it a token budget. It searches, it reads, it writes.
Over and over. Until it packs everything into one *zip file*.
I call it a dataroom, because it kind of reminds me of the data rooms I prepared for investors back when I was a founder.
That zip is a distilled corpus of the open web, ready for the next agent to consume.
And notice the *token economy* here.
You explore the web and build the corpus with cheap tokens from small local models, like Qwen 27b/35b-a3b.
And you save the expensive frontier tokens for later, for exploitation.`},

   {
      n: 27, sec: 47, title: "searchbox",
      note: `Second is *searchbox*.
This is the testbed to study agentic search and tool calling.
And it's designed to be *airgapped*, so the agent has no internet access.
You lock an agent inside a box.
You give it a dataroom, and ask a question.
So to answer, the agent has to assemble a search pipeline at test time.
A pipeline made of local tools.
Things like grep, embed, and rerank.
And that lets you ask some interesting questions.
Which tool does the agent reach for first?
Is grep all you need?
Does forcing more compute help on the hard questions?
And will the agent build a pipeline it can reuse later?
Searchbox is just the testbed to study those questions.`},

   {
      n: 28, sec: 32, title: "knowledge-graph",
      note: `So how do you *evaluate* agentic search like that?
Well, you need *hard questions*. That's the third project, the *knowledge-graph*.
It turns the corpus into a knowledge graph.
Every fact becomes an *edge*, linking a subject to an object.
Then we walk the *longest paths* through that graph.
Those long chains become *multi-hop questions* that no single passage can answer.
The agent has to spend real test-time compute, connecting facts to get there.
So it's a tool for building a private verifier.`},

   {
      n: 29, sec: 43, title: "Synthesis",
      note: `So let's connect the dots.
Both versions are doing the *same thing*.
They both spend compute at test time.
And *neither one grows the model*.
In version A, we found a special embedding algebra over a frozen model that improves search relevance.
In version B, we build a stack to find the best pipeline.
We use the *dataroom* to maximize recall.
We use *searchbox* to maximize precision.
And we use the *knowledge graph* for the evaluations.
And that finally gives us a pipeline with strong search relevance.
So it's two *levels*, but they share one bet.
Spend more *test-time compute*, not a bigger model.`},

   {
      n: 30, sec: 46, title: "Close",
      note: `Finally, let me leave you with the big picture. //
*Search is test-time compute.*
So don't reach for a bigger model.
*Do more search* at inference instead. //
And you don't have to design that search by hand.
*Autoresearch* discovers it for you, overnight.
That's how we *scale* test-time compute. //
And that's my talk.
You can grab these slides from the QR codes here.
The paper and the projects are on my *GitHub* and *arXiv*.
And if you are around *this evening*, Elastic is running a hackathon.
The QR is right here, so come and build something with us.
Thank you so much.
Happy engineering.`},
];
