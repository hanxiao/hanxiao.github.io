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
  var TOPIC  = qs.get('ch') || 'aie-sf-2026-hxiao-remote-7q3m9k2x';
  var WORKER = (qs.get('worker') || '').replace(/\/+$/,'');   // '' = Worker channel off
  var MQTT_ON = qs.get('mqtt') !== '0';
  var NTFY = 'https://ntfy.sh';
  var MQURL = 'wss://broker.emqx.io:8084/mqtt', MQTOP = 'aie-sf-2026/' + TOPIC;
  var mq = null, mqOnMsg = null;

  function pack(s){ return JSON.stringify({ s:s, t:Date.now() }); }
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

  /* ---------- follow: subscribe to every channel; cb(slide) on the freshest ---------- */
  function follow(cb){
    var lastT = 0;
    function onMsg(raw){
      try{ var o = (typeof raw === 'string') ? JSON.parse(raw) : raw;
           if(o && o.t > lastT && o.s >= 1){ lastT = o.t; cb(o.s); } }catch(_){}
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

  window.Sync = { topic:TOPIC, publish:publish, follow:follow, ensureMqtt:ensureMqtt };
})();
