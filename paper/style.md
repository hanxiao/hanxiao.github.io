# STYLE.md

Writing rules for the omni-macos paper (`main.tex`, `short.tex`), reconstructed from every
instruction Han gave on style, tone and structure between 2026-07-26 and 2026-08-07
(sessions `683e03ae`, `0fa96710`, `eac03107`).

Every rule below cites the original wording verbatim, typos included, with the date it was said.
Where the same rule was repeated, the repetitions are listed too: repetition is itself the signal
of how strongly it is held.

---

## 0. The one-line summary

**Lean and mean. Academic register, never blog. Final state, never process. No negative results.
Remove beats rewrite.**

> "Trivial things should use less words and be lean and mean." (2026-07-30)

> "less is more, we dont have to justify everything we design" (2026-08-04)

> "Less is more. Less is confident" (2026-08-05)

---

## 1. Register and tone

### 1.1 It is a paper, not a blog post

The very first style verdict, and the one repeated most often:

> "Also find some very good system paper and learn their title abstract intro, section writing
> style, flow, etc. I think atm urs read like a blog post" (2026-07-26)

> "overall the writing bold section title, paragraphs sections is very like a tech blog not like a
> paper. please refer to datroom those best paper structure and writing style to fix the styling."
> (2026-08-02)

> "Probably read more best system papers (three of four) from top-tier ai conf and learn their
> narrative process, writing flow, section titles subsection structuring and title abstract intro
> conclusion writing style and tone and then revise our work" (2026-07-27)

> "okay review the full paper again, make sure none of the forementioned issues i pointed out
> exist. also 'Where the funnel overtakes the scan' i said many times, dont go for this kind of
> blog tone" (2026-08-06)

Consequences:
- Section and subsection titles must not be blog headlines. "What X is", "Where X overtakes Y",
  "How the pieces fit together" are all rejected forms.
  > "Sect 4.2,4.3 title sounds like blog tone, those what xxx is very blog tone title, avoid that"
  > (2026-08-05)
- No bold paragraph lead-ins as a structuring device.
  > "i said many times to explcitily avoid this kind of paragraph bold blog style writing
  > setructure, yet u still do that" (2026-08-02)

### 1.2 The language must read as human and natural

> "Overall, the paper is very hard to read somehow, the language is not really natural for some
> reasons." (2026-08-02)

> "i still feel over all language tone feels very weird, machine like not really some
> human-written stuff." (2026-08-02)

> "fix all these werid expressions as below, rewrite them in a natural academic tone." (2026-08-06)

### 1.3 First person for what we did

> "'Every measurement below refuses to start on a machine that is hot,' i think it's better to
> write things in first person like we only benchmark ... when...; passive experiment writing
> feels weird" (2026-08-06)

---

## 2. The four banned prose patterns

This list was given by name and then re-issued verbatim at least four separate times
(2026-08-04 x2, 2026-08-06, 2026-08-07). Treat it as the standing checklist:

> "do also pay attention to the language overall, every sentence avoid those weird expressions i
> see:
> - The clipped-fragment pattern
> - Riddle metaphores
> - Staccato fragment list
> - Causal idioms." (2026-08-04, repeated 2026-08-06, 2026-08-07)

### 2.1 Clipped-fragment pattern

The "A, single-word" appositive tail, and comma-stacked trailing clauses.

> "also i see u r using 'Figure 1 shows the shipping interface, annotated. ' this A, signle word
> style wrigting tone which i really dont like in academmic paper" (2026-08-04)

Examples fixed: "shows the shipping interface, annotated" became "shows the interface as a user
sees it"; "no forward pass, on any file the index holds, with nothing re-encoded" lost its stacked
comma tails; "Real edits fall between." and "Section 4.2 reports where." had their dangling
referents completed.

### 2.2 Riddle metaphors

Sentences whose meaning has to be decoded. Han's strongest reaction of the whole revision:

> "can we remove all these riddle stuff from the paper, i really hate it" (2026-08-02)

> "'Nothing here changes the network or the vectors it produces.' Nothing change wrt what,
> jina-v5-omni-nano, you should make it it clear instead of being a riddle man." (2026-08-03)

> "'Launches are merged wherever the shapes allow' riddle style, what is launch???" (2026-08-04)

> "'The one change that removes arithmetic rather than rescheduling it narrows the final layer to
> the rows that survive pooling' riddle 'A rather than B' style language, hard to read."
> (2026-08-04)

> "the encoder section is very badly written. 'The network is the reference network and the vectors
> it produces are the reference vectors; what differs is how the work is issued to the GPU.' i dont
> know what is this? what does this even mean?" (2026-08-02)

