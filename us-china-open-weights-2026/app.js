/* US × CN × EU open-weight LLM knowledge graph
   design system: force-graph v1.43.5, white bg, monochrome #1a1a1a, SF Mono,
   hollow nodes, directional arrows.

   Layout model (2026-09 EU round): the graph is a MAP, not a blob.
   - Fixed region geometry (GEO below): CN, US, EU circles; the US circle nests two
     sub-circles (US MODEL PROVIDERS: google/openai/anthropic/meta + their models;
     US INDUSTRY: every other US company + in-house models). A node lives in exactly
     one region; sub-circles are disjoint.
   - Model providers (CN labs, the 4 US frontier labs, EU labs) get their own
     "provider ring": their models orbit the company (strong follow force); the ring
     is drawn on a separate background canvas at the models' extent.
   - Companies/models are held to their home positions by a per-node-strength home
     force; a hard containment force clamps every node inside its region (and
     sub-region) circle each tick, so circles never leak.
   - Obsolete models (withdrawn from the frontier race, or pre-2024 generations) are
     labeled in models.json and HIDDEN by default (toggle in the sidebar).
   - Model nodes are rounded squares containing the model/org logo; company nodes
     are circles with the company logo (square-vs-circle distinguishes the two).

   Perpetual organic floating (the "animated floating" the layout was asked for):
   d3AlphaMin(0) + cooldownTime(Infinity) keep force-graph's manual rAF engine
   ticking for the life of the page, and the custom 'float' force (makeFloatForce)
   applies an alpha-independent Brownian nudge + weak home spring once the springs
   have settled (alpha < FLOAT.SETTLE), so the graph gently floats inside the
   region rings forever. Drags revive the real springs (force-graph sets
   alphaTarget 0.3 on the inner sim). A region canvas (rings) + nudge() repaints
   on demand (hover, filters, zoom, logo arrival). */
