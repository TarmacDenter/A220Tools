export default defineEventHandler(async (event) => {
  const icao = getRouterParam(event, 'icao')
  const config = useRuntimeConfig(event)

  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
  }

  if (!config.avwxToken) {
    throw createError({ statusCode: 500, statusMessage: 'AVWX API token is not configured' })
  }

  const upstreamUrl = `https://avwx.rest/api/metar/${encodeURIComponent(icao.toUpperCase())}?options=info`

  try {
    return await $fetch(upstreamUrl, {
      headers: {
        Authorization: `Token ${config.avwxToken}`,
      },
    })
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage: 'AVWX upstream request failed',
      data: error,
    })
  }
})
