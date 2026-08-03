import { errorFields, logEvent } from '../../utils/logger'
import { recordAirportLookup } from '../../utils/airportLookup'
import { getAirportConditions } from '../../utils/aviationWeather'
import type { AirportConditionsResponse } from '#shared/types/api'

export default defineEventHandler(async (event): Promise<AirportConditionsResponse> => {
  const icao = getRouterParam(event, 'icao')?.toUpperCase()
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
  }

  try {
    const conditions = await getAirportConditions(icao)
    await recordAirportLookup(event, icao)
    return conditions
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    logEvent('warn', 'airport.conditions', {
      requestId: event.context.requestTelemetry?.requestId ?? null,
      icao,
      outcome: 'upstream_failure',
      ...errorFields(error),
    })
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather conditions upstream request failed',
      data: error,
    })
  }
})
