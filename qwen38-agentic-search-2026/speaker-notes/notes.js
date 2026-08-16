/* Speaker notes for qwen38-agentic-search-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (23 slides).

   STATUS OF THE NUMBERS. Slides 4, 6, 7, 10, 15, 16, 17 carry measured numbers, all
   traceable to the private-verifier paper or to the Qwen3.8 serving repository.
   Slides 18, 19, 20 and 21 describe an experiment that HAS NOT BEEN RUN. Slide 20 is
   the pending result table with empty cells. Say so on stage. Do not improvise a number. */
window.NOTES = [
  { n:1, sec:40, title:"Title",
    note:`Hello everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*.//
This talk is about a measurement I have set up
but have not yet taken.//
The question is simple to state.
Does a small local model,
Qwen three point eight,
actually search well
over documents that cannot leave the building?//
Everything you will see today runs on premises.
The corpus, the verifier, the solver, and the judge.
Nothing goes to an API.`},

  { n:2, sec:52, title:"Why evaluation is hard",
    note:`Let me start with why this is hard in twenty twenty six.//
A public benchmark stops measuring search
the moment its corpus becomes public.//
Three separate reasons.//
First, the answer may already be in the weights.
A model that recites a HotpotQA answer
without retrieving anything
scores exactly the same
as a model that searched well.//
Second, what you are scoring is the *scaffold*.
An agentic system is a model, plus tools, plus a loop,
and the number tells you nothing about which part moved.//
Third, and this is the one that matters commercially,
the corpus you actually care about
is in no public benchmark at all.//
So if you want to know whether a model
searches *your* documents well,
you have to build the benchmark on *your* documents.`},

  { n:3, sec:44, title:"Private data forces local",
    note:`And once the corpus is private,
the API route closes for every stage.
Not just the one you were thinking about.//
Construction reads every document,
so the whole corpus goes through the model.//
The audit sees the evidence span and the source.//
The solver, the thing under test,
reads passages, so its context *is* the corpus.//
And the judge sees the gold answer.//
Any one of those on a hosted endpoint
and the data has left the premises.//
So the whole loop is local.
And local, in practice, means a budget GPU.
Everything behind this deck ran on single L4 cards
with zero API spend.`},

  { n:4, sec:48, title:"What the verifier is",
    note:`Here is what I mean by a private verifier.//
You take the corpus.
A local model reads it and extracts grounded triples,
subject, predicate, object.
That gives you a knowledge graph.//
Then you mine simple paths through that graph.
A path of length k
is a chain of k corpus-grounded facts,
so path length is your difficulty knob.//
Each path becomes one question.
The endpoint is the answer,
and the bridge entities in the middle are *hidden*,
so the solver has to discover them.//
The numbers at the bottom are the real scale.
Two hundred and seven documents.
Ten graphs built over that same corpus.
Eighteen thousand six hundred and fifteen edges audited,
every edge, no sampling.
Forty questions per graph.`},

  { n:5, sec:46, title:"The acceptance problem",
    note:`Now here is the problem that took me a paper to work out.//
When a pipeline emits an evaluation set,
nobody vouches for it.
There is no annotator.//
So acceptance rests on checks
the pipeline computes over its own output.
The same three recur everywhere.
Coverage. Deduplication. Groundedness.//
All three are cheap, exact, and need no model.
And a run that satisfies them
gets reported as having produced a usable set.//
The one line of work that inspects acceptance closely
is DoRA, and it *abandons* automation:
three rounds of domain-expert review.//
So before you trust a verifier to rank models,
you have to ask what licenses the claim
that the verifier itself is any good.`},

  { n:6, sec:44, title:"Groundedness decomposed",
    note:`Groundedness is one word for two properties,
and this is where it goes wrong.//
*Provenance* asks whether the evidence span
is an exact substring of the document it cites.
No model in the loop. Perfectly objective.//
*Assertion* asks something different.
Shown the span alone,
can a judge recover the subject, the relation, and the object?//
Both are cheap.
The substring check needs no model at all.
The assertion audit needs one call
of at most eight output tokens per edge.//
Which is why I could audit
all eighteen thousand six hundred and fifteen edges,
at temperature zero, with no sampling.//
Standard practice measures the first
and reports it as the second.`},

  { n:7, sec:52, title:"The inversion",
    note:`And here is what that audit found.//
Every point on this plot is one constructed graph.
Provenance on the x axis, assertion on the y axis.//
Look at the bottom right.
That graph is *one hundred percent* verbatim
and *six point nine percent* asserting.//
The mechanism is visible in the artifact.
The median evidence span is eleven characters.
The builder set each span
to the object string itself,
and a one word span is trivially a substring.
Every edge passes the check while asserting nothing.//
Now look at the top left.
Ten point eight percent verbatim.
Ninety three point one percent asserting.
Last on provenance, first on assertion.
Its spans paraphrase rather than quote,
while actually stating the facts they support.//
Accept on substring groundedness
and you keep the first graph
and throw away the second.`},

  { n:8, sec:40, title:"usable(q)",
    note:`So if the checks do not tell you,
you have to measure what the thing is *for*.//
Here is the definition I use.
A question is usable
when it is *not* answerable closed-book,
and it *is* answerable from the corpus.//
The first conjunct throws out
everything answerable from parametric memory,
because that measures recall, not search.//
The second throws out questions that are broken,
unanswerable, or whose gold answer is simply wrong.//
And notice: neither of those failure modes
is visible to any artifact-level check.
You cannot see them by looking at the file.
You have to run a solver.`},

  { n:9, sec:38, title:"The solver ladder",
    note:`That is the solver ladder.
Three conditions, one corpus.//
Closed-book, no retrieval at all.
This rung *must fail* for the question to count.//
Single-shot retrieval.
BM25 top five passages in context, one shot.//
Agentic retrieval.
The model issues its own BM25 queries,
up to four rounds, before it answers.//
Grading is string containment
falling back to an equivalence judge.//
Same ladder, every graph, every question,
no graph-specific tuning,
because this is the measuring instrument,
not the result.`},

  { n:10, sec:54, title:"Correlation result",
    note:`So: do the acceptance checks predict usability?//
This is the headline table of the paper,
ten graphs, each metric correlated against measured usability.//
Coverage, minus zero point three four.
Duplicate-freedom, minus zero point one eight.
Edge count, plus zero point zero four.
Those three are simply uninformative.//
And then verbatim groundedness.
Minus zero point seven four,
on both Pearson and Spearman.//
The most widely used check in the field
ranks the artifacts close to *inversely*.
The three highest-provenance graphs
are the three least usable.//
I want to be careful here.
This is ten points.
It supports an ordinal statement, not a coefficient.
And my own proposed substitutes,
entailment and capacity,
are correctly signed and far too weak
to replace measurement.//
Capacity is dependable only at zero:
the one graph with no length-three path
yielded one usable question in forty.`},

  { n:11, sec:36, title:"What this buys",
    note:`So what do you get at the end of all that?//
A question set with three properties.//
Uncontaminated: every item survived a closed-book probe,
so nothing here is answerable from memory.//
Answerable: every item was reached
by at least one retrieval-equipped solver,
so a failure belongs to the solver, not the question.//
And tunable: path length is the difficulty knob,
and it is defined on graph structure,
not on how the question is phrased.//
The important point is that this is a *procedure*.
It reconstructs on any corpus.
The two hundred and seven document corpus here
is a shareable stand-in for a private one.`},

  { n:12, sec:44, title:"The harness",
    note:`Now the thing being tested.//
The harness is deliberately thin.
Pi in RPC mode is already a complete agent:
it loops, it calls tools, it compacts its own context.//
So I add three things and nothing else.
A binding to an OpenAI-compatible endpoint.
One extension registering search underscore corpus.
And two wall-clock rails.//
No skills. No tool catalog.
No supervision of what the model does with its turn.//
The task lives in the system prompt,
which is present every turn and never compacted,
rather than in a first user message
that compaction would eventually summarise away.//
Web search and read URL exist,
and they are *off* by default.
With web off the extension is never loaded,
so the model never even sees the two tools.`},

  { n:13, sec:38, title:"The tool surface",
    note:`One detail about the tool,
because it changes what you are measuring.//
A hit comes back as score, path, lines, and text.
And the system prompt tells the agent explicitly:
read the file around those lines,
widen the window if it is still truncated,
grep the same file for where else the topic appears.//
That instruction is load-bearing.
The lines field alone was not enough.
Runs would answer from the snippet
without ever opening the file.//
The retrieval under test is exactly one script,
and everything else is stock file access.
Nothing in between to credit or blame.//
The in-process implementation is checked
against the reference CLI on fifteen combinations:
identical rankings, max score delta one e minus six.`},

  { n:14, sec:40, title:"The model under test",
    note:`So, the model.//
Qwen three point eight, twenty seven B.
And the interesting part is that
it is not the dense twenty seven B you are thinking of.//
Sixty four layers,
full attention interval of four.
So sixteen layers maintain a KV cache
and the other forty eight use linear attention.//
It also ships a native MTP draft head,
which I use for self-speculative decoding.//
Weights are seventeen point nine two gigabytes
at the Unsloth dynamic four bit quant.//
Because only one layer in four holds a cache,
context costs roughly a quarter
of what it costs on a real dense model this size.
That is the entire reason
a twenty seven B class model
is even a candidate for an agentic loop
on one budget card.`},

  { n:15, sec:46, title:"Context ceiling",
    note:`Here is what one L4 actually buys you.//
The ceiling is one hundred and four thousand
one hundred and ninety two tokens.
Found by binary search to a tolerance of two hundred and fifty six.//
And one methodological point I care about.
A context counts as working
only when the server reaches health
*and* completes a generation.//
Because llama dot cpp allocates the KV cache at load time,
but sizes some compute buffers on the first decode.
So there is a band where the server starts fine
and dies the moment you send it traffic.//
Then I confirmed it under load, not at idle.
A prompt of one hundred and one thousand
eight hundred and fifteen tokens,
ninety eight percent of the window,
came back correct at twenty four point eight eight tokens per second.//
Four hundred and ninety four megabytes free.
That is genuinely the edge of the card.`},

  { n:16, sec:44, title:"Throughput",
    note:`And the speed.
Twenty three tokens per second, roughly, across workloads.//
Here is why that number and not another one.
The L4 gives you three hundred gigabytes per second.
Reading seventeen point nine gigabytes of weights
once per token
bounds plain autoregressive decode
at about sixteen point eight tokens per second.//
So everything above that line
is the MTP draft head, and nothing else.//
Speculative decoding is lossless by construction,
and forty arithmetic problems with known answers
score forty out of forty either way.//
Now the honest comparison.
The sparse alternative on the same card,
thirty five B with three B active,
sustains ninety two to a hundred tokens per second.
Four times faster.
At half the context.`},

  { n:17, sec:42, title:"Reading the two numbers together",
    note:`Put those two facts side by side
and you have the actual question of this talk.//
One hundred and four thousand tokens of context,
at twenty three tokens per second.
Versus fifty six thousand tokens,
at ninety two to a hundred.//
An agentic search loop spends its budget re-reading.
Every round appends tool output
and re-prefills a growing prefix.//
So the window bounds how many rounds fit
before compaction starts throwing evidence away.
And decode speed bounds how long the whole thing takes.//
The two models sit on opposite sides of that trade.//
Which one wins on this verifier
is an empirical question.
I am not going to reason my way to it.
That is the experiment.`},

  { n:18, sec:38, title:"Experiment design",
    note:`So here is the design.
AWAITING MEASUREMENT. Say this out loud.//
Two rows, the two served models.
Three columns, the solver ladder you already saw.//
The lit cells are the condition under test:
agentic BM25, four rounds.
The closed-book column is a control.
It is not a score, it is the filter
that makes the other columns mean something.//
Everything else is held fixed.
Same corpus, same question set,
same mining stage, same index,
same grading, same four-round cap.
Only the served model changes across rows.//
Sample is forty questions per graph,
fewer where a graph is too sparse,
so per-graph rates carry
a sampling error of several points.
I will not read a two-point difference as a result.`},

  { n:19, sec:38, title:"Scoring",
    note:`And how the agentic condition gets scored.
Also awaiting measurement.//
Not just the final answer.
I snapshot the answer the model holds
at the end of *every* turn,
carry it forward on turns where it did not change,
and judge every turn separately.//
That gives me a curve, not a point.//
And I plot that curve against two different x axes.
Turn index, which is what a person reads.
And cumulative fresh-prefill input tokens,
summed compaction-safe from the session log,
which is what the GPU actually pays.//
Those two can disagree.
A model with a longer window
spends more tokens per turn,
so it can win on turns and lose on tokens.
Both get reported.`},

  { n:20, sec:44, title:"The pending result table",
    note:`And this is the results slide.//
The table exists. The cells do not.
This experiment has not been run.//
I want to be completely direct about that,
because there is a version of this talk
where I fill these in with something plausible
and nobody in this room could tell.//
The rows, the columns, and the metric definitions
are fixed *in advance*.
That is the whole point of showing you an empty table:
once the definitions are public,
the numbers cannot be chosen after the fact
to make a story work.//
The hatching is deliberate.
Every one of those cells
is a measurement I owe you.`},

  { n:21, sec:44, title:"What each outcome would mean",
    note:`Let me commit to the readings in advance too.//
If Qwen three point eight comes out ahead on accuracy,
then the longer window
was worth four times the decode cost,
because more evidence survived
to the turn that answers.//
If the sparse model wins at equal wall time,
then more turns beat a bigger window.
The loop just recovers by querying again,
and compaction costs less than it looks like it should.//
And the third case is the one I actually want you to hold on to.
If both curves are flat above turn two,
then the verifier is not exercising the loop at all.
Either the questions resolve in one retrieval,
or my four-round cap binds
before the model ever needed it.//
That would be a result about my instrument,
not about either model.
And it is only visible
because I record the per-turn curve
instead of the final answer.`},

  { n:22, sec:40, title:"Limits",
    note:`What the result will not say.//
One corpus, one domain, two hundred and seven documents.
Ordinal claims, not coefficients.//
Retrieval is BM25, so it is lexical.
A question no solver reached
may still be answerable by a stronger system.
Usability is a conservative lower bound.//
Four rounds is a cap I chose.
It is part of the measurement,
not a property of the model.//
And the judge is from the same family as the builders,
which risks self-preference.
I keep its task narrow and run at temperature zero.//
One more, and it is already measured.
Across all ten construction runs,
not one builder ever invoked
the embedding or reranking tools
sitting right there in its loop.//
Provided capability that is not directed
goes unused.
Which should make all of us
a little more careful
about how much of an agentic result
actually belongs to the agent.`},

  { n:23, sec:26, title:"Close",
    note:`So, to close.//
A benchmark you built yourself
is worth exactly what
a measurement of its purpose says it is.
Not what the checks in your pipeline say.//
The harness is live behind that QR code.
The serving repository is public,
with every number in this deck reproducible
by one command.//
And when I have the table filled in,
I will come back and show you.//
Thank you.`},

];
