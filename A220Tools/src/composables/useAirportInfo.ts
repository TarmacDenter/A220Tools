import { ref } from 'vue'
import type { FetchStatus, MagneticCorrection } from '@/types/wind'

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

    const tag = `[Airport] ${icao.toUpperCase()}`
    console.group(tag)
    console.log('Fetching airport info…')

    try {
      const base = import.meta.env.DEV ? '/api/avwx' : 'https://aviationweather.gov/api/data'
      const url = `${base}/airport?ids=${encodeURIComponent(icao.toUpperCase())}&format=json`
      console.log('URL:', url)

      const response = await fetch(url)
      console.log(`HTTP ${response.status} ${response.statusText}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No airport data found for ${icao.toUpperCase()}`)
      }

      const raw = data[0]
      console.log('Raw API response:', raw)

      const magdecRaw: string | null = raw.magdec ?? null
      console.log('magdec field:', magdecRaw ?? '(absent)')

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
        if (declination !== null) {
          console.log(`Declination from airport API: ${declination}° (parsed from "${magdecRaw}")`)
        } else {
          console.warn(`Failed to parse magdec string "${magdecRaw}" — falling back to geomagnetism`)
        }
      } else {
        console.warn('magdec field absent from airport API — falling back to geomagnetism package')
      }

      if (declination === null) {
        const useLat = airport.value.lat || lat || 0
        const useLon = airport.value.lon || lon || 0
        console.log(`Geomagnetism fallback: lat=${useLat}, lon=${useLon}`)
        try {
          const geomagnetism = await import('geomagnetism')
          const model = geomagnetism.default.model(new Date())
          const point = model.point([useLat, useLon])
          declination = point.decl
          source = 'geomagnetism_package'
          rawMagdecString = null
          console.log(`Declination from geomagnetism WMM: ${declination.toFixed(2)}°`)
        } catch (geoErr) {
          console.error('Geomagnetism fallback failed:', geoErr)
          throw new Error('Failed to determine magnetic declination from both airport API and fallback.')
        }
      }

      magneticCorrection.value = {
        declination: declination!,
        source,
        rawMagdecString,
      }

      status.value = 'success'
      console.log('✓ Airport fetch complete:', { declination: declination!, source })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      error.value = msg
      status.value = 'error'
      console.error('✗ Airport fetch failed:', msg)
    } finally {
      console.groupEnd()
    }
  }

  return { status, airport, magneticCorrection, error, fetchAirportInfo }
}
