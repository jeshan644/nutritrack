const CACHE_VERSION = 'v' + Date.now()
const CACHE_NAME = `nutritrack-${CACHE_VERSION}`

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
]

// Install — cache only essential files
self.addEventListener('install', (event) => {
  // Take control immediately without waiting
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Activate — delete ALL old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),

      // Delete every old cache
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
    ])
  )
})

// Fetch — Network first, cache fallback
// NEVER serve stale HTML from cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept same-origin requests — let Supabase, APIs, etc. pass through natively
  if (url.origin !== self.location.origin) {
    return
  }

  // Always fetch HTML fresh from network — never cache it
  if (request.destination === 'document' ||
      url.pathname === '/' ||
      url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // For JS/CSS assets — network first, then cache
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh asset
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request)
        })
    )
    return
  }
})

// Listen for skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
