import { errorFields, logEvent } from '../../utils/logger'
import { coarseRequestOrigin } from '../../utils/requestTelemetry'

export default defineEventHandler(async (event) => {
  const icao = getRouterParam(event, 'icao')
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
  }

  const upstreamUrl = `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao.toUpperCase())}&format=json`

  try {
    const data = await $fetch<unknown[]>(upstreamUrl)
    if (!Array.isArray(data) || data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: `No METAR data found for ${icao.toUpperCase()}` })
    }

    try {
      const origin = coarseRequestOrigin(event.context.requestTelemetry?.origin ?? 'unknown')
      const { isNew } = await useAirportStorage().addAirportHit(icao.toUpperCase(), origin)
      logEvent('info', 'airport.lookup', {
        requestId: event.context.requestTelemetry?.requestId ?? null,
        icao: icao.toUpperCase(),
        outcome: 'success',
        uniqueCaller: isNew,
      })
    } catch (error) {
      logEvent('error', 'airport.hit_storage_failed', {
        requestId: event.context.requestTelemetry?.requestId ?? null,
        icao: icao.toUpperCase(),
        ...errorFields(error),
      })
    }

    return data[0]
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
