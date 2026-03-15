import { ref } from 'vue'
import type { FetchStatus, MagneticCorrection } from '@/types/wind'
import { fetchAirportFromServer } from '@/composables/aviationWeatherApi'


interface AviationWeatherAirportRecord {
  icaoId?: string
  name?: string
  magdec?: string | null
  lat?: number
  lon?: number
}

interface AirportInfo {
  icaoId: string
  name: string
  magdec: string | null
  lat: number
  lon: number
}

function parseMagdecString(magdec: string): number | null {
  const match = /^(\d+(?:\.\d+)?)(E|W)$/.exec(magdec.trim())
  if (!match) return null
  const value = parseFloat(match[1]!)
  const sign = match[2] === 'E' ? 1 : -1
  return sign * value
}

interface CachedAirport {
  airport: AirportInfo
  magneticCorrection: MagneticCorrection
}

const clientCache = new Map<string, CachedAirport>()

export function useAirportInfo() {
  const status = ref<FetchStatus>('idle')
  const airport = ref<AirportInfo | null>(null)
  const magneticCorrection = ref<MagneticCorrection | null>(null)
  const error = ref<string | null>(null)

  async function fetchAirportInfo(icao: string, lat?: number, lon?: number): Promise<void> {
    status.value = 'loading'
    airport.value = null
    magneticCorrection.value = null
    error.value = null

    const key = icao.toUpperCase()
    const cached = clientCache.get(key)
    if (cached) {
      airport.value = cached.airport
      magneticCorrection.value = cached.magneticCorrection
      status.value = 'success'
      return
    }

    try {
      const raw = await fetchAirportFromServer<AviationWeatherAirportRecord>(icao)

      const magdecRaw: string | null = raw.magdec ?? null

      airport.value = {
        icaoId: raw.icaoId ?? icao.toUpperCase(),
        name: raw.name ?? '',
        magdec: magdecRaw,
        lat: raw.lat ?? lat ?? 0,
        lon: raw.lon ?? lon ?? 0,
      }

      let declination: number | null = null
      let source: MagneticCorrection['source'] = 'airport_api'
      let rawMagdecString: string | null = magdecRaw

      if (magdecRaw) {
        declination = parseMagdecString(magdecRaw)
        if (declination === null) {
          console.warn(`[airport] failed to parse magdec "${magdecRaw}" — falling back to geomagnetism`)
        }
      }

      if (declination === null) {
        const useLat = airport.value.lat || lat || 0
        const useLon = airport.value.lon || lon || 0
        try {
          const geomagnetism = await import('geomagnetism')
          const model = geomagnetism.default.model(new Date())
          const point = model.point([useLat, useLon])
          declination = point.decl
          source = 'geomagnetism_package'
          rawMagdecString = null
        } catch (geoErr) {
          console.error('[airport] geomagnetism fallback failed', geoErr)
          throw new Error('Failed to determine magnetic declination from both airport API and fallback.')
        }
      }

      magneticCorrection.value = {
        declination: declination!,
        source,
        rawMagdecString,
      }

      clientCache.set(key, { airport: airport.value, magneticCorrection: magneticCorrection.value })
      status.value = 'success'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      error.value = msg
      status.value = 'error'
      console.error('[airport] fetch failed', msg)
    }
  }

  return { status, airport, magneticCorrection, error, fetchAirportInfo }
}
