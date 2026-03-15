const AIRPORT_STORAGE_KEY = 'hits';

export type AirportHits = { icao: string; timestamps: number[]; origins: string[] };

type HitsStore = ReturnType<typeof useStorage<AirportHits>>;

export enum RangeWindow {
  HOUR = 1000 * 60 * 60,
  DAY = 1000 * 60 * 60 * 24,
  WEEK = 1000 * 60 * 60 * 24 * 7,
}

const storeFactory = () => useStorage<AirportHits>(AIRPORT_STORAGE_KEY);

const pruneTimestamps = (rangeMs: number, stamps: number[]): number[] => {
  const windowStart = Date.now() - rangeMs;
  return stamps.filter(ts => ts >= windowStart);
};

const getAirportHits = async (store: HitsStore, icao: string): Promise<AirportHits> => {
  return await store.getItem(icao) || { icao, timestamps: [], origins: [] };
};

const addAirportHit = async (store: HitsStore, icao: string, origin: string): Promise<{ isNew: boolean }> => {
  const existing = await getAirportHits(store, icao);
  const isNew = !existing.origins.includes(origin);
  existing.timestamps.push(Date.now());
  if (isNew) existing.origins.push(origin);
  await store.setItem(icao, existing);
  return { isNew };
};

export const getAllAirportKeys = async () => storeFactory().getKeys();

export const pruneOlderThan = async (rangeMs: number, icao: string): Promise<void> => {
  const store = storeFactory();
  const hits = await getAirportHits(store, icao);
  const pruned = pruneTimestamps(rangeMs, hits.timestamps);
  await store.setItem(icao, { icao, timestamps: pruned, origins: hits.origins });
};

export const pruneAllOlderThan = async (rangeMs: number): Promise<number> => {
  const keys = await getAllAirportKeys();
  const jobs = keys.map(k => pruneOlderThan(rangeMs, k));
  await Promise.all(jobs);
  return keys.length;
};

export const useAirportStorage = () => {
  const storage = storeFactory();

  const _getAirportHits = async (icao: string): Promise<AirportHits> => getAirportHits(storage, icao);

  const _addAirportHit = async (icao: string, origin: string): Promise<{ isNew: boolean }> => addAirportHit(storage, icao, origin);

  const getHitsInRange = async (rangeMs: number, icao: string): Promise<AirportHits> => {
    const hits = await getAirportHits(storage, icao);
    return {
      icao,
      timestamps: pruneTimestamps(rangeMs, hits.timestamps),
      origins: hits.origins,
    };
  };

  return {
    getAirportHits: _getAirportHits,
    addAirportHit: _addAirportHit,
    getHitsInRange,
  };
}; 