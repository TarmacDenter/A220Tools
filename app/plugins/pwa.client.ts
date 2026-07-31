export default defineNuxtPlugin(() => {
  if (import.meta.dev) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => registration.unregister())
        })
        .catch(() => {
          // Best-effort cleanup; ignore errors in dev.
        })
    }
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  const config = useRuntimeConfig()

  window.addEventListener('load', async () => {
    try {
      const baseUrl = config.public.appBaseUrl ?? '/'
      await navigator.serviceWorker.register(`${baseUrl}sw.js`, {
        scope: baseUrl,
      })
      console.log('[PWA] Service worker registered')
    } catch (err) {
      console.error('[PWA] Service worker registration failed:', err)
    }
  })
})
