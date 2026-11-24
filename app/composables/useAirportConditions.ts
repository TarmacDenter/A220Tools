import { ref } from 'vue'
import type { FetchStatus } from '@/types/request'
import type { MagneticCorrection, MetarData } from '#shared/domain/wind'
import { loadAirportConditions } from '@/services/airportConditions'
import type { RunwaySelection } from '#shared/types/api'

export interface FetchAirportConditionsOptions {
  /**
   * Keep the current conditions on screen while the request is in flight and if it fails.
   * Use for refreshes of the same airport; a different airport must start from a clean slate.
   */
  keepPrevious?: boolean
}

export function useAirportConditions() {
  const status = ref<FetchStatus>('idle')
  const metar = ref<MetarData | null>(null)
  const magneticCorrection = ref<MagneticCorrection | null>(null)
  const runways = ref<RunwaySelection[]>([])
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)
  /** A background refresh is in flight while previous conditions remain displayed. */
  const isRefreshing = ref(false)
  /** The latest refresh failed; the displayed conditions are from the last successful fetch. */
  const refreshFailed = ref(false)

  // Only the most recent request may write state, so a slower earlier response
  // (e.g. a previous airport) cannot overwrite a newer one.
  let latestRequestId = 0

  function hasConditions() {
    return metar.value !== null
  }

  async function fetchAirportConditions(
    icao: string,
    options: FetchAirportConditionsOptions = {},
  ): Promise<void> {
    const requestId = ++latestRequestId
    const keepPrevious = options.keepPrevious === true && hasConditions()

    if (keepPrevious) {
      isRefreshing.value = true
    } else {
      status.value = 'loading'
      metar.value = null
      magneticCorrection.value = null
      runways.value = []
      error.value = null
      refreshFailed.value = false
      isRefreshing.value = false
    }

    try {
      const conditions = await loadAirportConditions(icao)
      if (requestId !== latestRequestId) return
      runways.value = conditions.runways
      metar.value = conditions.metar
      magneticCorrection.value = conditions.magneticCorrection
      lastFetchedAt.value = conditions.fetchedAt
      error.value = null
      refreshFailed.value = false
      status.value = 'success'
    } catch (err) {
      if (requestId !== latestRequestId) return
      error.value = err instanceof Error ? err.message : String(err)
      if (keepPrevious) {
        refreshFailed.value = true
      } else {
        status.value = 'error'
      }
    } finally {
      if (requestId === latestRequestId) isRefreshing.value = false
    }
  }

  function clearConditions() {
    latestRequestId++
    status.value = 'idle'
    metar.value = null
    magneticCorrection.value = null
    runways.value = []
    error.value = null
    lastFetchedAt.value = null
    isRefreshing.value = false
    refreshFailed.value = false
  }

  return {
    status,
    metar,
    magneticCorrection,
    runways,
    error,
    lastFetchedAt,
    isRefreshing,
    refreshFailed,
    fetchAirportConditions,
    clearConditions,
  }
}