(() => {
'use strict';
const INK = '#1a1a1a';
const TAU = Math.PI * 2;

/* Perpetual organic floating. force-graph (1.43.5) drives the d3-force sim manually in its
   own rAF loop and stops it when: alpha < d3AlphaMin, or wall-time > cooldownTime (15s default),
   or ticks > cooldownTicks (Infinity default). d3AlphaMin(0) + cooldownTime(Infinity) keeps the
   engine ticking for the life of the page. This custom force is the perpetual motion: while the
   layout settles (alpha >= SETTLE) it stays idle so the springs settle cleanly; once (re)settled
   it snapshots each node's position as its "home" and every tick applies a small random nudge
   plus a weak spring pull back home — a bounded, alpha-independent Brownian drift, so the graph
   keeps gently floating like the source project's always-live layout. Drags revive the real
   springs (force-graph sets alphaTarget 0.3 on the inner sim internally), so the layout also
   reacts organically. The contain force keeps the float inside the region rings and collide
   (not alpha-scaled) keeps resolving overlaps. The settle crossing also drives __kgSettled +
   the final fit (onEngineStop never fires with a perpetual engine). */
const FLOAT = { KICK: 0.5, HOME_K: 0.002, SETTLE: 0.05 };
function makeFloatForce() {
  let fns = null, prevAlpha = 1, homesReady = false;
  function force(alpha) {
    if (!fns || !fns.length) return;
    if (alpha < FLOAT.SETTLE && prevAlpha >= FLOAT.SETTLE) {
      for (const n of fns) { n.__hx = n.x; n.__hy = n.y; }
      homesReady = true;
      window.__kgSettled = true;
      if (!userMoved) fitToData(true);
    }
    prevAlpha = alpha;
    if (!homesReady) return;
    for (const n of fns) {
      if (n.fx != null || n._off) continue;
      n.vx += (Math.random() - 0.5) * FLOAT.KICK + (n.__hx - n.x) * FLOAT.HOME_K;
      n.vy += (Math.random() - 0.5) * FLOAT.KICK + (n.__hy - n.y) * FLOAT.HOME_K;
    }
  }
  force.initialize = nodes => { fns = nodes; };
  return force;
}

/* ---------------- region geometry (world units) ---------------- */
const GEO = {
  cn:         { x: -1400, y: 80,    r: 900,  label: 'CHINA' },
  us:         { x: 1490,  y: 320,   r: 1190, label: 'UNITED STATES' },
  usModels:   { x: 1010,  y: -420,  r: 310,  label: 'US MODEL PROVIDERS' },
  usIndustry: { x: 1800,  y: 800,   r: 620,  label: 'US INDUSTRY' },
  eu:         { x: -200,  y: -1000, r: 620,  label: 'EUROPE' },
  community:  { x: -400,  y: 1250,  r: 120,  label: 'COMMUNITIES' }
};
const GEO_TOP = ['us', 'cn', 'eu'];
const GEO_SUB = { us: ['usModels', 'usIndustry'] };
const US_PROVIDERS = ['google', 'openai', 'anthropic', 'meta'];
const EU_PROVIDERS = ['mistral-ai', 'aleph-alpha', 'bigscience'];

const ORIGIN_LABEL = {
  chinese_open: 'Chinese open-weight',
  us_open: 'US open-weight',
  us_closed: 'US closed frontier',
  us_inhouse: 'US in-house',
  undisclosed: 'undisclosed',
  eu_open: 'EU open-weight',
  eu_closed: 'EU closed',
  eu_inhouse: 'EU in-house'
};
const USAGE = ['hosting','production','integration','post_training','developer'];
const KINDS = ['uses','lineage','posted'];
const ORIGIN = ['chinese_open','us_open','us_closed','us_inhouse','undisclosed','eu_open','eu_closed','eu_inhouse'];
const CONF = ['high','medium','low'];

const state = {
  usages: new Set(USAGE),
  origins: new Set(ORIGIN),
  confs: new Set(CONF),
  regions: new Set(GEO_TOP),
  kinds: new Set(KINDS),
  showObsolete: false,
  noedge: false,
  cnOnly: false,
  q: ''
};
let showNodeLabels = true;
let showEdgeLabels = false;

let nodes = [], links = [];
let nodeById = new Map();
const imgCache = new Map();
let selected = null, hoverNode = null, hoverLink = null, userMoved = false, nudging = false, progZoomUntil = 0;
let selectedSet = null, hoverSet = null;
let graph;
let ringProviders = [];           // company nodes that own a provider ring
const ringR = new Map();         // id -> smoothed ring radius
const CONN_BY_ID = new Map();
function evById(id) { return CONN_BY_ID.get(id) || { evidence: [] }; }
const stats = { squareDraws: 0 };

function nudge() {
  if (!graph || nudging) return;
  nudging = true;
  try {
    progZoomUntil = Math.max(progZoomUntil, performance.now() + 60);
    const c = graph.centerAt();
    graph.centerAt(c.x, c.y, 0);
    drawRegionCanvas();
  } finally { nudging = false; }
}

function neighborSet(n) {
  const s = new Set([n.id]);
  for (const l of links) if (l._on && (l.source === n || l.target === n)) { s.add(l.source.id); s.add(l.target.id); }
  return s;
}

function selectNode(n) {
  selected = n;
  selectedSet = n ? neighborSet(n) : null;
  if (n) renderPanel(n);
  nudge();
}

/* ---------------- data ---------------- */
function phyllotaxis(c, r, i, n, a0 = 0) {
  const a = i * 2.39996323 + a0;
  const rr = r * Math.sqrt((i + 0.5) / n);
  return { x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr };
}

async function load() {
  const get = u => fetch(u, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(u + ' → ' + r.status); return r.json(); });
  const [c, m, x, cm] = await Promise.all([get('data/companies.json'), get('data/models.json'), get('data/connections.json'), get('data/communities.json')]);
  const companies = c.companies, models = m.models, conns = x.connections, communities = cm.communities;

  const cdeg = new Map();
  for (const e of conns) if (e.kind === 'uses') cdeg.set(e.company, (cdeg.get(e.company) || 0) + 1);
  const mdeg = new Map();
  for (const e of conns) {
    if (e.kind === 'uses') mdeg.set(e.model, (mdeg.get(e.model) || 0) + 1);
    else if (e.kind === 'posted') cdeg.set(e.company, (cdeg.get(e.company) || 0) + 1); // posts grow the company, not the model
    else { mdeg.set(e.company, (mdeg.get(e.company) || 0) + 1); mdeg.set(e.model, (mdeg.get(e.model) || 0) + 1); }
  }
  const pdeg = new Map();
  for (const e of conns) if (e.kind === 'posted') pdeg.set(e.community, (pdeg.get(e.community) || 0) + 1);

  const companyById = new Map(companies.map(k => [k.id, k]));
  const providerCompanies = new Set(models.map(k => k.provider).filter(Boolean));
  const ringProviderSet = new Set([...US_PROVIDERS, ...companies.filter(k => k.region === 'cn').map(k => k.id), ...EU_PROVIDERS]);

  // per-provider model lists (for orbits + provider rings)
  const modelsByProvider = new Map();
  for (const k of models) {
    if (!k.provider) continue;
    if (!modelsByProvider.has(k.provider)) modelsByProvider.set(k.provider, []);
    modelsByProvider.get(k.provider).push(k);
  }

  /* ---- node construction + home positions ---- */
  const companyHome = new Map();

  // US frontier providers: 4 seats on a circle inside the US MODEL PROVIDERS sub-ring
  const usProvSeats = { google: -Math.PI / 2, openai: 0, meta: Math.PI, anthropic: Math.PI / 2 };
  for (const id of US_PROVIDERS) {
    const a = usProvSeats[id];
    companyHome.set(id, { x: GEO.usModels.x + Math.cos(a) * 205, y: GEO.usModels.y + Math.sin(a) * 205, sub: 'usModels' });
  }
  // CN providers: 8 seats on a circle inside the CN ring
  const cnComps = companies.filter(k => k.region === 'cn');
  cnComps.forEach((k, i) => {
    const a = (i / cnComps.length) * TAU - Math.PI / 2;
    companyHome.set(k.id, { x: GEO.cn.x + Math.cos(a) * 400, y: GEO.cn.y + Math.sin(a) * 400, sub: null });
  });
  // EU providers: 3 seats on the outer EU circle; EU industry companies phyllotaxis inside
  const euProvSeats = { 'mistral-ai': -Math.PI / 2, 'aleph-alpha': Math.PI * 5 / 6, 'bigscience': -Math.PI * 5 / 6 };
  for (const id of EU_PROVIDERS) {
    const a = euProvSeats[id];
    companyHome.set(id, { x: GEO.eu.x + Math.cos(a) * 380, y: GEO.eu.y + Math.sin(a) * 380, sub: null });
  }
  // remaining companies phyllotaxis inside their region's industry area
  const usIndustry = companies.filter(k => k.region === 'us' && !companyHome.has(k.id));
  usIndustry.forEach((k, i) => {
    companyHome.set(k.id, { ...phyllotaxis(GEO.usIndustry, 560, i, usIndustry.length, 0.6), sub: 'usIndustry' });
  });
  const euIndustry = companies.filter(k => k.region === 'eu' && !companyHome.has(k.id));
  euIndustry.forEach((k, i) => {
    companyHome.set(k.id, { ...phyllotaxis(GEO.eu, 260, i, euIndustry.length, 2.1), sub: null });
  });
  // any straggler region without a home (defensive): park at region center
  for (const k of companies) if (!companyHome.has(k.id)) {
    companyHome.set(k.id, { x: GEO[k.region]?.x ?? 0, y: GEO[k.region]?.y ?? 0, sub: null });
  }

  // model homes: orbit the provider ring (or the owner company for in-house models)
  const orbitIdx = new Map();
  const modelHome = new Map();
  for (const k of models) {
    let idx = orbitIdx.get(k.provider) || 0;
    if (k.provider) orbitIdx.set(k.provider, idx + 1);
    if (k.provider && ringProviderSet.has(k.provider)) {
      const hp = companyHome.get(k.provider);
      const a = (idx / Math.max(1, (modelsByProvider.get(k.provider) || []).length)) * TAU + 0.6;
      modelHome.set(k.id, { x: hp.x + Math.cos(a) * 46, y: hp.y + Math.sin(a) * 46, follow: k.provider, region: companyById.get(k.provider)?.region || 'us', sub: hp.sub });
    } else if (k.provider && companyById.get(k.provider)) {
      const hp = companyHome.get(k.provider);
      const a = (idx % 5) * (TAU / 5) + 1.2;
      modelHome.set(k.id, { x: hp.x + Math.cos(a) * 34, y: hp.y + Math.sin(a) * 34, follow: k.provider, region: companyById.get(k.provider)?.region || 'us', sub: hp.sub });
    } else {
      // hub (llm-unspecified): park at US industry center
      modelHome.set(k.id, { x: GEO.usIndustry.x, y: GEO.usIndustry.y, follow: null, region: 'us', sub: 'usIndustry' });
    }
  }

  nodes = [
    ...companies.map(k => {
      const h = companyHome.get(k.id);
      return {
        id: k.id, name: k.name, _label: cleanName(k.name), type: 'company', rx: 11 + Math.min(9, (cdeg.get(k.id) || 0) * 0.55),
        deg: cdeg.get(k.id) || 0, x: h.x, y: h.y, _data: k, _region: k.region, _sub: h.sub,
        _isRingProvider: ringProviderSet.has(k.id),
        _hx: h.x, _hy: h.y, _follow: null,
        _homeStrength: (ringProviderSet.has(k.id) || (modelsByProvider.get(k.id) || []).length > 0) ? 0.12 : 0.08,
        _dim: false, _off: false, _hit: false
      };
    }),
    ...models.map(k => {
      const h = modelHome.get(k.id);
      const providerNode = h.follow ? null : null; // follow resolved below (node refs)
      return {
        id: k.id, name: k.name, _label: cleanName(k.name), type: 'model', origin: k.origin,
        r: 7 + Math.min(6, (mdeg.get(k.id) || 0) * 0.42), deg: mdeg.get(k.id) || 0,
        x: h.x, y: h.y, _data: k, _region: h.region, _sub: h.sub, _obsolete: !!k.obsolete,
        _hx: h.x, _hy: h.y, _follow: h.follow,
        _homeStrength: 0.45,
        _dim: false, _off: false, _hit: false
      };
    }),
    ...communities.map(k => {
      const d = pdeg.get(k.id) || 0;
      const r = 20 + Math.min(10, d * 0.35);
      return {
        id: k.id, name: k.name, _label: cleanName(k.name), type: 'community',
        r, rx: r, deg: d,
        x: GEO.community.x, y: GEO.community.y, _data: k, _region: 'community', _sub: null,
        _hx: GEO.community.x, _hy: GEO.community.y, _follow: null,
        // pinned at the ring center: the 28 posted-link springs pull it toward the top of
        // the ring (toward the company clusters) and it would sit on the ring-top label.
        // Region rings + labels are static anchors; the community marker follows suit.
        // (fx/fy are cleared by the lib after a user drag, and the home force pulls it back.)
        fx: GEO.community.x, fy: GEO.community.y,
        _homeStrength: 0.7,
        _dim: false, _off: false, _hit: false
      };
    })
  ];
  nodeById = new Map(nodes.map(n => [n.id, n]));
  // resolve follow refs to node objects
  for (const n of nodes) if (n._follow) n._follow = nodeById.get(n._follow);
  // provider ring bookkeeping
  ringProviders = nodes.filter(n => n.type === 'company' && n._isRingProvider);
  for (const p of ringProviders) {
    p._models = (modelsByProvider.get(p.id) || []).map(k => nodeById.get(k.id)).filter(Boolean);
    ringR.set(p.id, p.rx + 20);
  }

  // direction: "uses" arrows point AT the company (the model flows into its adopters);
  // lineage arrows point at the base model (derived -> base)
  links = conns.map(e => {
    const src = e.kind === 'uses' ? nodeById.get(e.model) : nodeById.get(e.company);
    const tgt = e.kind === 'uses' ? nodeById.get(e.company) : (e.kind === 'posted' ? nodeById.get(e.community) : nodeById.get(e.model));
    return {
      id: e.id,
      source: src, target: tgt,
      kind: e.kind,
      usage: e.kind === 'uses' ? e.usage : null,
      confidence: e.confidence,
      _modelOrigin: (nodeById.get(e.model) || {}).origin,
      _sOrigin: (src || {}).origin,
      _tOrigin: (tgt || {}).origin,
      _conf: e.confidence,
      _about: e.kind === 'posted' ? nodeById.get(e.model) : null,
      _dim: false, _on: true
    };
  });
  conns.forEach(e => CONN_BY_ID.set(e.id, e));

  companies.forEach(k => loadLogo(k.id, k.logo));
  models.forEach(k => loadLogo(k.id, k.logo));
  communities.forEach(k => loadLogo(k.id, k.logo));
  buildFilters();
  initGraph();
  applyFilters();
}

function loadLogo(id, logoRel) {
  if (imgCache.has(id)) return;
  const rec = { img: new Image(), done: false, triedFallback: false };
  imgCache.set(id, rec);
  rec.img.onload = () => { rec.done = true; nudge(); };
  rec.img.onerror = () => {
    if (logoRel && !rec.triedFallback) { rec.triedFallback = true; rec.img.src = `logos/${id}.png`; }
    else rec.done = true;
  };
  rec.img.src = logoRel ? `${logoRel}` : `logos/${id}.png`;
}

/* ---------------- filters UI ---------------- */
function buildFilters() {
  const box = (elId, values, set, label, onchange) => {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    values.forEach(v => {
      const l = document.createElement('label');
      l.className = 'check';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = true; cb.value = v;
      cb.onchange = () => {
        cb.checked ? set.add(v) : set.delete(v);
        state.cnOnly = false; syncCnBtn();
        if (onchange) onchange(); else applyFilters();
      };
      l.append(cb, document.createTextNode(label(v)));
      el.appendChild(l);
    });
  };
  const regionCount = r => nodes.filter(n => n.type === 'company' && n._region === r).length;
  box('f-region', GEO_TOP, state.regions,
    v => `${v.toUpperCase()} · ${regionCount(v)}`,
    () => { fitToData(false); });
  box('f-origin', ORIGIN.filter(o => nodes.some(n => n.type === 'model' && n.origin === o)), state.origins, v => ORIGIN_LABEL[v]);
  box('f-kind', KINDS, state.kinds, v => v === 'uses' ? 'uses / hosts' : v === 'lineage' ? 'model lineage' : 'community posts');
  box('f-usage', USAGE, state.usages, v => v.replace('_', '-'));
  box('f-conf', CONF, state.confs, v => v);
}

function syncCnBtn() {
  document.getElementById('btn-cn').classList.toggle('active', state.cnOnly);
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  for (const n of nodes) {
    n._hit = !!q && (n.name.toLowerCase().includes(q) || n.id.includes(q));
    n._off = (n.type !== 'community' && !state.regions.has(n._region))
      || (n.type === 'model' && n._obsolete && !state.showObsolete);
  }

  for (const l of links) {
    let on = true;
    // posted edges also follow their about-model: hiding the model (e.g. obsolete off)
    // hides its community posts too
    if (l.source._off || l.target._off || (l.kind === 'posted' && l._about && l._about._off)) on = false;
    else if (!state.kinds.has(l.kind === 'uses' ? 'uses' : l.kind === 'posted' ? 'posted' : 'lineage')) on = false;
    else if (l.kind === 'uses') {
      if (state.usages.size && !state.usages.has(l.usage)) on = false;
      else if (!state.confs.has(l.confidence)) on = false;
      else if (!state.origins.has(l._modelOrigin)) on = false;
      if (on && state.cnOnly && l._modelOrigin !== 'chinese_open') on = false;
    } else if (l.kind === 'posted') {
      if (!state.confs.has(l.confidence)) on = false;
      else if (!state.origins.has(l._modelOrigin)) on = false;
      if (on && state.cnOnly && l._modelOrigin !== 'chinese_open') on = false;
    } else {
      if (!state.origins.has(l._sOrigin) || !state.origins.has(l._tOrigin)) on = false;
    }
    l._pass = on; // passes the user filters (region/obsolete/kind/usage/conf/origin) —
    // independent of search focus; hover-card and panel counts use this so they
    // stay correct while a search query is live
    if (on && q) on = !!(l.source._hit || l.target._hit);
    l._on = on;
  }

  const active = new Set();
  for (const l of links) if (l._on) { active.add(l.source.id); active.add(l.target.id); }
  for (const n of nodes) {
    if (n._off) continue;
    if (n._hit) { n._dim = false; continue; }
    if (n.type === 'company' && state.noedge) { n._dim = false; continue; }
    n._dim = !active.has(n.id);
  }

  // stats reflect what is currently VISIBLE (region + obsolete filters),
  // connections reflect the edge filters
  const ac = nodes.filter(n => n.type === 'company' && !n._off).length;
  const am = nodes.filter(n => n.type === 'model' && !n._off).length;
  const hiddenObsolete = nodes.filter(n => n.type === 'model' && n._obsolete).length;
  const al = links.filter(l => l._on).length;
  const hits = nodes.filter(n => n._hit && !n._off).length;
  const conn = n => `${n} connection${n === 1 ? '' : 's'}`;
  const ob = hiddenObsolete
    ? ` · <span class="stat-ob" title="${state.showObsolete ? 'click to hide obsolete models' : 'click to show obsolete models'}">${hiddenObsolete} obsolete ${state.showObsolete ? 'shown' : 'hidden'}</span>`
    : '';
  document.getElementById('stats').innerHTML = q
    ? `${hits} match${hits === 1 ? '' : 'es'} · ${ac} companies · ${am} models · ${conn(al)}`
    : `${ac} companies · ${am} models · ${conn(al)}${ob}`;

  if (selected && (selected._dim || selected._off)) {
    selected = null; selectedSet = null;
    document.getElementById('panel').hidden = true;
  }
  nudge();
}

/* ---------------- custom forces ---------------- */
function forceHome() {
  let ns = [];
  function force(alpha) {
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      if (n.fx != null || n._off) continue;
      let hx = n._hx, hy = n._hy;
      if (n._follow) { hx = n._follow.x; hy = n._follow.y; }
      const s = n._homeStrength * alpha;
      n.vx += (hx - n.x) * s;
      n.vy += (hy - n.y) * s;
    }
  }
  force.initialize = n => { ns = n; };
  return force;
}
function forceContain() {
  let ns = [];
  function clampInto(n, cx, cy, R) {
    const dx = n.x - cx, dy = n.y - cy;
    const d = Math.hypot(dx, dy);
    if (d > R && d > 0) {
      const f = R / d;
      n.x = cx + dx * f; n.y = cy + dy * f;
      const ux = dx / d, uy = dy / d;
      const vout = n.vx * ux + n.vy * uy;
      if (vout > 0) { n.vx -= vout * ux; n.vy -= vout * uy; }
    }
  }
  function force() {
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      if (n.fx != null || n._off) continue;
      const pad = (n.type === 'company' ? n.rx : n.r * 1.15) + 12;
      const g = GEO[n._region];
      if (g) clampInto(n, g.x, g.y, g.r - pad);
      if (n._sub) {
        const s = GEO[n._sub];
        clampInto(n, s.x, s.y, s.r - pad - 6);
      }
    }
  }
  force.initialize = n => { ns = n; };
  return force;
}

