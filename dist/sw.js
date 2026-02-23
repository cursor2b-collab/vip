const CACHE_NAME = 'app-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/api')) return
  if (url.pathname.startsWith('/admin')) return
  if (url.pathname.startsWith('/app/admin')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
        return response
      }).catch(() => null)

      return cached || fetchPromise
    })
  )
})
