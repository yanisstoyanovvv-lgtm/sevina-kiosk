/* Sevina kiosk service worker – version 759a387e57 */
var VERSION = "759a387e57";
var CACHE = "sevina-kiosk-" + VERSION;
var PRECACHE = ["./", "style.css?v=759a387e57", "config.js?v=759a387e57", "seating.js?v=759a387e57", "app.js?v=759a387e57", "assets/bg-corners-portrait.jpg?v=759a387e57", "assets/brain.png?v=759a387e57", "assets/title-portrait.jpg?v=759a387e57", "fonts/LobsterTwo-Bold.ttf?v=759a387e57", "fonts/NotoColorEmoji-subset.ttf?v=759a387e57", "fonts/Rubik.ttf?v=759a387e57"];
var NAV_TIMEOUT_MS = 6000;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(PRECACHE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("sevina-kiosk-") === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function timeout(ms) { return new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); }); }

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                       // votes (POST) go straight to the network
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Apps Script / ?api= endpoint: never cached
  var scope = new URL(self.registration.scope);
  if (url.pathname.indexOf(scope.pathname) !== 0) return;

  // Page itself (index.html, any ?kiosk=N): network-first, bypass HTTP cache, fall back to cached copy.
  if (req.mode === "navigate" || url.pathname === scope.pathname || url.pathname === scope.pathname + "index.html") {
    e.respondWith(Promise.race([fetch(req.url, { cache: "no-store", credentials: "same-origin" }), timeout(NAV_TIMEOUT_MS)])
      .then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put("./", copy); }); }
        return res;
      })
      .catch(function () {
        return caches.open(CACHE).then(function (c) { return c.match("./"); }).then(function (r) {
          return r || new Response("<h1>Няма връзка</h1>", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
        });
      }));
    return;
  }
  // Versioned static files (?v=...): cache-first, then network (and store).
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; })
        .catch(function () { return c.match(req, { ignoreSearch: true }); });
    });
  }));
});