/* ---------------- graph ---------------- */
function initGraph() {
  const el = document.getElementById('graph');
  graph = ForceGraph()(el)
    .backgroundColor('rgba(0,0,0,0)') /* transparent: region rings on #region-canvas behind must show through */
    .width(el.clientWidth)
    .height(el.clientHeight)
    .nodeLabel(() => '')
    .linkLabel(() => '')
    .nodeCanvasObject(drawNode)
    .linkCanvasObject(drawLink)
    .nodePointerAreaPaint(nodePointerArea)
    .linkPointerAreaPaint(linkPointerArea)
    .onNodeClick(n => { if (n._dim || n._off) return; selectNode(n); })
    .onLinkClick(l => { if (!l._on) return; selectNode(l.target); })
    .onBackgroundClick(() => {
      if (selected) { selected = null; selectedSet = null; document.getElementById('panel').hidden = true; nudge(); }
    })
    .onNodeHover(n => {
      if (n && n._off) n = null;
      hoverNode = n;
      hoverSet = n ? neighborSet(n) : null;
      document.body.style.cursor = n ? 'pointer' : 'default';
      if (n) showNodeCard(n); else hideHoverCard();
      nudge();
    })
    .onLinkHover(l => {
      hoverLink = l;
      document.body.style.cursor = l ? 'pointer' : (hoverNode ? 'pointer' : 'default');
      if (l && l._on) showLinkCard(l); else hideHoverCard();
    })
    .d3AlphaMin(0)          // engine never stops on alpha decay -> perpetual layout
    .d3AlphaDecay(0.02)
    .cooldownTime(Infinity); // ...nor on wall-time (15s default)

  // structural forces: home holds the map; contain clamps circles; charge de-clumps locally.
  // link force is deliberately gentle: it only eases crowding, it must not drag adopters
  // across the map (cross-region edges span ~2500 units; a hard pull piles every CN-adopter
  // onto the usIndustry boundary and companies overlap).
  graph.d3Force('link').distance(l => l.kind === 'uses' ? 300 : l.kind === 'posted' ? 400 : 70).strength(l => l.kind === 'uses' ? 0.02 : l.kind === 'posted' ? 0.03 : 0.06);
  graph.d3Force('charge').strength(-80).distanceMax(300);
  graph.d3Force('collide', window.d3.forceCollide()
    .radius(n => (n.type === 'company' ? n.rx : n.r * 1.15) + 10)
    .strength(1)
    .iterations(3));
  graph.d3Force('home', forceHome());
  graph.d3Force('contain', forceContain());
  // perpetual gentle drift (idle while the layout is settling; see makeFloatForce)
  graph.d3Force('float', makeFloatForce());
  // force-graph seeds its simulation with a default forceCenter(0,0), which rigidly
  // re-centers the whole node cloud on the origin every tick. With home-anchored GEO
  // placement the cloud's centroid sits ~1000 units east of the origin (most nodes are
  // US-side), so the center force drags the entire map west of the region circles.
  // Home positions are absolute, so there is no free-floating cloud to center: drop it.
  graph.d3Force('center', null);

  graph.graphData({ nodes, links });
  progZoomUntil = performance.now() + 1600;
  fitToData(false);

  graph.onZoom(() => drawRegionCanvas());
  graph.onRenderFramePost(() => drawRegionCanvas());
  graph.onZoomEnd(() => {
    if (performance.now() >= progZoomUntil) userMoved = true;
    if (!nudging) graph.flushShadowCanvas && graph.flushShadowCanvas();
  });
  // The engine no longer stops (perpetual float), so onEngineStop never fires; the settle
  // crossing (alpha < FLOAT.SETTLE) inside the float force drives __kgSettled + the final fit.
  graph.onNodeDragEnd(() => { userMoved = true; nudge(); });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    graph.width(el.clientWidth).height(el.clientHeight);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (!userMoved) fitToData(false); else nudge(); }, 160);
  });
}

