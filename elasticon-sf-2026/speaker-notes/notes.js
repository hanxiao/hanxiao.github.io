/* Speaker notes for elasticon-sf-2026 ("Search is test-time compute", ElasticON AI San Francisco, Nov 4 2026).
   window.NOTES[i] = {n, title, sec, note}. Exactly one entry per slide, keep 1:1 with ../index.html.
   Annotations: line break = breathe   *word* = stress   // = a longer beat.   No dashes. Total sec = 950 (15.8 min). */
window.NOTES = [
   { n: 1, sec: 15, title: "Search is test-time compute",
     note: `Good morning everyone!
Welcome to ElasticOn San Francisco.
My name is Han and I run the model training and inference team at Elastic and today I want to talk about search as test time compute.` },

   { n: 2, sec: 40, title: "Training harder",
     note: `Lets start from the history, think about over last 10 years especially since 2017 where transformer/BERT model starts to take off in the field of information retrieval.
Semantic search is mostly achieved by bigger and better transformers models that can represent document into vectors, and map those vectors into relevance.
We started from the original very small BERT models with 110M parameters, all the way to multi- billion level parameters, by training longer, harder and better to get more relevant search results.
People talk about scaling law and the idea there is the more computational resources u put into training the better outcome u will come` },

   { n: 3, sec: 35, title: "The second axis",
     note: `This trend meets a turning point in late 2024, when OpenAI released the first reasoning model gpt-O1.
What differs O1 from all its previous generations is the more computation resources are put at inference time by generating thinking process before giving the final answer.
The same model, if u give it longer time to think, it will give better answer.
Noam Brown call this as test-time compute or test-time scaling.
It’s the first time people realize that better outcomes can be achieved by investing more at inference.` },

   { n: 4, sec: 35, title: "Search lives on that axis",
     note: `Since there there are a lot of new developments on the reasoning models, and today all of our daily used models are basically reasoning models, opus, gpt6 or gemini and one can change thinking level there at test time, from low to high to ultra high.
The more you spend the more accurate result you will get.
But so far this seems to be exclusive for LLM and generative models.
In this talk, I send a clear message and convince everyone on this message is that search is always about test time compute.` },

   { n: 5, sec: 25, title: "A currency, not a KPI",
     note: `To understand this message, the first thing you need to do is to change your mindset.
The traditional mindset believes that search latency is important and must be minimized, so it’s a KPI a hard limit.
Today, under the test time compute framework, please think the inference time as a currency, a budget where you can use it to buy relevancy or new capability.` },

   { n: 6, sec: 35, title: "Four demos",
     note: `In particular in this talk, I will talk about four ways to spend your inference budget at test time.
To build a retrieval program that gives higher relevance.
An image tagger that can annotate photos with open vocabulary.
A reranker that can do semantic highlighting based the matches.
And finally an agent workflow that builds small search pipeline and reuse them in long horizon task.
In all of these demos, none of them involve training a new model, so all of them are training-free.` },

   { n: 7, sec: 15, title: "Three ways to spend compute",
     note: `So if the search model is frozen, the representation space is fixed where the improvements can come from?
In this talk, we will talk about three ways to do that.
Doing a deeper pass, doing more passes and doing calibration.` },

   { n: 8, sec: 10, title: "Section 01",
     note: `Let’s first look at the first example, finding a retrieval program that use a frozen embedding model gives higher relevance.` },

   { n: 9, sec: 30, title: "Scoring spectrum",
     note: `We know in classic semantic search people use cosine similarity between a query vector and document vector to measure the relevancy.
But that’s not the only way, one also chunk the document into sentences and use the maximum cosine of the query and every sentence as the final score.
To put this into an extreme, one can even max over every document token and every query token.
This is exactly what ColBERT model did.` },

   { n: 10, sec: 30, title: "The loop",
     note: `And of course the score function is not stopping there.
We can use auto research to find all score functions that give us better relevance.
Here I design this research loop as follows: it starts with a frontier model proposing a score function, the score function is verified on some evaluator, the results is stored in a memory file which is basically a plain json file, and the LLM reads that memory and propose the next score function.` },

   { n: 11, sec: 25, title: "Setup",
     note: `In particular, in this discovery loop we use Jina-embedding-v5-nano as the base model as it is smallest best sota embedding model today, (2) because it’s small enough so the evaluation there is quite cheap, which is very important to for this discovery loop to run efficiently.
For validating the effectiveness, we use three diff other models and some other benchmarks.` },

   { n: 12, sec: 50, title: "Pareto curve",
     note: `So we run this discovery loop long enough and we end up with 144 different score functions that use slightly more and more compute all thee way up to 16 times more compute than a simple cosine similarity. and to read this graph, x-axis is the computation cost, from origin point which represents the original cosine where given a query, u compute cosine against every doc in the corpus just once, and if a score function somehow require compute cosine over the entire corpus twice then it’s 2x.
So all the way up to 16x.
And we do see there is trend that a score function that uses more compute, tends to gives higher score.
Y axis is the score, and +0.2 on ndcg is significant improvement.` },

   { n: 13, sec: 40, title: "Heatmap",
     note: `So far our discovery loop only use jina-embeddings-v5-nano, so we need to test all these 12 score functions on their genearlibility on diff model and diff task.
And the idea here is: if a score function is genuinely useful and meaningful it should generalize to other models and on other tasks.
So here is a heat map of different programs and their win/loss rate on diff task under diff model.
One can see that some program does generalize pretty well on diff embedding model and diff task, meaning that they might be some new useful score function that can be used for getting better relevance` },

   { n: 14, sec: 20, title: "Classical IR",
     note: `So what are these score functions then, it turns out many of them we already know from classical IR but probably forgotten recently, like reciprocal rank fusion, fisher linear discriminate and and maxsim.
Each one of them is achieved by using the same frozen embedding model but spending more compute as test time` },

   { n: 15, sec: 5, title: "Section 02",
     note: `Our next example is to use a frozen embedding model for image tagging` },

   { n: 16, sec: 25, title: "Tags for free",
     note: `So here’s an illustration to show u want we want to achieve, those r real photos from my laptop and I hope to give them some annotations or tagging which help me to organize them later.
But the challenge here is I can’t use any image annotation model, all I have is use embedding model, so how to do that?` },

   { n: 17, sec: 20, title: "One space",
     note: `In this example, we will need jina-embeddings-v5-omni-nano, our smallest omni embedding model that can represent text, image, audio in one vector space.
This model was released in May.
So with this embedding model, we encode image and text into vectors, but how can we use those vectors and convert them into tags.` },

   { n: 18, sec: 35, title: "The tagger",
     note: `So this is the entire tagging pipeline, it looks complicated but essentially it’s a one time offline process and then per-image online process combining together.
In the offline procedure, we compute the embedding vector for every token in our vocabulary and store them first.
In the online process we compute the image embedding at patch, crop, and global level to get visual embeddings from different perspectives, we then later subtract the background prior from the image, do deep and some gating based on threshold, and eventually get the top-k tags.` },

   { n: 19, sec: 35, title: "Score every patch",
     note: `What’s important here is number of vectors per image, if we only use one vector per image in our previous pipeline, it works.
But the quality is pretty bad.
If we stop pooling the image embeddings and use raw patch-level embedding to represent an image, this gives us multiple embeddings per image, and we will need more compute to do max-sim like similarity calculation, but this gives much better quality in the end.
We can also combine these two together in the same pipline to get even better results.` },

   { n: 20, sec: 25, title: "Crops",
     note: `What interesting is if we spend more compute and do this step further, this will give us even better results.
So here’s a simple example, we have these 2 score functions already and they applied to the input image level.
If we do multiple crops and repeat the score functions there, it gives even more accurate results.` },

   { n: 21, sec: 25, title: "One recursive scoring function",
     note: `Perhaps to see it more clearly, this equatiion shows exactly what’s happening.
The final score function combines global, patch-level and crop information.
And the crop information is recursively defined as the function of itself.
I like this score function a lot, bc this very nice map to the three ways I talked earlier on how to spend compute at test time.
Via calibration, deeper pass and more passes.` },

   { n: 22, sec: 25, title: "The ladder",
     note: `Again we can plot a graph to show the effectiveness of adding more compute to the quality of tagging.
We can see even with a fixed embedding model processing more information can significantly improve the quality.
And what’s probably surprising to everyone is that the whole image tagging is done by jina-embeddings-v5-omni-nano, an embedding model with no extra training.` },

   { n: 23, sec: 5, title: "Section 03",
     note: `Next example is semantic highlighting using reranker and test time compute` },

   { n: 24, sec: 10, title: "The task",
     note: `Semantic highlighting is select the most matched paragraphs or sections or sentences from the documents given the query, and highlight it to the user.` },

   { n: 25, sec: 35, title: "Cross-encoder",
     note: `Traditionally, one can use reranker, a bi-encoder transfromer model to solve this.
So you basically cut the long document into chunks and encode them separately, and finally compute the cosine simlairy of the query against every passage.
To get the score.
But the problem of this approach is the lost of context, bc you chunk the document and evaluate them separately, each chunk dont know other chunk exist and they dont exchange information, so you are not leveraging the context of the entire document, which makes the result suboptimal` },

   { n: 26, sec: 30, title: "Listwise",
     note: `In jina-reranker-v3 and v3.5 we propose a new architecture called listwise reranker, the idea is u dont indepentdently compute pairwise similarity, but instead u put all sentences from the document in their original order into the context window and compute once.
You insert special score token after each sentence or passage.
By doing so, the information exchange happens between every document and with the query, and this gives a much better quality.` },

   { n: 27, sec: 20, title: "Extra compute",
     note: `If we compare the two architecture side by side, we can immediately realize that the list wise approach add much more computation at query time, we spend this computation on calculating the interaction between every documents to get richer semantics, and this gives much better result.` },

   { n: 28, sec: 5, title: "Section 04",
     note: `Our last example is how to use agent to build reusable pipeline at test-time` },

   { n: 29, sec: 35, title: "Long-horizon agents",
     note: `In 2025 people talked about deep research, where there is a loop over search, read, reason and it happens at test-time, the whole model is fixed, but just by looping over these steps and get better quality repor.t. in 2026, the community moved to more challenging long horizon task, where research itself is not enough, we need excution and implementation.
But the general idea is quite same, fixing the model, first do research loop and then do implementation loop.
The current RSI basically follows very similar pattern.` },

   { n: 30, sec: 40, title: "dataroom",
     note: `dataroom is the first half.
You give it a query. A local model in a pi harness, on your own GPU,
loops search, read, write, edit. Every pass adds sourced files to the dataroom.
It stops when coverage reaches a floor, then hands you a zip.
In this example run, about six hundred fifty thousand local tokens built a hundred and fourteen files.` },

   { n: 31, sec: 40, title: "searchbox",
     note: `searchbox is the second half.
The zip goes into a box with no web.
For each question, the agent builds its own pipeline from local tools.
A lookup is grep, then read. A harder one adds embed and rerank. Another clusters first.
Each run keeps the pipeline it built, so the next task can start from it.
One turn already costs about six tool calls and twenty thousand tokens per question.` },

   { n: 32, sec: 40, title: "knowledge-graph",
     note: `To know if a pipeline is good, you need hard questions.
If one grep finds the answer, every method looks the same.
So an LLM turns the dataroom into a graph of facts. We walk two hops and hide the bridge.
jina-embeddings-v3 is based on a model. What was that trained on? Common Crawl.
Grep and read, in one turn, answered for the wrong model.
On a hundred questions, one turn gets seventy-six percent of one-hop questions, and twenty-two percent of multi-hop.
That gap is our private verifier. It scores every new pipeline.` },

   { n: 33, sec: 50, title: "Summary of four examples",
     note: `Let me recap the four examples.
One, we spent compute to build advanced score functions.
Two, we spent compute to unlock a new capability, image tagging.
Three, we spent compute on more interactions between candidate documents.
Four, we spent compute to build reusable, verifiable pipelines.
Four angles, one idea. Search is test-time compute. //` },

   { n: 34, sec: 25, title: "Closing",
     note: `So, to close.
Search has always been test-time compute.
Spend it where *new information* enters. //` },

   { n: 35, sec: 15, title: "Thank you",
     note: `Thank you.
Happy to take questions.` }
];