And the escalation: an unclear riddle sentence is usually not worth rewriting at all.

> "i mean some of the generuinely unclear riddle sentences probably dont even worth a rewrite,
> delete them can be leaner." (2026-08-06)

Fixed examples: "Table 8 is the licence" became "justifies the choice"; "the resource the rest of
this paper is spent protecting", "sets the mechanism its hardest test", "which is what it exists to
do", "quietly resurrect a stale vector", "The files are alive" were all made plain statements.

### 2.3 Staccato fragment list

Verbless lists after a colon, telegraphic caption heads.

Examples fixed: "Nothing leaves the machine: no file, no query, no vector." was folded into the
preceding sentence; "Finder throughout: Quick Look, reveal, drag out" became a full clause;
caption heads like "Median of 40 queries per rung, 6 GB cap pinned, same seeded vectors" and
"Same binary, arms interleaved" were written out.

### 2.4 Casual idiom

Fixed examples: "leave the building" to "leave the premises"; "pick it up" to "use it"; "three ship
policies" to "three per-machine defaults"; "the pins" to "the pinned settings"; "starts to pay" to
"overtakes the exact scan".

### 2.5 Overused contrastive constructions

> "do also check similar experessions like that, including those over used 'rather than', 'a not
> b', 'instead of' long sentence" (2026-08-06)

---

## 3. Word and micro-style rules

| Rule | Original expression |
| --- | --- |
| No possessive apostrophe-s | "over all in the full paper avoid x's expression I don't think that's common in academic paper" (2026-08-04) |
| No verb-as-noun | the bare verb-nouns "an encode", "a bit compare", "the rescore", "encoder forwards" were spelled out (2026-08-06) |
| No dismissive throwaway qualifiers | "'Every file the crawler accepts is chunked and embedded by the encoder, whatever its type, ' wtf mean ' whatever its type, ' here in this sentence, i really hate such expressions." (2026-08-06) |
| No anthropomorphic ownership framing | "' each one indexing the files of its own owner.' weird expressions, how about just local files, also can we globally remove the idea of 'owner' i dont think 'owner' of 'files of its owner' make any sense in the paper" (2026-08-06) |
| Say the real technique, not a poetic paraphrase | "also 'and a map of a folder laid out by meaning.' here u mean umap/pca right? then just write them edireclty" (2026-08-06) |
| Use the professional term, not an amateur one | "in the intro: place ... into a single vector space is so amatuer, it should be embed ... into the same representation space." (2026-08-06) |
| Use vendor-official terminology with citation | "then we probbaly should learn apple offical doc and use unified memory term professionally." (2026-08-02) |
| Question dated vocabulary | "'corpus' is very 2010 pre deep learning, I'm not really sure this is the right word today and for this paper?" (2026-08-02) |
| Be specific, never vague | "'Operating system macOS 26.x ' be specific man," (2026-08-04) |
| No emojis, no em dashes (global standing rule) | "dont use emdash, keep ui text lean & mean" (2026-06-19), and CLAUDE.md |
| Sentence length ceiling | roughly 40 words; long stacked-clause sentences were repeatedly flagged as "way to long and too details" (2026-08-04) |

---

## 4. What must never appear in the paper

### 4.1 No exploration, iteration or process narrative

> "You shouldn't write the version upgrade, exploring, withdrawing process in the paper. The paper
> reflects the final state of omni-macos, not the exploring processes. I see in many sections and
> overall writing philosophy is like, yeah we did that, but it's wrong/useless so it is not really
> used. In this case, just don't write about those rejected ideas." (2026-08-02)

> "mid thinking, upgrades/iterations on the experiment design, architect design, algorithm design,
> any intermeidate steps that internally u and i discussed shouldn't be exposed in the paper. our
> paper is a 'final state' of what we discussed and built, not some diary or logs" (2026-08-06)

> "Clear ur mind. , and start read the paper like a completely new first time paper, recognizing
> the logical flow, negative defensive writing styles and other M3 over describing problem,
> 'reference model' 'reference box', thought process/iterative process leaking issue in the paper"
> (2026-08-03)

### 4.2 No negative, inconclusive or self-undermining results

Stated more forcefully than any other rule:

> "no negative/dubious/inconclusiove result, to me those arent contributionn at all. anyone can do
> bunch of work and say hey it didnt work, that's not a contribution thats a skill issue."
> (2026-08-04)

> "avoid negative and inconclusive results or claims that decorated as some kind of negative
> lessons learned contribution" (2026-08-03)

