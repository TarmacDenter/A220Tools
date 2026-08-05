import { ref } from 'vue'
import type { FetchStatus, MagneticCorrection, MetarData } from '@/types/wind'
import { fetchAirportConditionsFromServer } from '@/services/aviationWeatherApi'
import { normalizeAirportConditions, parseMagdecString } from '@/domain/airportNormalization'
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
      runways.value = response.runways ?? []
      const normalized = normalizeAirportConditions(response, Date.now(), lat, lon)
      metar.value = normalized.metar
      const rawMagdec = normalized.rawMagdec
      let declination = rawMagdec ? parseMagdecString(rawMagdec) : null
      let source: MagneticCorrection['source'] = 'airport_api'
      let rawMagdecString: string | null = rawMagdec

      if (declination === null) {
        const useLat = normalized.latitude
        const useLon = normalized.longitude
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
