function resolveRequestUrl(url: string): string {
  if (!url.startsWith('/') || typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

async function fetchServerJson<T>(url: string): Promise<T> {
  console.log('[Backend API] Fetch attempt:', url)

  const response = await fetch(resolveRequestUrl(url))
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const payload = (await response.json()) as T
  console.log('[Backend API] JSON response:', payload)
  return payload
}

export async function fetchMetarFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return fetchServerJson<T>(`/api/metar/${normalizedIcao}`)
}

export async function fetchAirportFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return fetchServerJson<T>(`/api/airport/${normalizedIcao}`)
}