> "this expression is really weird, 'defends', 'give up',, That pair, in-process encoding and a
> shared device, is what this paper defends. What it gives up is any system to compare against./.
> can we not saying this, just remove experession like this, i dont like any negative dubious
> result mentioned in the paper." (2026-08-03)

> "in general io dont like these weak statement that gives reader dubious or confusing ideas, check
> out the full paper, inconclusive statement or saying that yeah we did that here's caveat so u
> should not read that seriously thingys should be removed." (2026-08-07)

> "I dont think u need to rerun the benchmark on local m3 its done and one patch changes nothing,
> just analyze both result and put into paper. Again no negative results plz" (2026-08-02)

Corollary: the limitation section was deleted entirely rather than softened.
> "okay can u reduce the content in limitation section and see if u can solve them in the paper? i
> want to completely elimnate that section." (2026-08-02)

### 4.3 No prompt, instruction or internal-workflow leakage

> "'Sample counts differ by row and are reported rather than assumed.' this is clearly a prompt
> leaked into the content, plz remove those things" (2026-08-06)

> "'All five columns come from one merged export set.' thses are leaked prompt/instuction/internal
> workflow that shouldn't be writtne in the paper" (2026-08-06)

> "the reference box should be just m3 ultra, i think 'reference box/setting' is your code comment
> but get leaked into the paper" (2026-08-02)

### 4.4 No exhaustiveness or completeness promises

> "please restructure the sentence so it no longer promises exhaustiveness." (2026-08-02)

Also: the evaluation harness and the measurement suite are not contributions.
> "'An evaluation of each mechanism' and ' A portable measurement suite carried inside' is not
> really some contributions, they are basically added for this paper writing for completeness in
> terms of academic research, therefore in anywhere of the paper, they should not be mentioned as
> contribution." (2026-08-02)

> "Plz remove things like measurement suite ships inside the product from every section this is
> not worthy to mention." (2026-08-05)

### 4.5 No spoilers of the evaluation before the evaluation

> "Also do not disclose the results/benchmark before the experiment section." (2026-08-02)

> "In general, I have seen you try to spoiler the experimental result that should be in eval
> sesction or appendix section. Dont do that. You should avoid disclose these numbers or even refer
> to them before sect 4, bc the readers aren't sure the eval setup yet." (2026-08-07)

> "'Section 4.7 measures the split on three machines.' Should probably be removed or delayed. Same
> as '' which Figure 4 measures on all three machines.'' As we shouldn't disclose those experiment
> in section 2 constraints." (2026-08-02)

> "i said the design the impl should not disclose experiments or describe an observation/numbers
> that only apply to one machine, check those comprehensively and remove them" (2026-08-07)

### 4.6 Never overfit the prose to one machine or one corpus size

> "Make sure to update all tables and charts that needed to be updated also in the paper main
> content do not overfit your conclusions numbers observations into m3 only" (2026-08-02)

> "We need to stop explicitly mention 'three Macs' in other sections besides experiment sections, I
> may add four, five Macs so it's better not overfit our writing to three Macs. Same as a live
> index about 'a million chunks'" (2026-08-04)

> "This seems also unnecessary to mention plz go through whole a paper and see if any unnecessary
> description about m3 ultra like these" (2026-08-03)

---

## 5. Trimming discipline: lean and mean

### 5.1 Removal beats rewriting

> "you have to look at every line, line by line, think if it's neceesary to keep there, does it
> really necessary for the paragraph for the section for the paper. remove or rewrite it in a
> leaner acedmic expression if necessary. remove>rewite. but every sentence u remove u have to
> think about its consequence at pargraph level, section level and article level. if they make
> paper unclear or hide important msg we want to send then u have to think twice" (2026-08-06)

> "focus on the sentences, removing>rewriting but be super careful on both local and global impact
> when removing sentence. from abstract, sentence to sentence, all the way down to the conclusion"
> (2026-08-07)

### 5.2 Proportionality: trivial things get few words

> "but isn't filename a super basic thing so not worthy a whole big section for it?" (2026-07-30)

> "do a full review of the paper make sure we r not writing similar simple idea common sense like
> filename search using big section as if we r first one solving them or making big deal of it.
> That looks stupid. Trivial things should use less words and be lean and mean." (2026-07-30)

> "'Filenames are a second channel. ' this is overstated, make this paragraph leaner. It's not a
> 2nd channel, it's just we support filename search by blah blah" (2026-08-04)

### 5.3 Kill duplication, local and remote

