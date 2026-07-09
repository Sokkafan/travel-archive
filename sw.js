const CACHE_VERSION = "pwa-v1";
const PRECACHE = "travel-archive-precache-" + CACHE_VERSION;
const PAGE_CACHE = "travel-archive-pages-" + CACHE_VERSION;
const ASSET_CACHE = "travel-archive-assets-" + CACHE_VERSION;
const BASE_PATH = "/travel-archive";
const OFFLINE_URL = "/travel-archive/offline/";
const PRECACHE_URLS = [
  "/travel-archive/",
  "/travel-archive/about/",
  "/travel-archive/archives/",
  "/travel-archive/atom.xml",
  "/travel-archive/icons/app.svg",
  "/travel-archive/images/hero/atlas.svg",
  "/travel-archive/indexes/",
  "/travel-archive/maintenance/",
  "/travel-archive/manifest.webmanifest",
  "/travel-archive/map/",
  "/travel-archive/memories/",
  "/travel-archive/offline/",
  "/travel-archive/photos/",
  "/travel-archive/planned/",
  "/travel-archive/posts/",
  "/travel-archive/posts/file-driven/",
  "/travel-archive/posts/hello-archive/",
  "/travel-archive/review/",
  "/travel-archive/rss.xml",
  "/travel-archive/search/",
  "/travel-archive/stats/",
  "/travel-archive/stories/",
  "/travel-archive/tags/",
  "/travel-archive/tags/%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86/",
  "/travel-archive/tags/%E5%8D%9A%E7%89%A9%E9%A6%86/",
  "/travel-archive/tags/%E5%9F%8E%E5%B8%82/",
  "/travel-archive/tags/%E5%B1%B1%E6%B0%B4/",
  "/travel-archive/tags/%E5%BB%BA%E7%AB%99/",
  "/travel-archive/tags/%E5%BE%92%E6%AD%A5/",
  "/travel-archive/tags/%E6%85%A2%E6%B8%B8/",
  "/travel-archive/tags/%E6%97%85%E8%A1%8C/",
  "/travel-archive/tags/%E7%BE%8E%E9%A3%9F/",
  "/travel-archive/tags/%E8%83%A1%E5%90%8C/",
  "/travel-archive/tags/%E8%87%AA%E7%84%B6/",
  "/travel-archive/tags/%E9%AB%98%E5%8E%9F/",
  "/travel-archive/themes/",
  "/travel-archive/themes/landscape-routes/",
  "/travel-archive/themes/museum-map/",
  "/travel-archive/themes/weekend-slow-travel/",
  "/travel-archive/travels/",
  "/travel-archive/travels/beijing/",
  "/travel-archive/travels/chengdu/",
  "/travel-archive/travels/guilin/",
  "/travel-archive/travels/jiuzhaigou/",
  "/travel-archive/years/"
];
const MANAGED_CACHES = [PRECACHE, PAGE_CACHE, ASSET_CACHE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("travel-archive-") && !MANAGED_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isManagedRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== location.origin) return false;
  if (!BASE_PATH) return true;
  return url.pathname === BASE_PATH || url.pathname.startsWith(BASE_PATH + "/");
}

function isDocumentRequest(request) {
  return request.mode === "navigate" || request.destination === "document";
}

function isRuntimeAsset(request) {
  if (["font", "image", "manifest", "script", "style"].includes(request.destination)) return true;
  return /\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|json|txt|xml|webmanifest|woff2?)$/i.test(new URL(request.url).pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (await caches.match(request)) || (await caches.match(OFFLINE_URL));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isManagedRequest(request)) return;
  if (isDocumentRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isRuntimeAsset(request)) {
    event.respondWith(cacheFirst(request));
  }
});