function fitToData(anim) {
  progZoomUntil = Math.max(progZoomUntil, performance.now() + (anim ? 1200 : 60));
  // frame the visible REGION geometry (nodes are clamped inside it, so this is exact and stable)
  const visible = [];
  for (const key of GEO_TOP) if (state.regions.has(key)) {
    visible.push(GEO[key]);
    if (key === 'us') for (const s of GEO_SUB.us) visible.push(GEO[s]);
  }
  visible.push(GEO.community); // communities are not region-filtered — always in frame
  if (!visible.length) return;
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const g of visible) {
    minX = Math.min(minX, g.x - g.r); maxX = Math.max(maxX, g.x + g.r);
    minY = Math.min(minY, g.y - g.r); maxY = Math.max(maxY, g.y + g.r);
  }
  const PAD = 56;
  minX -= PAD; maxX += PAD; minY -= PAD + 14; maxY += PAD;
  const el = document.getElementById('graph');
  const w = el.clientWidth, h = el.clientHeight;
  const z = Math.min(w / (maxX - minX), h / (maxY - minY));
  graph.zoom(Math.min(z, 1.6), anim ? 900 : 0);
  graph.centerAt((minX + maxX) / 2, (minY + maxY) / 2, anim ? 900 : 0);
}

/* ---------------- region canvas (rings behind the graph) ---------------- */
let regionCanvas = null;
function ensureRegionCanvas() {
  if (regionCanvas) return regionCanvas;
  regionCanvas = document.createElement('canvas');
  regionCanvas.id = 'region-canvas';
  regionCanvas.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none';
  const stage = document.querySelector('.stage');
  stage.insertBefore(regionCanvas, document.getElementById('graph'));
  return regionCanvas;
}

function ringRadiusTarget(p) {
  let maxd = 0, any = false;
  for (const m of p._models) {
    if (m._off || m._dim === undefined) continue;
    any = true;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d > maxd) maxd = d;
  }
  return any ? Math.max(p.rx + 18, maxd + 26) : 0;
}