> "see if there's possibility to merge them without losing clarity meanwhile improving the reading
> smoothness flow. i feel sometimes we are repeatedly talking the samething again and again in
> multiple places. pay attention to that. read the paper multiple times, before revising.
> duplication could be at nearby paragraph level, or nearby sentence level" (2026-08-02)

> "we can remove this sentence ... this is duplicated in iintro, wdyt." then "see if anyother
> section has this issue" (2026-08-07)

### 5.4 Merge stubby paragraphs

> "in general, scan those small paragraphs with only 2 or three sentences and see if there's a
> chance to merge into nearby pargraphs with some smoothly rewriting." (2026-08-07)

> "Let's focus on the paper I think we need to merge some sections, currently there are way too
> many h1 sections" (2026-07-27)

### 5.5 Connective and boundary paragraphs must earn their place

> "please check and read every paragraph especially those connection paragraphg, starting, ending
> paragraphs, make sure they serve what they intend to, not just duplicate the content or speaking
> some nonsense, or do spoiler early on some late experiment, conclusions" (2026-08-02)

> "Pay attention to connection paragraphs and their writing styles, if u find some paragraphs just
> wasting words to explain simple stuffs try to rewrite them lean and mean." (2026-08-03)

### 5.6 Page-limit work is prose work, not layout tricks

> "i know theres other tricks layout optimization things, but for now i dont want u to use
> savetrees or sth. okay maybe start with savetrees least aggressive version first to set up a
> baseline and then work sentence by sentence. including everysection and fig and table caption.
> you can also move some paragraphs/sentences into appendix but also dont created a lot of
> fragmeneted appendix section taht's brainless cheating" (2026-08-06)

> "plz be aware that big visual diff maybe desk rejected by neurips workshop chair, so u have to be
> passive-aggressive" (2026-08-07, on savetrees aggressiveness)

---

## 6. Narrative and structure

### 6.1 Build the storyline from what a reader already knows

The core narrative instruction of the whole revision:

> "I think you need to work on the overall narrative storyline: okay what general
> readers/reviewers know? They know embedding model, multimodal embedding model, vector db, apple
> silicon and m-chip, and related embedding/vectordb SaaS; what they probably dont know is can we
> have everything running locally on this consumer hardware effectively for daily work. And what
> could be the issues/design problems/performance problems. Then this paves the way for how we
> design macOS can run both high-end/low-end apple silicon using fixed vram contraint. And then our
> mechaissm 1,2,3,4, etc to clearly explain each problem's corresponding solution." (2026-08-02)

> "For each meachnisim you also need to explain it nicely from simple/intutive stuff down to deep
> stuff." (2026-08-02)

### 6.2 Write against an implicit reader-question list

> "A natural well-educated person when comes to this topic will think about:
> - What embedding model you are using for handling text, image, audio
> - What types of files are you going to enable for search and index
> - What's the diff between a local filesystem semantic search system and an online sass? frequent
>   file changes? Need a watcher? Memory cap so it can run quietly in the background without making
>   system lag?
> - How these local file system affect the design and use of vector db?
> - Are you going to enable real-time reindex, instant search (type while search), find similar,
>   tagging, and how they affect or can fit into your existing design?
> - Is omni-macos usable on Both low-end and high-end macOS, what's the benchmark?
>
> I may not have the full list of questions yet, but I think you get the idea, you should first
> think when given the similar topic, how would you do, and keep down a questions list, and then
> follow that list in your mind (not write them down explicitly in the paper) to write the
> storyline of the paper. This will make the paper much easier to read and follow." (2026-08-02)

### 6.3 One job per section, and the reader must be able to tell

> "for me it is unclear the relationship of section2 and section 3, it seems that section3 is the
> main design explainer but something has been pre disclosed in section 2?" (2026-08-02)

> "so what is section2 then? system feature description or sth? if so we should probably change the
> section/subsection title to make it clearer. this applies to all section subsection title."
> (2026-08-02)

> "Always remember sect 2 is always about features." (2026-08-04)

> "Too tech details ... Probably dont explain this tech details in section 2." (2026-08-04)

Settled division:
- Introduction: problem, constraints, contributions, roadmap.
- Section 2 (System): features only, what the user sees, no mechanism, no numbers.
- Section 3 (Design and implementation): the mechanisms, ordered by system layer, encoder first.
- Section 4 (Evaluation): one headline result plus a small number of deep dives.
- Appendix: everything supporting, each item referenced from the main body.

> "i think sect 3.1 has to be the otpimization u made to the embedding model vs vanilla hf mlx
> model from our offical omni repo. in general, im expecting model, indexer, searcher, and other
> things, u mentioned in section 3. but things like model should be put first." (2026-08-02)

