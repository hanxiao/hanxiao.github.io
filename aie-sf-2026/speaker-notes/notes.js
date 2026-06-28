/* Speaker notes for aie-sf-2026. window.NOTES[i] = {n, title, sec, note}
   v6: a teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   No title fragments, no bullet phrasing, no bare letters (say "version A", not "A").
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. This is a talk, not a paper. Keep 1:1 with index.html. */
window.NOTES = [
{n:1, sec:42, title:"Title",
note:`Hi everyone, I'm Han Xiao.
I founded and ran *Jina AI*,
and last October, we were acquired by Elastic.
So I'm now VP of AI there.
Here's the question I want to answer today.
Big models get better by *thinking longer* at inference.
We call that test-time compute.
Can a *small retrieval model* do the same thing?
Can it get better just by working harder at inference,
without making the model any bigger?
To find out, I let an agent run the search overnight. //
And the answer turned out to be more interesting than a simple *yes or no*.
So let me show you what I found.`},

{n:2, sec:40, title:"Test-time compute, defined",
note:`First, let me say what test-time compute is.
The idea is simple.
Instead of training a bigger model,
you spend *more compute at inference time*, and you get a *better answer* back.
It shows up in a few familiar forms,
like best-of-n, self-consistency, or a verifier that reranks candidates.
Noam Brown, over at OpenAI, put a number on this.
He found that a poker bot thinking for *twenty seconds*
got the same boost as scaling the model *a hundred thousand times*.
That's the promise of test-time compute. //
So the real question for us is, does that promise hold for *search*?`},

{n:3, sec:35, title:"The reframe: search is test-time compute",
note:`Here's the reframe that turns this into a retrieval talk.
*Search is already test-time compute.*
Think about what you do when you build search.
You take trained embeddings, a reranker, a multi-vector retriever, a query expander,
and you wire them together into a *pipeline*.
You're spending inference to buy relevance.
You're not reaching for a bigger model.
You're *assembling more search* at test time.
So the real question isn't whether your model is big enough.
It's *how much pipeline* you assemble at inference, and whether that pays off.`},

{n:4, sec:40, title:"Two versions",
note:`There are *two ways* to build that pipeline, and I'll show you both.
The first one, *version A*, is the one I'll go deep on.
Here, an agent writes little programs over a single *frozen encoder*.
It might chunk the document, z-score and fuse the channels, or feed the results back.
Think of it as multi-pass algebra on embeddings.
The second one, *version B*, I'll come to later.
There, a small agent wires up retrieval tools like grep, embed, and rerank,
over a corpus, under a budget.
It's the *same move at two different altitudes*.
So let's start with version A.`},

{n:5, sec:38, title:"Small models are distilled from LLMs",
note:`So, version A runs over a small, *frozen* embedder.
And there's a common belief that small models have *nothing to gain* here,
that test-time compute belongs to the big reasoning models.
But look at where today's embedders come from.
Models like E5-Mistral, Qwen3-Embed, EmbeddingGemma, and our own jina-v5.
They are all *distilled from LLM backbones*.
That's the dominant recipe now.
So if test-time compute lives in the LLM's representation space,
then these distilled encoders should *inherit* it. //
Do they?
That's exactly what I wanted to find out.`},

{n:6, sec:40, title:"The scoring spectrum",
note:`Here's the intuition for how a frozen model could gain.
Look at these three panels.
They go from the simplest way to score a match on the left, to the most detailed on the right.
On the left, you have a single cosine, one vector per document.
That's our *frozen baseline*.
On the right, you have ColBERT-style (say: Col-BERT) late interaction,
where every query token is matched against every document token.
But that needs a multi-vector model, which we don't have.
The interesting part is the *middle* panel, the one I've outlined in blue.
You take the same frozen encoder, split the document into sentences, and max over them.
That's what I mean by *test-time structure*.
You move toward late interaction with *no new model*,
just more work over the vectors you already have.`},

{n:7, sec:35, title:"The strict question",
note:`So let me make the question *strict*.
How much can a frozen, single-vector encoder gain at inference *alone*?
And I do mean strict.
No retraining, no second model, and no learned parameters.
Just one frozen encoder, behind an API.
The popular methods all break one of these rules.
HyDE (say: hide) puts an LLM in the query path.
GQR (say: G-Q-R) adds a second retriever.
And MetaEmbed trains new parameters.
So we forbid all three,
and we ask whether the gain scales with the compute you spend.`},

{n:8, sec:40, title:"Autoresearch",
note:`So how do you search that huge space? With *autoresearch*.
Instead of me hand-designing the programs,
an agent runs the research loop by itself.
It changes one file, it runs a short experiment,
and if the metric improved, it keeps the change, otherwise it reverts.
It does that over and over, all night.
It's just *hill-climbing*, with an LLM as the mutation function.
Andrej Karpathy, now at Anthropic, described the same shift.
You're not editing Python the way a researcher would.
You're writing the markdown files that set up an autonomous research org.
And that loop generated *everything you're about to see*.`},

{n:9, sec:40, title:"The method loop",
note:`Here's the whole loop in one picture. Just follow the boxes, left to right.
A *proposer*, which is an LLM agent, writes a program over the frozen encoder.
The *evaluator* then scores that program.
*Memory* logs the result.
And the *registry*, the black box on the far right, collects all of them, 144 programs over 144 generations.
Now see that dashed arrow looping back underneath?
That's the *feedback*. Memory conditions the next program, so every round builds on the last one.
Let me quickly walk through the four pieces,
because a couple of them have a *catch* that shows up later.`},

{n:10, sec:35, title:"Proposer",
note:`First, the proposer.
It's Opus 4.6, used purely as a *mutation function*.
It reads the current best program and the memory ledger,
and then it edits one Python file and proposes the next one.
There is no human in the inner loop.
Now, here's the catch. //
It optimizes *exactly the metric you give it*, not the metric you meant.
So if you reward in-domain performance, and you reward spending compute,
then that is exactly what it will chase.
Whether those gains hold up *anywhere else* is a separate question.
So hold on to that thought.`},

{n:11, sec:35, title:"Program",
note:`Second, the program.
It's just arbitrary Python over the encoder.
And the one piece that matters is *embed_fn*.
That is the *compute budget*.
Every embed_fn call re-embeds some text, or switches an adapter, or picks a smaller dimension.
So one call is one unit of compute.
There are also some *taboos*.
The program can't use hyperparameters, task routing, external models, or learned weights.
Those taboos force it toward *task-agnostic structure*,
instead of a config that's secretly tuned for each task.`},

{n:12, sec:38, title:"Evaluator",
note:`Third, the evaluator.
Every program runs on the same *fourteen* discovery tasks,
spanning legal, financial, long-document, and general retrieval.
We score it with delta-nDCG (say: delta n-D-C-G) against the cosine baseline,
plus a cost ratio, and I'll define cost in just a minute.
It's the same fixed budget every generation.
Now here's the design choice that matters most. //
The loop only ever sees these fourteen tasks.
There are *nineteen more* that are held out, and the loop never touches them.
So later we can ask a clean question. Does what wins *here* also hold up *there*?
And that gap is the whole experiment.`},

{n:13, sec:30, title:"Memory",
note:`Fourth, memory.
It's a simple JSONL ledger, with one row per program.
Each row stores the scores, the cost, the parent, and a short lesson.
The proposer reads this ledger before every round,
so the whole search *compounds* over time.
But compounding cuts both ways.
It builds on real wins, yes,
but it also compounds whatever *bias* the objective has.
A biased metric doesn't just mislead one program.
It steers the *entire family tree*.`},

{n:14, sec:42, title:"Setup",
note:`Now, the rules of the game, because these decide everything.
The discovery tasks are the same fourteen I just mentioned.
What's new on this slide is the *model axis*.
We run the search on a single encoder, jina-v5-nano.
And everything else is *held out*.
We hold out a bigger model from the same family.
And most importantly, we hold out *two completely unseen families*, Gemma and Qwen.
They share no training data and no tokenizer with the discovery model.
Plus the nineteen evaluation tasks the loop never sees.
So one program gets discovered here,
and it has to *generalize to all of it*.
The metric, again, is delta-nDCG (say: delta n-D-C-G) at ten, versus cosine.`},

{n:15, sec:50, title:"The distinction: cost = extra forward passes",
note:`Now, before any results, I want to pin down one idea.
And it comes down to just *one number*.
The formula up top says it: cost, c, is just the number of *extra forward passes* through the encoder.
Let me make it concrete with the two cards on the slide.
They do the same move. They mix in some neighbor information, then they re-score.
The card on the left is SoftCentroid.
It averages document vectors you've *already computed*, so there's no new forward pass.
That means its cost, c, equals one.
The card on the right is FirstSent.
It re-embeds the first sentence of the top document, which is a brand-new forward pass.
So there, c is *greater than one*.
One reuses geometry you already have.
The other spends compute on new text. //
And the question for the back half is this.
Which one pays off when you switch to a different encoder?`},

{n:16, sec:35, title:"Two admission rules",
note:`We run that exact same loop under *two different rules*.
The first rule is the *compute search*.
It admits a program only if its in-domain performance beats every program before it,
so it is actively pushed to spend more inference.
The second rule is the *transfer search*.
It admits a program only if a held-out validation split improves, with nothing getting worse,
and it gets *no reward at all* for spending compute.
And to be clear, neither search ever touches the nineteen final tasks, or the unseen encoders.
So that's two objectives, running on the same loop.
Let's see what each one comes up with.`},

{n:17, sec:38, title:"In-search Pareto",
note:`Let's start with the compute search.
When you tell it to spend compute, it draws this *beautiful, clean curve*.
The x-axis is the compute you spend, on a log scale; the y-axis is the score.
There are 144 programs, and twelve of them sit on the Pareto front,
with cost running from just over 1x all the way up to *almost fifteen times*.
And the in-search score climbs nicely, it more than *triples* across that front.
This looks *exactly* like test-time-compute scaling. More compute, more quality.
If I stopped here, you would be sold. //
But this is all still *in-search*. We haven't tested it yet.
So let's take a quick look at those twelve programs, and then run them on held-out data.
Because *that's where it turns*.`},

{n:18, sec:25, title:"The twelve programs",
note:`So here are those twelve programs, drawn as little diagrams.
Don't try to read each one.
The only thing I want you to take away is this.
They are all *training-free recombinations* of the same frozen vectors,
just chunking, z-scoring, feedback, and fusion.
The cost climbs steadily from left to right.
It does look like a clean scaling story. //
But the gains, as you'll see, do *not*.`},

{n:19, sec:55, title:"The money chart (held-out)",
note:`So here's what happens when we run those twelve programs on the held-out data. //
The setup is the same as before.
Left to right is how much compute you spend, out to almost fifteen times.
Up and down is the held-out score, and that dashed line across the middle is the baseline.
Above the line is a gain, below it is a loss.
The pink line is the compute search, all twelve programs, now run on encoders the search never optimized for.
Just look at the shape of it. //
It is basically *flat*. It hugs the zero line the whole way out.
So even at almost fifteen times the compute, the typical gain is essentially *nothing*.
And when you average everything in, it actually turns *negative*,
because a handful of cases collapse all the way down to nearly *minus one*.
So all that compute buys you *nothing* out of domain, and sometimes it does real harm.
Now look at the blue dots.
Those are the transfer-search programs, and they all bunch up on the *left*, because they're all *cheap*.
Every one of them sits *above* the pink line.
And the leftmost one, at *c equals one*, with zero extra forward passes,
already *beats* the most expensive program on the far right. //
So more compute did *not* transfer.
The cheap structure did.
So that's the finding. The rest of the talk is *why*.`},

{n:20, sec:42, title:"Heatmap",
note:`So why exactly is that mean flat?
This heatmap shows what's hiding behind that one number, every single cell of it.
Each of the four blocks is one encoder, and three of them were never seen during the search.
Inside a block, every row is a program, the cheap ones up top and the priciest ones at the bottom.
Every column is one of the nineteen held-out tasks.
And the color is the key: green means it helped, deep pink means it collapsed.
Now, it's not that compute does nothing.
About *half* the cells are green, almost five hundred of them.
Most task-encoder pairs do improve under some program.
But then look at the deep-pink cells. They fall all the way down to nearly *minus one*.
And those collapses drag the whole mean negative.
So flat-on-average is *not* the same as harmless.
It's real wins, getting *wiped out* by catastrophic failures.
And you can't tell in advance which task will collapse.`},

{n:21, sec:40, title:"Transfer search",
note:`Now let's look at the other objective, the transfer search.
It picks a *completely different six* programs.
Not the twelve compute ones, and all of them cost *at most one and a half times*.
The best one wins on 83 percent of the held-out set.
But here's the part that matters. //
It never loses on a single task.
And even its worst single query only dips to about *minus a tenth*.
Compare that to the compute side, which collapsed to nearly *minus one*.
That's almost ten times tighter.
So transfer isn't about winning more often.
It's about *never failing badly*.`},

{n:22, sec:40, title:"It transfers across encoders and languages",
note:`And this genuinely *transfers*.
Remember, this was discovered only on jina-nano.
The x-axis is the four encoders, and for each one the blue bar is the mean gain, the teal bar the median.
The mean is positive on *all four*.
And the tallest bars are the two on the right, Gemma and Qwen, the families it *never saw*.
On the jina encoders on the left, the median sits near zero,
so this is a positive *tail*, not a broad lift across the board.
But it follows *general embedding geometry*, not some quirk of the discovery model.
It even survives a language switch it never searched on.
Applied as-is to French and Greek, it gets a small positive median, around plus 0.02,
an 86 percent win-rate, and every single held-out cell positive on Gemma.`},

{n:23, sec:40, title:"Structure vs a learned head",
note:`Now, the obvious objection. Why not just *train a head*?
So we tried exactly that.
The same budget, the same fourteen tasks, with a linear, low-rank, or MLP (say: M-L-P) head.
And in-domain, it looks *fantastic*. That's the dashed band up top, a jump of about *plus 0.2*.
But now drop your eyes below the baseline.
Those pink bars are the *same head* on the held-out encoders, and every one of them is negative.
The thin blue line just above zero is what structure does instead, a small but real gain on Gemma.
So adding parameters at the same budget just *memorizes*.
But recombining the frozen geometry *generalizes*.`},

{n:24, sec:40, title:"Rediscoveries: classical IR",
note:`So what is this structure that keeps transferring?
When you read the winning programs, they are *not new*.
The search keeps re-deriving classical IR, right in embedding space.
Things like Reciprocal Rank Fusion, Fisher's discriminant, Rocchio (say: ROH-kee-oh) feedback, and sentence-level MaxSim.
Two of those it rediscovered cold, and two it built up from a seed.
And that is exactly *why* they transfer.
They're *geometric*, things like z-scoring, sub-document granularity, and centroid feedback.
They depend on cosine geometry, not on any one model's training.
So the cheap versions carry over to encoders we never even touched. //
It is fifty years of IR, re-derived by an agent overnight.`},

{n:25, sec:45, title:"The trend (2025 to 2026)",
note:`So that was version A.
A frozen encoder, where cheap structure transfers, and raw compute doesn't.
Now let me zoom out.
Because that same move, assembling a pipeline at inference instead of growing the model,
is showing up *one level up*, in deep research and long-horizon agents.
The top row here is 2025. It was *one loop* on the open web. You search, you read, you reason.
The bottom row is 2026, and that loop is *splitting into two*.
First, a research phase that hits the web and builds a local corpus. That's the teal box in the middle, the one we call a *dataroom*.
And then there's an execution phase that runs *offline* against that corpus.
That split, dataroom first and then searchbox, is *version B*.
And it's built out of three small tools.`},

{n:26, sec:42, title:"dataroom",
note:`So, stage one is the *dataroom*.
You give it a token budget,
and it spends that budget on *local small models*, instead of an expensive frontier model.
It searches, it reads, and it writes, over and over,
until it has dumped all that knowledge into a single, cited *zip file*.
That zip is the open web, distilled into a small local corpus a machine can consume.
And notice the *economy* here.
You build the corpus using cheap local tokens,
and you save the expensive frontier budget for the execution that *actually needs it*.
It stops based on an *outcome*, a coverage floor, not on a fixed token count.
Then that grounded zip goes to stage two.`},

{n:27, sec:42, title:"searchbox",
note:`So, stage two is *searchbox*.
This is the testbed for the search-is-test-time-compute idea,
and it is deliberately *airgapped*.
You lock an agent inside a box, with one zip dataroom, and *no web access*.
So the only way it can answer is by composing a pipeline out of local tools,
things like grep, embed, rerank, cluster, and select-diverse.
Nothing leaks in.
Now I can finally ask the *real questions*.
Which tool does the agent reach for first?
Is grep all you need, or does a dense retriever earn its place?
And does forcing more compute help on the hard questions?
Those are all still *open*, and searchbox is how we find out.`},

{n:28, sec:40, title:"knowledge-graph",
note:`So how do you even *evaluate* a system like that?
you need *hard questions*.
And that is the third tool, the *knowledge-graph*.
Trivial questions teach you nothing,
because if one grep finds the answer, then every method scores the same.
So we turn the corpus into a knowledge graph,
where every fact becomes an *edge*, a subject, a predicate, and an object.
Then we walk the *longest paths* through that graph.
Those long chains become *multi-hop questions* that no single passage can answer.
The agent has to search and connect facts to get there.
So it's a private verifier, grown from the same corpus searchbox is locked inside.`},

{n:29, sec:35, title:"Synthesis",
note:`So let's connect the dots.
Both versions are doing the *same thing*.
They both build a search pipeline at test time,
and *neither one of them grows the model*.
In version A, the pipeline is multi-pass embedding algebra,
and what scales is *structure*, not forward passes.
In version B, the pipeline is a chain of tools,
where you compose tools instead of adding parameters.
And whether spending more compute there pays off,
well, that's exactly what searchbox is built to test.
*Different altitudes, same move.*`},

{n:30, sec:25, title:"Close",
note:`So here's the one line I'd like you to walk away with. //
*Information retrieval is test-time compute.*
Don't reach for a bigger model.
*Assemble more search* at inference instead.
The paper, all three tools, and these slides are behind the codes up here.
Thank you so much, and I'd love to take your questions.`},
];
