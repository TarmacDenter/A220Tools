export default defineCachedEventHandler(async (event) => {
  const icao = getRouterParam(event, 'icao')?.toUpperCase();
  if (!icao) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' });
  }

  const upstreamUrl = `https://aviationweather.gov/api/data/airport?ids=${encodeURIComponent(icao)}&format=json`;

  try {
    const data = await $fetch<Record<string, unknown>[]>(upstreamUrl);
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[airport] not found', icao);
      throw createError({ statusCode: 404, statusMessage: `No airport data found for ${icao}` });
    }

    return data[0];
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;

    console.warn('[airport] upstream failed', { icao, error });
    throw createError({
      statusCode: 502,
      statusMessage: 'AviationWeather airport upstream request failed',
      data: error,
    });
  }
}, {
  maxAge: 60 * 60 * 24 * 7,
  getKey: (event) => getRouterParam(event, 'icao')?.toUpperCase() || '',
});
