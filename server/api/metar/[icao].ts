import { errorFields, logEvent } from '../../utils/logger'
import { getCachedMetarRecord } from '../../utils/aviationWeather'
import { recordAirportLookup } from '../../utils/airportLookup'
import type { MetarApiRecord } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<MetarApiRecord> => {
  const icao = getRouterParam(event, 'icao')
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
  }

  try {
    const normalizedIcao = icao.toUpperCase()
    const metar = await getCachedMetarRecord(normalizedIcao)
    await recordAirportLookup(event, normalizedIcao)
    return metar
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    logEvent('warn', 'metar.lookup', {
      requestId: event.context.requestTelemetry?.requestId ?? null,
      icao: icao.toUpperCase(),
      outcome: 'upstream_failure',
      ...errorFields(error),
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather METAR upstream request failed',
      data: error,
    })
  }
})
