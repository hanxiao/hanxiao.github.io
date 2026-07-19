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

  { n:2, sec:44, title:"The result, first",
    note:`Let me show you the destination before the route.//
These are nine real files from this Mac Studio.
A mountain vista. A thermostat. A receipt. A drink carton.
A store shelf. Sunglasses. A tablet teardown.
A workshop stage. A birthday card.//
Every card shows the top *five* tags, completely unfiltered,
produced by a *one billion* parameter embedding model
that was built for retrieval, and *never* trained to tag.
You even see the occasional odd word. Nothing is cherry picked.
Seventy-five milliseconds per image, on this machine.//
And notice the vocabulary.
*Harga*, Indonesian for price, on the store shelf.
*Fiyat*, Turkish, on the receipt.
The label space is the tokenizer itself,
a hundred and twenty-eight thousand tokens, no curated list.//
On a real COCO benchmark this reaches
*eighty-one percent* precision at one. Training-free.//
The rest of this talk answers two questions.
Where does this capability come from,
and *which kind* of test-time compute pays for it.`},

  { n:3, sec:38, title:"Problem formulation",
    note:`Let me state the problem precisely.//
Given. One embedding model, jina-embeddings-v5-omni-nano.
About a billion parameters. Image and text in one space.
And one image.//
Output. Words for *every* object in that image.
Multi-label. Open vocabulary.//
Frozen. All weights.
This is a retrieval encoder.
No tagging head, no classifier. Never trained for this.//
Allowed. Inference-time computation over the model's own outputs.
And *nothing* else.
Training-free. No second model. No dictionaries, no POS taggers.//
So whatever tagging ability appears
must come from *test-time compute of the embedding model*.
That is the game.`},

  { n:4, sec:44, title:"Where new information comes from",
    note:`Before the method, one piece of vocabulary,
because at first glance the options all look the same.
A frozen encoder's inference budget takes roughly three forms.//
Family *A*, a deeper pass.
Read more of the one pass you already ran.
Every patch vector, not just the pooled one.
If you did retrieval, you know this. Late interaction. ColBERT.
The information is reclaimed from inside the pass.//
Family *B*, more passes.
Run the frozen encoder *again*, on new views.
Split a document. Crop an image. Re-encode.
The information is acquired from the input.//
Family *C*, bootstrap.
Transform the vectors you already have.
Whitening, propagation, optimal transport.
Nothing new enters.//
Same frozen encoder in all three.
The difference is only what enters the computation.`},

  { n:5, sec:36, title:"Two research questions",
    note:`Two questions, in increasing depth.//
Question one.
Can a frozen embedding model *become* an image tagger,
through test-time compute alone?
Prior work pays for tagging with training or with resources.
The RAM line trains over curated tags.
TagCLIP and PIAA are training-free,
but they assume the class list is *given*,
and they lean on WordNet and part of speech tools.
We allow none of that.//
And question two, if it can.
*Which* test-time compute scales its accuracy?
Re-processing features, family C, where the literature bets?
Or new information, families A and B?`},

  { n:6, sec:48, title:"Architecture",
    note:`Now let me open the model up, because the whole method lives in this picture.//
This entire blue block is *one* released checkpoint,
jina-embeddings-v5-omni-nano, and it stays *frozen*.
Inside it there are two internal submodels.
A vision tower, and a text tower.
We never break them apart, and we never retrain them.//
The image path.
An image becomes sixteen pixel patches.
The patch is the vision tower's *internal* unit, not a crop.
Those patch tokens are *injected* into the bidirectional text tower.
Out come two things.
Capital P, one row per patch,
and each row is shaped by attention over the *whole* image.
And small g, one vector for the whole image,
pooled from the last token of that same sequence.//
The vocabulary path.
This one runs *once*, offline.
All hundred twenty-eight thousand tokens go through the *same* text tower,
and the results are cached as E, the label matrix.
At test time, only the *image* path runs.//
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
On the right, what we do instead.
Every patch row is scored against *every* label,
and each label keeps its max over the patches.
If you know ColBERT, this *is* late interaction.
Patches play the token vectors. MaxSim per label.
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
The strip under the chart shows the actual pools.
In the study, ordinary photos.
In the app port, *procedural* neutrals.
Gradients, flat fields, noise. No real data needed at all.
A word that scores high on *everything* gets centered to zero.
Only the image-specific spikes survive.//
No calibration set. No labels. One offline pass.
It is the lightest correction possible, and it is enough.`},

  { n:11, sec:32, title:"Step 4: word gate and NMS",
    note:`Step four. Cleaning up the output.
The tokenizer *already* knows what a word is.
Byte-level tokenizers encode a leading space as a special glyph.
That G-with-a-dot on the slide is exactly that glyph.
It is a tokenizer artifact, *not* a rendering error.
A token that starts with it starts a *new word*.
So *space-cat* is a whole word, but *GetComponent* is a fragment.
That one built-in signal filters a hundred-twenty-eight-thousand tokens
down to about *twenty-five thousand* clean words.
No external dictionary.//
Then embedding NMS. Non maximum suppression, in embedding space.
Walk the labels by score,
and keep a word only if its cosine to everything already kept
is below zero point six.
The funnel on the right is the real ranking for the cat image.
Cat, kitten, chatte, cats, all struck out, suppressed by kitty.
Again, no lookup table. Just the geometry.`},

  { n:12, sec:42, title:"Step 5: CWR multi-crop",
    note:`Step five. And this is the important one.
This is the *only* lever that genuinely raises accuracy.//
We re-encode the image as a grid of *fourteen crops*.
And note the distinction.
A patch is the tower's internal unit.
A crop is a new *input image*, which gets re-patchified itself.
Watch the overlay sweep the image.
Three by three, then two by two, then the center.
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
And notice the third term is *recursive*.
S c l is the same patch plus global score,
applied to each crop as a fresh image.//
Then gate to real words, dedupe by cosine, take the top k.
And that is it.
No head. No logits. No learned threshold.
*Every symbol* in that equation is either the frozen model, or a max.`},

  { n:14, sec:40, title:"The equation, over the vocabulary",
    note:`And here is that equation, watched over the *whole* vocabulary.
This is real data, for the cat image. Not a sketch.//
Stage one. The raw fused score, all hundred twenty-eight thousand tokens.
A smooth bell. Every token is *somewhat* close to every image.
There is no signal you can threshold here.//
Stage two. Subtract each token's own prior.
The mass snaps to zero.
What remains on the *right tail* is evidence.//
Stage three. The word-start gate.
A hundred twenty-eight thousand candidates become twenty-five thousand.
The shape survives. The fragments do not.//
And stage four. Zoom into that right tail.
The top eight tokens are kitty, cat, kitten, chatte, kitt, cats, kittens.
*One concept*, in seven forms.
That is exactly what embedding NMS is for.
It keeps one, and the final tags fall out.//
Tagging, in one sentence, is *distribution sharpening*.`},

  { n:15, sec:30, title:"Results",
    note:`The full progression, on a hundred and fifty real COCO images
with true multi-label ground truth.//
Global pooling, the weak baseline, mAP point two six.
Patch scoring, point six three.
And with multi-crop, *point seven one*,
with precision at one over *eighty percent*.//
That is the headline number from slide two,
now with the full ablation behind it.`},

  { n:16, sec:40, title:"Does bootstrapping scale?",
    note:`Now the experiment behind that conclusion.
Every published bootstrap lever, re-implemented, measured on COCO.//
Read the chart as a dumbbell.
Open circle, the pipeline the lever starts from.
Filled circle, where it ends up.//
The two blue bars on top are our own wins.
Five-crop re-encoding, plus point zero five eight.
Fourteen-crop, plus point zero seven five.
Their endpoints, point six nine and point seven one,
are the baselines the other levers start from.//
Take OTTER, optimal transport.
It re-balances the scores toward a target class distribution.
Pure re-arrangement, nothing new.
It sits on the five-crop pipeline, so it starts at point six nine three.
And it moves *nothing*. Plus point zero zero six. Noise.//
Someone always asks, why not run it on fourteen-crop.
Because OTTER only corrects base-rate calibration,
and our prior subtraction already did that.
The crop count underneath does not change the verdict.//
Look at the pink bars.
Whitening, graph propagation, Dirichlet.
Every one collapses, from wherever it starts.
Only feeding new pixels moves right.`},

  { n:17, sec:40, title:"The meta-conclusion",
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

  { n:18, sec:42, title:"The frontier",
    note:`And here is everything on one chart.
Accuracy, against *measured* latency per image. Log scale.//
The frontier runs through four points.
Global only, fifty-two milliseconds, point two six.
Patch fusion, seventy-five milliseconds, point six three.
Five-crop re-encoding, four hundred milliseconds, point six nine.
Fourteen-crop, one second, point seven one.
Read more of the pass, then re-encode new views.//
Now the pink points.
Re-processing costs under a tenth of a millisecond, measured.
So each one sits at the latency of the pipeline it modifies,
at or below the frontier.//
Two honest footnotes.
Softmax over classes lands a thousandth above patch fusion.
Noise level. It is on the frontier anyway.
And OTTER lands six thousandths above five-crop on mAP,
but its precision at three *collapses*, point four five to point three.
That is why it is not adopted.
Free re-arrangement buys noise.
Re-encoding buys seven and a half points.`},

  { n:19, sec:46, title:"Patch-local n-grams",
    note:`One more mode, because open vocabulary invites a harder question.
Can we get *modifiers*, not just nouns?
Without a part of speech tagger, of course.
And I will be precise up front.
Without grammar these are not adjectives, strictly.
They are *region grounded n-grams*.//
Naive phrase scoring fails.
Image to text similarity is bag of words,
so any high scoring word attaches to any noun.//
The trick is *locality*, and there is no adjective list.
Watch it happen for one noun. Kitty.
Pool the patches where kitty fires.
Rank *every* gated word on that region alone.
The top of that list is cat, kitty, kitten.
All within cosine point five five of the noun. Suppressed.
The first survivor is *couch*. So the pair is couch kitty.
Grey, blanket, fleece are right behind, and they win other slots.
The modifier is whatever the object's own pixels support next,
once the noun's concept is removed.
And the construction iterates.
Suppress again, and the next survivor joins.
Couch fleece kitty. Grey blanket cosy.//
And the phrases you see are chosen by *beam search*, the default.
The encoder itself scores each assembled phrase against the region,
and it promotes *grey couch kitty*.
It even prefers attribute *first* order over the alternatives.
Composition emerges from the embedding space.
No grammar anywhere. No benchmark numbers yet.//
Look at the result.
Couch kitty. *Grey* cosy. *Sleeping* crib.
The cats really are grey, and they really are asleep on a couch.
The modifier is tied to the object's *pixels*.//
No grammar anywhere, so a related noun can fill the slot,
like cat plush.
But every pair is grounded in the region it came from.
And it is still family A. Thirty milliseconds extra.`},

  { n:20, sec:40, title:"Beam mechanics",
    note:`Here is the whole search space, drawn as a tree, with real numbers.//
Top left is the phrase template.
Two open slots, then the noun, kitty, fixed.
Slot one fills first, next to the noun.
Slot two prepends in front.
The candidates are the region's surviving words.
And the score of any filled phrase is the encoder's own judgment.
Embed the phrase, dot it with the region, subtract the bare noun.//
Depth one. Fill the first slot.
Couch kitty scores highest. Grey, sleeps, sofa follow.
We keep the top four branches.
The pink branches, fleece, blanket, are pruned. Dead subtrees.//
Depth two. Fill the second slot on each survivor.
And here is the moment I love.
Grey couch kitty, plus point zero nine three.
Couch grey kitty, *same two words*, plus point zero nine one.
The encoder prefers the attribute *first*.
Word order, resolved by an embedding model,
with no grammar anywhere in the system.`},

  { n:21, sec:28, title:"Qualitative results",
    note:`And it holds up outside the benchmark.
Each card shows fourteen-crop re-encoding,
and beam-searched n-grams at two and at three.
All verbatim, unfiltered.//
The Porsche gets carro, rims, windshield, steering.
The conference hall, venue, ceiling, projector.
The corridor, attendees, commuters, demonstrators.
And one miss survives, synagogue.
That is the direct cost of a *zero-annotation* open vocabulary,
and I would rather show it than hide it.`},

  { n:22, sec:32, title:"Relation to prior work",
    note:`To place this against the literature, in one table.
The RAM line trains a tagging model on a curated tag list.
We do zero training, and the labels *are* the tokenizer vocabulary.
TagCLIP uses a two-tower CLIP and the second-to-last layer.
We use one omni model, where the *last* layer is the output space.
PIAA whitens to close the modality gap.
Our image and text are *already* one space, so whitening collapses it.//
Research question one: yes. A frozen embedding model becomes a tagger.
Research question two: only compute that adds information scales it.
The contribution is the *combination*,
plus the negative results.
We empirically ruled out
the test-time machinery everyone else is adding.//
And this combination is cheap enough to run on a laptop.
Which brings me to deployment.`},

  { n:23, sec:44, title:"Deployment in Omni",
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

  { n:24, sec:46, title:"Every media shape",
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

  { n:25, sec:34, title:"Synthesis",
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

  { n:26, sec:26, title:"Close",
    note:`So this is the sentence I want to leave you with.
Scaling test-time compute of an embedding model
unlocks tasks *beyond retrieval*.
But only the compute that carries new information scales.//
The code, the benchmark, and every negative result are on GitHub.
It all runs on a Mac.
Thank you.
I would love your questions.`},

];
