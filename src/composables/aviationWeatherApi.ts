
function resolveRequestUrl(url: string): string {
  if (!url.startsWith('/') || typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

function classifyProxy(url: string): string {
  if (url.startsWith('/api/avwx')) {
    return 'vite-proxy'
  }
  if (url.startsWith('https://cors.isomorphic-git.org/')) {
    return 'isomorphic-git'
  }
  if (url.startsWith('https://corsproxy.io/?')) {
    return 'corsproxy.io'
  }
  if (url.startsWith('https://aviationweather.gov/')) {
    return 'direct'
  }
  return 'unknown'
}

export async function fetchJsonWithFallback<T>(urls: string[]): Promise<T> {

  let lastError: unknown = null

  for (const url of urls) {
    try {
      console.log('[AviationWeather] Fetch attempt:', url)
      const response = await fetch(resolveRequestUrl(url))
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const payload = (await response.json()) as T
      console.log('[AviationWeather] JSON response:', payload)
      console.log('[AviationWeather] Success via:', { url, proxy: classifyProxy(url) })
      return payload
    } catch (err) {
      lastError = err
      console.warn('[AviationWeather] Fetch failed:', { url, error: err })
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to fetch Aviation Weather data')
}

export async function fetchAviationWeatherJson<T>(path: string): Promise<T> {
  return fetchJsonWithFallback<T>([`/api/avwx${path}`])
}
