import type { AirportConditionsResponse } from '#shared/types/api'

export async function fetchAirportConditionsFromServer(icao: string): Promise<AirportConditionsResponse> {
  const normalizedIcao = encodeURIComponent(icao.toUpperCase())
  return $fetch<AirportConditionsResponse>(`/api/airport-conditions/${normalizedIcao}`)
}
