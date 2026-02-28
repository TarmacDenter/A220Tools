import { ref } from 'vue'
import type { FetchStatus, MetarData, ParsedWind } from '@/types/wind'
import { fetchAviationWeatherJson } from '@/composables/aviationWeatherApi'
import { isAvwxAvailable, fetchAvwxMetar } from '@/composables/avwxApi'

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

export function useMetar() {
  const status = ref<FetchStatus>('idle')
  const metar = ref<MetarData | null>(null)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

  async function fetchMetar(icao: string): Promise<void> {
    status.value = 'loading'
    metar.value = null
    error.value = null

    const tag = `[METAR] ${icao.toUpperCase()}`
    console.group(tag)
    console.log('Fetching METAR…')

    try {
      // --- Primary: avwx.rest (authenticated, native CORS, no proxy needed) ---
      if (isAvwxAvailable()) {
        try {
          console.log('Trying AVWX…')
          const avwxData = await fetchAvwxMetar(icao)

          const rawOb = avwxData.raw ?? ''
          const wdirRepr = avwxData.wind_direction?.repr ?? null
          const wdirValue = avwxData.wind_direction?.value ?? null
          const wdir: number | 'VRB' | null = wdirRepr === 'VRB' ? 'VRB' : wdirValue
          const wgst: number | null = avwxData.wind_gust?.value ?? null

          metar.value = {
            icaoId: avwxData.station ?? icao.toUpperCase(),
            rawOb,
            issuedAt: parseMetarIssuedAt(rawOb, Date.now()),
            wdir,
            wspd: avwxData.wind_speed?.value ?? 0,
            wgst,
            lat: avwxData.info?.latitude ?? 0,
            lon: avwxData.info?.longitude ?? 0,
            name: avwxData.info?.name ?? '',
          }

          console.log('Parsed METAR (AVWX):', {
            wdir: metar.value.wdir,
            wspd: metar.value.wspd,
            wgst: metar.value.wgst,
            rawOb: metar.value.rawOb,
          })

          status.value = 'success'
          lastFetchedAt.value = Date.now()
          console.log('✓ METAR fetch complete (AVWX)')
          return
        } catch (avwxErr) {
          console.warn('AVWX fetch failed, falling back to aviationweather.gov:', avwxErr)
        }
      }

      // --- Fallback: aviationweather.gov (via CORS proxy chain) ---
      const path = `/metar?ids=${encodeURIComponent(icao.toUpperCase())}&format=json`
      console.log('Path:', path)

      const data = await fetchAviationWeatherJson<unknown>(path)

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No METAR data found for ${icao.toUpperCase()}`)
      }

      const raw = data[0]
      console.log('Raw API response:', raw)

      // Parse gust: use wgst field if present, else fall back to rawOb regex
      let wgst: number | null = raw.wgst ?? null
      if (wgst === null || wgst === undefined) {
        const gustMatch = /(?:\d{3}|VRB)\d{2}G(\d{2})KT/.exec(raw.rawOb ?? '')
        if (gustMatch) {
          wgst = parseInt(gustMatch[1]!, 10)
          console.warn('wgst field absent — gust parsed from rawOb regex:', wgst, 'kt')
        } else {
          console.log('No gust detected (wgst field absent, no G-group in rawOb)')
        }
      } else {
        console.log('Gust from wgst field:', wgst, 'kt')
      }

      const wdir = raw.wdir === 'VRB' ? 'VRB' : typeof raw.wdir === 'number' ? raw.wdir : null

      metar.value = {
        icaoId: raw.icaoId ?? icao.toUpperCase(),
        rawOb: raw.rawOb ?? '',
        issuedAt: parseMetarIssuedAt(raw.rawOb ?? '', Date.now()),
        wdir,
        wspd: raw.wspd ?? 0,
        wgst,
        lat: raw.lat ?? 0,
        lon: raw.lon ?? 0,
        name: raw.name ?? '',
      }

      console.log('Parsed METAR (aviationweather.gov):', {
        wdir: metar.value.wdir,
        wspd: metar.value.wspd,
        wgst: metar.value.wgst,
        rawOb: metar.value.rawOb,
      })

      status.value = 'success'
      lastFetchedAt.value = Date.now()
      console.log('✓ METAR fetch complete (aviationweather.gov)')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      error.value = msg
      status.value = 'error'
      console.error('✗ METAR fetch failed:', msg)
    } finally {
      console.groupEnd()
    }
  }

  function clearMetar() {
    status.value = 'idle'
    metar.value = null
    error.value = null
    lastFetchedAt.value = null
  }

  return { status, metar, error, lastFetchedAt, fetchMetar, clearMetar }
}

/**
 * Parse a MetarData object into a ParsedWind object.
 */
export function parseMetarWind(metar: MetarData): ParsedWind {
  const isCalm = metar.wdir === 0 && metar.wspd === 0
  const isVariable = metar.wdir === 'VRB'

  let directionTrue: number | 'VRB' | 'CALM'
  if (isCalm) {
    directionTrue = 'CALM'
  } else if (isVariable) {
    directionTrue = 'VRB'
  } else {
    directionTrue = metar.wdir as number
  }

  const speed = metar.wspd
  const gust = metar.wgst
  const effectiveSpeed = gust !== null ? gust : speed

  const parsed: ParsedWind = {
    directionTrue,
    speed,
    gust,
    effectiveSpeed,
    isVariable,
    isCalm,
    source: 'metar',
  }

  console.log('[METAR] parseMetarWind →', {
    directionTrue,
    speed,
    gust,
    effectiveSpeed,
    isCalm,
    isVariable,
  })

  return parsed
}
