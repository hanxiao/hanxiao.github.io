/* Chart data for the 腾讯云 × Elastic AI 搜索技术大会 deck.
   window.B = test-time image tagging experiment, copied verbatim from
   ttc-embedding-image-tagging-2026/data.js (only the variable name differs).
   The former window.A block (autoresearch program search) was removed on
   2026-08-15 when that project was cut from the talk. */
window.B = {

/* ---- COCO-150 method progression (the four rows of the README results table) ---- */
"methods": [
  {"name":"global pooled",  "tag":"[CLS]-style",       "p1":0.433, "p3":0.289, "r5":0.449, "map":0.264, "kind":"weak"},
  {"name":"patch max + global","tag":"a = 0.7 fusion", "p1":0.753, "p3":0.427, "r5":0.631, "map":0.635, "kind":"mid"},
  {"name":"softpool",       "tag":"T = 0.05",          "p1":0.773, "p3":0.449, "r5":0.649, "map":0.608, "kind":"mid"},
  {"name":"+ CWR multi-crop","tag":"--hq, 14 crops",   "p1":0.813, "p3":0.476, "r5":0.680, "map":0.710, "kind":"win"}
],

/* ---- the mAP story as a simple ladder (global -> patch -> +CWR) ---- */
"ladder": [
  {"label":"global pooled",   "sub":"one vector per image", "map":0.264, "kind":"weak"},
  {"label":"patch max + global","sub":"score every patch, fuse", "map":0.635, "kind":"mid"},
  {"label":"+ CWR multi-crop","sub":"re-encode 14 crops, per-label max", "map":0.710, "kind":"win"}
],

/* ---- the levers we tried, as DELTA vs the pipeline each method was applied to.
   OTTER/BCA ran on the 5-CROP CWR pipeline (base 0.693, measured 407 ms); soft-trim replaced
   max in 14-crop CWR (base 0.710); the rest ran on the patch-fuse baseline (0.635).
   All endpoints verified in docs/ttc-paper-eval.md / accuracy-design-memo.md. ---- */
"levers": [
  {"name":"CWR 14-crop",   "base":0.635,"to":0.710,"fam":"B","verdict":"win",  "why":"re-encodes new pixels: a small object fills a crop"},
  {"name":"CWR 5-crop",    "base":0.635,"to":0.693,"fam":"B","verdict":"win",  "why":"lighter grid; its result is the OTTER/BCA baseline"},
  {"name":"OTTER optimal transport", "base":0.693,"to":0.699,"fam":"C","verdict":"flat", "why":"scores already calibrated; mass conservation fights recall"},
  {"name":"softmax-over-classes",    "base":0.635,"to":0.636,"fam":"C","verdict":"flat", "why":"cross-class competition not needed"},
  {"name":"BCA adaptive prior",      "base":0.693,"to":0.693,"fam":"C","verdict":"flat", "why":"a per-class shift is absorbed by centering"},
  {"name":"soft-trim crop agg.",     "base":0.710,"to":0.671,"fam":"C","verdict":"flat", "why":"the outlier crop IS the signal; do not trim it"},
  {"name":"EM-Dirichlet",            "base":0.635,"to":0.170,"fam":"C","verdict":"collapse", "why":"simplex normalization destroys multi-label"},
  {"name":"ZLaP label propagation",  "base":0.635,"to":0.140,"fam":"C","verdict":"collapse", "why":"graph built on the weak global vector"},
  {"name":"whitening / GDA",         "base":0.635,"to":0.060,"fam":"C","verdict":"collapse", "why":"image and text already share one space"},
  {"name":"softpool aggregation",    "base":0.635,"to":0.608,"fam":"A","verdict":"flat", "why":"better top-k, lower full ranking"},
  {"name":"penultimate-layer patches","base":0.635,"to":0.160,"fam":"A","verdict":"collapse", "why":"last layer IS the trained output space here"}
],

/* ---- latency breakdown (M3 Ultra, MLX), ms per image ---- */
"latency": {"fast":75, "hq":1016},

/* ---- the compute-accuracy curve (slide: does accuracy scale with test-time compute?)
   x positions are compute regimes, not measured ms; ms shown only where measured. ---- */
"compute": [
  {"label":"1 forward pass",        "sub":"pooled vector only",            "ms":null, "map":0.264},
  {"label":"1 pass + patch algebra","sub":"score all patches vs 128k labels &middot; 75 ms", "ms":75,   "map":0.635},
  {"label":"15 forward passes",     "sub":"+ 14 crops re-encoded &middot; 1016 ms",          "ms":1016, "map":0.710}
],
/* the 8 re-processing methods: heavier math on the SAME pixels, all <= baseline */
"reprocess": [0.06, 0.14, 0.17, 0.608, 0.636, 0.671, 0.693, 0.699],


/* ---- vocab-wide score histograms for cat.jpg (REAL pipeline output, 72 bins):
   raw = 0.7*patchmax + 0.3*global (uncentered); cen = prior-centered; gated = cen on the
   25,465 word-start tokens. top = top-8 gated tokens BEFORE NMS (the synonym cluster). ---- */
"vhist": {
 "bins": 72,
 "raw":  {"lo": -0.01, "hi": 0.20, "h": [2,1,5,3,17,25,40,73,122,184,295,442,608,865,1285,1549,2094,2712,3311,3937,4529,5440,6071,6681,7110,7492,7765,7888,7777,8406,6990,6228,5362,4608,3707,3989,2554,1938,1547,1093,865,654,479,354,259,167,178,125,111,75,50,42,37,28,22,20,14,11,5,2,2,4,2,1,1,0,2,0,5,0,0,0]},
 "cen":  {"lo": -0.05, "hi": 0.12, "h": [0,1,1,1,8,5,27,42,81,142,338,525,849,1219,1920,2851,4699,7088,10636,13476,11793,10158,9662,8833,8225,7096,5935,4817,3995,3976,2453,1771,1403,1050,770,575,434,335,243,154,137,109,66,63,61,37,35,28,26,14,17,9,9,10,10,4,8,5,0,1,3,1,1,6,0,1,3,0,2,0,4,3]},
 "gated":{"lo": -0.05, "hi": 0.12, "h": [0,1,0,1,3,3,8,16,30,46,91,119,228,326,493,683,1057,1526,2278,2511,2363,2027,1803,1678,1545,1325,1088,883,751,586,463,346,268,213,173,110,85,67,53,39,32,28,17,12,22,7,9,8,9,3,5,3,3,3,3,3,2,1,0,0,1,1,1,2,0,0,1,0,1,0,2,0]},
 "nGate": 25465,
 "top": [{"t":"kitty","s":0.117},{"t":"cat","s":0.116},{"t":"kitten","s":0.113},{"t":"chatte","s":0.107},{"t":"kitt","s":0.101},{"t":"cats","s":0.100},{"t":"kittens","s":0.098},{"t":"cosy","s":0.095}],
 "final": ["kitty","cosy","plush","crib","paw","sleeps"]
},


/* ---- Pareto: measured ms/img on M3 Ultra (global-only 52 = forward+global scoring, measured
   2026-07-18; patch 75 and 14-crop 1016 from bench_latency). Family-C methods run as batch
   post-processing on cached scores; measured worst-case cost < 0.1 ms/img, so they plot at the
   latency of the pipeline they modify. softmax-over-classes edges patch by +0.001 (noise). ---- */
"pareto": {
 "frontier": ["global","patch fuse","softmax/cls","+CWR 5-crop","+CWR 14-crop"],
 "points": [
  {"name":"global",        "ms":52,   "map":0.264, "fam":"A", "la":"start", "dx":11},
  {"name":"patch fuse",    "ms":75,   "map":0.635, "fam":"A", "la":"end",   "dx":-12, "dy":12},
  {"name":"softmax/cls",   "ms":75,   "map":0.636, "fam":"C", "la":"end",   "dx":-12, "dy":-8},
  {"name":"softpool",      "ms":75,   "map":0.608, "fam":"A", "la":"start", "dx":11,  "dy":8},
  {"name":"penult. layer", "ms":75,   "map":0.160, "fam":"C", "lbl":false},
  {"name":"EM-Dirichlet",  "ms":75,   "map":0.170, "fam":"C", "lbl":false},
  {"name":"ZLaP",          "ms":75,   "map":0.140, "fam":"C", "lbl":false},
  {"name":"whitening",     "ms":75,   "map":0.060, "fam":"C", "lbl":false},
  {"name":"+CWR 5-crop",   "ms":407,  "map":0.693, "fam":"B", "la":"end",   "dx":-14, "dy":18},
  {"name":"OTTER",         "ms":420,  "map":0.699, "fam":"C", "la":"middle", "dx":0,  "dy":-11},
  {"name":"BCA (no-op)",   "ms":407,  "map":0.693, "fam":"C", "la":"start", "dx":16,  "dy":16},
  {"name":"+CWR 14-crop",  "ms":1016, "map":0.710, "fam":"B", "la":"end",   "dx":-12, "dy":-8},
  {"name":"soft-trim",     "ms":1016, "map":0.671, "fam":"C", "la":"start", "dx":11,  "dy":4}
 ]
},

/* ---- Omni (macOS app) Swift/bf16 port, COCO-150 via omni-verify tageval ---- */
"omni": {"baseP1":0.773, "baseMap":0.645, "hqP1":0.847, "hqMap":0.697}
};
