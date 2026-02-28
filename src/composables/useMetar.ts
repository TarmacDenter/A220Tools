import { ref } from 'vue'
import type { FetchStatus, MetarData, ParsedWind } from '@/types/wind'
import { fetchAviationWeatherJson } from '@/composables/aviationWeatherApi'
import { METAR_MAX_AGE_MINUTES } from '@/constants/metar'

function parseMetarIssuedAtFromRaw(rawOb: string, nowMs: number): number | null {
  const match = /\b(\d{2})(\d{2})(\d{2})Z\b/.exec(rawOb)
  if (!match) return null

  const day = Number(match[1])
  const hour = Number(match[2])
  const minute = Number(match[3])

  if (day < 1 || day > 31 || hour > 23 || minute > 59) return null

  const now = new Date(nowMs)
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth()
  let candidate = Date.UTC(year, month, day, hour, minute)

  if (candidate > nowMs) {
    month -= 1
    if (month < 0) {
      month = 11
      year -= 1
    }
    candidate = Date.UTC(year, month, day, hour, minute)
  }

  return candidate
}

function resolveMetarIssuedAt(raw: Record<string, unknown>, nowMs: number): number | null {
  const obsTime = raw.obsTime
  if (typeof obsTime === 'string') {
    const parsed = Date.parse(obsTime)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  const rawOb = typeof raw.rawOb === 'string' ? raw.rawOb : ''
  return parseMetarIssuedAtFromRaw(rawOb, nowMs)
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

      const nowMs = Date.now()
      const issuedAt = resolveMetarIssuedAt(raw, nowMs)
      if (issuedAt !== null) {
        const ageMinutes = Math.floor((nowMs - issuedAt) / 60_000)
        if (ageMinutes > METAR_MAX_AGE_MINUTES) {
          throw new Error(
            `METAR is stale (${ageMinutes} min old, max ${METAR_MAX_AGE_MINUTES} min). Use manual wind entry and verify ATIS/AWOS.`
          )
        }
      }

      metar.value = {
        icaoId: raw.icaoId ?? icao.toUpperCase(),
        rawOb: raw.rawOb ?? '',
        wdir,
        wspd: raw.wspd ?? 0,
        wgst,
        lat: raw.lat ?? 0,
        lon: raw.lon ?? 0,
        name: raw.name ?? '',
        issuedAt,
      }

      console.log('Parsed METAR:', {
        wdir: metar.value.wdir,
        wspd: metar.value.wspd,
        wgst: metar.value.wgst,
        rawOb: metar.value.rawOb,
        issuedAt: metar.value.issuedAt,
      })

      status.value = 'success'
      lastFetchedAt.value = nowMs
      console.log('✓ METAR fetch complete')
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
