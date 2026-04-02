function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const lat = Number(query.lat);
  const lon = Number(query.lon);

  if (!query.lat || !query.lon || Number.isNaN(lat) || Number.isNaN(lon)) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid lat/lon query params' });
  }

  const DELTA = 0.3;
  const bbox = `${lat - DELTA},${lon - DELTA},${lat + DELTA},${lon + DELTA}`;
  const upstreamUrl = `https://aviationweather.gov/api/data/metar?bbox=${bbox}&format=json`;

  let data: unknown[];
  try {
    data = await $fetch<unknown[]>(upstreamUrl);
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: 'AviationWeather upstream request failed', data: err });
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No airport found near your location' });
  }

  type MetarEntry = { icaoId: string; lat: number; lon: number };
  let closest: MetarEntry | null = null;
  let closestDist = Infinity;

  for (const entry of data) {
    const e = entry as MetarEntry;
    if (typeof e.icaoId !== 'string' || typeof e.lat !== 'number' || typeof e.lon !== 'number') continue;
    const dist = haversineKm(lat, lon, e.lat, e.lon);
    if (dist < closestDist) {
      closestDist = dist;
      closest = e;
    }
  }

  if (!closest) {
    throw createError({ statusCode: 404, statusMessage: 'No airport found near your location' });
  }

  return { icao: closest.icaoId };
});
