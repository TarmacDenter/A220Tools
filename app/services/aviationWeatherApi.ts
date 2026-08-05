import type { AirportConditionsResponse } from '#shared/types/api'
export async function fetchAirportConditionsFromServer(icao: string): Promise<AirportConditionsResponse> { return $fetch<AirportConditionsResponse>(`/api/airport-conditions/${encodeURIComponent(icao.toUpperCase())}`) }
