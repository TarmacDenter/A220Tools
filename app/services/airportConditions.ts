import type { MagneticCorrection, MetarData } from '#shared/domain/wind'
import type { RunwaySelection } from '#shared/types/api'
import { fetchAirportConditionsFromServer } from '@/services/aviationWeatherApi'
import { normalizeAirportConditions, parseMagdecString } from '#shared/domain/airportNormalization'

export interface LoadedAirportConditions {
  metar: MetarData
  magneticCorrection: MagneticCorrection
  runways: RunwaySelection[]
  fetchedAt: number
}

export async function loadAirportConditions(
  icao: string,
  lat?: number,
  lon?: number,
  nowMs = Date.now(),
): Promise<LoadedAirportConditions> {
  const response = await fetchAirportConditionsFromServer(icao)
  const normalized = normalizeAirportConditions(response, nowMs, lat, lon)
  const rawMagdec = normalized.rawMagdec
  let declination = rawMagdec ? parseMagdecString(rawMagdec) : null
  let source: MagneticCorrection['source'] = 'airport_api'
  let rawMagdecString: string | null = rawMagdec

  if (declination === null) {
    const geomagnetism = await import('geomagnetism')
    const model = geomagnetism.default.model(new Date(nowMs))
    declination = model.point([normalized.latitude, normalized.longitude]).decl
    source = 'geomagnetism_package'
    rawMagdecString = null
  }

  return {
    metar: normalized.metar,
    magneticCorrection: { declination, source, rawMagdecString },
    runways: response.runways ?? [],
    fetchedAt: Date.now(),
  }
}
