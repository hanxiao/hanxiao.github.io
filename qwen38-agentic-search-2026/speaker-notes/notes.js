/* Speaker notes for qwen38-agentic-search-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (6 slides).

   Every number spoken here is measured: the two serving repository READMEs, the corpus
   manifest at snapshot 2026-08-13, and the audit over the 207-file snapshot. Do not
   improvise a number, and do not quote an accuracy for either model on this verifier. */
window.NOTES = [
  { n:1, sec:30, title:"Title",
    note:`Hello everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*.//
This talk is a head to head
between two models I have both already deployed
on the same cheap GPU,
over a benchmark built out of my own documents.//
Everything you will see on the hardware side is measured on one card,
and the corpus never leaves the premises.`},

  { n:2, sec:75, title:"The two serving backends",
    note:`These are the two backends.//
On the left, thirty five B A three B.
Sparse mixture of experts.
Thirty five billion total,
about three billion active,
eight of two hundred and fifty six experts per token,
about twenty one point three gibibytes resident.//
Ninety one to ninety nine tokens per second, by workload.
Chat is the floor at ninety point six.
Math is the ceiling at ninety eight point eight.
Prose ninety two point five, code ninety three,
json ninety two, translation ninety one point seven,
summarization ninety three point one.//
Fifty six thousand three hundred and twenty context.//
And that speed is *tuned*.
Out of the box it was sixty three.
Full GPU residency of the experts, and ECC off,
put it forty five percent higher, losslessly.
Raw ceiling is about seventy three,
and the MTP head multiplies that
by one point two seven to one point three seven.//
On the right, three point eight.
Twenty three tokens per second
at a hundred and four thousand one hundred and ninety two context,
which is the largest window this card will serve at this quantization.
I found it by binary search.//
Under load it holds.
A prompt of a hundred and one thousand eight hundred and fifteen tokens,
ninety eight percent of the window,
came back correct at twenty four point eight eight decode
and two hundred and seventy eight prefill,
with VRAM peaking at twenty four thousand and eighty two mebibytes.//
Sixty four layers, but only sixteen hold a KV cache.
That is why a dense-class twenty seven B
fits a hundred K of context on a card this small.//
Now the card.
Twenty four gigabytes. Seventy two watts.
About twenty four cents an hour on spot.//
This is the low-budget GPU,
and at ninety odd tokens a second
the left-hand side is genuinely comfortable in a real loop.
That is the trade:
four times the throughput, or nearly twice the window.`},

  { n:3, sec:50, title:"dataroom and searchbox",
    note:`Two systems do the work here, and both are open.//
dataroom is the corpus stage.
A local model runs search, read and write in a loop
until the knowledge is dumped into one fully cited zip on disk.
It stops at a measured coverage floor.//
searchbox is the search stage.
An airgapped testbed for search as test-time compute.
One local model, one zip, no web access.
Every answer has to be composed
from local tools over what is in the box.//
So dataroom builds the private corpus,
and searchbox is the loop
the two models are compared inside.`},

  { n:4, sec:50, title:"The private corpus",
    note:`This is what is in the box.//
Two hundred and eighteen files,
snapshot the thirteenth of August.//
Twenty papers, six years of my own published work,
July twenty twenty three to July twenty twenty six.
Twenty nine model cards, one per released model.
A hundred and sixty one blog posts:
a hundred and four technical, twenty eight press,
fourteen insights, eight events, seven knowledge base.
Three API documents, two FAQ files
holding a hundred and sixty three question and answer pairs
over fourteen sources,
two site files with twenty seven page namespaces
and two thousand two hundred and ninety seven English strings,
and the legal set.//
Indexed, that is seven thousand seven hundred and seventy seven chunks
over two hundred and ten documents,
median ninety one units,
longest a hundred and ninety five units at two point one kilobytes,
embedded at seven hundred and sixty eight dimensions
and L2 normalized.//
The important structure is the overlap.
Each released model has both a paper and a release post,
framed differently.
That is what makes a multi-hop question possible at all.`},

  { n:5, sec:60, title:"Verifier construction",
    note:`Here is how the questions are made.//
Take the corpus.
A local model extracts grounded triples into a knowledge graph.
Then mine simple entity paths of length two and three.
Each path becomes a question:
name the starting entity, hide the bridges,
and the endpoint is the answer.//
A path of length k is a chain of k corpus-grounded facts,
so path length *is* the difficulty knob.
The solver has to discover the bridges.
It cannot look one thing up.//
A question only enters the set
when a closed-book probe fails on it
and at least one retrieval-equipped solver reaches the answer.
That is what makes the set measure search
and not memory.//
Ten graphs.
Eighteen thousand six hundred and fifteen edges audited,
every edge of every graph, no sampling.
Forty questions sampled per graph.
Two and three hops.//
One thing to keep straight.
The graphs were built over an earlier snapshot,
two hundred and seven files of the same material.
The two hundred and eighteen file snapshot
is what the agentic harness indexes today.`},

  { n:6, sec:25, title:"Close",
    note:`To close.//
A private corpus, a private verifier,
and one low-budget GPU
decide which model I serve.//
Both serving repositories are public,
and every serving number in this deck
is reproducible with one command.//
The harness is live at dataroom dot jina dot ai.//
Thank you.`},

];
