/* Speaker notes for ttc-embedding-image-tagging-2026. window.NOTES[i] = {n, sec, title, note}
   Teleprompter script. Every line is a COMPLETE, natural sentence you read aloud.
   Annotations:  line break = breathe / pause   *word* = stress it   // = a longer beat
   No dashes. Keep 1:1 with index.html (20 slides). */
window.NOTES = [
  { n:1, sec:48, title:"Title",
    note:`Good morning, everyone.
My name is Han Xiao.
I run the model training and inference team at *Elastic*,
and before that I founded and ran *Jina AI*.//
Last time I was on this stage, I talked about test-time compute for *search*.
Today I want to push that same idea somewhere stranger.
I have a *one billion* parameter embedding model.
It was built for retrieval.
It was *never* trained to tag images.
And yet, with zero training and no second model,
it tags images anyway.
The question I want to answer is,
how much of that new skill is really just *test-time compute*?`},

  { n:2, sec:40, title:"Recap: search is test-time compute",
    note:`Let me quickly recap where the last talk landed.
The claim was simple.
You do *not* need a bigger model to get better search.
You take *one frozen encoder*,
and you recombine its geometry at inference.
You split the document, you re-score, you fuse channels, you feed it back.
That extra work at test time *is* the compute.//
So here is the new question.
Instead of squeezing more *relevance* out of that frozen model,
can we squeeze out an entirely *new task*?`},

  { n:3, sec:44, title:"The move: emergent skill",
    note:`Here is the move.
This model is jina-embeddings-v5-omni-nano.
It is about a billion parameters.
It embeds text and images into *one shared space*, for search.
It has no tagging head.
It has no classifier.
It has no tag list.
It was never trained to answer, what is in this image.//
The naive path would be, train a head, curate labels, fine-tune.
A second model, more data, more parameters.
This talk does the opposite.
We keep the model completely *frozen*,
and we manufacture the whole tagger out of *test-time compute*.//
If a skill it was never trained on *emerges* purely from inference,
then test-time compute is buying *capability*, not just quality.`},

  { n:4, sec:36, title:"The task",
    note:`First, the task itself.
Open-vocabulary, multi-label image tagging.
You give it an image, and you get back the words for what is in it.
Not *one* label. *Every* object in the frame.
And not a fixed eighty-class head.
An *open* vocabulary, any word the model knows.//
On the right, two cats on a couch,
and the model returns kitty, cosy, plush, paw.
In eighty-six milliseconds, from a model that never saw a tagging label.`},

  { n:5, sec:34, title:"The rules",
    note:`The rules are strict, and they are the whole point.
Zero training.
No second model.
No WordNet, no dictionary.
No regex, no part-of-speech tagger.//
Every signal has to come from that *one* frozen model.
The label space, the visual features, the word filter, all of it.
The moment you add a curated tag list,
it is no longer the *model* doing the work.//
The constraint forces every ounce of this new skill
to come from test-time compute over the geometry that is already there.`},

  { n:6, sec:34, title:"The model",
    note:`A word on the model.
An image goes through a frozen vision tower,
then a bidirectional text tower,
and out comes a *single* seven-hundred-sixty-eight dimensional vector.
The same model handles text, audio, and video too.//
The key fact is this.
Image and text land in the *same* space.
So you can score an image *directly* against words.
That shared geometry is the raw material for everything that follows.`},

  { n:7, sec:34, title:"The pipeline",
    note:`Here is the whole pipeline on one slide.
Offline, just once, we encode the tokenizer vocabulary into a label matrix.
Then, per image,
we score the patches and the global vector against those labels,
we subtract a prior,
we optionally boost with multi-crop,
and we filter down to real words.//
The thing to notice is that *every* box
is either the same frozen model or plain arithmetic.
There is nothing else in here.`},

  { n:8, sec:42, title:"Step 1: vocabulary as label space",
    note:`Step one. Where do the labels come from.
There is no curated tag list.
We take all *one hundred twenty-eight thousand* tokens in the tokenizer,
and we encode each one as text.
Now any image can be scored against the entire vocabulary at once.//
But there is a trap here.
If you dot the image against the raw embedding table, you get *garbage*.
Tutor, avatar, PyTuple.
The reason is that this model *unties* its input and output embeddings.
The input table lives in a different space than the pooled output.
You have to encode each token *as a text string*
to put the labels in the same space as the image.//
The intuition, just use the vocabulary, was right.
But only through the aligned output space.`},

  { n:9, sec:40, title:"Step 2: patch beats global",
    note:`Step two. Where do you *look* in the image.
If you use the one global vector per image, you get a *weak* tagger.
Its mAP is only *point two six*.
The single vector gets dominated by the most salient object,
and everything else falls off.//
So instead, we score *every patch* against the labels,
and take the per-label max, fused with the global vector.
A small object fires on its *own* patch, and survives.
That jumps the mAP to *point six three*.
That is a plus zero-point-three-seven swing.//
This is the classic "the single vector is not enough" result,
confirmed on this encoder.
And notice, no new pixels. Just multi-pass compute over the same features.`},

  { n:10, sec:34, title:"Step 3: subtract the prior",
    note:`Step three. A quick de-biasing.
Raw cosine has a base-rate problem.
Some generic words, like bed, or cat,
score high on *almost any* image,
just because they sit close to the image modality.//
So we estimate a per-label prior from a handful of background images, once,
and we subtract it.
Only the true spikes survive.//
No calibration set. No labels. One offline pass.
It is the lightest correction possible,
and it is enough, because the space is already well aligned.`},

  { n:11, sec:34, title:"Step 4: word gate and NMS",
    note:`Step four. Cleaning up the output.
The tokenizer *already* knows what a word is.
Byte-level tokenizers mark word starts with a space glyph.
So *space-cat* is a whole word, but *GetComponent* is a fragment.
That one built-in signal filters a hundred-twenty-eight-thousand tokens
down to about *twenty-five thousand* clean words.
No external dictionary.//
Then embedding-based suppression collapses synonyms and translations,
cat in four languages, into one,
using cosine in the model's own space.
Again, no lookup table. Just the geometry.`},

  { n:12, sec:40, title:"Step 5: CWR multi-crop",
    note:`Step five. And this is the important one.
This is the *only* lever that genuinely lifts accuracy.//
We re-encode the image as a grid of *fourteen crops*,
three by three, plus two by two, plus the center,
through the *same* frozen model.
And we take the per-label max across those crops.
A small object becomes *large* in whichever crop contains it,
so its signal jumps from weak to strong.//
Look at the bear on the right.
A single pass says wolf, roar, muzzle.
With multi-crop, it recovers the *bear*.//
This is test-time augmentation done *right*.
Full coverage grid, and per-label max.
The outlier crop is not noise. It is the *evidence*.`},

  { n:13, sec:34, title:"Results",
    note:`Here are the numbers, on a hundred-fifty real COCO images
with true multi-label ground truth.//
Global pooling, the weak baseline, mAP point two six.
Patch scoring, point six three.
And with multi-crop, *point seven one*,
with precision-at-one over *eighty percent*.//
Let me say what that means.
A frozen *retrieval* model,
with zero training and no tagging head,
tags images at eighty-one percent precision-at-one.
That is the emergent skill, and it is real.`},

  { n:14, sec:32, title:"In the wild",
    note:`And it holds up outside the benchmark.
A conference hall, it gets onstage and attendees.
A Porsche interior, it gets leather, steering, seat.
A bear on grass, it gets fur and bear.//
Because the labels come straight from the tokenizer,
you also see multilingual variants, like *carro* for car,
and the occasional fragment.
That is the honest price of a *zero-annotation* open vocabulary.`},

  { n:15, sec:38, title:"The scientific question",
    note:`Now for the part I actually care about.
The tagger works. Fine.
But the *scientific* question is the same one from the retrieval talk.
Does accuracy keep *scaling* with the compute you pour in at test time?//
So we took the obvious upgrades from the twenty twenty-four to twenty twenty-six
training-free literature, and we implemented every one of them.
They fall into two families.
One family *re-processes* the features you already have.
The other family *feeds the model new information*.//
Only *one* of these two families works.
The other does nothing, or it collapses.`},

  { n:16, sec:36, title:"The levers table",
    note:`Here is everything we tried, measured on the same benchmark.
The dashed line is the patch baseline, at point six three five.//
Look at the pink bars, on the left.
Changing the layer, collapse.
Whitening, collapse.
Graph label propagation, collapse.
Optimal transport, flat.
Bayesian priors, flat.
Dirichlet, collapse.//
Every single "advanced" test-time method
either does nothing or *breaks*.
Only one bar goes *right* of the baseline.
Multi-crop.`},

  { n:17, sec:40, title:"The meta-conclusion",
    note:`So here is the meta-conclusion, and it is the real payoff.//
Every method that *re-processes* the existing features
is a no-op or a collapse.
New layer, whitening, cross-class softmax,
label propagation, optimal transport, Dirichlet, robust trimming.
All of them.//
Why? Because those methods were designed for
weakly calibrated, *single-label* CLIP.
This encoder's space is *already* good, and *already* multi-label.
There is nothing left to recover by re-arranging it.//
The only thing that moves the ceiling
is *feeding the model new pixels*, with the crops.
Real test-time compute here means giving the model more to *look at*,
not re-processing what it already saw.`},

  { n:18, sec:36, title:"Synthesis",
    note:`Let me tie the two talks together.
One thesis, twice.
A frozen encoder holds *more capability*
than its training objective ever exposes.
And you unlock it with *test-time compute*, not more parameters.//
In the retrieval talk, that bought more *relevance*
on the task it was trained for.
In this talk, it bought an entirely *new task*, tagging,
that it was never trained for.//
But test-time compute is *not* a free lunch.
It only pays off when it feeds the model *new information*.
Re-processing a representation that is already good buys you *nothing*.`},

  { n:19, sec:34, title:"What is new here",
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

  { n:20, sec:30, title:"Close",
    note:`So this is the idea I want to leave you with.
A frozen model already knows *more* than its objective admits.
And test-time compute is how you *ask*.//
The code is all on GitHub, single-model, runs on a Mac.
Thank you.
I would love your questions.`}
];
