/* Speaker notes for ttc-embedding-image-tagging-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script, rebuilt from the delivered transcript. Every line is a COMPLETE,
   natural sentence you read aloud. Total budget 14:51, tuned for a 15-minute slot.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (26 slides). */
window.NOTES = [
  { n:1, sec:41, title:"Title",
    note:`Hello everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*.//
In my last talk I spoke about test-time compute for *search*.
And I said search is all about test-time compute,
because you spend the compute at test time to buy relevance,
by building a pipeline: embedding, ranker, hybrid search.//
Today I want to push that idea one step further,
to unlock a new *capability*: image tagging.
So I will show you how to use a frozen
jina-embeddings-v5-omni model
to tag images, purely at test time.`},

  { n:2, sec:38, title:"The result, first",
    note:`Let me show you what I want to achieve.//
These are real photos from my Mac Studio.
A landscape from San Jose.
A price tag from Costco.
My teammate Felix. My SSD drive.
So nothing here is cherry picked.//
Under each photo are five tags,
and those come from the v5-omni model.
Seventy-five milliseconds per image, on this machine.//
There is no training anywhere in the pipeline.
It is purely test-time compute.
And this is what you will be able to build
by the end of this talk.`},

  { n:3, sec:47, title:"Problem formulation",
    note:`Let me state the problem clearly.//
We have jina-embeddings-v5-omni-nano.
About one billion parameters,
image and text in one space.//
You could use another multimodal model here,
but I would not use CLIP,
because of the modality gap.
I never tested it, but I do not think it works.//
I chose this one because it is our model,
and because I use it every day.//
So one image goes in, and we want many labels back,
in an *open* vocabulary,
not a small predefined set.//
The constraints.
No retraining. No tagger.
No classifier on top.
The model is completely fixed.
All we may do is spend compute at test time.`},

  { n:4, sec:50, title:"How test-time scaling works",
    note:`A quick recap first.
What does test-time compute mean
for a *frozen* embedding model?
Roughly three ways.//
Family *A*, a deeper pass.
You run one pass,
but you carry more out of it.
Every patch vector, not just the pooled one.
If you know ColBERT, this is exactly that.//
Family *B*, more passes.
You run the same encoder again, on new views.
Split a document and embed each sentence.
Crop an image and re-encode each crop.//
Family *C*, calibration.
You work on the vectors you already have,
using their statistics.
Whitening, graph propagation.//
Same frozen encoder in all three.
Only what enters the computation changes.//
The QR in the corner is my last talk.`},

  { n:5, sec:21, title:"Two research questions",
    note:`So there are two questions I want to answer.//
First. Can a frozen embedding model become an image tagger,
by test-time compute alone?
No retraining, no fine-tuning, no head, no classifier.//
And second, if it can:
which of the three is the most effective?
Deeper pass, more passes, or calibration?`},

  { n:6, sec:50, title:"Architecture",
    note:`Now let me open the model up.//
This whole blue block is *one* checkpoint,
and it stays frozen.
Inside there is a vision tower
and a text tower, trained together.//
Three things to notice.
First, when an image goes in,
the vision tower breaks it into patches,
and each patch comes out as its own vector.
That is capital P.//
Second, you also get one pooled vector
for the whole image, from the last token.
That is small g.//
And third, the text path is the *same* tower.
We push all hundred twenty-eight thousand tokens
through it, once, offline,
and cache that as E, the label matrix.//
P, g, and E. We will use all three.`},

  { n:7, sec:43, title:"The pipeline",
    note:`Here is the complete workflow.//
The top lane runs *once*.
We encode the vocabulary into the label matrix E,
a hundred twenty-eight thousand by seven hundred sixty-eight.
We estimate the background prior, mu,
from neutral images.
And we filter the vocabulary down
to about twenty-five thousand real words.//
The bottom lane runs for *every* image.
One forward pass gives the patches
and the global vector.
We score them against E,
subtract the mean, dedupe,
and the top k tags come out.//
And if we crop the image
and send the crops through the same model,
that is family B.`},

  { n:8, sec:35, title:"Step 1: the label space",
    note:`So how is the label matrix built.//
We feed the tokens one by one
through the model, as text.//
And here is the trap.
You might think you can just read
the input embedding table.
But that is not the output space.
This model unties them,
so you score against it and get garbage.
Things like Tutor, and PyTuple.//
So every token has to go *through the tower*.
That is what puts the labels
in the same space as the image.`},

  { n:9, sec:40, title:"Step 2: patch beats global",
    note:`Second step. Where do you *look* in the image.//
On the left, one global vector against each label.
It is dominated by the largest object.
Mean average precision, *point two six*.//
On the right, what we do instead.
Every patch is scored against every label,
and each label keeps its strongest patch.
This is MaxSim, exactly like ColBERT.//
A small object now fires on its own patch.
And that takes the mAP to *point six three*.//
And it is almost free.
Those patch vectors already came out
of the forward pass.`},

  { n:10, sec:29, title:"Step 3: subtract the prior",
    note:`Third step. Remove the bias.//
Every label carries a prior.
Some words sit close to almost any image
in the embedding space,
just because of how the model was trained.//
So we take neutral images,
random backgrounds or ordinary photos,
compute the similarity once,
and use that as the prior.//
At test time we subtract it.
A word that scores high on everything
goes back to zero.`},

  { n:11, sec:31, title:"Step 4: word gate and NMS",
    note:`Fourth step. Clean up the output.//
The tokenizer already knows where a word starts.
So we keep only the tokens
that begin a *new word*,
and we drop the fragments.
That takes a hundred twenty-eight thousand
down to twenty-five thousand.//
Then we dedupe.
We walk down the ranking
and drop any word too close,
in embedding space,
to something we already kept.
Cat, kitten and cats collapse into kitty.//
No dictionary needed.`},

  { n:12, sec:42, title:"Step 5: CWR multi-crop",
    note:`Now the part that matters most.//
Instead of letting the vision tower
do all the splitting,
we crop the image ourselves.
Fourteen crops,
following the TagCLIP idea from AAAI,
all through the *same* frozen model.//
Each crop is a new image.
It gets re-patchified,
scored against every label,
and we take the max per label across crops.//
A small object fills its crop,
so weak signal becomes strong.
A single pass says wolf.
With crops, it finds the *bear*.//
And it has to be max, not average.
Averaging made it worse.
Only one crop holds the evidence.`},

  { n:13, sec:39, title:"One equation",
    note:`So here is the whole tagger,
as one score per label. Three terms.//
The first is the global vector
against the label, minus its prior.//
The second is the patch evidence,
the max over patches, minus its prior.
That is the deeper pass, family *A*,
and it is the one that buys us
plus point three seven.//
The third is multi-crop.
And notice it is *recursive*.
It calls this same score on each crop.
That is family *B*, more passes.//
No head, no logits, no learned threshold.`},

  { n:14, sec:31, title:"The equation, over the vocabulary",
    note:`And here is that score
over the whole vocabulary.
Real data, for the cat image.//
First the raw scores. A smooth bell.
Nothing you can threshold.//
Then subtract the prior,
and the mass collapses to zero.
What is left on the right tail is the evidence.//
Then the word gate, then dedupe,
and the top tags fall out.//
And all of this is just matrix math,
so it vectorizes and runs fast.`},

  { n:15, sec:24, title:"Results",
    note:`On a hundred and fifty COCO images,
with real multi-label ground truth.//
Global pooling gives precision at one
of point four three. Mediocre.//
Patch scoring takes the mAP
from point two six to *point six three*.
About two and a half times.//
And with multi-crop,
*eighty-one percent* precision at one,
and mAP point seven one.`},

  { n:16, sec:36, title:"Does calibration scale?",
    note:`So family A and family B both clearly work.//
Which made me curious about family *C*.
You already have the vectors.
Can you exploit their geometry to get more?
That is where most of the recent literature is.//
So I implemented all of it,
and measured it on the same benchmark.//
The open circle is where the method starts.
The filled circle is where it ends up.//
And the answer is no.
Some barely move.
Some collapse completely.`},

  { n:17, sec:27, title:"The meta-conclusion",
    note:`So this is the summary of that experiment.//
Calibration simply does not help on this model.//
The reason is that these methods
were designed for a weakly calibrated,
single-label, two-tower CLIP.
This space is already aligned,
already calibrated,
and already multi-label.
There is nothing left to recover.//
Only new pixels move the number.`},

  { n:18, sec:42, title:"The frontier",
    note:`And this is the most important plot in the talk.//
On the x axis, the time you spend per image.
On the y axis, the accuracy.//
And you can see it clearly.
The more compute you spend at test time,
the better the accuracy gets.
Not every method, of course.
But along the Pareto front it holds.
More patches, and then more crops.//
So there *is* a scaling law here,
for image tagging on a frozen embedding model.//
And the pink points are family C.
They are cheap, and they buy you nothing.//
Remember, we never trained anything.`},

  { n:19, sec:23, title:"The next question",
    note:`One more question.//
Every tag so far is a *single word*.
Kitty. Cosy. Sofa.//
But often I want a noun *phrase*,
because it tells me more about the image.//
So can we get grounded modifiers,
with no part-of-speech tagger,
no grammar, and no decoder model?
Just more compute on the frozen encoder.`},

  { n:20, sec:37, title:"Beam mechanics",
    note:`And we can, by borrowing beam search.//
We start from the noun and expand it.
Each candidate word fills a slot,
and we score the whole phrase
against the region.//
We keep the best four.
Then we expand all four again,
and keep the best four
of everything that comes back.
We stop when the phrase is long enough.//
Grey couch kitty wins, And it beats couch grey kitty.
Same words, better order,
decided by an embedding model with no grammar.`},

  { n:21, sec:22, title:"Qualitative results",
    note:`And it holds up outside the benchmark.
Real photos, four modes, top five each.//
Zero annotation, open vocabulary,
all from the embedding model alone.
Nothing cherry picked.`},

  { n:22, sec:33, title:"Relation to prior work",
    note:`To place this against the literature.//
TagCLIP and PIAA are training-free,
but they assume the label list is *given*.
The RAM line trains on a curated tag list.
And OTTER is a calibration method.//
What is unique here is the combination.
We are training-free.
We have no predefined label space,
the tokenizer vocabulary *is* the label space.
And there is no second model.//
Everything comes from going deeper
on one pass, or running more passes.`},

  { n:23, sec:29, title:"Deployment in Omni",
    note:`And this is not just a case study.
I implemented this algorithm in Omni,
a macOS app for local file search.
Completely air-gapped, no network,
written in Swift on MLX.//
The nice part is that the patch vectors
already exist for the file's embedding,
so tagging is one extra matrix multiply.
Effectively free.//
Scan the QR and try it.
I use it every day.`},

  { n:24, sec:24, title:"Every media shape",
    note:`And it is not only images.
The same label matrix,
and the same scoring rule,
cover video and scanned PDFs too.//
For video we take up to thirty-two frames
per segment,
and push them through as one sequence,
so the max pools over space *and* time.//
And for a PDF, each page is just an image.`},

  { n:25, sec:43, title:"The bigger picture",
    note:`So, to summarize.//
In my last talk, I spent test-time compute
to buy *relevance* in search.
In this talk, I spent it
to unlock a new *capability*.
And I think it is fair to call it new,
because people do not usually connect
an embedding model to image tagging.//
Anyway, this is what I have been working on lately,
and I think there is a lot left here.
How far can we go
without ever training the model,
just by building pipelines at test time?//
I think that is a very interesting direction,
especially in the era of agentic search.`},

  { n:26, sec:14, title:"Close",
    note:`The code and the benchmark
are all on GitHub, the QR is there.//
If you find this interesting,
please follow me on X.//
Thank you for your attention.`},

];
