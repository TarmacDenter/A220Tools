const CACHE_VERSION = 'a220tools-v1'
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`
const BASE_PATH = '/A220Tools/'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll([
        BASE_PATH,
        `${BASE_PATH}index.html`,
        `${BASE_PATH}manifest.webmanifest`,
        `${BASE_PATH}favicon.ico`,
        `${BASE_PATH}icons/icon-192.png`,
        `${BASE_PATH}icons/icon-512.png`,
      ])
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(APP_SHELL_CACHE)
        return cache.match(`${BASE_PATH}index.html`)
      })
    )
    return
  }

  if (!url.pathname.startsWith(BASE_PATH)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const copy = response.clone()
        caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, copy))
        return response
      })
    })
  )
})
