export default defineEventHandler(async (event) => {
  const icao = getRouterParam(event, 'icao')
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
  }

  const upstreamUrl = `https://aviationweather.gov/api/data/airport?ids=${encodeURIComponent(icao.toUpperCase())}&format=json`

  try {
    console.log('[AviationWeather] Airport fetch attempt', { icao: icao.toUpperCase(), url: upstreamUrl })
    const data = await $fetch<unknown[]>(upstreamUrl)
    if (!Array.isArray(data) || data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: `No airport data found for ${icao.toUpperCase()}` })
    }

    console.log('[AviationWeather] Airport fetch success', { icao: icao.toUpperCase() })
    return data[0]
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    console.warn('[AviationWeather] Airport fetch failed', { icao: icao.toUpperCase(), error })
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather airport upstream request failed',
      data: error,
    })
  }
})
