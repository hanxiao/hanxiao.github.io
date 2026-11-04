/* Speaker notes for elasticon-sf-2026 ("Search is test-time compute", ElasticON AI San Francisco, Nov 4 2026).
   window.NOTES[i] = {n, title, sec, note}. Exactly one entry per slide, keep 1:1 with ../index.html.
   Annotations: line break = breathe   *word* = stress   // = a longer beat.   No dashes. Total sec = 930 (15.5 min). */
window.NOTES = [
   { n: 1, sec: 15, title: "Search is test-time compute",
     note: `Good morning, everyone!
Welcome to ElasticON San Francisco.
My name is Han, and I run the model training and inference team at Elastic.
Today I want to talk about search // as *test-time compute*.` },

   { n: 2, sec: 45, title: "Training harder",
     note: `Let's start with some history.
Think about the last ten years, especially since 2017, when transformers and BERT started to take off in information retrieval.
Semantic search got better mostly through *bigger and better* transformer models.
They encode documents into vectors, and map those vectors to relevance.
We started from the original BERT, a tiny model with 110 million parameters, // and went all the way to billions of parameters.
Training longer, harder and better, to get more relevant search results.
People call this the *scaling law*. // The more compute you put into training, the better the outcome.` },

   { n: 3, sec: 40, title: "The second axis",
     note: `This trend hit a turning point in late 2024, when OpenAI released its first reasoning model, // o1.
So what made o1 different from all the previous generations? //
It spends more compute at *inference time*.
It generates a thinking process before it gives the final answer.
Same model. // Give it more time to think, and it gives a better answer.
Noam Brown calls this *test-time compute*, or test-time scaling.
It was the first time people realized you can get better outcomes // by investing more at inference.` },

   { n: 4, sec: 40, title: "Search lives on that axis",
     note: `Since then, reasoning models have moved really fast.
Today, basically every model we use daily is a reasoning model. Opus, GPT-6, Gemini.
And you can change the thinking level at test time, from low, to high, to ultra high.
The more you spend, the more accurate the result.
But so far, // this seems to be exclusive to LLMs and generative models.
In this talk, I want to send one clear message, and convince you of it. //
Search has *always* been about test-time compute.` },

   { n: 5, sec: 25, title: "A currency, not a KPI",
     note: `To get this message, the first thing you need is to change your mindset.
The traditional mindset says search latency matters, and must be minimized.
It's a KPI. // A hard limit.
Under the test-time compute framework, please think of inference time as // a *currency*.
A budget you can spend to buy relevance, or a new capability.` },

   { n: 6, sec: 35, title: "Four demos",
     note: `In this talk, I will show you four ways to spend your inference budget at test time.
One, // a score function that gives higher relevance.
Two, // an image tagger that annotates photos with an open vocabulary.
Three, // a reranker that does semantic highlighting.
And four, // an agent workflow that builds small search pipelines, and reuses them in long-horizon tasks.
None of these demos trains a new model. // They are all *training-free*.` },

   { n: 7, sec: 20, title: "Three ways to spend compute",
     note: `So if the search model is frozen, and the representation space is fixed, // where can the improvement come from?
In this talk, we will see three ways.
A *deeper* pass. // *More* passes. // And *calibration*.` },

   { n: 8, sec: 10, title: "Section 01",
     note: `Let's look at the first example.
Finding a score function that gives higher relevance, // from the same frozen embedding model.` },

   { n: 9, sec: 30, title: "Scoring spectrum",
     note: `In classic semantic search, we use the cosine similarity between a query vector and a document vector to measure relevance.
But that's not the only way.
You can also chunk the document into sentences, and take the *max* cosine between the query and every sentence as the final score.
Push this to the extreme, // and you max over every query token and every document token.
That is exactly what ColBERT does.` },

   { n: 10, sec: 30, title: "The loop",
     note: `And of course, score functions don't stop there.
We can use *auto research* to discover score functions that give better relevance.
Here is the research loop I designed.
A frontier model proposes a score function. // An evaluator verifies it.
The result goes into a memory file, // which is basically a plain JSON file.
Then the LLM reads that memory, and proposes the next score function.` },

   { n: 11, sec: 25, title: "Setup",
     note: `In this discovery loop, we use jina-embeddings-v5-nano as the base model.
Two reasons. //
First, it's the best small embedding model today.
Second, it's small, so evaluation is *cheap*, // and that matters a lot for running the loop efficiently.
To validate the results, we test on three *other* models, and on other benchmarks.` },

   { n: 12, sec: 50, title: "Pareto curve",
     note: `We ran this discovery loop long enough to get 144 different score functions.
They use more and more compute, // all the way up to *16 times* a simple cosine.
So how to read this graph. //
The x-axis is compute cost.
The origin is plain cosine. For one query, you compute cosine against every document in the corpus once.
If a score function needs cosine over the whole corpus twice, that's 2x. And so on, up to 16x.
The y-axis is the score. And plus 0.2 nDCG is a *significant* improvement.
And you can see a clear trend. //
A score function that spends more compute tends to score higher.` },

   { n: 13, sec: 40, title: "Heatmap",
     note: `So far, the loop only used jina-embeddings-v5-nano.
So we need to test these 12 score functions for *generalization*, on different models and different tasks.
The idea is simple. //
If a score function is genuinely useful, it should generalize to other models and other tasks.
Here is a heatmap of the score functions, with their wins and losses on each task, under each model.
You can see some of them generalize pretty well, // across embedding models and across tasks.
So they might be genuinely new, useful score functions for better relevance.` },

   { n: 14, sec: 25, title: "Classical IR",
     note: `So what are these score functions? //
It turns out many of them we already know from classical IR, // and probably forgot recently.
Reciprocal rank fusion. // Fisher linear discriminant. // MaxSim.
Each one uses the *same* frozen embedding model, and just spends more compute at test time.` },

   { n: 15, sec: 5, title: "Section 02",
     note: `Our next example uses a frozen embedding model // for image tagging.` },

   { n: 16, sec: 20, title: "Tags for free",
     note: `So here's what we want to achieve.
These are real photos from my laptop. I want to tag them, so I can organize them later.
The challenge is, // I can't use any image annotation model.
All I have is an *embedding* model.
So how do we do that?` },

   { n: 17, sec: 20, title: "One space",
     note: `For this example, we need jina-embeddings-v5-omni-nano.
It's our smallest omni embedding model. It puts text, images and audio in *one* vector space.
We released it in May.
With this model, we encode images and text into vectors.
But // how do we turn those vectors into tags?` },

   { n: 18, sec: 35, title: "The tagger",
     note: `So this is the full tagging pipeline.
It looks complicated, // but it's really two parts. A one-time offline step, and an online step per image.
Offline, we compute the embedding of every token in our vocabulary, and store them.
Online, we embed the image at three levels, // global, patch and crop, to see it from different perspectives.
Then we subtract the background prior, remove duplicates, gate by a threshold, // and finally return the top-k tags.` },

   { n: 19, sec: 35, title: "Score every patch",
     note: `What matters most here is the *number of vectors* per image.
If we use only one vector per image, the pipeline works, // but the quality is pretty bad.
If we stop pooling, and keep the raw patch-level embeddings, we get many vectors per image.
That needs more compute, for a MaxSim-style similarity.
But the quality is *much* better.
And we can combine the two in the same pipeline, // to get even better results.` },

   { n: 20, sec: 25, title: "Crops",
     note: `What's interesting is, if we spend even more compute and go one step further, // it gets even better.
Here's a simple example.
We already have these two score functions, applied to the whole input image.
Now we crop the image, and run the same score functions on every crop.
The tags get // even more accurate.` },

   { n: 21, sec: 30, title: "One recursive scoring function",
     note: `To see it more clearly, here is the equation.
The final score combines *global*, *patch* and *crop* information.
And the crop term is defined recursively, // by the score function itself.
I like this score function a lot, because it maps very nicely to the three ways to spend compute I mentioned earlier.
Calibration. // A deeper pass. // And more passes.` },

   { n: 22, sec: 20, title: "The ladder",
     note: `Again, we can plot how adding compute improves tagging quality.
Even with a *fixed* embedding model, processing more information improves quality significantly.
And what probably surprises everyone is that the whole image tagger // is just jina-embeddings-v5-omni-nano.
An embedding model, // with *no* extra training.` },

   { n: 23, sec: 5, title: "Section 03",
     note: `Next example. // Semantic highlighting, with a reranker and test-time compute.` },

   { n: 24, sec: 10, title: "The task",
     note: `Semantic highlighting means, given a query, // you select the paragraphs, sections or sentences in a document that match it best, and highlight them for the user.` },

   { n: 25, sec: 40, title: "Cross-encoder",
     note: `Traditionally, you would solve this with a reranker, a *cross-encoder*.
You cut the long document into chunks.
Then you feed the query plus one chunk into the model, one chunk at a time, and get a score for each.
But the problem is // *lost context*.
Each chunk is scored on its own. It doesn't know the other chunks exist, // and they never exchange information.
So you are not using the context of the whole document, // and the result is suboptimal.` },

   { n: 26, sec: 30, title: "Listwise",
     note: `In jina-reranker-v3 and v3.5, we introduced a new architecture, // the *listwise* reranker.
Instead of scoring each pair independently, you put all the sentences of the document, in their original order, into one context window, // and run it *once*.
A special score token goes after each sentence or passage.
This way, information flows between every passage, // and with the query.
And that gives much better quality.` },

   { n: 27, sec: 20, title: "Extra compute",
     note: `Put the two architectures side by side, and you see it immediately.
The listwise approach spends much *more* compute at query time.
That compute goes into the interactions // *between* passages.
It gives richer semantics, and a much better result.` },

   { n: 28, sec: 5, title: "Section 04",
     note: `Our last example. // Using an agent to build reusable pipelines at test time.` },

   { n: 29, sec: 40, title: "Long-horizon agents",
     note: `In 2025, everyone talked about *deep research*.
A loop of search, read and reason, all at test time.
The model is fixed. // Just by looping over these steps, you get a better report.
In 2026, the community moved on to harder, *long-horizon* tasks.
Research alone is not enough anymore. // We need execution and implementation.
But the idea is the same. //
Fix the model. First run a research loop, // then run an implementation loop.
Today's recursive self-improvement, RSI, follows a very similar pattern.` },

   { n: 30, sec: 30, title: "dataroom",
     note: `dataroom is the first half.
You give it a query.
A local model in a pi harness, on your own GPU, // loops search, read, write, edit.
Every pass adds sourced files to the dataroom.
It stops when coverage reaches a floor, // then hands you a zip.
In this example run, about six hundred fifty thousand *local* tokens // built a hundred and fourteen files.` },

   { n: 31, sec: 35, title: "searchbox",
     note: `searchbox is the second half.
The zip goes into a box // with *no* web.
For each question, the agent builds its own pipeline from local tools.
A simple lookup is grep, then read. // A harder one adds embed and rerank. // Another one clusters first.
Each run keeps the pipeline it built, so the next task can start from it.
One turn costs about six tool calls and twenty thousand tokens per question.` },

   { n: 32, sec: 50, title: "knowledge-graph",
     note: `To know if a pipeline is good, you need *hard* questions.
If one grep finds the answer, // every method looks the same.
So an LLM turns the dataroom into a graph of facts. We walk two hops, // and hide the bridge.
jina-embeddings-v3 is based on a model. What was that model trained on? // Common Crawl.
Grep and read, in one turn, // answered for the wrong model.
On a hundred questions, one turn gets seventy-six percent of the one-hop questions, // but only twenty-two percent of the multi-hop ones.
That gap is our *private verifier*. // It scores every new pipeline.` },

   { n: 33, sec: 35, title: "Summary of four examples",
     note: `So let me recap the four examples.
One, // we spent compute to build advanced score functions.
Two, // we spent compute to unlock a new capability, image tagging.
Three, // we spent compute on more interactions between candidate documents.
Four, // we spent compute to build reusable, verifiable pipelines.
And all four spend it in the same three ways. // A deeper pass, // more passes, // and calibration.
Four angles, // one idea.
Search is *test-time compute*.` },

   { n: 34, sec: 10, title: "Closing",
     note: `So, to close. //
Search has *always* been test-time compute.
Spend it // where *new information* enters.` },

   { n: 35, sec: 5, title: "Thank you",
     note: `Thank you. //
Happy to take questions.` }
];
