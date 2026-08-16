/* Chart + table data for qwen38-agentic-search-2026.
   Every number here is transcribed from a real artifact. Provenance per block:

   DATA.graphs   paper/private-verifier/tab_profiles.tex  (10 constructed graphs,
                 one 207-document corpus, 18,615 edges audited with no sampling)
   DATA.corr     paper/private-verifier/tab_corr.tex      (Pearson r, Spearman rho
                 of each acceptance metric against measured usability, n=10)
   DATA.serving  github.com/hanxiao/Qwen3.8-27B-UD-Q4_K_XL-L4 README, Table 2
                 (decode tok/s, MTP acceptance, measured 2026-08-14 on one L4)
   DATA.vram     same README, Table 1 (VRAM against --ctx-size on a 24,570 MiB device)
   DATA.a3b      paper/private-verifier/main.tex, Table 1 (Qwen3.6-35B-A3B on one L4)

   NOTHING in this file is an estimate, and nothing here describes a Qwen3.8
   result on the verifier: that evaluation has not been run. */
window.DATA = {

  /* tab_profiles.tex. verbatim = provenance (%), entail = assertion (%),
     usable = measured usability (%), cap = simple directed paths of length >= 3. */
  graphs: [
    {k:'O1',  name:'outcome r1',      verbatim:99.3, entail:54.3, usable:2.5,  cap:0,      edges:1214, cov:100},
    {k:'O2',  name:'outcome r2',      verbatim:13.5, entail:21.8, usable:37.5, cap:260,    edges:1583, cov:100},
    {k:'S1',  name:'struct r1',       verbatim:100.0,entail:18.3, usable:14.8, cap:39000,  edges:1352, cov:100},
    {k:'S2',  name:'struct r2',       verbatim:100.0,entail:6.9,  usable:14.3, cap:146000, edges:2811, cov:100},
    {k:'Sv2', name:'struct v2',       verbatim:85.3, entail:41.1, usable:22.5, cap:2000,   edges:326,  cov:100},
    {k:'P1',  name:'step r1',         verbatim:44.0, entail:56.9, usable:27.5, cap:443000, edges:2904, cov:71},
    {k:'Pb',  name:'step batch',      verbatim:37.5, entail:60.3, usable:20.0, cap:164000, edges:2301, cov:68},
    {k:'H1',  name:'hybrid r1',       verbatim:69.7, entail:36.5, usable:22.5, cap:500000, edges:2784, cov:95},
    {k:'H2',  name:'hybrid r2',       verbatim:42.2, entail:64.1, usable:15.0, cap:142000, edges:2200, cov:100},
    {k:'R',   name:'recipe',          verbatim:10.8, entail:93.1, usable:27.5, cap:41000,  edges:1144, cov:28}
  ],

  /* tab_corr.tex */
  corr: [
    {metric:'Document coverage',        kind:'common', r:-0.34, rho:-0.42},
    {metric:'Duplicate-free',           kind:'common', r:-0.18, rho:-0.22},
    {metric:'Groundedness, verbatim',   kind:'common', r:-0.74, rho:-0.74},
    {metric:'Edge count',               kind:'common', r: 0.04, rho: 0.00},
    {metric:'Groundedness, entailment', kind:'ours',   r: 0.05, rho: 0.25},
    {metric:'Capacity, log10 paths',    kind:'ours',   r: 0.29, rho: 0.15},
    {metric:'Entity-entity share',      kind:'ours',   r:-0.01, rho: 0.01}
  ],

  /* Qwen3.8-27B-UD-Q4KXL-MTP, one NVIDIA L4 24 GB, ctx 104,192, p-min 0.40. */
  serving: [
    {w:'summarization', tps:24.63, acc:0.810},
    {w:'math',          tps:24.54, acc:0.803},
    {w:'multi-turn',    tps:23.69, acc:0.798},
    {w:'code',          tps:23.67, acc:0.810},
    {w:'chat',          tps:23.24, acc:0.762},
    {w:'prose',         tps:22.96, acc:0.736},
    {w:'json',          tps:22.92, acc:0.725}
  ],

  /* VRAM against context on a 24,570 MiB device (README Table 1). */
  vram: [
    {ctx:'65,536',  used:21500, free:3070},
    {ctx:'90,112',  used:23138, free:1432},
    {ctx:'98,304',  used:23684, free:886},
    {ctx:'102,400', used:23956, free:614},
    {ctx:'104,192', used:24076, free:494, sel:true},
    {ctx:'104,448', used:null,  free:null}
  ],

  /* Qwen3.6-35B-A3B (Q4_K_XL + MTP) on one L4, main.tex Table 1. */
  a3b: [
    {w:'math',          tps:100.4, acc:0.90},
    {w:'code',          tps:94.6,  acc:0.80},
    {w:'summarization', tps:94.3,  acc:0.80},
    {w:'prose',         tps:93.8,  acc:0.78},
    {w:'json',          tps:93.7,  acc:0.79},
    {w:'multi-turn',    tps:93.1,  acc:0.78},
    {w:'chat',          tps:92.3,  acc:0.77}
  ]
};
