(function () {
  // Local stroke data so nothing is fetched from any CDN at runtime.
  var DATA_BASE = "/js/hanzi-data/";
  var CHAR_FILES = { "肖": "xiao.json", "涵": "han.json" };

  function loadData(ch) {
    var file = CHAR_FILES[ch];
    return fetch(DATA_BASE + file).then(function (r) {
      return r.json();
    });
  }

  function run() {
    var chars = document.querySelectorAll(".hanzi-name .hanzi-char");
    if (!chars.length) return;

    var size = 40;
    if (window.matchMedia && window.matchMedia("(max-width: 600px)").matches) {
      size = 34;
    }

    var strokeColor =
      (getComputedStyle(document.documentElement)
        .getPropertyValue("--ap-heading") || "").trim() || "#161616";

    function gridBg(s) {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '">' +
        '<line x1="2" y1="2" x2="' + (s - 2) + '" y2="' + (s - 2) + '" stroke="#e2e2e2" stroke-width="1"/>' +
        '<line x1="' + (s - 2) + '" y1="2" x2="2" y2="' + (s - 2) + '" stroke="#e2e2e2" stroke-width="1"/>' +
        '<line x1="' + (s / 2) + '" y1="0" x2="' + (s / 2) + '" y2="' + s + '" stroke="#e2e2e2" stroke-width="1"/>' +
        '<line x1="0" y1="' + (s / 2) + '" x2="' + s + '" y2="' + (s / 2) + '" stroke="#e2e2e2" stroke-width="1"/>' +
        "</svg>";
      return "url('data:image/svg+xml;utf8," + encodeURIComponent(svg) + "')";
    }

    var writers = [];
    chars.forEach(function (el) {
      var ch = el.getAttribute("data-char");
      el.innerHTML = "";
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.backgroundImage = gridBg(size);
      writers.push(
        HanziWriter.create(el, ch, {
          width: size,
          height: size,
          padding: 2,
          showOutline: false,
          strokeAnimationSpeed: 0.9,
          delayBetweenStrokes: 60,
          strokeColor: strokeColor,
          charDataLoader: function (char, onComplete) {
            loadData(char).then(onComplete);
          },
        })
      );
    });

    function animateAll() {
      var i = 0;
      (function next() {
        if (i >= writers.length) return;
        writers[i].animateCharacter({
          onComplete: function () {
            i += 1;
            setTimeout(next, 150);
          },
        });
      })();
    }

    animateAll();

    var wrap = document.querySelector(".hanzi-name");
    if (wrap) {
      wrap.style.cursor = "pointer";
      wrap.title = "肖涵 - click to replay";
      wrap.addEventListener("click", animateAll);
    }
  }

  function waitForLib(tries) {
    if (typeof HanziWriter !== "undefined") {
      run();
      return;
    }
    if (tries 