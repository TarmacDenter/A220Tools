const CACHE_VERSION = 'a220tools-v2'
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`
const API_CACHE = `${CACHE_VERSION}-api`
const API_ROUTE_PREFIXES = ['/api/metar/', '/api/airport/']

function getScopePath() {
  const scopeUrl = new URL(self.registration.scope)
  return scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : `${scopeUrl.pathname}/`
}

const SCOPE_PATH = getScopePath()

function getAssetPath(path) {
  return `${SCOPE_PATH}${path}`.replace(/\/+/g, '/').replace(':/', '://')
}

function isScopeRequest(url) {
  return url.pathname.startsWith(SCOPE_PATH)
}

function isNuxtBackendRoute(url) {
  return API_ROUTE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll([
        getAssetPath(''),
        getAssetPath('manifest.webmanifest'),
        getAssetPath('favicon.ico'),
        getAssetPath('icons/android-chrome-192x192.png'),
        getAssetPath('icons/android-chrome-512x512.png'),
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
          .filter((key) => key !== APP_SHELL_CACHE && key !== API_CACHE)
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

  if (isNuxtBackendRoute(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(API_CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          if (cached) return cached
          throw new Error('Network unavailable and no cached API response')
        })
    )
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(APP_SHELL_CACHE)
        return cache.match(getAssetPath(''))
      })
    )
    return
  }

  if (!isScopeRequest(url)) return

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
