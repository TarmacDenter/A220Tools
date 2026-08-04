import { ref } from 'vue'
import type { FetchStatus, MagneticCorrection, MetarData } from '@/types/wind'
import { normalizeAirportConditionsResponse } from '@/domain/airport/conditions'
import { fetchAirportConditionsFromServer } from '@/services/aviationWeatherApi'
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
      const response = await fetchAirportConditionsFromServer(icao)
      const normalized = normalizeAirportConditionsResponse(response, {
        fallbackIcao: icao,
        fallbackLat: lat,
        fallbackLon: lon,
        nowMs: Date.now(),
      })
      runways.value = normalized.runways
      metar.value = normalized.metar

      let declination = normalized.magneticCorrection.declination
      let source: MagneticCorrection['source'] = normalized.magneticCorrection.source
      let rawMagdecString = normalized.magneticCorrection.rawMagdecString

      if (declination === null) {
        const useLat = normalized.metar.lat
        const useLon = normalized.metar.lon
        const geomagnetism = await import('geomagnetism')
        const model = geomagnetism.default.model(new Date())
        declination = model.point([useLat, useLon]).decl
        source = 'geomagnetism_package'
        rawMagdecString = null
      }

      magneticCorrection.value = { declination, source, rawMagdecString }
      status.value = 'success'
      lastFetchedAt.value = Date.now()
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

  return { status, metar, magneticCorrection, runways, error, lastFetchedAt, fetchAirportConditions, clearConditions }
}