> "also i think now u can move three constaints directly into introduction section so taht we can
> remove the constraint subsection completely, and sect 2 is only about the system, much cleaner"
> (2026-08-02)

### 6.4 Ordering defects are real defects

> "make sure the full paper paragraph's logical order still smooth for example, i found the
> 'finding an encoder' paragraph sounds weird when put after omni-macos. this is just my first
> galance, probably tehres are some more that shares similar problem: sentences make snese, but the
> order (paragraph order or section order) are wrong?" (2026-08-07)

> "hmm i mean e.g. 'Figure 1 shows how the pieces fit together.' shouldn't this section be put
> after sect. 2.1? which is more logical? ... as the reader dont know what peiceses and dont know
> what the system looks like yet. logical flaws like this u need to find out and revise them do u
> agree?" (2026-08-02)

> "why 'Indexing never reaches a final state,' starts a new paragraph?" (2026-08-07)

### 6.5 Titles follow one convention

> "okay review all section title, subsection title and make sure they follow the same conventiion
> and thought process." (2026-08-02)

> "The current title looks like an opinion article" (2026-07-26, on the paper title)

---

## 7. Per-section rules

### Abstract
> "also shorten the abstract a bit, make it lean & mean, not too much spoiler" (2026-08-02)

> "In generals I think we expose too many deep details that make abstract very hard to understand,
> try to shorten and simplify it." (2026-08-03)

> "we can remove this ... (challengs, not worthy in abstreact) from the abstract to make it leaner,
> but u probably need to revise the proceeding sent a bit to make it smoother" (2026-08-06)

> "plz remove In a search engine that embeds text, code, documents, images, audio and video into
> one representation space, almost every component assumes a server. in abstract and dont use
> parentless in abstract" (2026-08-07)

Also: state plainly that we present omni-macos.
> "It's unclear that we propose/build omni-macos and 'the engine' refers to omni-macos's engine,
> same in the introduction. Did u do this intentionally of academic writing? Or u missed it"
> (2026-08-04)

### Introduction
> "Overall I think intro section may over disclose spoiler of section 2 and section 3, maybe move
> some of the contents from intro sect to sect.2/sect 3." (2026-08-02)

> "The two items under 'We contribute the following' is also hard to understand, can u read the
> paper again and rewrite/repurpose two contributions." (2026-08-03)

> "The intro section should end with a simple connection paragraph saying the remaining structure
> of the paper is blah blah." (2026-08-03)

Word-level corrections given for the intro, useful as a model of the preferred register:
> "One encoder => one multimodal encode; happens on 'a machine' => multi-tasking operating system
> is better? ... 'The machine belongs to its owner, who is doing something else on it' => better
> say the operating system/machine is almost always multitasking by its owner/user. I feel
> multi-tasking os is well-accepted concept. ... 'And the memory is unified' this need to be more
> accurate as it only holds for Apple computer devices" (2026-08-04)

### Evaluation
The design principle for the whole section:

> "remember the idea of experiment is not of explaining performance diff and obs on diff macs,
> thats pointless. its always about using these obs to explain/justify our design (if its
> positive). saying oh m3 has this number, m4 has this number blah blah is useless in the main
> content" (2026-08-06)

> "I think u need to rethink and revise section 4 deeply. It's too long and some narratives r out
> dated. Think one major experiment result/table. Design and write that, the others r either
> ablation or auxiliary minor experiments or studies." (2026-08-03)

> "We have to recognize the benchmark is on real live personal files ofc its diff person to person
> but that makes eval real." (2026-08-04)

> "focus on the most important stuff in ablation study" (2026-08-04)

> "In general, in section 4, do not cref section 3's content anymore, if u want to say sth just say
> it no need to backward cref the prev section. We dont want to create a lot of cross/back links."
> (2026-08-07)

### Related work
> "Also don't make related work like comparison with a lot of number details, I don't think that's
> common in writing related work section" (2026-08-05)

> "shorten related work a bit, without losing any important info" (2026-08-07)

> "remove all section 3 cref in related work section" (2026-08-07)

### Conclusion
> "Also think in this line of change the mindset behind and improve the conclusion be lean and mean
> and strong" (2026-08-05)

> "Also conclusion is a bit to long" (2026-08-05)

> "Conclusion section: merge 2 paragraphs into 1. Also plz compare the contributions in og main.tex
> intro section and see if we can move some of the contributions stuff into this conclusion
> section. I feel like 'The engineering problem was running a ...' Paragraph is just restating the
> problem and it's not explicitly state our contribution" (2026-08-07)

