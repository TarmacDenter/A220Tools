import type { AirportApiRecord, AirportConditionsResponse, MetarApiRecord } from '#shared/types/api'

const AVIATION_WEATHER_BASE_URL = 'https://aviationweather.gov/api/data'
const AIRPORT_CACHE_SECONDS = 60 * 60 * 24 * 7
const METAR_CACHE_SECONDS = 1 * 60

export const getCachedAirportRecord = defineCachedFunction(async (icao: string): Promise<AirportApiRecord> => {
  const upstreamUrl = `${AVIATION_WEATHER_BASE_URL}/airport?ids=${encodeURIComponent(icao)}&format=json`
  const data = await $fetch<AirportApiRecord[]>(upstreamUrl)
  if (!Array.isArray(data) || data.length === 0 || !data[0]) {
    throw createError({ statusCode: 404, statusMessage: `No airport data found for ${icao}` })
  }
  return data[0]
}, {
  name: 'aviation-weather-airport',
  maxAge: AIRPORT_CACHE_SECONDS,
  getKey: (icao) => icao,
})

export const getCachedMetarRecord = defineCachedFunction(async (icao: string): Promise<MetarApiRecord> => {
  const upstreamUrl = `${AVIATION_WEATHER_BASE_URL}/metar?ids=${encodeURIComponent(icao)}&format=json`
  const data = await $fetch<MetarApiRecord[]>(upstreamUrl)
  if (!Array.isArray(data) || data.length === 0 || !data[0]) {
    throw createError({ statusCode: 404, statusMessage: `No METAR data found for ${icao}` })
  }
  return data[0]
}, {
  name: 'aviation-weather-metar',
  maxAge: METAR_CACHE_SECONDS,
  getKey: (icao) => icao,
})

export async function getAirportConditions(icao: string): Promise<AirportConditionsResponse> {
  const normalizedIcao = icao.toUpperCase()
  const [metar, airport] = await Promise.all([
    getCachedMetarRecord(normalizedIcao),
    getCachedAirportRecord(normalizedIcao),
  ])

  return { metar, airport }
}
