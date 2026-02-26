function buildAviationWeatherEndpoint(path: string): string {
  return `https://aviationweather.gov/api/data${path}`
}

function withCorsProxy(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`
}

export async function fetchJsonWithFallback<T>(urls: string[]): Promise<T> {

  let lastError: unknown = null

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return (await response.json()) as T
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to fetch Aviation Weather data')
}

export async function fetchAviationWeatherJson<T>(path: string): Promise<T> {
  const directUrl = buildAviationWeatherEndpoint(path)

  if (import.meta.env.DEV) {
    return fetchJsonWithFallback<T>([`/api/avwx${path}`])
  }

  // gh-pages deployments can hit CORS restrictions when calling the API directly.
  // Try direct first, then transparently fall back to a CORS proxy.
  return fetchJsonWithFallback<T>([directUrl, withCorsProxy(directUrl)])
}
