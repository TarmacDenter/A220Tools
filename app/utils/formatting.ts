export function formatUtcTime(ms: number): string { const d = new Date(ms); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}Z` }
export function formatElapsedMinutes(minutes: number): string { return minutes <= 0 ? 'just now' : `${minutes} min ago` }
export function normalizeRunwayHeading(raw: string): number | null { const value = raw.trim(); if (!/^\d+$/.test(value)) return null; const heading = Number(value); if (!Number.isInteger(heading) || heading < 0 || heading > 360) return null; return heading === 360 ? 0 : heading }
