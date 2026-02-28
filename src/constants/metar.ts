// METAR should normally refresh at least hourly. If the latest report is older than
// this limit, fail loudly so pilots can switch to manual/ATIS sources.
export const METAR_MAX_AGE_MINUTES = 120
