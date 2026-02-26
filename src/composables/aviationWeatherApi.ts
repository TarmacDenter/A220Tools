function buildAviationWeatherEndpoint(path: string): string {
  return `https://aviationweather.gov/api/data${path}`
}

function withCorsProxy(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`
}

function withIsomorphicCorsProxy(url: string): string {
  return `https://cors.isomorphic-git.org/${url}`
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

  // gh-pages deployments hit CORS restrictions when calling aviationweather.gov directly.
  // Use CORS proxies in production to avoid direct-browser CORS failures.
  return fetchJsonWithFallback<T>([
    withIsomorphicCorsProxy(directUrl),
    withCorsProxy(directUrl),
    directUrl,
  ])
}
