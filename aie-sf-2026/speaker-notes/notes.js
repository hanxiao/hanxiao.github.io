/* Speaker notes for aie-sf-2026. window.NOTES[i] = {n, title, sec, note}
   v4: delivery-annotated for spoken reading.
     line break  = a breath / pause (one thought group per line)
     *word*       = stress this word (rendered bold)
     //           = a deliberate longer pause / beat
   No dashes (you can't read tone off a dash). No "paper" framing. This is a talk.
   sec = per-slide delivery budget (seconds, incl. pauses). Keep 1:1 with index.html. */
window.NOTES = [
{n:1, sec:35, title:"Title",
note:`Hi everyone. I'm Han Xiao, VP of AI at Elastic.
Here's my question for today.
Big models get better by *thinking longer* at inference.
That's *test-time compute*.
Can a *small retrieval model* do the same?
Can it get better just by working harder at inference,
without growing the model?
I let an agent run the search overnight to find out. //
The answer is more interesting than a simple *yes or no*.
Let me show you.`},

{n:2, sec:40, title:"Test-time compute, defined",
note:`First, what test-time compute is.
The idea is simple.
Instead of training a bigger model,
you spend *more compute at inference*.
And you get a *better answer*.
It comes in a few forms.
Best-of-n. Self-consistency. A verifier reranking candidates.
Noam Brown put a number on it.
A poker bot that thinks for *twenty seconds*
got the same boost as scaling the model *a hundred thousand times*.
That's the promise. //
So the question is: does that promise hold for *search*?`},

{n:3, sec:35, title:"The reframe: search is test-time compute",
note:`Here's the reframe that makes this a retrieval talk.
*Search is already test-time compute.*
Think about what you do.
You take trained embeddings, a reranker, a multi-vector retriever, query expansion.
And you wire them into a *pipeline*.
You're spending inference to buy relevance.
You're not reaching for a bigger model.
You're *assembling more search* at test time.
So the real question isn't "is my model big enough."
It's *how much pipeline* you assemble at inference.
And whether it pays off.`},

{n:4, sec:40, title:"Two versions",
note:`There are *two ways* to build that pipeline.
I'll show you both.
*Version A* is the one I'll go deep on.
An agent writes little programs over one *frozen encoder*.
It might chunk the document, z-score the scores, fuse channels, feed results back.
It's multi-pass algebra on embeddings.
*Version B* comes later.
There, a small agent wires up retrieval tools,
grep, embed, rerank, over a corpus, under a budget.
*Same move, two altitudes.*
Let's start with A.`},

{n:5, sec:38, title:"Small models are distilled from LLMs",
note:`A runs over a small, *frozen* embedder.
And the common belief is that small models have *nothing to gain* here.
That test-time compute belongs to the big reasoning models.
But look at where today's embedders come from.
E5-Mistral. Qwen3-Embed. EmbeddingGemma. Our own jina-v5.
They're all *distilled from LLM backbones*.
That's the recipe now.
So if test-time compute lives in the LLM's representation space,
these distilled encoders should *inherit* it. //
Do they?
That's what I wanted to find out.`},

{n:6, sec:40, title:"The scoring spectrum",
note:`Here's the intuition for how a frozen model could gain.
Scoring runs along a spectrum.
On the left, a single cosine. One vector per document.
That's the *frozen baseline*.
On the right, ColBERT-style late interaction.
Every query token against every doc token.
But that needs a multi-vector model you don't have.
The *middle* is the interesting part.
Take the same frozen encoder. Split the document into sentences. Max over them.
That's *test-time structure*.
You move toward late interaction, with *no new model*.
Just more work over the vectors you already have.`},

{n:7, sec:35, title:"The strict question",
note:`So let me make the question *strict*.
How much can a frozen, single-vector encoder gain at inference *alone*?
And I mean strict.
No retraining. No second model. No learned parameters.
One frozen encoder, behind an API.
The popular methods all break one of these rules.
HyDE puts an LLM in the query path.
GQR adds a second retriever.
MetaEmbed trains parameters.
We forbid *all three*.
And we ask: does the gain scale with the compute you spend?`},

{n:8, sec:40, title:"Autoresearch",
note:`How do you search that space? *Autoresearch.*
Instead of me hand-designing programs,
an agent runs the research loop itself.
Change one file. Run a short experiment.
Did the metric improve? Keep it. If not, revert.
Then repeat, overnight.
It's *hill-climbing*, with an LLM as the mutation function.
Karpathy described the same shift.
You're not editing Python like a researcher.
You're writing the markdown files that run an autonomous research org.
That loop generated *everything you're about to see*.`},

{n:9, sec:40, title:"The method loop",
note:`Here's the loop in one picture.
A *proposer*, an LLM agent, writes a program over the frozen encoder.
A *harness* scores it.
*Memory* logs the result. And that log shapes the next proposal.
The *registry* collects them all.
144 programs over 144 generations.
The key thing is the *feedback*.
Memory conditions the next program.
So each round builds on the last.
Let me walk the four pieces quickly.
A couple of them have a *catch* worth flagging.`},

{n:10, sec:35, title:"Proposer",
note:`One. The proposer.
It's Opus 4.6, used as a *mutation function*.
It reads the current best program and the memory ledger.
Edits one Python file. Proposes the next.
No human in the inner loop.
Here's the catch. //
It optimizes *exactly the metric you give it*.
Not the one you mean.
Reward the in-domain mean, reward spending compute,
and that's what it'll chase.
Whether those gains hold up *elsewhere* is a separate question.
Hold that thought.`},

{n:11, sec:35, title:"Program",
note:`Two. The program.
It's arbitrary Python over the encoder.
And the one piece that matters is *embed_fn*.
That's the *compute budget*.
Every embed_fn call re-embeds text, or switches an adapter, or picks a smaller dimension.
One call is one unit of compute.
And there are *taboos*.
No hyperparameters. No task routing. No external models. No learned weights.
Those taboos force *task-agnostic structure*,
not a per-task tuned config.`},

{n:12, sec:38, title:"Evaluator",
note:`Three. The evaluator.
Every program runs on the same *fourteen* discovery tasks.
Legal, financial, long-document, general.
We score delta-nDCG against the cosine baseline.
Plus a cost ratio. I'll define cost in a minute.
Same budget every generation.
Here's the design choice that matters most. //
The loop only ever sees these fourteen tasks.
*Nineteen more are held out.* The loop never touches them.
So later we can ask: does what wins *here* hold up *there*?
That gap is the whole experiment.`},

{n:13, sec:30, title:"Memory",
note:`Four. Memory.
It's a JSONL ledger. One row per program.
Scores, cost, parent, a lesson.
The proposer reads it before each round.
So the search *compounds*.
But compounding cuts both ways.
It builds on real wins.
And it compounds whatever *bias* the objective has.
A biased metric doesn't mislead one program.
It steers the *whole family tree*.`},

{n:14, sec:42, title:"Setup",
note:`Now the rules of the game. They decide everything.
The discovery tasks are the same fourteen from a moment ago.
What's new here is the *model axis*.
We search on *one* encoder: jina-v5-nano.
Everything else is *held out*.
A bigger model from the same family.
And, this is the key part, *two unseen families*: Gemma and Qwen.
They share no training data, no tokenizer with the discovery model.
Plus those nineteen evaluation tasks the loop never sees.
One program is discovered here.
It has to *generalize to all of it*.
The metric is delta-nDCG at ten, versus cosine.`},

{n:15, sec:50, title:"The distinction: cost = extra forward passes",
note:`Before any results, the most important idea in the talk.
And it's just *one number*.
Cost, c, is the number of *extra forward passes* through the encoder.
Let me make it concrete with two real programs.
They do the same move: mix in some neighbor information, then re-score.
The first one, *SoftCentroid*, averages document vectors you *already computed*.
No new forward pass. So *c equals one*.
The second, *FirstSent*, re-embeds the first sentence of the top document.
That's a new forward pass. So *c is greater than one*.
One reuses geometry you already have.
The other spends compute on new text. //
The question for the whole back half:
which one actually pays off when you change the encoder?`},

{n:16, sec:35, title:"Two admission rules",
note:`We run that same loop under *two different rules*.
The first, *compute-spending*.
It admits a program if its in-domain mean beats every program before it.
So it's pushed to spend more inference.
The second, *transfer-selecting*.
It admits a program only if an internal validation split improves, with nothing getting worse.
*No reward* for spending compute.
And to be clear: neither search ever touches the nineteen final tasks, or the unseen encoders.
Two objectives. Same loop.
Let's see what each one finds.`},

{n:17, sec:38, title:"In-search Pareto",
note:`Start with compute-spending.
Told to spend compute, the search draws a *beautiful, clean curve*.
144 programs. Twelve sit on the Pareto front.
Cost runs from 1.2 to *14.7 times*.
And the in-search score climbs, from plus 0.07 to plus 0.24.
This looks *exactly* like test-time-compute scaling.
More compute, more quality.
Honestly, if I stopped here, you'd be sold. //
But this is all *in-search*. We haven't tested it yet.
Quick look at the twelve programs, then we run them on held-out data.
And *that's where it turns*.`},

{n:18, sec:25, title:"The twelve programs",
note:`Here are the twelve, as little diagrams.
Don't read each one.
The point is just this.
They're all *training-free recombinations* of the same frozen vectors.
Chunking, z-scoring, feedback, fusion.
Cost climbs left to right.
It looks like a clean scaling story. //
The gains, do *not*.`},

{n:19, sec:55, title:"The money chart (held-out)",
note:`This is the *money chart*. The spine of the talk.
Take all twelve compute programs.
Run them on the *held-out* evaluation,
including encoders the search never optimized for.
The pink line is that compute frontier. Look at it. //
It's *flat*.
The pooled mean is actually *negative*, minus 0.016.
And the worst per-query case collapses all the way to *minus 0.98*.
So all that compute, up to 14.7 times, buys *nothing* out of domain.
Sometimes it does real harm.
Now look at the transfer-selecting program.
It sits at *c equals one*. Zero extra forward passes.
And it already *beats* the most expensive 14.7-times program. //
So more compute did not transfer.
*Cheap structure did.*
That's the result. Everything after this just explains it.`},

{n:20, sec:42, title:"Heatmap",
note:`Why is that mean flat?
Here's the texture behind it. Every single cell.
Four encoders, three of them never seen during the search,
times twelve programs, times nineteen tasks.
And it's not that compute does nothing.
About *half* the cells are green. 485 of 912.
Most task-encoder pairs improve under some program.
But look at the *deep-pink* cells. They fall to minus 0.98.
And those collapses drag the whole mean negative.
So flat-on-average is *not* the same as harmless.
It's real wins, *wiped out* by catastrophic failures.
And you can't tell in advance which task will collapse.`},

{n:21, sec:40, title:"Transfer-selecting frontier",
note:`Now the other objective.
The transfer-selecting rule picks a *different six* programs.
Not the twelve compute ones.
And all of them cost *at most 1.5 times*.
The best one wins on 83 percent of the held-out set.
But here's the real story. //
It *never loses a single task*.
And even its worst individual query only dips to about minus 0.1.
Compare that to compute's *minus 0.98* collapse.
That's almost ten times tighter.
Transfer isn't about winning more.
It's about *never failing badly*.`},

{n:22, sec:40, title:"It transfers across encoders and languages",
note:`And it *genuinely transfers*.
Remember, this was discovered only on jina-nano.
But the gains are positive on *all four* encoders.
And they're largest on the two families it *never saw*: Gemma and Qwen.
On the jina encoders, the median sits near zero.
So this is a positive *tail*, not a broad lift.
But it follows *general embedding geometry*,
not quirks of the discovery model.
It even survives a *language switch* it never searched on.
Applied as-is to French and Greek:
median plus 0.016, an 86 percent win-rate, every held-out cell positive on Gemma.`},

{n:23, sec:40, title:"Structure vs a learned head",
note:`The obvious objection: why not just *train a head*?
So we did.
Matched budget. Same fourteen tasks. A linear, low-rank, or MLP head.
In-domain, it looks *great*. Plus 0.20 to 0.25.
But on *every* held-out encoder, it falls below baseline.
That's the in-domain win that looks amazing and *does not carry over*.
The reference line shows what real transfer looks like:
structure, plus 0.018 on Gemma.
Adding parameters at the same budget, *memorizes*.
Recombining the frozen geometry, *generalizes*.`},

{n:24, sec:40, title:"Rediscoveries: classical IR",
note:`So what is this structure that transfers?
When you read the winning programs, they're *not new*.
The search keeps re-deriving *classical IR*, in embedding space.
Reciprocal Rank Fusion. Fisher's discriminant. Rocchio feedback. Sentence-level MaxSim.
Two it rediscovered cold. Two it built from a seed.
And that's exactly *why* they transfer.
They're *geometric*. Z-scoring, sub-document granularity, centroid feedback.
They depend on cosine geometry, not on any one model's training.
So the cheap versions carry to encoders we never touched. //
Fifty years of IR, re-derived by an agent, overnight.`},

{n:25, sec:45, title:"The trend (2025 to 2026)",
note:`So that's Version A.
A frozen encoder, where *cheap structure transfers* and raw compute doesn't.
Now let me zoom out.
Because the same move, assemble a pipeline at inference, don't grow the model,
is showing up *one level up*.
In deep research. In long-horizon agents.
In 2025, it was *one loop* on the open web. Search, read, reason.
In 2026, it's *splitting in two*.
A research phase that hits the web and builds a local corpus, a *dataroom*.
And an execution phase that runs *offline* against it.
That split, dataroom then searchbox, is *Version B*.
It's built from three small tools.`},

{n:26, sec:42, title:"dataroom",
note:`Stage one. *dataroom.*
You give it a token budget.
It spends that budget on *local small models*, not a frontier model.
Search, read, write. Repeat.
Until the knowledge is dumped into one cited *zip file*.
That zip is the open web, distilled down to a small local corpus a machine can consume.
And notice the *economy* here.
You build the corpus with *cheap local tokens*.
And you save the expensive frontier budget for the execution that *actually needs it*.
It stops on an *outcome*, a coverage floor. Not a fixed token count.
Then that zip goes to stage two.`},

{n:27, sec:42, title:"searchbox",
note:`Stage two. *searchbox.*
This is the testbed for the whole "search is test-time compute" idea.
And it's *airgapped* on purpose.
You lock an agent in a box. One zip dataroom. *No web.*
So it can only answer by composing a pipeline from local tools:
grep, embed, rerank, cluster, select-diverse.
Nothing leaks in.
Now I can ask the *real questions*.
Which tool does it reach for first?
Is grep all you need, or does a dense retriever actually earn its place?
And does forcing more compute help on the hard ones?
Those are still *open*. Searchbox is how we find out.`},

{n:28, sec:40, title:"knowledge-graph",
note:`And how do you even *evaluate* that?
You need *hard questions*.
That's the third tool. *knowledge-graph.*
Trivial questions teach you nothing.
If one grep finds the answer, every method scores the same.
So we turn the corpus into a knowledge graph.
Every fact becomes an *edge*: subject, predicate, object.
Then we walk the *longest paths* through it.
Those chains become *multi-hop questions*, ones no single passage can answer.
The agent has to actually search, and connect facts, to get there.
It's a private verifier, grown from the same corpus searchbox is locked inside.`},

{n:29, sec:35, title:"Synthesis",
note:`So let's connect the dots.
Both versions do the *same thing*.
They build a search pipeline at test time.
And *neither one grows the model*.
In A, the pipeline is multi-pass embedding algebra.
What scales is *structure*, not forward passes.
In B, the pipeline is a chain of tools.
You compose tools, instead of adding parameters.
And whether spending more compute there pays off,
that's exactly what searchbox is built to test.
*Different altitudes. Same move.*`},

{n:30, sec:25, title:"Close",
note:`So here's the one line I'll leave you with. //
*Information retrieval is test-time compute.*
Don't reach for a bigger model.
*Assemble more search* at inference.
The paper, the three tools, and these slides are all behind the codes up here.
Thank you. I'd love to take your questions.`},
];
