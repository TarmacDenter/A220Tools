import type { AirportConditionsResponse } from '#shared/types/api'
import type { MetarData } from '@/types/wind'
import { parseMagneticDeclination } from '#shared/utils/magneticDeclination'

export const parseMagdecString = parseMagneticDeclination

export function parseMetarIssuedAt(rawOb: string, nowMs: number): number | null {
  const match = /\b(\d{2})(\d{2})(\d{2})Z\b/.exec(rawOb)
  if (!match) return null

  const day = Number(match[1])
  const hour = Number(match[2])
  const minute = Number(match[3])
  if (hour > 23 || minute > 59 || day < 1 || day > 31) return null

  const now = new Date(nowMs)
  let issued = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour, minute)
  if (issued - nowMs > 12 * 60 * 60 * 1000) {
    issued = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, day, hour, minute)
  } else if (nowMs - issued > 31 * 24 * 60 * 60 * 1000) {
    issued = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day, hour, minute)
  }
  return issued
}

export interface NormalizedAirportConditions {
  metar: MetarData
  rawMagdec: string | null
  latitude: number
  longitude: number
}

export function normalizeAirportConditions(
  response: AirportConditionsResponse,
  nowMs: number,
  fallbackLat = 0,
  fallbackLon = 0,
): NormalizedAirportConditions {
  const rawMetar = response.metar
  const rawAirport = response.airport
  const gustFromObservation = /(?:\d{3}|VRB)\d{2}G(\d{2})KT/.exec(rawMetar.rawOb)?.[1]
  const gust = rawMetar.wgst ?? (gustFromObservation ? Number(gustFromObservation) : null)

  return {
    metar: {
      icaoId: rawMetar.icaoId,
      rawOb: rawMetar.rawOb,
      issuedAt: parseMetarIssuedAt(rawMetar.rawOb, nowMs),
      wdir: rawMetar.wdir,
      wspd: rawMetar.wspd,
      wgst: gust,
      lat: rawMetar.lat ?? rawAirport.lat ?? fallbackLat,
      lon: rawMetar.lon ?? rawAirport.lon ?? fallbackLon,
      name: rawMetar.name ?? rawAirport.name,
    },
    rawMagdec: rawAirport.magdec,
    latitude: rawAirport.lat ?? rawMetar.lat ?? fallbackLat,
    longitude: rawAirport.lon ?? rawMetar.lon ?? fallbackLon,
  }
}
