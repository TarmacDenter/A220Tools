import type { RunwaySelection, AirportConditionsResponse } from '#shared/types/api'
import type { MetarData } from '@/types/wind'

export interface AirportConditionsNormalizationInput {
  fallbackIcao: string
  fallbackLat?: number
  fallbackLon?: number
  nowMs: number
}

export interface NormalizedAirportConditions {
  metar: MetarData
  magneticCorrection: {
    declination: number | null
    source: 'airport_api'
    rawMagdecString: string | null
  }
  runways: RunwaySelection[]
}

export function parseMetarIssuedAt(rawOb: string, nowMs: number): number | null {
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

export function parseMagdecString(magdec: string): number | null {
  const match = /^(\d+(?:\.\d+)?)(E|W)$/.exec(magdec.trim())
  if (!match) return null
  const value = parseFloat(match[1]!)
  const sign = match[2] === 'E' ? 1 : -1
  return sign * value
}

export function normalizeAirportConditionsResponse(
  response: AirportConditionsResponse,
  input: AirportConditionsNormalizationInput,
): NormalizedAirportConditions {
  const rawMetar = response.metar
  const rawAirport = response.airport
  const normalizedIcao = input.fallbackIcao.toUpperCase()

  let wgst: number | null = rawMetar.wgst ?? null
  if (wgst === null) {
    const gustMatch = /(?:\d{3}|VRB)\d{2}G(\d{2})KT/.exec(rawMetar.rawOb ?? '')
    wgst = gustMatch ? parseInt(gustMatch[1]!, 10) : null
  }

  const rawMagdec = rawAirport.magdec ?? null

  return {
    metar: {
      icaoId: rawMetar.icaoId ?? normalizedIcao,
      rawOb: rawMetar.rawOb ?? '',
      issuedAt: parseMetarIssuedAt(rawMetar.rawOb ?? '', input.nowMs),
      wdir: rawMetar.wdir === 'VRB' ? 'VRB' : typeof rawMetar.wdir === 'number' ? rawMetar.wdir : null,
      wspd: rawMetar.wspd ?? 0,
      wgst,
      lat: rawMetar.lat ?? rawAirport.lat ?? input.fallbackLat ?? 0,
      lon: rawMetar.lon ?? rawAirport.lon ?? input.fallbackLon ?? 0,
      name: rawMetar.name ?? rawAirport.name ?? '',
    },
    magneticCorrection: {
      declination: rawMagdec ? parseMagdecString(rawMagdec) : null,
      source: 'airport_api',
      rawMagdecString: rawMagdec,
    },
    runways: response.runways ?? [],
  }
}
