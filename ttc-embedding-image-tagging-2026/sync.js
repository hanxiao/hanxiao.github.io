/* Cross-device slide sync for aie-sf-2026 (phone controller -> projected deck).
   Redundant channels: PUBLISH to all, FOLLOW from all, newest timestamp wins
   (so duplicate / out-of-order delivery across channels is harmless).
     1. ntfy.sh            HTTP SSE + POST   - primary, always on, no setup
     2. EMQX public broker MQTT over WSS     - backup, zero setup (mqtt.js loaded lazily)
     3. Cloudflare Worker  HTTP poll + POST  - optional, your own infra (see sync-worker.js)
   One channel is enough in practice; the rest are just in case.
   Override via query string:  ?ch=<topic>   ?worker=<https url>   ?mqtt=0
   window.Sync = { topic, publish(slide), follow(cb), ensureMqtt() } */
(function(){
  var qs = new URLSearchParams(location.search);
  // Deck-specific topic. MUST differ from other decks (the aie-sf-2026 deck uses its own),
  // otherwise two decks share one channel and their remotes fight over "newest epoch wins".
  var TOPIC  = qs.get('ch') || 'ttc-img-tagging-2026-hxiao-9f4b7c1e';
  var WORKER = (qs.get('worker') || '').replace(/\/+$/,'');   // '' = Worker channel off
  var MQTT_ON = qs.get('mqtt') !== '0';
  var NTFY = 'https://ntfy.sh';
  var MQURL = 'wss://broker.emqx.io:8084/mqtt', MQTOP = 'ttc-img-tagging-2026/' + TOPIC;
  var mq = null, mqOnMsg = null;

  // Each controller session gets a monotonically-increasing epoch. Followers lock onto the
  // newest epoch and ignore any lingering older controller -- that's what "kicks" a stale remote
  // (e.g. a leftover phone tab or a desktop with Remote still on) so it can't flash the projector.
  var EPOCH = 0;
  function takeover(){ EPOCH = Math.max(Date.now(), EPOCH + 1); }
  takeover();   // mint a session at load so our messages outrank anything left over

  function pack(s){ return JSON.stringify({ s:s, t:Date.now(), e:EPOCH }); }
  function post(u, b, retries){
    try{
      fetch(u, {method:'POST', body:b, keepalive:true})
        .then(function(r){ if(!r || !r.ok) throw 0; })
        .catch(function(){ if(retries>0) setTimeout(function(){ post(u,b,retries-1); }, 300); });
    }catch(_){}
  }

  /* ---------- publish to every channel ---------- */
  function publish(slide){
    var m = pack(slide);
    post(NTFY + '/' + encodeURIComponent(TOPIC), m, 2);
    if(WORKER) post(WORKER + '/pub', m, 1);
    if(mq && mq.connected){ try{ mq.publish(MQTOP, m); }catch(_){} }
  }

  /* ---------- reachability probe: POST a harmless s=0 ping (followers ignore s<1) so the
     phone UI can tell the presenter whether the sync server is reachable on this network. ---- */
  function ping(cb){
    try{
      fetch(NTFY + '/' + encodeURIComponent(TOPIC), {method:'POST', body:pack(0)})
        .then(function(r){ cb(!!(r && r.ok)); })
        .catch(function(){ cb(false); });
    }catch(_){ cb(false); }
  }

  /* ---------- follow: subscribe to every channel; cb(slide) on the freshest ---------- */
  function follow(cb){
    var bestE = -1, lastT = 0, lastRx = 0;
    function onMsg(raw){
      try{
        var o = (typeof raw === 'string') ? JSON.parse(raw) : raw;
        if(!o || !(o.s >= 1)) return;
        var e = +o.e || 0, t = +o.t || 0, now = Date.now();
        // ignore a stale controller while the current one is still live (it heartbeats every 15s);
        // but if the current one has gone silent for 20s, let whoever is talking take over (no lockout).
        if(e < bestE && (now - lastRx) < 20000) return;
        if(e !== bestE){ bestE = e; lastT = 0; }        // new / fallback controller -> clean slate
        if(t > lastT){ lastT = t; lastRx = now; cb(o.s); }
      }catch(_){}
    }
    mqOnMsg = onMsg;
    ntfyFollow(onMsg);
    if(WORKER) workerFollow(onMsg);
    if(MQTT_ON) ensureMqtt();
  }

  function ntfyFollow(onMsg){
    var es = null, last = Date.now();
    function conn(){
      if(es){ try{ es.close(); }catch(_){} }
      try{
        es = new EventSource(NTFY + '/' + encodeURIComponent(TOPIC) + '/sse?since=20s');
        es.onmessage = function(e){ last = Date.now();
          try{ var m = JSON.parse(e.data); if(m.event === 'message' && m.message) onMsg(m.message); }catch(_){} };
        es.onerror = function(){};
      }catch(_){}
    }
    conn();
    setInterval(function(){ if(Date.now() - last > 60000){ last = Date.now(); conn(); } }, 15000); // watchdog reconnect
  }

  function workerFollow(onMsg){
    var fails = 0, dead = false;
    setInterval(function(){
      if(dead) return;
      try{
        fetch(WORKER + '/last', {cache:'no-store'})
          .then(function(r){ if(!r || !r.ok) throw 0; return r.text(); })
          .then(function(t){ fails = 0; if(t) onMsg(t); })
          .catch(function(){ if(++fails >= 5) dead = true; });   // give up on a missing/broken worker
      }catch(_){ if(++fails >= 5) dead = true; }
    }, 1300);
  }

  /* ---------- MQTT: load mqtt.js lazily, connect to a public broker ---------- */
  function ensureMqtt(){
    if(!MQTT_ON) return;
    if(window.mqtt){ connectMqtt(); return; }
    if(window.__mqLoad) return; window.__mqLoad = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js';
    s.onload = connectMqtt; s.onerror = function(){};   // CDN blocked? ntfy still carries it
    document.head.appendChild(s);
  }
  function connectMqtt(){
    try{
      if(mq || !window.mqtt) return;
      mq = window.mqtt.connect(MQURL, { reconnectPeriod:3000, connectTimeout:8000 });
      mq.on('connect', function(){ try{ mq.subscribe(MQTOP); }catch(_){} });
      mq.on('message', function(t, p){ if(mqOnMsg) mqOnMsg(p.toString()); });
      mq.on('error', function(){});
    }catch(_){}
  }

  window.Sync = { topic:TOPIC, publish:publish, follow:follow, ensureMqtt:ensureMqtt, takeover:takeover, ping:ping };
})();
