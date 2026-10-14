/* Optional 3rd sync channel for aie-sf-2026, on your own Cloudflare (most reliable,
   same origin as the deck). ntfy.sh + MQTT already work without this; deploy it only
   if you want a third independent channel.

   Deploy:
     1. wrangler init sync-worker  (or paste this into a new Worker in the dashboard)
     2. Bind a Durable Object named SYNC -> class Hub. In wrangler.toml:
          [[durable_objects.bindings]]
          name = "SYNC"
          class_name = "Hub"
          [[migrations]]
          tag = "v1"
          new_sqlite_classes = ["Hub"]   # SQLite-backed DO is on the free Workers plan
     3. Route it at e.g. https://hanxiao.io/aie-sf-2026-sync/*  (or a workers.dev URL).
     4. Tell the pages to use it: open the deck as  /aie-sf-2026/?follow&worker=https://hanxiao.io/aie-sf-2026-sync
        and the phone as  /aie-sf-2026/speaker-notes/?worker=https://hanxiao.io/aie-sf-2026-sync
        (or hard-code WORKER in sync.js).

   Endpoints:  POST <base>/pub   (body = the {s,t} json the phone sends)
               GET  <base>/last  (returns the latest {s,t}; the deck polls this ~1.3s)
   The latest slide is held in the single DO instance's memory; the phone's 15s
   heartbeat keeps it fresh, so it self-recovers if the DO ever hibernates. */

export class Hub {
  constructor(state){ this.state = state; this.last = ''; }
  async fetch(req){
    const u = new URL(req.url);
    if(req.method === 'OPTIONS') return new Response(null, {headers: cors()});
    if(req.method === 'POST' && u.pathname.endsWith('/pub')){ this.last = await req.text(); return new Response('ok', {headers: cors()}); }
    if(u.pathname.endsWith('/last')) return new Response(this.last, {headers: cors()});
    return new Response('', {status: 404, headers: cors()});
  }
}

export default {
  async fetch(req, env){
    if(req.method === 'OPTIONS') return new Response(null, {headers: cors()});
    const id = env.SYNC.idFromName('aie-sf-2026');     // one shared hub for everyone
    return env.SYNC.get(id).fetch(req);
  }
};

function cors(){
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': '*',
    'content-type': 'text/plain',
    'cache-control': 'no-store'
  };
}
