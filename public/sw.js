const CACHE_VERSION = 'a220tools-v3'
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`
const API_CACHE = `${CACHE_VERSION}-api`
const API_ROUTE_PREFIXES = ['/api/metar/', '/api/airport/', '/api/activity', '/api/nearest-airport']

const APP_SHELL_ASSETS = ['/', '/manifest.webmanifest', '/favicon.ico', '/icons/android-chrome-192x192.png', '/icons/android-chrome-512x512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== APP_SHELL_CACHE && k !== API_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (API_ROUTE_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) caches.open(API_CACHE).then((c) => c.put(event.request, res.clone()))
          return res
        })
        .catch(() => caches.match(event.request).then((c) => c ?? Promise.reject(new Error('offline'))))
    )
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')))
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((res) => {
      if (res.ok && res.type === 'basic') caches.open(APP_SHELL_CACHE).then((c) => c.put(event.request, res.clone()))
      return res
    }))
  )
})
