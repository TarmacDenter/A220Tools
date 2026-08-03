import { getAllAirportKeys, useAirportStorage, RangeWindow } from '../utils/storage'

export default defineEventHandler(async () => {
  const { getHitsInRange } = useAirportStorage();
  const keys = await getAllAirportKeys();
  const rows = await Promise.all(
    keys.map(async (icao) => {
      const result = await getHitsInRange(RangeWindow.DAY, icao);
      const hourly = result.timestamps.reduce<Record<string, number>>((counts, timestamp) => {
        const hour = new Date(timestamp).toISOString().slice(0, 13) + ':00:00Z'
        counts[hour] = (counts[hour] ?? 0) + 1
        return counts
      }, {})

      return { icao, hits: result.timestamps.length, uniqueCallers: result.origins.length, hourly }
    })
  )

  return rows
    .filter(r => r.hits > 0)
    .sort((a, b) => b.hits - a.hits)
})
