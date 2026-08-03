import type { AirportApiRecord, MetarApiRecord } from '#shared/types/api'

export async function fetchMetarFromServer(icao: string): Promise<MetarApiRecord> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return $fetch<MetarApiRecord>(`/api/metar/${normalizedIcao}`)
}

export async function fetchAirportFromServer(icao: string): Promise<AirportApiRecord> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return $fetch<AirportApiRecord>(`/api/airport/${normalizedIcao}`)
}
