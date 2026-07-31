function fetchJson<T>(endpoint: string): Promise<T> {
  const request = $fetch as unknown as <Response>(url: string) => Promise<Response>
  return request<T>(endpoint)
}

export async function fetchMetarFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  const endpoint: string = `/api/metar/${normalizedIcao}`
  return fetchJson<T>(endpoint)
}

export async function fetchAirportFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  const endpoint: string = `/api/airport/${normalizedIcao}`
  return fetchJson<T>(endpoint)
}