### Appendix
> "The section title should be appendix and the table in there should not be leaked into main
> content. Can u check the right way to place neurips appendix" (2026-08-03)

> "plz do make sure that everytime we have sth in the appendix at least there's a ref from main
> content ref to that section in the appendix ... Do make sure appendix also have to be logical,
> easy to read and lean and mean" (2026-08-03)

> "now that all floats are in appendix, make sure to sort them correctly as their first
> appearance/mention order in the appendix" (2026-08-07)

---

## 8. Cross-references, floats and citations

| Rule | Original expression |
| --- | --- |
| Introduce a float with a sentence, not a parenthetical | "for tables and figure first get introduced, dont use (figure x/table x) in parentless. instead using a natural sentence like figure/table x illustrates/describes/depicts ... this rule should apply overall throughout the paper." (2026-08-07) |
| Same, phrased earlier | "'for a single item (Figure 3).' -> 'as illustrated in Figure 3'" (2026-08-04) |
| Be sparing with cross-references generally | "can we be a bit conservative using this kind of (Section 3) thing in the main content & appendix ... i mean this is a paper not a html page with full of cross links." (2026-08-06) |
| Never point at the immediately following section by number | "in section a.b u shouldn't refer section a.(b+1) explicity, instead u should write sth like 'as we shall see in the next section' thing as transition. fix problems like this all over the paper" (2026-08-06) |
| Use smart refs | "can we use smart ref so u dont have to write section/figure/table before the \\ref and the link automatically extend to Section x.y instead of just link on x.y" (2026-08-04) |
| Keep link colorboxes | "wait why u remove those colorbox around href/cref?" (2026-08-07) |
| Cite the model papers on first mention | "Omni model first mention should cite Florian paper make sure of that" (2026-08-05) |
| Footnote the repo at first mention | "Omni-macos GitHub link should be put into the first time omni-macos get mentioned in the footnote." (2026-08-02); "in the footnote of the first page, we can just write in the foonote 'opensource under apache 2 licen at https://github.com/hanxiao/omni-macos." (2026-08-03) |
| Footnotes stay short | "footnote about image tagging is way way too long" (2026-08-04) |
| Drop footnotes that record un-swept settings | "Unnecessary footnote 'The debounce interval, the activity window and the reduced batch size were set once and not swept.'" (2026-08-04) |

Naming and macros:
> "my instituie would be jina ai by elastic, with by in itatlic. the app name should be omni-macos
> the model name should be jina-embeddings-v5-omni-nano/-small those shopuld be texttt macro
> wrapped so we can reuse them everytime they got mentioned." (2026-08-02)

---

## 9. Figures and tables

### 9.1 Captions
> "Fig 2 caption is too long probably make it lean and mean." (2026-08-05)

> "also plz make sure float caption is not overdescribing sth that already described in the
> table/figure or in the main content. like for tables one should read describe details of table
> cell by cell. also make sure the unit is clear, e.g. ms, what x axis means, y axis means, those
> stuff are clear to the readers." (2026-08-06)

> "also pay attention to the figure & table caption many captions are so long that i worried about
> duplicated info alrteady described in the paper content. plz go through all figur, table caption,
> thik hard and make them lean & mean a bit." (2026-08-04)

> "without losing any important info, lets shorten all fig/table caption a bit to save some lines."
> (2026-08-07)

### 9.2 Tables
> "why I don't see some nice numerical table/figue but a table of full of natural language text
> man?" (2026-07-26)

> "can u make every table in the experiment include all machinese?" (2026-08-02)

> "for all tables plz sort machine column by recency first" (2026-08-06)

> "In table 1 probably also mention the manufacturer year in the column header. Also I don't really
> like using italic row for sep, probably add hline before." (2026-08-05)

> "Actually I think we can remove the subgroup title in table 1 as caption probably already
> mentioned those" (2026-08-05)

> "look at each table and think about bold each row's best number, not only for table 1 but all
> tables in eval & appendix" (2026-08-07)

> "probably move filename query to the top row in table 1 as it is cpu only (and implicilty serve
> as a baseline)" (2026-08-07)

> "Table 1 is not really important or informative, u should move it to appendix" (2026-08-03)

### 9.3 TikZ figures: the grid-and-layers method

The method was formalised into the public `tikz-figure` skill at Han's instruction. Original spec,
in Chinese (2026-08-02):