function drawRegionCanvas() {
  if (!graph || !nodes.length) return;
  const rc = ensureRegionCanvas();
  const gc = document.querySelector('#graph canvas');
  if (!gc) return;
  if (rc.width !== gc.width || rc.height !== gc.height) {
    rc.width = gc.width; rc.height = gc.height;
    rc.style.width = gc.style.width || gc.clientWidth + 'px';
    rc.style.height = gc.style.height || gc.clientHeight + 'px';
  }
  // force-graph v1.43.5 exposes no getZoomTransform(); d3-zoom stores the live
  // transform on the main canvas (__zoom) and updates it every frame, even during
  // animated zooms. Reading it directly keeps the region rings in sync with the view.
  const _z = gc && gc.__zoom;
  const t = _z ? { k: _z.k, x: _z.x, y: _z.y } : { k: 1, x: 0, y: 0 };
  const dpr = window.devicePixelRatio || 1;
  const ctx = rc.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, rc.width, rc.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = t.k, ox = t.x, oy = t.y;
  const sx = wx => wx * k + ox, sy = wy => wy * k + oy;
  const mono = '"SF Mono",ui-monospace,monospace';
  const setSpacing = px => { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; };

  // top-level region rings
  for (const key of GEO_TOP) {
    if (!state.regions.has(key)) continue;
    const g = GEO[key];
    ctx.beginPath(); ctx.arc(sx(g.x), sy(g.y), g.r * k, 0, TAU);
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.font = `700 11px ${mono}`;
    setSpacing(2.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.strokeText(g.label, sx(g.x), sy(g.y - g.r) - 7);
    ctx.fillStyle = INK;
    ctx.fillText(g.label, sx(g.x), sy(g.y - g.r) - 7);
    setSpacing(0);
  }
  // sub-rings
  if (state.regions.has('us')) {
    for (const key of GEO_SUB.us) {
      const g = GEO[key];
      ctx.beginPath(); ctx.arc(sx(g.x), sy(g.y), g.r * k, 0, TAU);
      ctx.strokeStyle = INK; ctx.globalAlpha = 0.3; ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.globalAlpha = 0.6;
      ctx.font = `600 9px ${mono}`;
      setSpacing(1.5);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)';
      const ly = sy(g.y - g.r) + 9;
      ctx.strokeText(g.label, sx(g.x), ly);
      ctx.fillStyle = INK;
      ctx.fillText(g.label, sx(g.x), ly);
      setSpacing(0);
    }
  }
  // community ring (not region-filtered; dashed to set it apart from region rings)
  {
    const g = GEO.community;
    ctx.beginPath(); ctx.arc(sx(g.x), sy(g.y), g.r * k, 0, TAU);
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.1;
    ctx.setLineDash([4, 3]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.6;
    ctx.font = `600 9px ${mono}`;
    setSpacing(1.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)';
    const ly = sy(g.y - g.r) + 9;
    ctx.strokeText(g.label, sx(g.x), ly);
    ctx.fillStyle = INK;
    ctx.fillText(g.label, sx(g.x), ly);
    setSpacing(0);
  }
  // provider rings (dynamic: drawn at the models' extent)
  for (const p of ringProviders) {
    if (p._off) continue;
    const target = ringRadiusTarget(p);
    const cur = ringR.get(p.id);
    ringR.set(p.id, cur + (target - cur) * 0.3);
    const rr = ringR.get(p.id);
    if (rr < 1) continue;
    ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), rr * k, 0, TAU);
    ctx.strokeStyle = INK; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
    ctx.stroke();
    // provider name at fit zoom (the main canvas only labels companies above 0.4 -> no overlap)
    if (k < 0.4) {
      ctx.globalAlpha = 0.7;
      ctx.font = `600 9px ${mono}`;
      setSpacing(0.5);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const ly = sy(p.y) + (p.rx + 4);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.88)';
      ctx.strokeText(p._label, sx(p.x), ly);
      ctx.fillStyle = INK;
      ctx.fillText(p._label, sx(p.x), ly);
      setSpacing(0);
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------------- node / link drawing ---------------- */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function nodeAlpha(n) {
  if (selected) return selectedSet.has(n.id) ? 1 : 0.10;
  if (hoverNode) return hoverSet.has(n.id) ? 1 : 0.25;
  return n._dim ? 0.08 : 1;
}

function linkAlpha(l) {
  if (!l._on) return 0.03;
  if (selected) return (l.source === selected || l.target === selected) ? confA(l._conf) + 0.25 : 0.04;
  if (hoverNode) return (l.source === hoverNode || l.target === hoverNode) ? confA(l._conf) + 0.3 : 0.06;
  return confA(l._conf);
}
function confA(c) { return c === 'high' ? 0.5 : c === 'medium' ? 0.32 : 0.17; }

function drawNode(n, ctx, scale) {
  if (n._off) return;
  const sc = Math.max(scale, 0.8);
  const a = nodeAlpha(n);
  const x = n.x, y = n.y;
  if (n.type === 'company') {
    const r = n.rx;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    const rec = imgCache.get(n.id);
    if (rec && rec.done && rec.img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r - 1.5, 0, TAU); ctx.clip();
      const iw = rec.img.naturalWidth, ih = rec.img.naturalHeight;
      const fit = Math.min((r - 1.5) * 2 / iw, (r - 1.5) * 2 / ih);
      const dw = iw * fit, dh = ih * fit;
      ctx.drawImage(rec.img, x - dw / 2, y - dh / 2, dw, dh);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = INK; ctx.lineWidth = (n === selected ? 2.4 : 1.4) / sc;
    ctx.stroke();
    if (n === selected) { ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, TAU); ctx.lineWidth = 1 / sc; ctx.stroke(); }
  } else if (n.type === 'model') {
    stats.squareDraws++;
    const r = n.r;
    const s = r * 1.78; // rounded square, area ~= the old circle
    const rad = s * 0.22;
    const inset = 1.4 / sc;
    ctx.globalAlpha = a * (n._obsolete ? 0.5 : 1);
    roundRectPath(ctx, x - s / 2, y - s / 2, s, s, rad);
    ctx.fillStyle = n.origin === 'undisclosed' ? 'rgba(26,26,26,.12)' : '#ffffff';
    ctx.fill();
    const rec = imgCache.get(n.id);
    if (rec && rec.done && rec.img.naturalWidth > 0) {
      ctx.save();
      roundRectPath(ctx, x - s / 2 + inset, y - s / 2 + inset, s - inset * 2, s - inset * 2, rad * 0.8);
      ctx.clip();
      const iw = rec.img.naturalWidth, ih = rec.img.naturalHeight;
      const fit = Math.min((s - inset * 2) / iw, (s - inset * 2) / ih);
      const dw = iw * fit, dh = ih * fit;
      ctx.drawImage(rec.img, x - dw / 2, y - dh / 2, dw, dh);
      ctx.restore();
    }
    roundRectPath(ctx, x - s / 2, y - s / 2, s, s, rad);
    ctx.strokeStyle = INK;
    ctx.lineWidth = (n === selected ? 2.2 : 1.3) / sc;
    const dashed = n.origin === 'us_inhouse' || n.origin === 'eu_inhouse' || n.origin === 'undisclosed';
    ctx.setLineDash(dashed ? [3 / sc, 2.5 / sc] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    // origin badge, top-right corner (square echo of the node shape)
    if (n.origin === 'chinese_open' || n.origin === 'us_closed' || n.origin === 'eu_closed') {
      const b = s * 0.26;
      const bx = x + s / 2 - b / 2 - 0.4 / sc, by = y - s / 2 + b / 2 + 0.4 / sc;
      roundRectPath(ctx, bx, by, b, b, 1 / sc);
      if (n.origin === 'chinese_open') { ctx.fillStyle = INK; ctx.fill(); }
      else { ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.2 / sc; ctx.stroke(); }
    }
  } else {
    // community: logo in a circle with a dashed port ring around it
    const r = n.rx;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    const rec = imgCache.get(n.id);
    if (rec && rec.done && rec.img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.clip();
      const iw = rec.img.naturalWidth, ih = rec.img.naturalHeight;
      const fit = Math.min((r - 2) * 2 / iw, (r - 2) * 2 / ih);
      const dw = iw * fit, dh = ih * fit;
      ctx.drawImage(rec.img, x - dw / 2, y - dh / 2, dw, dh);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.strokeStyle = INK; ctx.lineWidth = (n === selected ? 2.4 : 1.6) / sc;
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r + 5 / sc, 0, TAU);
    ctx.setLineDash([3 / sc, 2.5 / sc]);
    ctx.lineWidth = 1 / sc;
    ctx.stroke();
    ctx.setLineDash([]);
    if (n === selected) { ctx.beginPath(); ctx.arc(x, y, r + 8 / sc, 0, TAU); ctx.lineWidth = 1 / sc; ctx.stroke(); }
  }
  // labels — companies above 0.4; models above 0.5 (or very connected when > 0.32);
  // emphasized (selected/hover/search-hit) always
  const emphasized = n === selected || n === hoverNode || n._hit;
  const show = emphasized
    || (showNodeLabels && (n.type === 'community' ? scale > 0.3 : n.type === 'company' ? scale > 0.4 : (scale > 0.5 || ((n.deg || 0) >= 8 && scale > 0.32))));
  if (show) {
    const fs = (n.type === 'company' ? 11 : n.type === 'community' ? 12 : 10) / Math.max(scale, 0.5);
    ctx.font = `${n === selected || n === hoverNode ? '700 ' : ''}${fs}px "SF Mono",ui-monospace,monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const lr = n.type === 'model' ? n.r * 0.9 : n.rx;
    const ly = y + lr + 4 / Math.max(scale, 0.5);
    ctx.lineWidth = 3 / Math.max(scale, 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.strokeText(n._label, x, ly);
    ctx.fillStyle = INK;
    ctx.fillText(n._label, x, ly);
    if (n.type === 'model' && n._obsolete) {
      // strikethrough for obsolete
      const w2 = ctx.measureText(n._label).width;
      ctx.beginPath();
      ctx.moveTo(x - w2 / 2, ly + fs * 0.55);
      ctx.lineTo(x + w2 / 2, ly + fs * 0.55);
      ctx.lineWidth = 1 / Math.max(scale, 0.5);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawLink(l, ctx, scale) {
  if (!l._on) return;
  const s = l.source, t = l.target;
  if (s._off || t._off) return;
  const sx0 = s.x, sy0 = s.y;
  const tx = t.x, ty = t.y;
  const dx = tx - sx0, dy = ty - sy0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const ux = dx / len, uy = dy / len;
  const sr = (s.type === 'company' ? s.rx : s.type === 'community' ? s.rx + 6 : s.r * 0.95) + 1;
  const tr = (t.type === 'company' ? t.rx : t.type === 'community' ? t.rx + 8 : t.r * 0.95) + 2;
  const sx = sx0 + ux * sr, sy = sy0 + uy * sr;
  const ex = tx - ux * tr, ey = ty - uy * tr;

  const sc = Math.max(scale, 0.7);
  ctx.globalAlpha = linkAlpha(l);
  ctx.strokeStyle = INK;
  ctx.lineWidth = (l.kind === 'uses' ? 1.1 : l.kind === 'posted' ? 0.9 : 0.85) / sc;
  if (l.kind === 'posted') ctx.setLineDash([1.6 / sc, 3 / sc]);
  else if (l.kind !== 'uses') ctx.setLineDash([4 / sc, 3 / sc]);
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.setLineDash([]);
  const al = 5 / sc, aw = 2.8 / sc;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ux * al - uy * aw, ey - uy * al + ux * aw);
  ctx.lineTo(ex - ux * al + uy * aw, ey - uy * al - ux * aw);
  ctx.closePath(); ctx.fill();
  if (showEdgeLabels && scale > 0.9) {
    const label = l.kind === 'uses' ? (l.usage || '').replace('_', '-')
      : l.kind === 'posted' ? `posts about ${l._about ? l._about._label : ''}`
      : (l.kind === 'based_on' ? 'based on' : 'distilled from');
    if (label) {
      const fs = 8.5 / Math.max(scale, 0.6);
      const mx = (sx + ex) / 2, my = (sy + ey) / 2;
      ctx.font = `${fs}px "SF Mono",ui-monospace,monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(label).width, pad = 2.5 / Math.max(scale, 0.6);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillRect(mx - w / 2 - pad, my - fs / 2 - pad, w + pad * 2, fs + pad * 2);
      ctx.fillStyle = INK;
      ctx.fillText(label, mx, my);
    }
  }
  ctx.globalAlpha = 1;
}

