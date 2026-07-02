rows = open('grid.txt').read().split('\n')
labels = ''.join(rows)
colors = open('colors.txt').read()
COLS, ROWS = len(rows[0]), len(rows)
assert len(labels) == COLS * ROWS and len(colors) == COLS * ROWS * 3

js = r'''// portrait.jpg -> hanzi mosaic (click to toggle, hover to disturb)
// regions precomputed offline: 0 tian 1 qiao 2 shan 3 hai 4 shu 5 wo
(function () {
  var COLS = %COLS%, ROWS = %ROWS%;
  var CHARS = ['天', '桥', '山', '海', '树', '我'];
  var LAB = '%LAB%';
  var COL = '%COL%';

  function init() {
    var img = document.querySelector('img[src^="/portrait.jpg"], img[src^="portrait.jpg"]');
    if (!img) return;
    img.style.cursor = 'pointer';
    img.title = 'click';

    var canvas = null, ctx = null, on = false, raf = 0;
    var W, Hc, cw, chh;
    var dx = new Float32Array(COLS * ROWS), dy = new Float32Array(COLS * ROWS);
    var px = -1e4, py = -1e4, inside = false;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() {
      var r = img.getBoundingClientRect();
      W = Math.round(r.width) || img.naturalWidth;
      Hc = Math.round(W * ROWS / COLS);
      var dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr; canvas.height = Hc * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = Hc + 'px';
      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      cw = W / COLS; chh = Hc / ROWS;
    }

    function build() {
      canvas = document.createElement('canvas');
      canvas.style.display = 'none';
      canvas.style.cursor = 'pointer';
      canvas.title = 'click';
      size();
      canvas.addEventListener('click', toggle);
      canvas.addEventListener('pointermove', function (e) {
        if (still) return;
        var q = canvas.getBoundingClientRect();
        px = e.clientX - q.left; py = e.clientY - q.top;
        inside = true; kick();
      });
      canvas.addEventListener('pointerleave', function () {
        inside = false; px = py = -1e4; kick();
      });
      window.addEventListener('resize', function () {
        if (on) { size(); draw(); }
      });
      img.parentNode.insertBefore(canvas, img.nextSibling);
    }

    function draw() {
      ctx.clearRect(0, 0, W, Hc);
      ctx.font = (chh * 1.15).toFixed(2) + 'px "Songti SC","STSong","Noto Serif SC",serif';
      for (var k = 0, j = 0; j < ROWS; j++) {
        var cy = (j + 0.5) * chh;
        for (var i = 0; i < COLS; i++, k++) {
          ctx.fillStyle = '#' + COL.substr(k * 3, 3);
          ctx.fillText(CHARS[LAB.charCodeAt(k) - 48],
            (i + 0.5) * cw + dx[k], cy + dy[k]);
        }
      }
    }

    function step() {
      raf = 0;
      var R = Math.max(48, W * 0.13), F = R * 0.55, moving = false;
      for (var k = 0, j = 0; j < ROWS; j++) {
        var cy = (j + 0.5) * chh;
        for (var i = 0; i < COLS; i++, k++) {
          var tx = 0, ty = 0;
          if (inside) {
            var vx = (i + 0.5) * cw - px, vy = cy - py;
            var d2 = vx * vx + vy * vy;
            if (d2 < R * R && d2 > 1) {
              var dd = Math.sqrt(d2), f = 1 - dd / R;
              f = f * f * F;
              tx = vx / dd * f; ty = vy / dd * f;
            }
          }
          dx[k] += (tx - dx[k]) * 0.16;
          dy[k] += (ty - dy[k]) * 0.16;
          if (tx || ty || dx[k] * dx[k] + dy[k] * dy[k] > 0.02) moving = true;
        }
      }
      draw();
      if (moving) raf = requestAnimationFrame(step);
    }

    function kick() { if (on && !raf) raf = requestAnimationFrame(step); }

    function toggle() {
      if (!canvas) build();
      on = !on;
      if (on) {
        size();
        img.style.display = 'none';
        canvas.style.display = 'block';
        draw();
      } else {
        canvas.style.display = 'none';
        img.style.display = '';
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        for (var k = 0; k < dx.length; k++) { dx[k] = 0; dy[k] = 0; }
      }
    }

    img.addEventListener('click', toggle);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
'''
js = js.replace('%COLS%', str(COLS)).replace('%ROWS%', str(ROWS))
js = js.replace('%LAB%', labels).replace('%COL%', colors)
open('../../js/ascii-portrait.js', 'w').write(js)
print('wrote ascii-portrait.js', len(js) // 1024, 'KB', COLS, 'x', ROWS)
