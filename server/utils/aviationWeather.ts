import {
  AirportUpstreamSchema,
  AirportResponseSchema,
  AirportConditionsResponseSchema,
  MetarResponseSchema,
  MetarUpstreamSchema,
  RunwayUpstreamSchema,
  type AirportApiRecord,
  type AirportConditionsResponse,
  type AirportUpstream,
  type MetarApiRecord,
  type MetarUpstream,
  type RunwaySelection,
} from '#shared/schemas/airportConditions'

const AVIATION_WEATHER_BASE_URL = 'https://aviationweather.gov/api/data'
const AIRPORT_CACHE_SECONDS = 60 * 60 * 24 * 7
const METAR_CACHE_SECONDS = 1 * 60

function invalidUpstreamResponse(): never {
  throw createError({
    statusCode: 502,
    statusMessage: 'AviationWeather conditions response was invalid',
  })
}

function parseUpstream<T>(
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: unknown } },
  value: unknown,
  source: string,
): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success || parsed.data === undefined) {
    console.error('[aviation-weather] invalid upstream response', { source, issues: parsed.error })
    return invalidUpstreamResponse()
  }
  return parsed.data
}

export const getCachedAirportRecord = defineCachedFunction(
  async (icao: string): Promise<AirportUpstream> => {
    const upstreamUrl = `${AVIATION_WEATHER_BASE_URL}/airport?ids=${encodeURIComponent(icao)}&format=json`
    const data = await $fetch<unknown>(upstreamUrl)
    if (!Array.isArray(data) || data.length === 0 || !data[0]) {
      throw createError({ statusCode: 404, statusMessage: `No airport data found for ${icao}` })
    }
    return parseUpstream(AirportUpstreamSchema, data[0], 'airport')
  },
  {
    name: 'aviation-weather-airport',
    maxAge: AIRPORT_CACHE_SECONDS,
    getKey: (icao) => icao,
  },
)

export const getCachedMetarRecord = defineCachedFunction(
  async (icao: string): Promise<MetarUpstream> => {
    const upstreamUrl = `${AVIATION_WEATHER_BASE_URL}/metar?ids=${encodeURIComponent(icao)}&format=json`
    const data = await $fetch<unknown>(upstreamUrl)
    if (!Array.isArray(data) || data.length === 0 || !data[0]) {
      throw createError({ statusCode: 404, statusMessage: `No METAR data found for ${icao}` })
    }
    return parseUpstream(MetarUpstreamSchema, data[0], 'metar')
  },
  {
    name: 'aviation-weather-metar',
    maxAge: METAR_CACHE_SECONDS,
    swr: false,
    getKey: (icao) => icao,
  },
)

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360
}

function parseMagneticDeclination(magdec: string | null | undefined): number | null {
  if (!magdec) return null
  const match = /^(\d+(?:\.\d+)?)(E|W)$/.exec(magdec.trim().toUpperCase())
  if (!match) return null
  const value = Number(match[1])
  return match[2] === 'W' ? -value : value
}

async function resolveDeclination(airport: AirportUpstream): Promise<number | null> {
  const parsed = parseMagneticDeclination(airport.magdec)
  if (parsed !== null) return parsed

  try {
    const geomagnetism = await import('geomagnetism')
    return geomagnetism.default.model(new Date()).point([airport.lat, airport.lon]).decl
  } catch (error) {
    console.error('[aviation-weather] geomagnetism fallback failed', error)
    return null
  }
}

function normalizeRunwayName(value: string): string | null {
  const match = /^(\d{1,2})([LCR]?)$/.exec(value.toUpperCase())
  if (!match) return null
  const number = Number(match[1])
  if (number < 0 || number > 36) return null
  return `${String(number).padStart(2, '0')}${match[2]}`
}

function extractRunwayNames(id: string): [string, string] | null {
  const match = /^([^/]+)\/([^/]+)$/.exec(id.trim())
  if (!match) return null
  const first = normalizeRunwayName(match[1] ?? '')
  const second = normalizeRunwayName(match[2] ?? '')
  return first && second ? [first, second] : null
}

async function extractRunwaySelections(airport: AirportUpstream): Promise<RunwaySelection[]> {
  const declination = await resolveDeclination(airport)
  if (declination === null) return []

  const selections = (airport.runways ?? []).flatMap((rawRunway) => {
    const parsed = RunwayUpstreamSchema.safeParse(rawRunway)
    if (!parsed.success) return []
    const names = extractRunwayNames(parsed.data.id)
    if (!names) return []

    const heading = Math.round(normalizeHeading(parsed.data.alignment - declination))
    const reciprocalHeading = normalizeHeading(heading + 180)
    return [
      { name: names[0], heading },
      { name: names[1], heading: reciprocalHeading },
    ]
  })

  const unique = new Map(selections.map((runway) => [`${runway.name}:${runway.heading}`, runway]))
  return [...unique.values()].sort((a, b) => a.heading - b.heading || a.name.localeCompare(b.name))
}

export async function getAirportConditions(icao: string): Promise<AirportConditionsResponse> {
  const normalizedIcao = icao.toUpperCase()
  const [rawMetar, rawAirport] = await Promise.all([
    getCachedMetarRecord(normalizedIcao),
    getCachedAirportRecord(normalizedIcao),
  ])

  const metar: MetarApiRecord = MetarResponseSchema.parse({
    icaoId: rawMetar.icaoId,
    rawOb: rawMetar.rawOb,
    obsTime: rawMetar.obsTime,
    wdir: rawMetar.wdir,
    wspd: rawMetar.wspd,
    wgst: rawMetar.wgst ?? null,
    lat: rawMetar.lat,
    lon: rawMetar.lon,
    name: rawMetar.name,
  })
  const airport: AirportApiRecord = AirportResponseSchema.parse({
    icaoId: rawAirport.icaoId,
    name: rawAirport.name ?? rawAirport.icaoId,
    lat: rawAirport.lat,
    lon: rawAirport.lon,
    magdec: rawAirport.magdec ?? null,
  })
  const runways = await extractRunwaySelections(rawAirport)
  return AirportConditionsResponseSchema.parse({ metar, airport, runways })
}
