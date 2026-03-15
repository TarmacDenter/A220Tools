export async function fetchMetarFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return $fetch(`/api/metar/${normalizedIcao}`) as Promise<T>
}

export async function fetchAirportFromServer<T>(icao: string): Promise<T> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return $fetch(`/api/airport/${normalizedIcao}`) as Promise<T>
}
