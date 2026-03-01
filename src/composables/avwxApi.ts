
function resolveRequestUrl(url: string): string {
  if (!url.startsWith('/') || typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

interface AvwxWindField {
  value: number | null
  repr: string
  spoken: string
}

interface AvwxStationInfo {
  icao: string
  name: string
  latitude: number
  longitude: number
}

export interface AvwxMetarResponse {
  station: string
  raw: string
  wind_direction: AvwxWindField | null
  wind_speed: AvwxWindField | null
  wind_gust: AvwxWindField | null
  info?: AvwxStationInfo
}

export function isAvwxAvailable(): boolean {
  return false
}

export async function fetchAvwxMetar(icao: string): Promise<AvwxMetarResponse> {
  const url = `/api/avwx-rest/metar/${encodeURIComponent(icao.toUpperCase())}`
  console.log('[AVWX] Fetch attempt:', url)

  const response = await fetch(resolveRequestUrl(url))

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as AvwxMetarResponse
  console.log('[AVWX] Response:', data)
  return data
}
