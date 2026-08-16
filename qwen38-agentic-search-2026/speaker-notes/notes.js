/* Speaker notes for qwen38-agentic-search-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (23 slides).

   FRAMING. This is a HEAD-TO-HEAD replacement decision, not a solo evaluation:
   Qwen3.8-27B against Qwen3.6-35B-A3B, the model Han uses by default.

   STATUS OF THE NUMBERS. Slides 3, 5, 6, 8, 11, 15, 16 carry measured numbers, all
   traceable to the two serving repositories, the corpus manifest, or the
   private-verifier paper. Slides 17, 18, 19 and 20 describe an experiment that
   HAS NOT BEEN RUN. Slide 19 is the pending result table with empty cells.
   Say so on stage. Do not improvise a number. */
window.NOTES = [
  { n:1, sec:34, title:"Title",
    note:`Hello everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*.//
This talk is a head to head
between two models I have both already deployed,
on a benchmark I built out of my own documents.//
And I want to say at the top:
the measurement itself is not finished.
I will show you the design,
and I will show you the empty table.`},

  { n:2, sec:50, title:"Why I am running this",
    note:`Here is where this came from.//
Qwen three point eight came out *last week*,
and my timeline has already decided it is better.
That is not evidence. That is a vibe.//
Meanwhile I have a default.
For agentic search on my own hardware
I reach for Qwen three point six, thirty five B A three B,
and I have spent *months* tuning how it is served.//
So the question I actually want answered is narrow,
and it is on the slide.
In agentic search,
how much better is Qwen three point eight
than the model I currently like most
and use by default?//
Not: is this a good model.
Not: where does it sit on a leaderboard.
Should I *switch*.//
And I cannot get that from a public benchmark,
because the corpus I care about is mine.`},

  { n:3, sec:62, title:"The two backends",
    note:`These are the two backends, both already at the wall of one L4.//
On the left, thirty five B A three B.
Sparse mixture of experts.
Thirty five billion total,
about three billion active,
eight of two hundred and fifty six experts per token.//
Ninety one to ninety nine tokens per second,
depending on workload.
Fifty six thousand three hundred and twenty context.//
And that number is *tuned*, not out of the box.
Out of the box it was sixty three.
Two lossless wins got it to here:
forcing every expert to stay resident on the GPU,
which is twenty eight percent,
and turning ECC off, which is another ten.
Raw ceiling is about seventy three,
and the MTP head multiplies that
by one point two seven to one point three seven.//
On the right, three point eight.
Twenty three tokens per second,
at a hundred and four thousand context.//
Different architecture.
Sixty four layers,
but only sixteen of them hold a KV cache,
which is why a dense-class twenty seven B
fits a hundred K of context on a card this small.//
Now the reason I care about this card at all.
Twenty four gigabytes. Seventy two watts.
About twenty four cents an hour on spot.//
This is the cheap GPU,
and at ninety odd tokens a second
the left-hand side is genuinely *comfortable* to use.//
So the trade is right there.
Ninety two to a hundred at fifty six K,
against twenty three at a hundred and four K.
Throughput against window.
That is what the evaluation has to pay for.`},

  { n:4, sec:40, title:"Where the private data comes from",
    note:`Two systems make this possible.//
*dataroom* is the builder.
A local model in a Pi harness
loops search, read, write,
until it has a comprehensive, fully cited
knowledge dump on disk.
The output is a zip.//
*searchbox* is the cage.
It takes one of those zips,
locks a local Qwen in an airgapped loop with it,
and gives it no web access at all.
So it can only answer
from what is in the box.//
That second part is the one that matters here.
If the model can reach the open web,
I am not measuring search over *my* data,
I am measuring whether it can find a blog post.`},

  { n:5, sec:48, title:"What the corpus is",
    note:`And this is the actual corpus.
It is mine.//
Twenty papers, which is six years of published work.
Twenty nine model cards.
A hundred and sixty one blog posts.
The API specs, the FAQ, the website copy, the legal page.
Two hundred and eighteen files.//
Indexed, that is seven thousand seven hundred and seventy seven chunks
over two hundred and ten documents,
embedded at seven hundred and sixty eight dimensions.//
One honest note, and I want to be precise about it.
The ten audited graphs I am about to show you
were built over an *earlier* snapshot of this same corpus,
which had two hundred and seven files.
The two hundred and eighteen number
is what the harness indexes today.
They are the same material at two different dates,
and I am not going to quietly present them as one number.//
The other thing worth saying:
papers and blog posts overlap on purpose.
Every major model has both.
That overlap is exactly
what makes a multi-hop question possible.`},

  { n:6, sec:44, title:"How the verifier is built",
    note:`So how do you get questions out of that?//
A local model reads the corpus
and extracts grounded triples.
Subject, predicate, object.
That gives you a knowledge graph.//
Then you mine simple paths through it.
A path of length k
is a chain of k corpus-grounded facts,
so path length is your difficulty knob.//
Each path becomes one question.
The endpoint is the answer,
and the bridge entities in the middle are *hidden*,
so the solver has to discover them.//
Ten graphs.
Eighteen thousand six hundred and fifteen edges audited,
every edge, no sampling.
Forty questions per graph.`},

  { n:7, sec:46, title:"The acceptance problem",
    note:`Now here is the problem
that took me a paper to work out.//
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
The one line of work
that inspects acceptance closely
is DoRA, and it *abandons* automation:
three rounds of domain-expert review.//
So before I trust this verifier
to tell me which of my two models is better,
I have to ask what licenses the claim
that the verifier itself is any good.`},

  { n:8, sec:44, title:"Groundedness decomposed",
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

  { n:9, sec:52, title:"The inversion",
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

  { n:10, sec:40, title:"usable(q)",
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

  { n:11, sec:38, title:"The solver ladder",
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

  { n:12, sec:54, title:"Correlation result",
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

  { n:13, sec:36, title:"What this buys",
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

  { n:14, sec:44, title:"The harness",
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

  { n:15, sec:38, title:"The tool surface",
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

  { n:16, sec:50, title:"The trade, side by side",
    note:`Now put the two backends in one table.//
Decode: ninety point six to ninety eight point eight
on the sparse model,
against twenty two point nine to twenty four point six
on the dense-class one.
Roughly four times.//
Context: fifty six thousand against a hundred and four thousand.
Roughly double, the other way.//
Here is why that matters for *agentic* search specifically.
An agentic loop spends its budget re-reading.
Every round appends tool output
and re-prefills a growing prefix.//
So the window decides
how many rounds fit
before compaction starts throwing evidence away.
And decode speed decides
how long the whole thing takes.//
One number is not in dispute:
seventeen point nine gigabytes of weights
at three hundred gigabytes a second
puts plain decode at about sixteen point eight.
Everything above that, on either row,
is the MTP draft head,
and speculation is lossless by construction.//
The arithmetic explains the floor.
It does not tell me the winner.`},

  { n:17, sec:44, title:"The context ceilings",
    note:`Both of those context numbers
are ceilings I had to go find,
not settings I chose.//
Binary search, to a tolerance of two hundred and fifty six tokens.//
And one methodological point I care about.
A context counts as working
only when the server reaches health
*and* completes a generation.//
Because llama dot cpp
allocates the KV cache at load time,
but sizes some compute buffers on the first decode.
So there is a band where the server starts fine
and dies the moment you send it traffic.//
Then I confirmed it under load, not at idle.
A hundred and one thousand eight hundred and fifteen tokens,
ninety eight percent of the window,
came back correct at twenty four point eight eight tokens per second.
Four hundred and ninety four megabytes free.//
The sparse model's ceiling is found the same way:
fifty six thousand three hundred and twenty,
first OOM at fifty seven thousand three hundred and forty four,
also at ninety eight percent VRAM.//
On both cards, ECC off
is the precondition that makes the top setting fit at all.`},

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
Both serving repositories are public,
and every serving number in this deck
is reproducible by one command.//
And when I have that table filled in,
when I can actually tell you
whether to switch,
I will come back and show you.//
Thank you.`},

];
