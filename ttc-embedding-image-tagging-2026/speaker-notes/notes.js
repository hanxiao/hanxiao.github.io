/* Speaker notes for ttc-embedding-image-tagging-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (23 slides). */
window.NOTES = [
  { n:1, sec:45, title:"Title",
    note:`Good morning, everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*,
and before that I founded and ran *Jina AI*.//
In my last talk, I discussed test-time compute for *search*.
Today I want to push that same idea one step further,
to image tagging,
with a frozen jina-embeddings-v5-omni model.`},

  { n:2, sec:40, title:"The result, first",
    note:`Let me show you the destination before the route.//
This is a *one billion* parameter embedding model.
It was built for retrieval.
It was *never* trained to tag images.
And yet, here is what it does.
Two cats on a couch, eighty-six milliseconds,
and it returns kitty, cosy, plush, paw.//
On a real COCO multi-label benchmark,
it reaches *eighty-one percent* precision at one.
Its label space is not a curated list.
It is the model's own tokenizer vocabulary,
a hundred and twenty-eight thousand tokens.
And the number of training steps behind this capability is *zero*.//
The rest of this talk answers two questions.
Where does this capability come from,
and *which kind* of test-time compute pays for it.`},

  { n:3, sec:48, title:"Research questions",
    note:`Image tagging is not a new problem, so let me position this precisely.//
Question one.
Can the tokenizer vocabulary replace a curated label set?
The RAM line of work *trains* tagging models over about six thousand curated tags.
TagCLIP and PIAA are training-free, but they *assume* the class list is given.
We ask whether the model's own vocabulary can be the label space.//
Question two.
Can *one frozen model* supply every signal?
Prior training-free work runs on two-tower CLIP,
plus WordNet, dictionaries, part-of-speech tags.
We allow a single frozen omni encoder, and nothing else.//
Question three, the one I care most about.
*Which* test-time compute scales accuracy?
The recent literature bets on re-processing features.
Whitening, label propagation, optimal transport, Bayesian priors.
We measure every one of them against a single alternative,
re-encoding *new crops*.`},

  { n:4, sec:42, title:"Three families",
    note:`Before the method, let me define terms,
because test-time compute means something specific for an encoder.
Language models scale it in tokens.
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
This talk is a controlled experiment across all three.
Two of them scale accuracy with compute.
One of them does *not*.`},

  { n:5, sec:38, title:"Problem setup",
    note:`The setup, stated precisely.
The model is jina-embeddings-v5-omni-nano.
A one billion parameter *retrieval* encoder.
No tagging head, no classifier, no tag list.
It was never trained to answer, what is in this image.//
The task is open-vocabulary, multi-label tagging.
Every object in the frame, from any word the model knows.//
And the rules are strict.
Zero training.
No second model.
No WordNet, no dictionary, no part-of-speech tagger.
The constraint is the experimental control.
Whatever quality appears is attributable to *test-time compute*,
and to nothing else.`},

  { n:6, sec:48, title:"Architecture",
    note:`Now let me open the model up, because the whole method lives in this picture.//
This entire blue block is *one* released checkpoint,
jina-embeddings-v5-omni-nano, and it stays *frozen*.
Inside it there are two internal submodels.
A vision tower, and a text tower.
We never break them apart, and we never retrain them.//
The image path.
An image becomes sixteen pixel patches, merged two by two,
and those vision tokens are *injected* into the bidirectional text tower.
Out come two things.
Capital P, one seven-sixty-eight dimensional row *per patch*,
contextualized by the whole sequence.
And small g, the pooled global vector.//
The text path.
A vocabulary token enters the *same* text tower directly,
bypassing the vision tower,
and comes out as a label vector.
Stack all of them, and you get E, the label matrix.//
Both paths end in the *same* space.
So any patch, of any image,
can be scored against *any word the model knows*.`},

  { n:7, sec:40, title:"The pipeline",
    note:`Here is the complete tagger on one slide.
Top lane runs *once*, offline.
Encode the vocabulary into the label matrix.
Estimate a background prior.
And build the word gate. We will meet each of these.//
Bottom lane runs *per image*.
One frozen forward pass gives patches and the global vector.
Score them against the labels. That is family *A*.
Subtract the prior.
Gate and dedupe.
Top k tags come out. Seventy-five milliseconds.//
And the teal box below is the optional high quality mode.
Fourteen crops, back through the *same* model.
That is family *B*, new passes on new pixels.//
Notice what is *not* here.
No box from family C.
Every box is the frozen model, or plain arithmetic.`},

  { n:8, sec:42, title:"Step 1: the label space",
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
The intuition, use the vocabulary directly, was correct.
But only through the aligned output space.`},

  { n:9, sec:40, title:"Step 2: patch beats global",
    note:`Step two. Where do you *look* in the image.
On the left, the global vector g scored against each label.
One vector, dominated by the most salient object.
Mean average precision, *point two six*.//
In the middle, the truthful picture of what we do instead.
Every *patch row* is scored against the label,
and the per-label max survives.
A small object fires on its *own* patch.
That jumps the mAP to *point six three*.
Plus zero-point-three-seven, in one line of algebra.//
And here is the test-time compute reading.
This is pure family *A*.
The patch features already exist in the forward pass.
One additional max over rows. Essentially free.`},

  { n:10, sec:32, title:"Step 3: subtract the prior",
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

  { n:11, sec:32, title:"Step 4: word gate and NMS",
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

  { n:12, sec:42, title:"Step 5: CWR multi-crop",
    note:`Step five. And this is the important one.
This is the *only* lever that genuinely raises accuracy.//
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

  { n:13, sec:40, title:"One equation",
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

  { n:14, sec:30, title:"Results",
    note:`The full progression, on a hundred and fifty real COCO images
with true multi-label ground truth.//
Global pooling, the weak baseline, mAP point two six.
Patch scoring, point six three.
And with multi-crop, *point seven one*,
with precision at one over *eighty percent*.//
That is the headline number from slide two,
now with the full ablation behind it.`},

  { n:15, sec:28, title:"Qualitative results",
    note:`And it holds up outside the benchmark.
A conference hall, it gets onstage and attendees.
A Porsche interior, it gets leather, steering, seat.
A bear on grass, it gets fur and bear.//
Because the labels come straight from the tokenizer,
you also see multilingual variants, like *carro* for car,
and the occasional fragment.
That is the direct cost of a *zero-annotation* open vocabulary.`},

  { n:16, sec:42, title:"Test-time scaling",
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
Not one of them improves the pipeline it was applied to.//
Compute only scales accuracy when it carries *new information*.`},

  { n:17, sec:40, title:"The levers chart",
    note:`Now, research question three, answered by measurement.
We re-implemented every training-free lever from the recent literature,
on *this* pipeline, on the *same* benchmark.
And to be scrupulously fair,
each bar shows the *change* in accuracy
relative to the pipeline that method was applied to.
The dashed line is zero. No effect.//
Look at the pink bars.
Changing the layer, minus point four eight.
Whitening, minus point five eight.
Graph label propagation, minus point five.
Dirichlet, minus point four seven.
Optimal transport, plus point zero zero six. Noise.
Bayesian priors, exactly zero.
Robust crop trimming, *negative*.//
Every published method
either does nothing or *breaks*.
Only one bar is positive.
Multi-crop re-encoding, plus point zero seven five.`},

  { n:18, sec:40, title:"The meta-conclusion",
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

  { n:19, sec:32, title:"Relation to prior work",
    note:`To place this against the literature, in one table.
The RAM line trains a tagging model on a curated tag list.
We do zero training, and the labels *are* the tokenizer vocabulary.
TagCLIP uses a two-tower CLIP and the second-to-last layer.
We use one omni model, where the *last* layer is the output space.
PIAA whitens to close the modality gap.
Our image and text are *already* one space, so whitening collapses it.//
The contribution is the *combination*,
plus the negative results.
We empirically ruled out
the test-time machinery everyone else is adding.//
And this combination is cheap enough to run on a laptop.
Which brings me to deployment.`},

  { n:20, sec:44, title:"Deployment in Omni",
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

  { n:21, sec:46, title:"Every media shape",
    note:`And here is my favorite part of the port.
One label matrix, one scoring rule,
and it covers *every media shape* in the app.//
A plain image is tagged at index time, inside the embedding pass.//
For high quality, a background re-tag pass adds crops.
Two by two with fifteen percent overlap, plus the center.
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

  { n:22, sec:34, title:"Synthesis",
    note:`Let me tie the two talks together.
One thesis, twice.
A frozen encoder holds *more capability*
than its training objective ever exposes.
And you unlock it with *test-time compute*, not more parameters.//
In the retrieval talk, that produced more *relevance*
on the task it was trained for.
In this talk, it produced an entirely *new task*, tagging,
that the model was never trained for.//
But test-time compute only *scales*
when it supplies the model with *new information*.
Re-processing a representation that is already good yields *nothing*.`},

  { n:23, sec:26, title:"Close",
    note:`So this is the idea I want to leave you with.
A frozen model already knows *more* than its objective admits.
And test-time compute is how you *ask*.
But only new information gets an answer.//
The code, the benchmark, and every negative result are on GitHub.
It all runs on a Mac.
Thank you.
I would love your questions.`}
];
