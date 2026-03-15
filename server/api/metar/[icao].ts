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
      const origin = event.context.requestTelemetry?.origin ?? 'unknown'
      const { isNew } = await useAirportStorage().addAirportHit(icao.toUpperCase(), origin)
      console.log('[hits:debug] write succeeded', { icao: icao.toUpperCase(), isNew, origin })
    } catch (error) {
      console.error('[hits] failed to record hit for', icao.toUpperCase(), error)
    }

    return data[0]
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    console.warn('[metar] upstream failed', { icao: icao.toUpperCase(), error })
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather METAR upstream request failed',
      data: error,
    })
  }
})