function nodePointerArea(node, color, ctx, scale) {
  if (node._off) return;
  const pad = 2 / Math.max(scale, 0.5);
  ctx.fillStyle = color;
  if (node.type === 'model') {
    const s = node.r * 1.78 + 4 / Math.max(scale, 0.5);
    roundRectPath(ctx, node.x - s / 2, node.y - s / 2, s, s, s * 0.22);
    ctx.fill();
  } else { // company or community
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.rx + pad, 0, TAU);
    ctx.fill();
  }
}
function linkPointerArea(l, color, ctx, scale) {
  if (!l._on) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7 / Math.max(scale, 0.5);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(l.source.x, l.source.y);
  ctx.lineTo(l.target.x, l.target.y);
  ctx.stroke();
}

/* ---------------- hover card ---------------- */
const hoverCardEl = () => document.getElementById('hovercard');
const HC = { mx: 0, my: 0 };

function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }

function hcPos() {
  const card = hoverCardEl();
  const stage = document.getElementById('graph');
  let x = HC.mx + 16, y = HC.my + 16;
  if (x + 336 > stage.clientWidth) x = HC.mx - 336;
  if (y + card.offsetHeight > stage.clientHeight) y = stage.clientHeight - card.offsetHeight - 10;
  card.style.left = Math.max(4, x) + 'px';
  card.style.top = Math.max(4, y) + 'px';
}
function showHoverCard(html) {
  const card = hoverCardEl();
  card.innerHTML = html;
  card.hidden = false;
  hcPos();
}
function hideHoverCard() { hoverCardEl().hidden = true; }

function showNodeCard(n) {
  if (n.type === 'company') {
    const c = n._data;
    const cnt = links.filter(l => l.kind === 'uses' && l.target.id === n.id && l._pass).length;
    const provider = n._isRingProvider ? `<span class="hc-tag">model provider</span>` : '';
    const tags = `${provider}<span class="hc-tag">${n._region === 'us' ? 'US' : n._region === 'cn' ? 'CN' : 'EU'}</span>` +
      (c.tags || []).slice(0, 3).map(t => `<span class="hc-tag">${esc(t.replace(/_/g, ' '))}</span>`).join('');
    const meta = [c.hq, c.founded ? 'est. ' + c.founded : '', c.employees ? c.employees + ' employees' : ''].filter(Boolean).join(' · ');
    showHoverCard(
      `<div class="hc-title">${esc(n._label)}</div>` +
      (tags ? `<div class="hc-tags">${tags}</div>` : '') +
      (meta ? `<div class="hc-meta">${esc(meta)}</div>` : '') +
      `<div class="hc-desc">${esc(trunc(c.ai_stance, 120))}</div>` +
      `<div class="hc-cta">${cnt} model connection${cnt === 1 ? '' : 's'} · click for evidence</div>`
    );
  } else if (n.type === 'community') {
    const c = n._data;
    const postLinks = links.filter(l => l.kind === 'posted' && l.target.id === n.id && l._pass);
    const comps = new Set(postLinks.map(l => l.source.id)).size;
    showHoverCard(
      `<div class="hc-title">${esc(n._label)}</div>` +
      `<div class="hc-tags"><span class="hc-tag">community</span></div>` +
      `<div class="hc-desc">${esc(trunc(c.blurb, 120))}</div>` +
      `<div class="hc-cta">${comps} companies · ${postLinks.length} model posts · click for details</div>`
    );
  } else {
    const m = n._data;
    const cnt = links.filter(l => l.kind === 'uses' && l.source.id === n.id && l._pass).length;
    const prov = m.provider && nodeById.get(m.provider) ? nodeById.get(m.provider)._label : '—';
    const meta = [m.org, m.license, m.first_released].filter(Boolean).join(' · ');
    const obs = m.obsolete ? '<span class="hc-tag hc-tag-obsolete">obsolete</span>' : '';
    showHoverCard(
      `<div class="hc-title">${esc(n._label)}${m.obsolete ? ' <s></s>' : ''}</div>` +
      `<div class="hc-tags">${obs}<span class="hc-tag">${ORIGIN_LABEL[m.origin]}</span><span class="hc-tag">${m.open_weights ? 'open weights' : 'closed'}</span></div>` +
      (meta ? `<div class="hc-meta">${esc(meta)}</div>` : '') +
      (m.notes ? `<div class="hc-desc">${esc(trunc(m.notes, 150))}</div>` : '') +
      `<div class="hc-cta">provider: ${esc(prov)} · ${cnt} company connection${cnt === 1 ? '' : 's'} · click for details</div>`
    );
  }
}

