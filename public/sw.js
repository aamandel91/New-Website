const CACHE_NAME = 'fhf-static-v1'
const STATIC_ASSETS = ['/fonts/', '/icons/', '/images/']

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only cache GET requests for static assets
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  const isStatic =
    STATIC_ASSETS.some((prefix) => url.pathname.startsWith(prefix)) ||
    /\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|avif|svg|ico)$/.test(url.pathname)

  if (!isStatic) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response

        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone)
        })

        return response
      })
    })
  )
})
