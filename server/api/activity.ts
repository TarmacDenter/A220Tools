import { getAllAirportKeys, useAirportStorage, RangeWindow } from '../utils/storage';

export default defineEventHandler(async () => {
  const { getHitsInRange } = useAirportStorage();
  const keys = await getAllAirportKeys();
  console.log('[hits:debug] keys in store', keys);

  const rows = await Promise.all(
    keys.map(async (icao) => {
      const result = await getHitsInRange(RangeWindow.DAY, icao);
      return { icao, hits: result.timestamps.length, uniqueCallers: result.origins.length };
    })
  );

  return rows
    .filter(r => r.hits > 0)
    .sort((a, b) => b.hits - a.hits);
});