function showLinkCard(l) {
  const ev = CONN_BY_ID.get(l.id);
  const e0 = ev && ev.evidence && ev.evidence[0];
  const nEv = ev && ev.evidence ? ev.evidence.length : 0;
  let html;
  if (l.kind === 'uses') {
    html =
      `<div class="hc-title">${esc(l.source._label)} <span class="hc-triple-arrow">→</span> ${esc(l.target._label)}</div>` +
      `<div class="hc-meta">${esc((l.usage || '').replace('_', '-'))} · ${esc(l.confidence)} confidence</div>` +
      (e0 ? `<div class="hc-src">${esc(e0.date || '')} ${esc(e0.source || '')} — ${esc(e0.url)}</div>` : '') +
      `<div class="hc-cta">click for ${nEv} source${nEv === 1 ? '' : 's'}</div>`;
  } else if (l.kind === 'posted') {
    html =
      `<div class="hc-title">${esc(l.source._label)} <span class="hc-triple-arrow">→</span> ${esc(l.target._label)}</div>` +
      `<div class="hc-meta">official post about ${esc(l._about ? l._about._label : '')} · ${esc(l.confidence)} confidence</div>` +
      (e0 ? `<div class="hc-src">${esc(e0.date || '')} ${esc(e0.source || '')} — ${esc(e0.url)}</div>` : '') +
      `<div class="hc-cta">click for ${nEv} post${nEv === 1 ? '' : 's'}</div>`;
  } else {
    html =
      `<div class="hc-title">${esc(l.source._label)} <span class="hc-triple-arrow">→</span> ${esc(l.target._label)}</div>` +
      `<div class="hc-meta">${l.kind === 'based_on' ? 'based on' : 'distilled from'} (model lineage)</div>` +
      (ev && ev.notes ? `<div class="hc-desc">${esc(trunc(ev.notes, 160))}</div>` : '') +
      `<div class="hc-cta">click for details</div>`;
  }
  showHoverCard(html);
}

/* ---------------- detail panel ---------------- */
function evLinks(evs) {
  return (evs || []).map(e =>
    `<a class="ev" href="${esc(e.url)}" target="_blank" rel="noopener">` +
    `<span class="date">${esc(e.date || '')}</span> <span class="src">${esc(e.source || '')}</span> — ${esc(e.note || e.url)}` +
    `</a>`).join('');
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
// lean UI: display names drop trailing parentheticals ("Kimi K2.6 (Moonshot AI)" -> "Kimi K2.6")
const cleanName = s => { let t = String(s ?? ''); while (/\s*\([^)]*\)\s*$/.test(t)) t = t.replace(/\s*\([^)]*\)\s*$/, '').trim(); return t || String(s ?? '').replace(/[()]/g, '').trim(); };

function connItems(companyId) {
  return links
    .filter(l => l.kind === 'uses' && l.target.id === companyId && l._pass)
    .map(l => {
      const t = l.source;
      return `<div class="p-item">
        <div class="row1"><span class="mname">${esc(t._label)}${t._obsolete ? '<s></s> <span class="obs-badge">obsolete</span>' : ''}</span>
        <span class="usage">${esc((l.usage || '').replace('_', '-'))}</span>
        <span class="conf">${l.confidence} confidence</span></div>
        ${evLinks(evById(l.id).evidence)}
      </div>`;
    }).join('');
}

function renderPanel(n) {
  const p = document.getElementById('panel');
  const body = document.getElementById('panel-body');
  p.hidden = false;
  if (n.type === 'company') {
    const c = n._data;
    const cnt = links.filter(l => l.kind === 'uses' && l.target.id === n.id && l._pass).length;
    const items = connItems(n.id);
    const postLinks = links.filter(l => l.kind === 'posted' && l.source.id === n.id && l._pass);
    const posts = postLinks.map(l => {
      const evs = evById(l.id) ? evById(l.id).evidence : [];
      return `<div class="p-item">
        <div class="row1"><span class="mname">${esc(l._about ? l._about._label : '')} <span class="usage">on ${esc(l.target._label)}</span></span>
        <span class="conf">${evs.length} post${evs.length === 1 ? '' : 's'}</span></div>
        ${evLinks(evs)}
      </div>`;
    }).join('');
    const provBadge = n._isRingProvider ? '<span class="badge solid">model provider</span>' : '';
    body.innerHTML = `
      <div class="p-kicker">company · ${n._region === 'us' ? 'United States' : n._region === 'cn' ? 'China' : 'Europe'}</div>
      <div class="p-title">${esc(n._label)}</div>
      <div class="p-badges">${provBadge}${c.tags.map(t => `<span class="badge">${esc(t.replace(/_/g, ' '))}</span>`).join('')}</div>
      <div class="p-meta">
        <span class="k">hq</span><span>${esc(c.hq || '—')}</span>
        <span class="k">founded</span><span>${c.founded || '—'}</span>
        <span class="k">employees</span><span>${esc(c.employees || '—')}</span>
        <span class="k">revenue</span><span>${esc(c.revenue || '—')}</span>
        <span class="k">valuation</span><span>${esc(c.valuation || '—')}</span>
        <span class="k">listing</span><span>${(c.listing || []).join(', ')}</span>
        <span class="k">website</span><span><a class="plain" href="${c.website}" target="_blank" rel="noopener">${esc(c.website.replace('https://', ''))}</a></span>
      </div>
      <div class="p-block"><h4>AI stance</h4><div class="p-stance">${esc(c.ai_stance)}</div></div>
      <div class="p-block"><h4>model connections · ${cnt}</h4>${items || '<div class="muted">no model edges — in-house or undisclosed stack</div>'}</div>
      ${posts ? `<div class="p-block"><h4>community posts · ${postLinks.length}</h4>${posts}</div>` : ''}`;
  } else if (n.type === 'community') {
    const c = n._data;
    const postLinks = links.filter(l => l.kind === 'posted' && l.target.id === n.id && l._on);
    const posts = postLinks.map(l => {
      const evs = evById(l.id) ? evById(l.id).evidence : [];
      return `<div class="p-item">
        <div class="row1"><span class="mname">${esc(l.source._label)}</span>
        <span class="usage">posts about ${esc(l._about ? l._about._label : '')}</span>
        <span class="conf">${evs.length} post${evs.length === 1 ? '' : 's'}</span></div>
        ${evLinks(evs)}
      </div>`;
    }).join('');
    body.innerHTML = `
      <div class="p-kicker">community</div>
      <div class="p-title">${esc(n._label)}</div>
      <div class="p-badges"><span class="badge solid">community</span></div>
      <div class="p-meta">
        <span class="k">url</span><span><a class="plain" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url.replace('https://', ''))}</a></span>
      </div>
      <div class="p-block"><h4>about</h4><div class="p-stance">${esc(c.blurb)}</div></div>
      <div class="p-block"><h4>official posts about open models · ${postLinks.length}</h4>${posts || '<div class="muted">no posts in the current view.</div>'}</div>`;
  } else {
    const m = n._data;
    const incomingArr = links.filter(l => l.kind === 'uses' && l.source.id === n.id && l._pass).map(l => `
      <div class="p-item">
        <div class="row1"><span class="mname">${esc(l.target._label)}</span>
        <span class="usage">${esc((l.usage || '').replace('_', '-'))}</span>
        <span class="conf">${l.confidence}</span></div>
        ${evById(l.id) ? evLinks(evById(l.id).evidence) : ''}
      </div>`);
    const incoming = incomingArr.join('');
    const lineage = links.filter(l => (l.kind === 'based_on' || l.kind === 'teacher') && (l.source.id === n.id || l.target.id === n.id) && l._on).map(l => `
      <div class="p-item">
        <div class="row1"><span class="mname">${l.kind === 'based_on' ? 'based on' : 'distilled from'} → ${esc((l.kind === 'based_on' ? l.target : l.source)._label)}</span>
        <span class="usage">${esc((l.usage || '').replace('_', '-'))}</span></div>
      </div>`).join('');
    const posts = links.filter(l => l.kind === 'posted' && l._about && l._about.id === n.id && l._on).map(l => `
      <div class="p-item">
        <div class="row1"><span class="mname">posted on ${esc(l.target._label)} by ${esc(l.source._label)}</span></div>
        ${evById(l.id) ? evLinks(evById(l.id).evidence) : ''}
      </div>`).join('');
    const prov = m.provider && nodeById.get(m.provider) ? nodeById.get(m.provider)._label : '—';
    body.innerHTML = `
      <div class="p-kicker">model · ${m.country || '—'}</div>
      <div class="p-title">${esc(n._label)}${m.obsolete ? ' <s></s>' : ''}</div>
      <div class="p-badges">
        ${m.obsolete ? '<span class="badge obsolete">obsolete — out of the race</span>' : ''}
        <span class="badge ${m.origin === 'chinese_open' ? 'solid' : ''}">${ORIGIN_LABEL[m.origin]}</span>
        ${m.open_weights ? '<span class="badge">open weights</span>' : '<span class="badge">closed</span>'}
      </div>
      <div class="p-meta">
        <span class="k">org</span><span>${esc(m.org)}</span>
        <span class="k">provider</span><span>${esc(prov)}</span>
        <span class="k">license</span><span>${esc(m.license || '—')}</span>
        <span class="k">arch</span><span>${esc(m.arch || '—')}</span>
        <span class="k">base</span><span>${esc(m.base_model || '—')}</span>
        <span class="k">released</span><span>${esc(m.first_released || '—')}</span>
      </div>
      ${m.disguise_note ? `<div class="p-disguise"><b>disguise / provenance check</b>${esc(m.disguise_note)}</div>` : ''}
      ${m.obsolete_reason ? `<div class="p-disguise"><b>why obsolete</b>${esc(m.obsolete_reason)}</div>` : ''}
      <div class="p-block"><h4>notes</h4><div class="p-stance">${esc(m.notes)}</div></div>
      ${incoming ? `<div class="p-block"><h4>companies using · ${incomingArr.length}</h4>${incoming}</div>` : ''}
      ${lineage ? `<div class="p-block"><h4>lineage</h4>${lineage}</div>` : ''}
      ${posts ? `<div class="p-block"><h4>community posts</h4>${posts}</div>` : ''}`;
  }
}

