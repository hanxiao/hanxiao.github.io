/* Speaker notes for ttc-embedding-image-tagging-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (25 slides). */
window.NOTES = [
  { n:1, sec:48, title:"Title",
    note:`Good morning, everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*,
and before that I founded and ran *Jina AI*.//
In my last talk, I discussed test-time compute for *search*.
Today I want to push that same idea one step further.
I have a *one billion* parameter embedding model.
It was built for retrieval.
It was *never* trained to tag images.
And yet, with zero training and no second model,
it tags images anyway.
The question for the next fifteen minutes is,
how much of that new capability is really just *test-time compute*?`},

  { n:2, sec:36, title:"Recap: search is test-time compute",
    note:`Let me quickly recap where the last talk landed.
The claim was simple.
You do *not* need a bigger model to get better search.
You take *one frozen encoder*,
and you recombine its geometry at inference.
You split the document, you re-score, you fuse channels, you feed it back.
That extra work at test time *is* the compute.//
So here is the new question.
Beyond buying more *relevance* on the task it was trained for,
can test-time compute produce an entirely *new capability*?`},

  { n:3, sec:45, title:"Three families",
    note:`But first, let me be precise about what test-time compute even *means* here.
Language models scale it in tokens.
Longer chains of thought, more samples.
An embedding model has no tokens to spend.
Its budget takes exactly *three* forms.//
Family *A*. More computation per pass.
You extract more from a *single* forward pass.
Score every patch, fuse channels, subtract priors.
It costs a few matrix multiplies.//
Family *B*. New passes on new views.
You run the frozen encoder *again*, on inputs it has not seen.
Crops of an image. Splits of a document.
That costs full forward passes.//
And family *C*. Re-processing the features.
Whitening, graph propagation, optimal transport.
Most of the recent training-free literature operates *here*.//
This talk is a controlled experiment across all three families.
Two of them scale accuracy with compute.
One of them does *not*.`},

  { n:4, sec:38, title:"The hypothesis",
    note:`Here is the move.
The model is jina-embeddings-v5-omni-nano.
About a billion parameters.
It embeds text and images into *one shared space*, for search.
It has no tagging head.
It has no classifier.
It has no tag list.
It was never trained to answer, what is in this image.//
The standard approach would be, train a head, curate labels, fine-tune.
A second model, more data, more parameters.
This talk does the opposite.
We keep the model completely *frozen*,
and we construct the entire tagger from *test-time compute*.//
If a capability it was never trained for *emerges* purely from inference,
then test-time compute yields *capability*, not merely quality.`},

  { n:5, sec:32, title:"The task",
    note:`The task itself.
Open-vocabulary, multi-label image tagging.
You give it an image, and you get back the words for what is in it.
Not *one* label. *Every* object in the frame.
And not a fixed eighty-class head.
An *open* vocabulary, any word the model knows.//
On the right, two cats on a couch,
and the model returns kitty, cosy, plush, paw.
In eighty-six milliseconds, from a model that never saw a tagging label.`},

  { n:6, sec:30, title:"The rules",
    note:`The rules are strict, and they are the whole point.
Zero training.
No second model.
No WordNet, no dictionary.
No regex, no part-of-speech tagger.//
Every signal has to come from that *one* frozen model.
The label space, the visual features, the word filter, all of it.
The moment you add a curated tag list,
it is no longer the *model* doing the work.`},

  { n:7, sec:48, title:"Architecture",
    note:`Now let me open the model up, because the whole trick lives in this picture.
There are *two entrances* and *one tower*.//
Top lane, the image.
It goes through a frozen vision tower.
Sixteen pixel patches, merged two by two, into vision tokens.
Those tokens are *injected* into a twelve layer bidirectional text tower,
at the image token positions.//
And that tower gives us *two* things.
Capital P. One seven-sixty-eight dimensional row *per patch*,
each one contextualized by the whole sequence.
And small g. The pooled global vector.//
Bottom lane, the labels.
A vocabulary token enters the *same* tower as plain text,
and comes out as a label vector.
Stack all of them, and you get E.
The label matrix.//
Everything lands in *one* space.
So any patch, of any image,
can be scored against *any word the model knows*.
That inner product is the raw material for everything that follows.`},

  { n:8, sec:40, title:"The pipeline",
    note:`Here is the whole tagger on one slide.
Top lane runs *once*, offline.
Encode the vocabulary into the label matrix.
Estimate a background prior.
And build the word gate. We will meet each of these.//
Bottom lane runs *per image*.
One frozen forward pass gives patches and the global vector.
Score them against the labels. That is family *A*, more algebra.
Subtract the prior.
Gate and dedupe.
Top k tags come out. Seventy-five milliseconds.//
And the teal box below is the optional high quality mode.
Fourteen crops, back through the *same* model.
That is family *B*, new passes on new pixels.//
Notice what is *not* here.
No box from family C.
Every box is the frozen model, or plain arithmetic.`},

  { n:9, sec:42, title:"Step 1: vocabulary as label space",
    note:`Step one. Where do the labels come from.
There is no curated tag list.
We take all *one hundred twenty-eight thousand* tokens in the tokenizer,
and we encode each one as text, into the label matrix E.
Now one matrix multiply scores an image against the entire vocabulary.//
But there is a trap here, and it cost us a day.
If you dot the image against the raw *embedding table*, you get garbage.
Tutor, avatar, PyTuple.
The reason is that this model *unties* its input and output embeddings.
The input table lives in a different space than the pooled output.
You have to run each token *through the tower*, as a text string,
to put the labels in the same space as the image.//
The intuition, just use the vocabulary, was right.
But only through the aligned output space.`},

  { n:10, sec:40, title:"Step 2: patch beats global",
    note:`Step two. Where do you *look* in the image.
If you use the one global vector per image, you get a *weak* tagger.
Its mean average precision is only *point two six*.
The single vector gets dominated by the most salient object,
and everything else falls off.//
So instead, we score *every patch row* against the labels,
take the per-label max, and fuse with the global vector.
A small object fires on its *own* patch, and survives.
That jumps the mAP to *point six three*.
Plus zero-point-three-seven, in one line of algebra.//
And here is the test-time compute reading.
This is pure family *A*.
The patches were *already sitting there* in the forward pass.
One extra max over rows. Essentially free.`},

  { n:11, sec:32, title:"Step 3: subtract the prior",
    note:`Step three. A quick de-biasing.
Raw cosine has a base-rate problem.
Some generic words, like bed, or cat,
score high on *almost any* image,
just because they sit close to the image modality.//
So we estimate a per-label prior, mu,
from a handful of neutral background images, once,
and we subtract it.
A word that scores high on *everything* gets centered to zero.
Only the image-specific spikes survive.//
No calibration set. No labels. One offline pass.
It is the lightest correction possible, and it is enough.`},

  { n:12, sec:32, title:"Step 4: word gate and NMS",
    note:`Step four. Cleaning up the output.
The tokenizer *already* knows what a word is.
Byte-level tokenizers mark word starts with a space glyph.
So *space-cat* is a whole word, but *GetComponent* is a fragment.
That one built-in signal filters a hundred-twenty-eight-thousand tokens
down to about *twenty-five thousand* clean words.
No external dictionary.//
Then embedding-based suppression collapses synonyms and translations.
Walk the labels by score,
and keep a word only if its cosine to everything already kept
is below zero point six.
Cat in four languages becomes *one* cat.
Again, no lookup table. Just the geometry.`},

  { n:13, sec:42, title:"Step 5: CWR multi-crop",
    note:`Step five. And this is the important one.
This is the *only* lever that genuinely lifts accuracy.//
We re-encode the image as a grid of *fourteen crops*.
Three by three, plus two by two, plus the center.
Each crop is a full forward pass through the *same* frozen model.
And we take the per-label max across crops.
A small object becomes *large* in whichever crop contains it,
so its signal jumps from weak to strong.//
Look at the photo.
A single pass says wolf, roar, muzzle.
With multi-crop, it recovers the *bear*.//
And one detail matters enormously.
It is per-label *max*, not averaging.
Blind crop averaging actually made things *worse*.
For a small object, only one crop holds the evidence.
The outlier crop is not noise. It *is* the signal.`},

  { n:14, sec:40, title:"One equation",
    note:`Let me now assemble all five steps,
because the entire tagger is *one scoring function*.//
First term. Patch evidence.
Max over patch rows, minus its prior.
Family A. Free. Plus point three seven of mAP.//
Second term. Global context.
The pooled vector, minus its own prior.
Also family A. Also free.//
Third term. The multi-crop max.
Fourteen fresh forward passes.
Family B. Fourteen times the cost, plus point zero seven five.//
Then gate to real words, dedupe by cosine, take the top k.
And that is it.
No head. No logits. No learned threshold.
*Every symbol* in that equation is either the frozen model, or a max.`},

  { n:15, sec:32, title:"Results",
    note:`The numbers, on a hundred and fifty real COCO images
with true multi-label ground truth.//
Global pooling, the weak baseline, mAP point two six.
Patch scoring, point six three.
And with multi-crop, *point seven one*,
with precision at one over *eighty percent*.//
Let me say what that means.
A frozen *retrieval* model,
with zero training and no tagging head,
tags images at eighty-one percent precision at one.
The emergent capability is real.`},

  { n:16, sec:42, title:"The compute-accuracy curve",
    note:`And here is the same result, drawn as a scaling curve.
Accuracy, as a function of where the test-time compute *went*.//
The first gain is large, and it is *nearly free*.
Same pixels, same single forward pass.
We simply extract more from that pass. More computation.
Point two six to point six three.//
The second gain costs real compute.
Fourteen extra forward passes, fourteen x latency,
for another seven and a half points.
Diminishing, but *real*. That is test-time scaling.//
And then look at the pink cluster.
Eight methods that spent their compute *re-processing the features*.
More math, same pixels.
Every single one of them lands at or *below* the baseline.//
Compute only buys accuracy here when it touches *new information*.`},

  { n:17, sec:28, title:"In the wild",
    note:`And it holds up outside the benchmark.
A conference hall, it gets onstage and attendees.
A Porsche interior, it gets leather, steering, seat.
A bear on grass, it gets fur and bear.//
Because the labels come straight from the tokenizer,
you also see multilingual variants, like *carro* for car,
and the occasional fragment.
That is the direct cost of a *zero-annotation* open vocabulary.`},

  { n:18, sec:30, title:"The scientific question",
    note:`Now for the part I actually care about.
The tagger works.
The *scientific* question is, does accuracy keep scaling
with the compute you pour in at test time?//
So we took the twenty twenty-four to twenty twenty-six
training-free literature, and we implemented *all* the obvious upgrades.
They fall exactly into the two remaining families.
Family C, re-process the features.
Family B, feed the model new information.//
Only one of these families works.
The other does nothing, or it collapses.`},

  { n:19, sec:36, title:"The levers chart",
    note:`Here is everything we tried, measured on the same benchmark.
The dashed line is the patch baseline, at point six three five.//
Look at the pink bars.
Changing the layer, collapse.
Whitening, collapse.
Graph label propagation, collapse.
Dirichlet, collapse.
Optimal transport, flat.
Bayesian priors, flat.
Robust crop trimming, flat.//
Every single *advanced* test-time method
either does nothing or *breaks*.
Only one bar goes right of the baseline.
Multi-crop.`},

  { n:20, sec:40, title:"The meta-conclusion",
    note:`So here is the meta-conclusion, and it is the real payoff.//
Every method that *re-processes* the existing features
is a no-op or a collapse.
Why?
Because those methods were designed for
weakly calibrated, *single-label*, two-tower CLIP.
This encoder's space is *already* aligned, already calibrated,
and already multi-label.
There is nothing left to recover by re-arranging it.//
The only thing that moves the ceiling
is *supplying the model with new pixels*.
Family C is the one that does not scale.
Real test-time compute means giving the model more to *look at*,
not re-arranging what it already saw.`},

  { n:21, sec:44, title:"Shipped in Omni",
    note:`And this did not stay a Python study.
It is deployed, in Omni,
a native on-device search app I built, in Swift, on the same frozen model.
Every image on my Mac is tagged this way, today.//
The production story is where the design pays off.
The patch rows *already exist*, for the file's embedding.
So tagging rides the same forward pass.
One extra matrix multiply, against a memory-mapped label matrix.
About zero point six milliseconds per image.
Four percent overhead. Effectively *free* at index time.//
The tags land in the search snippet.
So your photos and videos become findable by *keyword*, not just by vector.
And the background prior calibrates itself,
on device, from the first sixty-four images it sees.`},

  { n:22, sec:46, title:"Every media shape",
    note:`And here is my favorite part of the port.
One label matrix, one scoring rule,
and it covers *every media shape* in the app.//
A plain image is tagged at index time, inside the embedding pass.//
For high quality, a background re-tag pass adds crops.
In production we ship *five* crops instead of fourteen,
because fourteen only adds one point of mAP for triple the cost.
Precision at one goes from point seven seven to *point eight five*.//
Video is the elegant one.
We sample up to thirty-two frames per four-minute segment,
and they go through the tower as *one sequence*.
So the patch max pools over space *and time*.
A bear in one frame of one segment still fires.//
And scanned PDFs render each page to an image,
and take exactly the same path.
Invoice, table, signature, per page.//
The media shape only changes *what counts as a patch*.
Crops for detail. Frames for time. Pages for documents.`},

  { n:23, sec:34, title:"Synthesis",
    note:`Let me tie the two talks together.
One thesis, twice.
A frozen encoder holds *more capability*
than its training objective ever exposes.
And you unlock it with *test-time compute*, not more parameters.//
In the retrieval talk, that bought more *relevance*
on the task it was trained for.
In this talk, it produced an entirely *new task*, tagging,
that the model was never trained for.//
But test-time compute only *scales*
when it supplies the model with *new information*.
Re-processing a representation that is already good yields *nothing*.`},

  { n:24, sec:30, title:"What is new here",
    note:`Quickly, how this sits against the recent literature.
The RAM line trains a tagging model on a curated tag list.
We do zero training, and the labels *are* the tokenizer vocabulary.
TagCLIP uses a two-tower CLIP and the second-to-last layer.
We use one omni model, where the *last* layer is the output space.
PIAA whitens to close the modality gap.
Our image and text are *already* one space, so whitening collapses it.//
The novelty is the *combination*,
plus the fact that we empirically ruled out
all the fancy test-time machinery everyone else is adding.`},

  { n:25, sec:26, title:"Close",
    note:`So this is the idea I want to leave you with.
A frozen model already knows *more* than its objective admits.
And test-time compute is how you *ask*.
But only new information gets an answer.//
The code, the benchmark, and every negative result are on GitHub.
It all runs on a Mac.
Thank you.
I would love your questions.`}
];