> "1. 先创建grid system, 密度根据图像复杂度来订 制定一个color scheme作为全局参考。
> 2. 充分理解图像要求，创建相应的图层。类似photoshop的图层，下层的就是背景，上层的就是上面，不同语义元素对应放在不同的图层上，这种对于那种结构化的语义非常有帮助
> 3. 绘图时，一个图层一个图层的向上构建，相同图层之间的所有元素不可以相互遮挡什么，并且统一color code.
> 4. 连接线必须从同一个图层的元素的边到达同一个元素的边，方向性要保持美观 一致。
> 5. 文字不能相互遮挡，也不能越出所在元素的边界。慎用颜色和bold和uppercase. 字体统一。如果所有的都被强调了那就是没有强调。
> 6. 自己输出成png先看看是否有问题，如果有排版、美观、遮挡的问题重复步骤1开始一步一步思考如何修复。"

English restatements of the same rules:

> "When making architecture graph, do it layer by layer from bottom to up, like in photoshop, make
> sure enough padding and between elements on the same layer. Ensure nice color palette with diff
> dims on the layer/block/element bg. Connectors only on same layer" (2026-07-27), clarified: "no I
> mean layers like photoshop layer semantics aka depth not architecture layer" (2026-07-27)

> "i think you should first use grids system, and then draw components following that grid system,
> as well as the connector curves/lines they should also follow the grid system. this will make
> them look cleaner and tidier." (2026-08-02)

> "also plz be conservative using bold/uppercase, if everythging in bold/uppercase then nothing
> gets emphaiszed" (2026-08-02); "same as color code/scheme if everything is in color, then nothing
> gets empahasized. also a cross the whol;e paper we should follow one color cheme" (2026-08-02)

> "Use modern design language to modernize your tikz meanwhile keep very accuracy especially when
> position, alignment, hierarchy has actual meaning from the algorithm" (2026-08-02)

> "make sure text is not exactly on the border line otherwise we lost some of design feeling of the
> figure. Make sure of that as well as no empty space around the figure so latex can render them
> max visually." (2026-08-02)

> "i mean u should look at padding in your grid system and visually look at the tikz result,
> repeate multiple iterations, make sure enough padding between elements/texts/ and no overlapp
> make texts unreadable." (2026-08-02)

> "unify the x-padding and y-padding between same-level element and overall design. forget about
> connection lines first, first arrange the blocks/elements/pannels, finally rebuild the connection
> lines" (2026-08-07)

> "can u make all arrow emits from the right edge of the block if their final destination is on
> their riught?" then "i mean emit from the vertical center of the right edge" (2026-08-07)

> "Figure 3 can u use black text instead of everything grey, only make less important text gray?"
> (2026-08-04)

> "for figure 2 make sure the text, connections, layers blocks are correct according to our paper,
> code, experiments, and insights, don't miss any path or block or connections but also don't add
> any nonexistent element." (2026-08-04)

> "cant u see some text are overflow?" (2026-08-02)

### 9.4 Screenshot figures
> "for figure 1 screenshot with annotation ... can we use black 折线 annotation and black annotation
> line with rounded circle on both end to accurately annotate? Also on the annotation text, first
> line bold black text the short feature naming, 2nd line regular black text brief description of
> the feature and the section number (clickable). Try to avoid connection line collision. One
> annotated labels has maximum one connection line" (2026-08-04)

> "Also pay attention to the screenshot round border, I think u didn't use Xcode/swift/Mac native
> way to take the screenshot, therefore the round border radius doesn't look perfect" (2026-08-04)

---

## 10. Facts, numbers and grounding

> "Assumptions are the enemy. Never guess numerical values - benchmark instead of estimating."
> (standing rule, CLAUDE.md)

> "Plz ground our source code and probably see if our sec 3.4 is accurate enough." (2026-08-04)

> "'Host-side optimization has almost nothing to reclaim, so we do not pursue it' this is wrong,
> this is only bc we have spent so many iterations and optimized the encoder so nothing can be
> further optimized, it doesn't mean one can just download HF model and run and get same
> performances." (2026-08-02)

> "also are u sure omni small is 1.6b? go ahead check original paper" (2026-08-07)

> "'The accelerator does not preempt. ' what accelerator preempt tho? Lack of references."
> (2026-08-02), and the follow-up test of whether a claim is really a hardware constraint: "if
> nvidia chip does not support The accelerator preempt, then it is no surprising apple silicon also
> not preempt, right? so this is not a hardware constrain?" (2026-08-02)

> "did u test if this stands in practice, does it work really?" (2026-08-02, on a limitation claim)

---

## 11. How to run a revision pass

### 11.1 Read the whole paper first, twice, with your own eyes

> "You probably need to read 2times the code and paper before revision" (2026-07-30)

> "read the paper multiple times, before revising" (2026-08-02)

