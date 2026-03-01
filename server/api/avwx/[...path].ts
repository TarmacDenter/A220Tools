export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Missing AviationWeather API path' })
  }

  const query = getRequestURL(event).search
  const upstreamUrl = `https://aviationweather.gov/api/data/${path}${query}`

  try {
    return await $fetch(upstreamUrl)
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather upstream request failed',
      data: error,
    })
  }
})
