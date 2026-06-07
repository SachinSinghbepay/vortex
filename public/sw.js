const CACHE = "cortex-v1"

// Pages to cache immediately on install
const PRECACHE = ["/", "/dashboard", "/goals", "/tasks", "/offline.html"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  // Only handle GET requests for same-origin pages
  if (e.request.method !== "GET") return
  if (!e.request.url.startsWith(self.location.origin)) return

  // Skip API, Next.js internals, and HMR
  const url = new URL(e.request.url)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return

  // Network-first: try the network, fall back to cache, then offline page
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful page responses
        if (res.ok && e.request.mode === "navigate") {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(e.request)
        return cached ?? caches.match("/offline.html")
      })
  )
})
