export function elapsedMinutesSince(nowMs: number, timestampMs: number): number {
  return Math.floor(Math.max(0, nowMs - timestampMs) / 60_000)
}

export type FreshnessStatus = 'unknown' | 'ok' | 'warn' | 'stale'

export function getFreshnessStatus(
  ageMinutes: number | null,
  warningAfterMinutes: number,
  staleAfterMinutes: number,
): FreshnessStatus {
  if (ageMinutes === null) return 'unknown'
  if (ageMinutes >= staleAfterMinutes) return 'stale'
  if (ageMinutes >= warningAfterMinutes) return 'warn'
  return 'ok'
}