/* ---------------- export (what-you-see) ---------------- */
function exportView() {
  const onLinks = links.filter(l => l._on).map(l => {
    const e = CONN_BY_ID.get(l.id);
    return {
      id: e.id, company: e.company, model: e.model, kind: e.kind,
      community: e.community || null,
      usage: e.usage || null, confidence: e.confidence, notes: e.notes || null,
      evidence: (e.evidence || []).map(x => ({ url: x.url, source: x.source || null, date: x.date || null }))
    };
  });
  const payload = {
    generated: new Date().toISOString(),
    filters: {
      search: state.q, usages: [...state.usages], origins: [...state.origins],
      confidence: [...state.confs], kinds: [...state.kinds], cnOnly: state.cnOnly,
      showNoEdge: state.noedge, regions: [...state.regions], showObsolete: state.showObsolete
    },
    companies: nodes.filter(n => n.type === 'company' && !n._off).map(n => n._data),
    models: nodes.filter(n => n.type === 'model' && !n._off).map(n => n._data),
    communities: nodes.filter(n => n.type === 'community' && !n._off).map(n => n._data),
    connections: onLinks
  };
  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'open-weight-kg-' + new Date().toISOString().slice(0, 10) + '-view.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return payload;
}

/* ---------------- wiring ---------------- */
function init() {
  const search = document.getElementById('search');
  let deb;
  search.addEventListener('input', () => {
    clearTimeout(deb);
    deb = setTimeout(() => { state.q = search.value; applyFilters(); }, 140);
  });
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter' && state.q.trim()) {
      const hits = nodes.filter(n => n._hit && !n._dim && !n._off);
      if (hits.length) {
        const hit = hits.reduce((a, b) => (b.deg || 0) > (a.deg || 0) ? b : a);
        progZoomUntil = Math.max(progZoomUntil, performance.now() + 700);
        graph.centerAt(hit.x, hit.y, 600);
        const k = graph.zoom();
        if (k < 1.15) graph.zoom(1.4, 600);
        selectNode(hit);
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
    if (e.key === 'Escape') {
      search.value = ''; state.q = '';
      selected = null; selectedSet = null;
      document.getElementById('panel').hidden = true;
      applyFilters();
    }
  });
  document.getElementById('btn-reset').addEventListener('click', () => fitToData(true));
  document.getElementById('btn-cn').addEventListener('click', () => {
    state.cnOnly = !state.cnOnly;
    syncCnBtn(); applyFilters();
  });
  document.getElementById('t-noedge').addEventListener('change', e => { state.noedge = e.target.checked; applyFilters(); });
  document.getElementById('t-obsolete').addEventListener('change', e => { state.showObsolete = e.target.checked; applyFilters(); });
  document.getElementById('stats').addEventListener('click', e => {
    if (!e.target.closest('.stat-ob')) return;
    state.showObsolete = !state.showObsolete;
    document.getElementById('t-obsolete').checked = state.showObsolete;
    applyFilters();
  });
  document.getElementById('panel-close').addEventListener('click', () => {
    document.getElementById('panel').hidden = true;
    selected = null; selectedSet = null;
    nudge();
  });

  document.getElementById('g-fit').addEventListener('click', () => fitToData(true));
  document.getElementById('g-nodelabels').addEventListener('click', e => {
    showNodeLabels = !showNodeLabels;
    e.currentTarget.classList.toggle('on', showNodeLabels);
    nudge();
  });
  document.getElementById('g-edgelabels').addEventListener('click', e => {
    showEdgeLabels = !showEdgeLabels;
    e.currentTarget.classList.toggle('on', showEdgeLabels);
    nudge();
  });

  const layout = document.querySelector('.layout');
  const toggle = document.getElementById('sidebar-toggle');
  toggle.addEventListener('click', () => {
    const collapsed = layout.classList.toggle('collapsed');
    toggle.textContent = collapsed ? '›' : '‹';
    setTimeout(() => {
      const el = document.getElementById('graph');
      graph.width(el.clientWidth).height(el.clientHeight);
      if (!userMoved) fitToData(true); else nudge();
    }, 230);
  });
  if (window.matchMedia('(max-width:760px)').matches) {
    layout.classList.add('collapsed');
    toggle.textContent = '›';
  }

  const stage = document.getElementById('graph');
  stage.addEventListener('mousemove', e => {
    const r = stage.getBoundingClientRect();
    HC.mx = e.clientX - r.left; HC.my = e.clientY - r.top;
    if (!hoverCardEl().hidden) hcPos();
  });
  stage.addEventListener('mouseleave', () => {
    if (hoverNode || hoverLink) {
      hoverNode = null; hoverSet = null; hoverLink = null;
      document.body.style.cursor = 'default';
      hideHoverCard();
      nudge();
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => exportView());

  window.__kg = {
    get graph() { return graph; }, get nodes() { return nodes; }, get links() { return links; },
    get hover() { return hoverNode; }, get hoverLink() { return hoverLink; }, get userMoved() { return userMoved; },
    get squareDraws() { return stats.squareDraws; }, get ringR() { return ringR; },
    get geo() { return GEO; }, get showObsolete() { return state.showObsolete; },
    get regions() { return state.regions; },
    exportView, markProgrammatic: ms => { progZoomUntil = Math.max(progZoomUntil, performance.now() + (ms || 60)); }
  };
}

load().then(init).catch(err => {
  document.body.innerHTML = `<div style="padding:40px;font-family:monospace">
    load failed: ${esc(err.message)}<br><br>
    serve the workspace root over HTTP, e.g.<br>
    <code>cd &lt;workspace&gt; &amp;&amp; python3 -m http.server 8000</code><br>
    then open <code>http://localhost:8000/kg/</code></div>`;
});
})();
