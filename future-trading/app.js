// future-trading — site interactions + interactive widget engine
// Vanilla JS, no dependencies. Black/white, mono, turbopuffer aesthetic.

/* ------------------------------------------------------------------ *
 * 1. Site chrome: mobile nav + keyboard paging                        *
 * ------------------------------------------------------------------ */
(function () {
  var t = document.getElementById('menu-toggle');
  if (t) { t.addEventListener('click', function () { document.body.classList.toggle('nav-open'); }); }
  document.querySelectorAll('#sidebar a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  });
  var active = document.querySelector('.toc li.active');
  if (active && active.scrollIntoView) { active.scrollIntoView({ block: 'center' }); }
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') { var p = document.querySelector('.pn-prev'); if (p) location.href = p.href; }
    if (e.key === 'ArrowRight') { var n = document.querySelector('.pn-next'); if (n) location.href = n.href; }
  });
})();

/* ================================================================== *
 * 2. Interactive widget engine                                        *
 * ================================================================== */
(function () {
  'use strict';

  // ---- tiny DOM helper -------------------------------------------
  function E(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function fmt(x, p) { if (!isFinite(x)) return '–'; p = p == null ? 2 : p; return (Math.round(x * Math.pow(10, p)) / Math.pow(10, p)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: p }); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  // ---- seeded RNG (mulberry32) + gaussian ------------------------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gaussPool(n, seed) { var r = rng(seed), a = new Float64Array(n); for (var i = 0; i < n; i++) { var u = 1 - r(), v = r(); a[i] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); } return a; }

  // ---- shared widget shell ---------------------------------------
  // returns { controls, addCanvas, readout, note, render(cb) }
  function shell(mount) {
    var cap = mount.querySelector('figcaption');
    var title = cap ? cap.textContent : (mount.getAttribute('data-title') || '');
    mount.innerHTML = '';
    mount.appendChild(E('div', { class: 'w-cap' }, title || 'INTERACTIVE'));
    var body = E('div', { class: 'w-body' });
    mount.appendChild(body);
    var controls = E('div', { class: 'w-controls' });
    var readout = E('div', { class: 'w-readout' });
    body.appendChild(controls);
    return {
      body: body, controls: controls, readout: readout,
      addCanvas: function (h) {
        var wrap = E('div', { class: 'w-canvas-wrap' });
        var c = E('canvas', { class: 'w-canvas' });
        c._h = h || 240;
        wrap.appendChild(c); body.appendChild(wrap);
        return c;
      },
      mountReadout: function () { body.appendChild(readout); },
      note: function (txt) { body.appendChild(E('div', { class: 'w-note', html: txt })); }
    };
  }

  // ---- control factories -----------------------------------------
  function slider(controls, label, min, max, step, val, render, fmtv) {
    var lab = E('div', { class: 'w-ctrl-label' });
    var name = E('span', null, label);
    var out = E('b', null, (fmtv || String)(val));
    lab.appendChild(name); lab.appendChild(out);
    var input = E('input', { class: 'w-range', type: 'range', min: min, max: max, step: step });
    input.value = val;
    var ctrl = E('div', { class: 'w-ctrl' }, [lab, input]);
    controls.appendChild(ctrl);
    var api = { get: function () { return parseFloat(input.value); }, set: function (v) { input.value = v; out.textContent = (fmtv || String)(v); } };
    input.addEventListener('input', function () { out.textContent = (fmtv || String)(parseFloat(input.value)); render(); });
    return api;
  }
  function segmented(controls, label, opts, idx, render) {
    var seg = E('div', { class: 'w-seg' });
    var cur = idx;
    var btns = opts.map(function (o, i) {
      var b = E('button', { class: i === idx ? 'on' : '' }, o);
      b.addEventListener('click', function () { cur = i; btns.forEach(function (x, j) { x.className = j === i ? 'on' : ''; }); render(); });
      seg.appendChild(b); return b;
    });
    var lab = E('div', { class: 'w-ctrl-label' }, E('span', null, label));
    controls.appendChild(E('div', { class: 'w-ctrl' }, [lab, seg]));
    return { get: function () { return cur; } };
  }
  function button(controls, label, fn) {
    var b = E('button', { class: 'w-btn' }, label);
    b.addEventListener('click', fn);
    controls.appendChild(E('div', { class: 'w-ctrl', style: 'flex:0 0 auto;justify-content:flex-end' }, b));
    return b;
  }
  function ro(readout, items) {
    readout.innerHTML = '';
    items.forEach(function (it) { readout.appendChild(E('span', { html: it[0] + ' <b>' + it[1] + '</b>' })); });
  }

  // ---- Plot: logical-coordinate canvas wrapper -------------------
  function Plot(canvas, pad) {
    var ctx = canvas.getContext('2d');
    var P = pad || { l: 46, r: 14, t: 14, b: 28 };
    var W = 0, H = 0, dom = { x0: 0, x1: 1, y0: 0, y1: 1 };
    var MONO = '11px ui-monospace,SFMono-Regular,Menlo,monospace';
    function resize() {
      var cssW = canvas.clientWidth || (canvas.parentNode && canvas.parentNode.clientWidth) || 600;
      var cssH = canvas._h || 240;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = cssW; H = cssH;
    }
    function X(x) { return P.l + (x - dom.x0) / (dom.x1 - dom.x0) * (W - P.l - P.r); }
    function Y(y) { return H - P.b - (y - dom.y0) / (dom.y1 - dom.y0) * (H - P.t - P.b); }
    var api = {
      ctx: ctx,
      resize: resize,
      get W() { return W; }, get H() { return H; }, X: X, Y: Y, dom: function () { return dom; },
      setDomain: function (x0, x1, y0, y1) { dom = { x0: x0, x1: x1, y0: y0, y1: y1 }; },
      clear: function () { ctx.clearRect(0, 0, W, H); },
      frame: function () { ctx.strokeStyle = '#e6e6e6'; ctx.lineWidth = 1; ctx.strokeRect(P.l + .5, P.t + .5, W - P.l - P.r - 1, H - P.t - P.b - 1); },
      gridX: function (ticks, f) {
        ctx.strokeStyle = '#eee'; ctx.fillStyle = '#999'; ctx.font = MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineWidth = 1;
        ticks.forEach(function (t) { var x = X(t); ctx.beginPath(); ctx.moveTo(x, P.t); ctx.lineTo(x, H - P.b); ctx.stroke(); ctx.fillText((f || fmt)(t), x, H - P.b + 5); });
      },
      gridY: function (ticks, f) {
        ctx.strokeStyle = '#eee'; ctx.fillStyle = '#999'; ctx.font = MONO; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 1;
        ticks.forEach(function (t) { var y = Y(t); ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(W - P.r, y); ctx.stroke(); ctx.fillText((f || fmt)(t), P.l - 6, y); });
      },
      line: function (pts, o) {
        o = o || {}; if (!pts.length) return;
        ctx.strokeStyle = o.color || '#111'; ctx.lineWidth = o.width || 1.6; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
        if (o.dash) ctx.setLineDash(o.dash); else ctx.setLineDash([]);
        ctx.beginPath();
        for (var i = 0; i < pts.length; i++) { var x = X(pts[i][0]), y = Y(pts[i][1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      },
      area: function (pts, y0, o) {
        o = o || {}; if (!pts.length) return;
        ctx.fillStyle = o.color || 'rgba(17,17,17,.06)'; ctx.beginPath();
        ctx.moveTo(X(pts[0][0]), Y(y0));
        for (var i = 0; i < pts.length; i++) ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
        ctx.lineTo(X(pts[pts.length - 1][0]), Y(y0)); ctx.closePath(); ctx.fill();
      },
      vline: function (x, o) { o = o || {}; ctx.strokeStyle = o.color || '#111'; ctx.lineWidth = o.width || 1; if (o.dash) ctx.setLineDash(o.dash); ctx.beginPath(); ctx.moveTo(X(x), P.t); ctx.lineTo(X(x), H - P.b); ctx.stroke(); ctx.setLineDash([]); },
      hline: function (y, o) { o = o || {}; ctx.strokeStyle = o.color || '#111'; ctx.lineWidth = o.width || 1; if (o.dash) ctx.setLineDash(o.dash); ctx.beginPath(); ctx.moveTo(P.l, Y(y)); ctx.lineTo(W - P.r, Y(y)); ctx.stroke(); ctx.setLineDash([]); },
      dot: function (x, y, r, c) { ctx.fillStyle = c || '#111'; ctx.beginPath(); ctx.arc(X(x), Y(y), r || 3, 0, 7); ctx.fill(); },
      bar: function (x, w, y0, y1, o) { o = o || {}; ctx.fillStyle = o.color || '#111'; var px = X(x - w / 2), pw = X(x + w / 2) - px; ctx.fillRect(px, Y(Math.max(y0, y1)), pw, Math.abs(Y(y1) - Y(y0))); },
      text: function (x, y, s, o) {
        o = o || {}; ctx.fillStyle = o.color || '#111'; ctx.font = o.font || MONO;
        ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
        var px = o.px ? x : X(x), py = o.px ? y : Y(y);
        ctx.fillText(s, px + (o.dx || 0), py + (o.dy || 0));
      }
    };
    return api;
  }

  // helper: build "nice" axis ticks
  function ticks(min, max, n) {
    n = n || 5; var span = max - min; if (span <= 0) return [min];
    var step = Math.pow(10, Math.floor(Math.log(span / n) / Math.LN10));
    var err = (span / n) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [], t = Math.ceil(min / step) * step;
    for (; t <= max + step * 1e-9; t += step) out.push(Math.round(t / step) * step);
    return out;
  }

  // ==================================================================
  //  WIDGET REGISTRY
  // ==================================================================
  var W = {};

  // ---- 1. kelly : growth rate vs bet fraction (learning-rate lens) -
  W.kelly = function (m) {
    var d = m.dataset, s = shell(m);
    var mode = segmented(s.controls, '模式', ['连续 (Sharpe)', '离散 (赔率)'], 0, render);
    var mu = slider(s.controls, '漂移 μ (每期超额收益)', 0.01, 0.20, 0.005, num(d.mu, 0.08), render, function (v) { return fmt(v * 100, 1) + '%'; });
    var sig = slider(s.controls, '波动 σ', 0.05, 0.50, 0.01, num(d.sigma, 0.20), render, function (v) { return fmt(v * 100, 0) + '%'; });
    var p = slider(s.controls, '胜率 p', 0.30, 0.80, 0.01, num(d.p, 0.55), render, function (v) { return fmt(v * 100, 0) + '%'; });
    var b = slider(s.controls, '盈亏比 b', 0.5, 4, 0.1, num(d.b, 1.5), render, function (v) { return fmt(v, 1); });
    var c = s.addCanvas(250), P = Plot(c);
    s.mountReadout();
    s.note('<b>f 就是学习率</b>。f* = μ/σ² 是最优步长；半凯利 ½f* 拿到约 ¾ 的增长却只有 ¼ 的方差；f > 2f* 时增长转负，等同于学习率过大、训练发散。');
    function render() {
      var continuous = mode.get() === 0;
      [mu, sig].forEach(function (x) { x; }); // controls always present; show/hide by mode
      toggleCtrls();
      P.resize(); P.clear();
      var fstar, fmax, g, label2;
      if (continuous) {
        var M = mu.get(), S = sig.get();
        fstar = M / (S * S); fmax = Math.max(2.2 * fstar, 1);
        g = function (f) { return f * M - f * f * S * S / 2; };
        label2 = '夏普 SR=' + fmt(M / S, 2) + ' · g* = SR²/2 = ' + fmt((M / S) * (M / S) / 2 * 100, 2) + '%';
      } else {
        var pp = p.get(), bb = b.get();
        fstar = clamp(pp - (1 - pp) / bb, -0.99, 0.999); fmax = Math.max(2.2 * Math.max(fstar, 0.01), 1) ; fmax = Math.min(fmax, 0.999);
        g = function (f) { f = clamp(f, -0.95, 0.995); return pp * Math.log(1 + f * bb) + (1 - pp) * Math.log(1 - f); };
        label2 = '凯利 f* = p − (1−p)/b';
      }
      var x0 = continuous ? 0 : 0, x1 = continuous ? fmax : Math.min(fmax, 0.999);
      var pts = [], gmax = -1e9, gmin = 1e9;
      for (var i = 0; i <= 200; i++) { var f = x0 + (x1 - x0) * i / 200; var v = g(f); if (isFinite(v)) { pts.push([f, v]); if (v > gmax) gmax = v; if (v < gmin) gmin = v; } }
      gmin = Math.min(gmin, 0); var pad = (gmax - gmin) * 0.12 || 0.01;
      P.setDomain(x0, x1, gmin - pad, gmax + pad);
      P.gridY(ticks(gmin - pad, gmax + pad, 5), function (t) { return fmt(t * 100, 1) + '%'; });
      P.gridX(ticks(x0, x1, 6), function (t) { return fmt(t, 1); });
      P.hline(0, { color: '#bbb', width: 1 });
      P.area(pts.filter(function (q) { return q[1] >= 0; }), 0);
      P.line(pts, { width: 2 });
      // markers
      var gAt = g(fstar);
      if (fstar > x0 && fstar < x1) { P.vline(fstar, { color: '#111', dash: [3, 3] }); P.dot(fstar, gAt, 3.5); P.text(fstar, gmax + pad, 'f* (满凯利)', { align: 'center', dy: -4, color: '#111' }); }
      var half = fstar / 2; if (half > x0 && half < x1) { P.vline(half, { color: '#999', dash: [2, 4] }); P.text(half, P.dom().y0, '½f*', { align: 'center', dy: -7, color: '#777' }); }
      var ruin = 2 * fstar; if (ruin > x0 && ruin < x1) { P.vline(ruin, { color: '#111', dash: [1, 3] }); P.text(ruin, P.dom().y0, '2f* 发散', { align: 'center', dy: -7, color: '#111' }); }
      P.frame();
      ro(s.readout, [['f* =', fmt(fstar, 3)], ['g(f*) =', fmt(gAt * 100, 2) + '%/期'], ['', label2]]);
    }
    function toggleCtrls() {
      var continuous = mode.get() === 0;
      [mu.set ? null : null]; // noop
      muRow().style.display = continuous ? '' : 'none';
      sigRow().style.display = continuous ? '' : 'none';
      pRow().style.display = continuous ? 'none' : '';
      bRow().style.display = continuous ? 'none' : '';
    }
    function muRow() { return s.controls.children[1]; }
    function sigRow() { return s.controls.children[2]; }
    function pRow() { return s.controls.children[3]; }
    function bRow() { return s.controls.children[4]; }
    bind(m, render);
  };

  // ---- 2. position-sizer : contracts from risk budget --------------
  W['position-sizer'] = function (m) {
    var d = m.dataset, s = shell(m);
    var PRE = {
      'MES': { pt: 5, px: 5000, n: 'MES 微型标普' }, 'ES': { pt: 50, px: 5000, n: 'ES 标普' },
      'MNQ': { pt: 2, px: 18000, n: 'MNQ 微型纳指' }, 'NQ': { pt: 20, px: 18000, n: 'NQ 纳指' },
      'MGC': { pt: 10, px: 2300, n: 'MGC 微型黄金' }, 'GC': { pt: 100, px: 2300, n: 'GC 黄金' },
      'CL': { pt: 1000, px: 75, n: 'CL 原油' }, 'MCL': { pt: 100, px: 75, n: 'MCL 微型原油' }
    };
    var order = ['MES', 'ES', 'MNQ', 'NQ', 'MGC', 'GC', 'MCL', 'CL'];
    var inst = segmented(s.controls, '合约', order, order.indexOf(d.inst || 'MES') < 0 ? 0 : order.indexOf(d.inst || 'MES'), render);
    var acct = slider(s.controls, '账户权益 ($)', 2000, 200000, 1000, num(d.account, 25000), render, function (v) { return '$' + fmt(v, 0); });
    var risk = slider(s.controls, '单笔风险 (%)', 0.25, 3, 0.25, num(d.risk, 1), render, function (v) { return fmt(v, 2) + '%'; });
    var stop = slider(s.controls, '止损距离 (点)', 1, 100, 1, num(d.stop, 12), render, function (v) { return fmt(v, 0) + ' 点'; });
    var c = s.addCanvas(120), P = Plot(c, { l: 14, r: 14, t: 30, b: 14 });
    s.mountReadout();
    s.note('手数 = 风险预算 ÷ (止损距离 × 每点价值)。<b>先定止损，再反算手数</b>——和你设网络前先定损失函数、再调参一个顺序。');
    function render() {
      var k = order[inst.get()], spec = PRE[k];
      var budget = acct.get() * risk.get() / 100;
      var perContractRisk = stop.get() * spec.pt;
      var contracts = Math.floor(budget / perContractRisk);
      var realRisk = contracts * perContractRisk;
      var notional = contracts * spec.px * spec.pt;
      var lev = notional / acct.get();
      ro(s.readout, [
        [spec.n + ' · 每点', '$' + fmt(spec.pt, 0)],
        ['风险预算', '$' + fmt(budget, 0)],
        ['可下', '<u>' + contracts + ' 手</u>'],
        ['实际风险', '$' + fmt(realRisk, 0)],
        ['名义敞口', '$' + fmt(notional, 0)],
        ['杠杆', fmt(lev, 1) + '×']
      ]);
      // bar viz: risk as % of account + leverage gauge
      P.resize(); P.clear(); P.setDomain(0, 1, 0, 2);
      var ctx = P.ctx;
      ctx.font = '11px ui-monospace,Menlo,monospace';
      // risk bar
      function bar(row, frac, lab, danger) {
        var y = P.Y(row + .5), x0 = P.X(0.32), x1 = P.X(0.98);
        ctx.fillStyle = '#eee'; ctx.fillRect(x0, y - 7, x1 - x0, 14);
        ctx.fillStyle = danger ? '#111' : '#666'; ctx.fillRect(x0, y - 7, (x1 - x0) * clamp(frac, 0, 1), 14);
        ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(lab, P.X(0.02), y);
      }
      bar(1, risk.get() / 3, '风险 ' + fmt(risk.get(), 2) + '%', risk.get() > 2);
      bar(0, lev / 30, '杠杆 ' + fmt(lev, 1) + '×', lev > 15);
    }
    bind(m, render);
  };

  // ---- 3. leverage-ruin : Monte Carlo equity paths -----------------
  W['leverage-ruin'] = function (m) {
    var d = m.dataset, s = shell(m);
    var K = 160, T = 252, seedBox = { s: 7 };
    var pool = gaussPool(K * T, seedBox.s);
    var lev = slider(s.controls, '杠杆 L', 1, 30, 1, num(d.lev, 8), render, function (v) { return fmt(v, 0) + '×'; });
    var mu = slider(s.controls, '每期边际 μ', 0, 0.0010, 0.00005, num(d.mu, 0.0004), render, function (v) { return fmt(v * 1e4, 1) + 'bp'; });
    var sg = slider(s.controls, '每期波动 σ', 0.003, 0.025, 0.001, num(d.sigma, 0.012), render, function (v) { return fmt(v * 100, 1) + '%'; });
    var logy = segmented(s.controls, 'Y 轴', ['对数', '线性'], 0, render);
    button(s.controls, '重新抽样', function () { seedBox.s = (seedBox.s * 1103515245 + 12345) >>> 8 | 1; pool = gaussPool(K * T, seedBox.s); render(); });
    var c = s.addCanvas(260), P = Plot(c);
    s.mountReadout();
    s.note('同一组随机冲击，只把杠杆放大。<b>L = 步长</b>：最优 L* ≈ μ/σ²；超过它，方差拖累(−L²σ²/2)压倒漂移，多数路径走向破产——和学习率过大时损失发散同形。');
    function render() {
      P.resize(); P.clear();
      var L = lev.get(), M = mu.get(), S = sg.get(), useLog = logy.get() === 0;
      var ruinLevel = 0.30, ruined = 0, terminals = [];
      var paths = [];
      for (var k = 0; k < K; k++) {
        var eq = 1, dead = false, pts = [[0, 1]];
        for (var t = 1; t <= T; t++) {
          var z = pool[k * T + t - 1];
          var ret = L * (M + S * z);
          eq *= (1 + ret);
          if (eq <= ruinLevel && !dead) { dead = true; }
          if (eq < 1e-4) eq = 1e-4;
          if (t % 2 === 0 || t === T) pts.push([t, eq]);
          if (dead) break;
        }
        if (dead) ruined++;
        terminals.push(eq);
        paths.push({ pts: pts, dead: dead });
      }
      terminals.sort(function (a, b) { return a - b; });
      var med = terminals[Math.floor(K / 2)];
      var hi = terminals[Math.floor(K * 0.95)] || 1;
      var ymax = useLog ? Math.max(hi, 3) : Math.min(Math.max(hi, 2), 8);
      var ymin = useLog ? 0.05 : 0;
      var tf = useLog ? function (v) { return Math.log(Math.max(v, ymin)); } : function (v) { return v; };
      P.setDomain(0, T, tf(ymin) , tf(ymax));
      // y ticks
      var yt = useLog ? [0.1, 0.3, 1, 3, ymax].filter(function (v) { return v <= ymax && v >= ymin; }) : ticks(0, ymax, 5);
      P.ctx.strokeStyle = '#eee'; P.ctx.fillStyle = '#999'; P.ctx.font = '11px Menlo,monospace'; P.ctx.textAlign = 'right'; P.ctx.textBaseline = 'middle';
      yt.forEach(function (v) { var y = P.Y(tf(v)); P.ctx.beginPath(); P.ctx.moveTo(P.X(0), y); P.ctx.lineTo(P.X(T), y); P.ctx.stroke(); P.ctx.fillText(fmt(v, v < 1 ? 1 : 0) + '×', P.X(0) - 6, y); });
      P.gridX(ticks(0, T, 6), function (t) { return fmt(t, 0); });
      P.hline(tf(ruinLevel), { color: '#111', dash: [4, 4] });
      P.text(T, tf(ruinLevel), '破产线 0.3×', { align: 'right', dy: -4, color: '#111' });
      P.hline(tf(1), { color: '#ccc' });
      paths.forEach(function (pp) {
        P.line(pp.pts.map(function (q) { return [q[0], tf(q[1])]; }), { color: pp.dead ? '#111' : '#999', width: pp.dead ? 0.8 : 0.7, alpha: pp.dead ? 0.55 : 0.28 });
      });
      P.frame();
      var Lopt = M / (S * S);
      ro(s.readout, [['破产比例', '<b>' + fmt(ruined / K * 100, 0) + '%</b> (' + ruined + '/' + K + ')'], ['中位终值', fmt(med, 2) + '×'], ['最优 L* = μ/σ²', '≈ ' + fmt(Lopt, 0) + '×'], ['当前 L', fmt(L, 0) + '×' + (L > Lopt ? ' (过载)' : '')]]);
    }
    bind(m, render);
  };

  // ---- 4. drawdown : recovery asymmetry ----------------------------
  W.drawdown = function (m) {
    var d = m.dataset, s = shell(m);
    var dd = slider(s.controls, '回撤 d', 0.05, 0.90, 0.01, num(d.dd, 0.5), render, function (v) { return fmt(v * 100, 0) + '%'; });
    var c = s.addCanvas(240), P = Plot(c);
    s.mountReadout();
    s.note('回本所需涨幅 g = d/(1−d)，是凸函数。<b>在对数权益空间里回撤才是可加、对称的</b>——这正是你优化对数似然而非似然本身的同一个理由。');
    function render() {
      P.resize(); P.clear();
      var g = function (x) { return x / (1 - x); };
      var pts = []; for (var i = 0; i <= 180; i++) { var x = i / 200; pts.push([x, g(x)]); }
      P.setDomain(0, 0.9, 0, 9);
      P.gridY(ticks(0, 9, 5), function (t) { return fmt(t * 100, 0) + '%'; });
      P.gridX(ticks(0, 0.9, 6), function (t) { return fmt(t * 100, 0) + '%'; });
      P.line([[0, 0], [0.9, 0.9]], { color: '#ccc', dash: [4, 4] });
      P.text(0.9, 0.9, '对称线', { align: 'right', color: '#aaa', dy: -4 });
      P.line(pts, { width: 2 });
      var x = dd.get(), gg = g(x);
      P.vline(x, { dash: [3, 3] }); P.hline(Math.min(gg, 9), { dash: [3, 3] });
      P.dot(x, Math.min(gg, 9), 4);
      P.frame();
      ro(s.readout, [['回撤', fmt(x * 100, 0) + '%'], ['需涨', '<b>' + fmt(gg * 100, 0) + '%</b> 才回本'], ['-50%→', '+100%'], ['-65%→', '+186%']]);
    }
    bind(m, render);
  };

  // ---- 5. ar1 : trend vs mean-reversion (OU / GP kernel) -----------
  W.ar1 = function (m) {
    var d = m.dataset, s = shell(m);
    var N = 240, pool = gaussPool(N + 64, 41);
    var phi = slider(s.controls, '自相关 φ', -0.95, 0.98, 0.01, num(d.phi, 0.92), render, function (v) { return fmt(v, 2); });
    var sg = slider(s.controls, '噪声 σ', 0.2, 2, 0.1, 1, render, function (v) { return fmt(v, 1); });
    var showPnl = segmented(s.controls, '叠加', ['只看序列', '趋势 vs 回归 PnL'], 0, render);
    button(s.controls, '重新抽样', function () { pool = gaussPool(N + 64, (Math.floor(phi.get() * 1000) + 7919) | 1); render(); });
    var c = s.addCanvas(250), P = Plot(c);
    var c2 = s.addCanvas(120), P2 = Plot(c2, { l: 46, r: 14, t: 12, b: 22 });
    s.mountReadout();
    s.note('这就是 AR(1)：yₜ = φ·yₜ₋₁ + εₜ。连续极限是 OU 过程，等价于<b>指数核 k(s,t)=exp(−|s−t|/ℓ) 的高斯过程</b>——你采样过上千次。φ→1 持续(趋势)，φ<0 振荡(均值回归)，φ=0 白噪声。半衰期 = ln½/lnφ。');
    function render() {
      var ph = phi.get(), S = sg.get();
      var y = new Float64Array(N), yv = 0;
      for (var i = 0; i < N; i++) { yv = ph * yv + S * pool[i]; y[i] = yv; }
      // top: the series
      P.resize(); P.clear();
      var ymin = 1e9, ymax = -1e9; for (i = 0; i < N; i++) { if (y[i] < ymin) ymin = y[i]; if (y[i] > ymax) ymax = y[i]; }
      var pad = (ymax - ymin) * 0.1 || 1;
      P.setDomain(0, N, ymin - pad, ymax + pad);
      P.gridY(ticks(ymin - pad, ymax + pad, 4));
      P.gridX(ticks(0, N, 6), function (t) { return fmt(t, 0); });
      P.hline(0, { color: '#ccc' });
      var pts = []; for (i = 0; i < N; i++) pts.push([i, y[i]]);
      P.line(pts, { width: 1.4 });
      P.frame();
      P.text(P.X(P.dom().x0) + 6, P.Y(P.dom().y1) + 4, ph >= 0.85 ? '≈ 随机游走 / 趋势' : ph <= -0.2 ? '均值回归 / 振荡' : '弱相关 / 近噪声', { px: true, color: '#777', baseline: 'top' });
      // bottom: either ACF or strategy PnL
      P2.resize(); P2.clear();
      if (showPnl.get() === 0) {
        // sample ACF
        var mean = 0; for (i = 0; i < N; i++) mean += y[i]; mean /= N;
        var c0 = 0; for (i = 0; i < N; i++) c0 += (y[i] - mean) * (y[i] - mean);
        var L = 20, acf = [];
        for (var lag = 0; lag <= L; lag++) { var cc = 0; for (i = lag; i < N; i++) cc += (y[i] - mean) * (y[i - lag] - mean); acf.push(cc / c0); }
        P2.setDomain(-0.6, L + 0.6, -1, 1);
        P2.gridY([-1, 0, 1]); P2.hline(0, { color: '#ccc' });
        var bound = 1.96 / Math.sqrt(N);
        P2.hline(bound, { color: '#bbb', dash: [2, 3] }); P2.hline(-bound, { color: '#bbb', dash: [2, 3] });
        acf.forEach(function (v, lag) { P2.bar(lag, 0.55, 0, v, { color: lag === 0 ? '#ccc' : '#111' }); });
        P2.text(P2.X(0) + 4, P2.Y(1) + 2, '自相关函数 ACF', { px: true, color: '#777', baseline: 'top' });
        P2.frame();
      } else {
        // two toy strategies on the series, cumulative PnL
        // trend: position = sign of last move; reversion: position = -sign of deviation from MA
        var ma = 0, alpha = 0.1, eqT = 0, eqR = 0, pT = [[0, 0]], pR = [[0, 0]];
        for (i = 1; i < N; i++) {
          ma = (1 - alpha) * ma + alpha * y[i - 1];
          var mom = y[i - 1] - y[i - 2 < 0 ? 0 : i - 2];
          var posT = mom > 0 ? 1 : -1;
          var posR = (y[i - 1] - ma) > 0 ? -1 : 1;
          var dr = y[i] - y[i - 1];
          eqT += posT * dr; eqR += posR * dr;
          pT.push([i, eqT]); pR.push([i, eqR]);
        }
        var lo = 1e9, hi = -1e9; pT.concat(pR).forEach(function (q) { if (q[1] < lo) lo = q[1]; if (q[1] > hi) hi = q[1]; });
        var pd = (hi - lo) * 0.1 || 1;
        P2.setDomain(0, N, lo - pd, hi + pd);
        P2.gridY(ticks(lo - pd, hi + pd, 3)); P2.hline(0, { color: '#ccc' });
        P2.line(pT, { width: 1.6, color: '#111' });
        P2.line(pR, { width: 1.4, color: '#999', dash: [4, 3] });
        P2.text(P2.X(0) + 4, P2.Y(P2.dom().y1) + 2, '趋势(实) vs 回归(虚) 累计PnL', { px: true, color: '#777', baseline: 'top' });
        P2.frame();
        ro(s.readout, [['趋势策略', (eqT >= 0 ? '+' : '') + fmt(eqT, 1)], ['回归策略', (eqR >= 0 ? '+' : '') + fmt(eqR, 1)], ['φ', fmt(ph, 2)], ['半衰期', ph > 0 && ph < 1 ? fmt(Math.log(0.5) / Math.log(ph), 1) + ' 期' : '—']]);
        return;
      }
      ro(s.readout, [['φ', fmt(ph, 2)], ['lag-1 ACF', '≈ ' + fmt(ph, 2)], ['半衰期', ph > 0 && ph < 1 ? fmt(Math.log(0.5) / Math.log(ph), 1) + ' 期' : (ph <= 0 ? '振荡' : '∞')], ['制度', ph >= 0.85 ? '趋势' : ph <= -0.2 ? '均值回归' : '噪声']]);
    }
    bind(m, render);
  };

  // ---- 6. overfit : max-of-N in-sample Sharpe (deflated Sharpe) ----
  W.overfit = function (m) {
    var d = m.dataset, s = shell(m);
    var POOL = 1000, isPool = gaussPool(POOL, 271), oosPool = gaussPool(POOL, 99173);
    var Nn = slider(s.controls, '尝试的策略数 N', 1, 500, 1, num(d.n, 80), render, function (v) { return fmt(v, 0); });
    var Tt = slider(s.controls, '每策略交易数 T', 30, 1000, 10, num(d.t, 250), render, function (v) { return fmt(v, 0); });
    var c = s.addCanvas(250), P = Plot(c);
    s.mountReadout();
    s.note('全部 N 个策略<b>真实优势为零</b>。挑出样本内最高夏普 = N 个噪声里取最大值 ≈ √(2 ln N)/√T——这就是「通缩夏普(deflated Sharpe)」要扣掉的虚高。和你跑 N 个模型变体后报最好那个的多重检验偏差完全同构，也正是你做对抗鲁棒性时的最坏情形视角。');
    function render() {
      P.resize(); P.clear();
      var N = Math.round(Nn.get()), T = Tt.get(), sd = 1 / Math.sqrt(T);
      var bestIdx = 0, bestIS = -1e9;
      for (var i = 0; i < N; i++) { var v = isPool[i] * sd; if (v > bestIS) { bestIS = v; bestIdx = i; } }
      var bestOOS = oosPool[bestIdx] * sd;
      var expMax = Math.sqrt(2 * Math.log(Math.max(N, 1.0001))) * sd; // theory
      // scatter of in-sample sharpes (index vs value), highlight max + its OOS
      var xmax = Math.max(N, 5), ylim = Math.max(0.5, expMax * 1.6, Math.abs(bestIS) * 1.2);
      P.setDomain(0, xmax, -ylim, ylim);
      P.gridY(ticks(-ylim, ylim, 5), function (t) { return fmt(t, 2); });
      P.gridX(ticks(0, xmax, 5), function (t) { return fmt(t, 0); });
      P.hline(0, { color: '#111', width: 1 });
      P.text(0, ylim, '真实夏普 = 0', { dy: -4, color: '#aaa', align: 'left' });
      for (i = 0; i < N; i++) { P.dot(i + 0.5, isPool[i] * sd, 1.6, '#bbb'); }
      // expected-max envelope
      var env = []; for (var k = 1; k <= xmax; k++) env.push([k, Math.sqrt(2 * Math.log(Math.max(k, 1.0001))) * sd]);
      P.line(env, { color: '#111', width: 1.2, dash: [4, 3] });
      P.dot(bestIdx + 0.5, bestIS, 4, '#111');
      P.text(bestIdx + 0.5, bestIS, '你挑中的', { dy: -7, align: 'center', color: '#111' });
      P.dot(bestIdx + 0.5, bestOOS, 4, '#fff');
      P.ctx.strokeStyle = '#111'; P.ctx.lineWidth = 1.4; P.ctx.beginPath(); P.ctx.arc(P.X(bestIdx + 0.5), P.Y(bestOOS), 4, 0, 7); P.ctx.stroke();
      P.ctx.setLineDash([2, 2]); P.ctx.beginPath(); P.ctx.moveTo(P.X(bestIdx + 0.5), P.Y(bestIS)); P.ctx.lineTo(P.X(bestIdx + 0.5), P.Y(bestOOS)); P.ctx.stroke(); P.ctx.setLineDash([]);
      P.text(bestIdx + 0.5, bestOOS, '它的样本外', { dy: 14, align: 'center', color: '#777' });
      P.frame();
      ro(s.readout, [['样本内最高夏普', '<b>' + fmt(bestIS, 2) + '</b>'], ['同一策略样本外', fmt(bestOOS, 2)], ['理论虚高 √(2lnN)/√T', '≈ ' + fmt(expMax, 2)], ['通缩后真实', '≈ 0']]);
    }
    bind(m, render);
  };

  // ---- 7. sharpe-significance : how long to trust an edge ----------
  W['sharpe-significance'] = function (m) {
    var d = m.dataset, s = shell(m);
    var sr = slider(s.controls, '年化夏普 SR', 0.2, 3, 0.1, num(d.sr, 1), render, function (v) { return fmt(v, 1); });
    var yr = slider(s.controls, '观测年数', 0.25, 10, 0.25, num(d.years, 2), render, function (v) { return fmt(v, 2) + ' 年'; });
    var c = s.addCanvas(230), P = Plot(c);
    s.mountReadout();
    s.note('t = SR·√年数。要达到 p<0.05 (单侧 t≈1.65) 需要约 (1.65/SR)² 年。<b>先测量，别假设</b>——夏普 1 的策略也要约 2.7 年样本才统计显著，这和你报基准前要够样本量是同一条纪律。');
    function render() {
      P.resize(); P.clear();
      var SR = sr.get(), Y = yr.get();
      var tf = function (y) { return SR * Math.sqrt(y); };
      var pts = []; for (var i = 0; i <= 200; i++) { var y = 10 * i / 200; pts.push([y, tf(y)]); }
      var ymax = Math.max(tf(10), 2.5);
      P.setDomain(0, 10, 0, ymax);
      P.gridY(ticks(0, ymax, 5), function (t) { return fmt(t, 1); });
      P.gridX(ticks(0, 10, 5), function (t) { return fmt(t, 0) + 'y'; });
      P.hline(1.65, { color: '#999', dash: [4, 3] }); P.text(10, 1.65, 'p<0.05 (t=1.65)', { align: 'right', dy: -4, color: '#777' });
      P.hline(1.96, { color: '#bbb', dash: [2, 3] }); P.text(10, 1.96, 'p<0.025', { align: 'right', dy: -4, color: '#aaa' });
      P.line(pts, { width: 2 });
      var t = tf(Y); P.vline(Y, { dash: [3, 3] }); P.dot(Y, Math.min(t, ymax), 4);
      P.frame();
      var needed = Math.pow(1.65 / SR, 2);
      ro(s.readout, [['当前 t 值', '<b>' + fmt(t, 2) + '</b>'], ['是否显著', t >= 1.65 ? '是 (p<0.05)' : '否 — 可能是运气'], ['需观测', '≈ ' + fmt(needed, 1) + ' 年才显著']]);
    }
    bind(m, render);
  };

  // ---- 8. cost-of-carry : futures term structure -------------------
  W['cost-of-carry'] = function (m) {
    var d = m.dataset, s = shell(m);
    var S0 = slider(s.controls, '现货 S', 1000, 6000, 50, num(d.spot, 5000), render, function (v) { return fmt(v, 0); });
    var r = slider(s.controls, '无风险利率 r', 0, 0.10, 0.0025, num(d.r, 0.045), render, function (v) { return fmt(v * 100, 2) + '%'; });
    var q = slider(s.controls, '分红/便利收益 q', 0, 0.10, 0.0025, num(d.q, 0.015), render, function (v) { return fmt(v * 100, 2) + '%'; });
    var c = s.addCanvas(240), P = Plot(c);
    s.mountReadout();
    s.note('F(T) = S·e^(r−q)T，到期 T=0 必收敛到现货。这不是预测，是<b>无套利约束</b>——风险中性(鞅)测度下的确定性函数，像给价格加了一条一致性损失。r>q 升水(contango)，r<q 贴水。');
    function render() {
      P.resize(); P.clear();
      var sp = S0.get(), rr = r.get(), qq = q.get();
      var F = function (T) { return sp * Math.exp((rr - qq) * T); };
      var pts = []; for (var i = 0; i <= 120; i++) { var T = i / 120; pts.push([T * 12, F(T)]); }
      var vals = pts.map(function (p) { return p[1]; });
      var lo = Math.min.apply(null, vals.concat([sp])), hi = Math.max.apply(null, vals.concat([sp]));
      var pad = (hi - lo) * 0.3 || sp * 0.01;
      P.setDomain(0, 12, lo - pad, hi + pad);
      P.gridY(ticks(lo - pad, hi + pad, 5), function (t) { return fmt(t, 0); });
      P.gridX([0, 3, 6, 9, 12], function (t) { return fmt(t, 0) + 'M'; });
      P.hline(sp, { color: '#ccc', dash: [4, 4] }); P.text(0.2, sp, '现货 S', { color: '#999', dy: -4 });
      P.line(pts, { width: 2 });
      P.dot(0, sp, 3.5);
      P.frame();
      var basis3 = F(0.25) - sp;
      ro(s.readout, [['净持有成本 r−q', fmt((rr - qq) * 100, 2) + '%'], ['3M 基差', (basis3 >= 0 ? '+' : '') + fmt(basis3, 1)], ['形态', rr > qq ? '升水 contango' : rr < qq ? '贴水 backwardation' : '平']]);
    }
    bind(m, render);
  };

  // ---- 9. diversification : effective number of bets ---------------
  W.diversification = function (m) {
    var d = m.dataset, s = shell(m);
    var rho = slider(s.controls, '两两相关 ρ', -0.2, 1, 0.05, num(d.rho, 0.6), render, function (v) { return fmt(v, 2); });
    var nn = slider(s.controls, '持仓数 n', 1, 30, 1, num(d.n, 8), render, function (v) { return fmt(v, 0); });
    var c = s.addCanvas(240), P = Plot(c);
    s.mountReadout();
    s.note('等权组合波动 = √(1/n + (1−1/n)ρ)，n→∞ 趋于 √ρ 的系统性地板。<b>有效独立赌注 Nₑ = n/(1+(n−1)ρ)</b> 就是参与率/有效秩——和你算嵌入协方差谱的有效维度 (Σλ)²/Σλ² 是同一个量。做多 ES+NQ+RTY 看着 3 注，其实远不到 3。');
    function render() {
      P.resize(); P.clear();
      var rr = rho.get();
      var vol = function (n) { return Math.sqrt(Math.max(1e-6, 1 / n + (1 - 1 / n) * rr)); };
      var pts = []; for (var n = 1; n <= 30; n++) pts.push([n, vol(n)]);
      P.setDomain(1, 30, 0, 1.02);
      P.gridY(ticks(0, 1, 5), function (t) { return fmt(t, 1); });
      P.gridX(ticks(1, 30, 6), function (t) { return fmt(t, 0); });
      if (rr > 0) { var floor = Math.sqrt(rr); P.hline(floor, { color: '#999', dash: [4, 3] }); P.text(30, floor, '系统性地板 √ρ', { align: 'right', dy: -4, color: '#777' }); }
      P.line([[1, 1], [30, 1 / Math.sqrt(30)]], { color: '#ccc', dash: [2, 3] });
      P.text(30, 1 / Math.sqrt(30), 'ρ=0 理想 1/√n', { align: 'right', dy: 12, color: '#bbb' });
      P.line(pts, { width: 2 });
      var N = nn.get(); P.vline(N, { dash: [3, 3] }); P.dot(N, vol(N), 4);
      P.frame();
      var Neff = N / (1 + (N - 1) * rr);
      ro(s.readout, [['组合波动', fmt(vol(N), 3) + ' (单品=1)'], ['名义注数', fmt(N, 0)], ['有效独立注 Nₑ', '<b>' + fmt(Neff, 1) + '</b>'], ['分散效率', fmt(Neff / N * 100, 0) + '%']]);
    }
    bind(m, render);
  };

  // ---- 10. payoff : linear futures payoff --------------------------
  W.payoff = function (m) {
    var d = m.dataset, s = shell(m);
    var side = segmented(s.controls, '方向', ['做多', '做空'], 0, render);
    var entry = slider(s.controls, '入场价', 4000, 6000, 25, num(d.entry, 5000), render, function (v) { return fmt(v, 0); });
    var pt = num(d.pt, 5), lots = slider(s.controls, '手数', 1, 10, 1, num(d.lots, 1), render, function (v) { return fmt(v, 0); });
    var c = s.addCanvas(230), P = Plot(c);
    s.mountReadout();
    s.note('期货盈亏对价格<b>线性</b>，斜率(delta)恒为 ±每点价值×手数——你交易的是标的的一阶梯度，常数敏感度。期权才是非线性(凸)的。');
    function render() {
      P.resize(); P.clear();
      var e = entry.get(), L = lots.get(), dir = side.get() === 0 ? 1 : -1;
      var lo = e - 400, hi = e + 400;
      var pnl = function (px) { return dir * (px - e) * pt * L; };
      var ymax = 400 * pt * L, pts = [[lo, pnl(lo)], [hi, pnl(hi)]];
      P.setDomain(lo, hi, -ymax, ymax);
      P.gridY(ticks(-ymax, ymax, 5), function (t) { return '$' + fmt(t, 0); });
      P.gridX(ticks(lo, hi, 5), function (t) { return fmt(t, 0); });
      P.hline(0, { color: '#ccc' }); P.vline(e, { color: '#ccc', dash: [3, 3] });
      P.area([[lo, pnl(lo)], [e, 0]], 0, { color: 'rgba(17,17,17,.05)' });
      P.line(pts, { width: 2 });
      P.dot(e, 0, 3.5);
      P.text(e, 0, '入场 ' + fmt(e, 0), { dy: 14, align: 'center', color: '#777' });
      P.frame();
      ro(s.readout, [['每点价值', '$' + fmt(pt * L, 0)], ['+100 点', (dir > 0 ? '+' : '−') + '$' + fmt(100 * pt * L, 0)], ['−100 点', (dir > 0 ? '−' : '+') + '$' + fmt(100 * pt * L, 0)], ['斜率(delta)', dir > 0 ? '+' + fmt(pt * L, 0) : '−' + fmt(pt * L, 0) + '/点']]);
    }
    bind(m, render);
  };

  // ---- mount + responsive binding --------------------------------
  function bind(mount, render) {
    render();
    var raf = 0;
    var ro2 = new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
    ro2.observe(mount);
  }

  function boot() {
    document.querySelectorAll('figure.widget[data-widget]').forEach(function (mount) {
      var name = mount.getAttribute('data-widget');
      var fn = W[name];
      if (!fn) { mount.appendChild(E('div', { class: 'w-note', text: '未知组件: ' + name })); return; }
      try { fn(mount); } catch (err) { console.error('widget', name, err); mount.appendChild(E('div', { class: 'w-note', text: '组件出错: ' + name })); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
