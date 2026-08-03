import { ref } from 'vue'
import type { FetchStatus, MagneticCorrection, MetarData } from '@/types/wind'
import { fetchAirportConditionsFromServer } from '@/composables/aviationWeatherApi'

function parseMetarIssuedAt(rawOb: string, nowMs: number): number | null {
  const match = /\b(\d{2})(\d{2})(\d{2})Z\b/.exec(rawOb)
  if (!match) return null

  const day = Number.parseInt(match[1]!, 10)
  const hour = Number.parseInt(match[2]!, 10)
  const minute = Number.parseInt(match[3]!, 10)
  if (Number.isNaN(day) || Number.isNaN(hour) || Number.isNaN(minute)) return null

  const now = new Date(nowMs)
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  let issuedAt = Date.UTC(year, month, day, hour, minute, 0, 0)
  const twelveHoursMs = 12 * 60 * 60 * 1000
  const thirtyOneDaysMs = 31 * 24 * 60 * 60 * 1000

  if (issuedAt - nowMs > twelveHoursMs) {
    issuedAt = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  } else if (nowMs - issuedAt > thirtyOneDaysMs) {
    issuedAt = Date.UTC(year, month + 1, day, hour, minute, 0, 0)
  }

  return issuedAt
}

function parseMagdecString(magdec: string): number | null {
  const match = /^(\d+(?:\.\d+)?)(E|W)$/.exec(magdec.trim())
  if (!match) return null
  const value = parseFloat(match[1]!)
  const sign = match[2] === 'E' ? 1 : -1
  return sign * value
}

export function useAirportConditions() {
  const status = ref<FetchStatus>('idle')
  const metar = ref<MetarData | null>(null)
  const magneticCorrection = ref<MagneticCorrection | null>(null)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

  async function fetchAirportConditions(icao: string, lat?: number, lon?: number): Promise<void> {
    status.value = 'loading'
    metar.value = null
    magneticCorrection.value = null
    error.value = null

    try {
      const response = await fetchAirportConditionsFromServer(icao)
      const rawMetar = response.metar
      const rawAirport = response.airport
      const normalizedIcao = icao.toUpperCase()

      let wgst: number | null = rawMetar.wgst ?? null
      if (wgst === null) {
        const gustMatch = /(?:\d{3}|VRB)\d{2}G(\d{2})KT/.exec(rawMetar.rawOb ?? '')
        wgst = gustMatch ? parseInt(gustMatch[1]!, 10) : null
      }

      metar.value = {
        icaoId: rawMetar.icaoId ?? normalizedIcao,
        rawOb: rawMetar.rawOb ?? '',
        issuedAt: parseMetarIssuedAt(rawMetar.rawOb ?? '', Date.now()),
        wdir: rawMetar.wdir === 'VRB' ? 'VRB' : typeof rawMetar.wdir === 'number' ? rawMetar.wdir : null,
        wspd: rawMetar.wspd ?? 0,
        wgst,
        lat: rawMetar.lat ?? rawAirport.lat ?? lat ?? 0,
        lon: rawMetar.lon ?? rawAirport.lon ?? lon ?? 0,
        name: rawMetar.name ?? rawAirport.name ?? '',
      }

      const rawMagdec = rawAirport.magdec ?? null
      let declination = rawMagdec ? parseMagdecString(rawMagdec) : null
      let source: MagneticCorrection['source'] = 'airport_api'
      let rawMagdecString: string | null = rawMagdec

      if (declination === null) {
        const useLat = rawAirport.lat ?? rawMetar.lat ?? lat ?? 0
        const useLon = rawAirport.lon ?? rawMetar.lon ?? lon ?? 0
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
    error.value = null
    lastFetchedAt.value = null
  }

  return { status, metar, magneticCorrection, error, lastFetchedAt, fetchAirportConditions, clearConditions }
}