> "Revise it again by first reading paper twice" (2026-08-03)

> "btw i think u shouldnt use regex for this task, u should read the full paper urself and
> understand sentence by sentence and then see if any of those weird expressions ... need to be
> fixed" (2026-08-06)

> "i mean can't u read everything into context to review insteadd of using some heuristic scans"
> (2026-08-02)

### 11.2 Bird view first, then details, then reconnect

> "revise the full paper again and see if anything missing, birdview first, then details, pay
> attention to everything, connect everything, keep in mind what neighbour pargraph/sections and
> remote pair, like intro<>conclusions" (2026-08-06)

> "okay reread the whole paper and see if the overall logical flow is better now, or see if we have
> some same confusion i pointed out as in sect2&3 but exist somewhere else deeply." (2026-08-02)

### 11.3 Generalise from every comment; never fix only the instance

> "I pointed out the following bc I only read it so far, but issues like below could exist
> somewhere else, so make sure to deeply understand the logical behind my changes & revisions, and
> do a through revisions, not limited to the things I mentioned below" (2026-08-03)

> "find similar language issues in other section and fix them as well" (2026-08-04)

> "anything like these that should be removed? do a through check" (2026-08-06)

> "see if anyother section has this issue" (2026-08-07)

### 11.4 Do not stop early, do not work half the paper

> "why stop, plz work on all sections" (2026-08-02)

> "u nwab what about other sections? did u review them" (2026-08-02)

> "Follow the same strict standard and review every sentence in this paper again" (2026-08-03)

> "I think I need to read and determine each sentence in section, no lazy plz be lean and mean."
> (2026-08-03)

### 11.5 Do not copy the wording of the instruction into the paper

> "note thate dont use my exact word in this comment, think deeply and in a global view before
> revision." (2026-08-02)

> "Sth in this line, not my exact word." (2026-08-04)

### 11.6 After every change, propagate

> "review the whole paper again an make sure other sections, abstract, intro, conclusion, table,
> figure reflect our changes (if necessary) accordingly" (2026-08-02)

> "after that review the full paper again and see if anything else need to be updated accordingly
> bc of the updated of experiment & appendix section, look at sentence by sentence." (2026-08-06)

### 11.7 main.tex and short.tex must stay in sync

> "okay again focus on our logics of fixing in short.Tex vs now main Tex scan again and see if
> anything missing need to be reapply to main tex, including fig tables abstract intro conclusion
> appendix." (2026-08-07)

> "in retrospect, let's look at the og main.tex and compare side by side which u think must be
> fixed in main.tex in terms of languages and facts and errors and duplicated nonsense
> expressions." (2026-08-07)

> "u sure ur migrate our changes to table content from short.tex to main.tex, i dont mean their
> positions but like bold font, Filename query as the first row those kind of changes that we added
> to short.tex they are generally appliable to main.tex right?" (2026-08-07)

> "Let's Compare our short version vs main.tex what is overdeleted or if any, add them back"
> (2026-08-07)

Also, short.tex derives from main.tex by editing, never by round-tripping the PDF:
> "lets start over by just copy main.tex to short.tex ... no savetree just pure copy of main.tex to
> short.tex" (2026-08-06)

---

## 12. Pre-submission checklist

Run through this before any compile that will be sent out.

1. Any sentence matching the four banned patterns (clipped fragment, riddle metaphor, staccato
   fragment list, casual idiom)?
2. Any "rather than", "A not B", "instead of" construction doing work a plain sentence could do?
3. Any possessive apostrophe-s, verb-as-noun, or "whatever its type" style throwaway?
4. Any negative, hedged, inconclusive or self-undermining claim, or a caveat that tells the reader
   not to take a result seriously?
5. Any process, iteration, rejected idea or internal discussion visible?
6. Any prompt or code-comment vocabulary leaked into prose?
7. Any evaluation number, or reference to an evaluation number, before Section 4?
8. Any claim overfit to one machine, one corpus size, or one chip generation outside Section 4?
9. Any paragraph that only restates its neighbour? Any 2-sentence orphan paragraph?
10. Any float introduced as a bare "(Figure X)" parenthetical? Any caption repeating the body?
    Any missing unit or unlabelled axis?
11. Any forward reference to the immediately following numbered section? Any back-cref from
    Section 4 into Section 3? Any appendix item with no reference from the main body?
12. Any section or subsection title that would fit a blog?
13. Do all figures still pass the grid, layer, padding, no-overlap and emphasis-budget checks after
    the last edit?
14. Are main.tex and short.tex consistent in every fix that applies to both?
