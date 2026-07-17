/* data.js - every number extracted verbatim from the project result files
   (docs/findings-v5omni-nano.md, docs/accuracy-design-memo.md, docs/ttc-paper-eval.md,
    eval/eval_coco.py on COCO-150, 80-category closed set). Nothing estimated. */
window.DATA = {

/* ---- COCO-150 method progression (the four rows of the README results table) ---- */
"methods": [
  {"name":"global pooled",  "tag":"[CLS]-style",       "p1":0.433, "p3":0.289, "r5":0.449, "map":0.264, "kind":"weak"},
  {"name":"patch max",      "tag":"a = 0.7 fusion",    "p1":0.753, "p3":0.427, "r5":0.631, "map":0.635, "kind":"mid"},
  {"name":"softpool",       "tag":"T = 0.05",          "p1":0.773, "p3":0.449, "r5":0.649, "map":0.608, "kind":"mid"},
  {"name":"+ CWR multi-crop","tag":"--hq, 14 crops",   "p1":0.813, "p3":0.476, "r5":0.680, "map":0.710, "kind":"win"}
],

/* ---- the mAP story as a simple ladder (global -> patch -> +CWR) ---- */
"ladder": [
  {"label":"global pooled",   "sub":"one vector per image", "map":0.264, "kind":"weak"},
  {"label":"patch max + global","sub":"score every patch, fuse", "map":0.635, "kind":"mid"},
  {"label":"+ CWR multi-crop","sub":"re-encode 14 crops, per-label max", "map":0.710, "kind":"win"}
],

/* ---- the levers we tried: what feeds new info (win) vs what re-processes features (fail) ---- */
"levers": [
  {"name":"CWR multi-crop",        "map":0.710, "verdict":"win",  "why":"feeds the model new pixels: a small object fills a crop"},
  {"name":"softpool aggregation",  "map":0.608, "verdict":"flat", "why":"better top-k, lower full ranking; a wash"},
  {"name":"penultimate-layer patches","map":0.16, "verdict":"collapse", "why":"last layer IS the trained output space here"},
  {"name":"softmax-over-classes",  "map":0.636, "verdict":"flat", "why":"cross-class competition not needed"},
  {"name":"whitening / GDA",       "map":0.06,  "verdict":"collapse", "why":"image and text already share one space"},
  {"name":"ZLaP label propagation","map":0.14,  "verdict":"collapse", "why":"graph built on the weak global vector"},
  {"name":"OTTER optimal transport","map":0.699,"verdict":"flat", "why":"scores already calibrated; mass-conservation fights recall"},
  {"name":"BCA adaptive prior",    "map":0.693, "verdict":"flat", "why":"a per-class shift is absorbed by centering"},
  {"name":"EM-Dirichlet",          "map":0.17,  "verdict":"collapse", "why":"simplex normalization destroys multi-label"},
  {"name":"soft-trim crop agg.",   "map":0.671, "verdict":"flat", "why":"the outlier crop IS the signal; do not trim it"}
],
"leverBaseline": 0.635,   // patch fusion baseline that every lever is measured against

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

/* ---- Omni (macOS app) Swift/bf16 port, COCO-150 via omni-verify tageval ---- */
"omni": {"baseP1":0.773, "baseMap":0.645, "hqP1":0.847, "hqMap":0.697}
};
