import { ref } from 'vue'
import type { FetchStatus } from '@/types/request'
import type { MagneticCorrection, MetarData } from '#shared/domain/wind'
import { loadAirportConditions } from '@/services/airportConditions'
import type { RunwaySelection } from '#shared/types/api'

export function useAirportConditions() {
  const status = ref<FetchStatus>('idle')
  const metar = ref<MetarData | null>(null)
  const magneticCorrection = ref<MagneticCorrection | null>(null)
  const runways = ref<RunwaySelection[]>([])
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

  async function fetchAirportConditions(icao: string, lat?: number, lon?: number): Promise<void> {
    status.value = 'loading'
    metar.value = null
    magneticCorrection.value = null
    runways.value = []
    error.value = null

    try {
      const conditions = await loadAirportConditions(icao, lat, lon)
      runways.value = conditions.runways
      metar.value = conditions.metar
      magneticCorrection.value = conditions.magneticCorrection
      status.value = 'success'
      lastFetchedAt.value = conditions.fetchedAt
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      status.value = 'error'
    }
  }

  function clearConditions() {
    status.value = 'idle'
    metar.value = null
    magneticCorrection.value = null
    runways.value = []
    error.value = null
    lastFetchedAt.value = null
  }

  return {
    status,
    metar,
    magneticCorrection,
    runways,
    error,
    lastFetchedAt,
    fetchAirportConditions,
    clearConditions,
  }
}
