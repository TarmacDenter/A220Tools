const AVWX_TOKEN: string | undefined = import.meta.env.VITE_AVWX_TOKEN

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
  return typeof AVWX_TOKEN === 'string' && AVWX_TOKEN.length > 0
}

export async function fetchAvwxMetar(icao: string): Promise<AvwxMetarResponse> {
  if (!AVWX_TOKEN) {
    throw new Error('AVWX API token not configured')
  }

  // avwx.rest is a proper CORS-enabled API — no proxy needed.
  // ?options=info includes station lat/lon/name in the response.
  const url = `https://avwx.rest/api/metar/${encodeURIComponent(icao.toUpperCase())}?options=info`
  console.log('[AVWX] Fetch attempt:', url)

  const response = await fetch(url, {
    headers: { Authorization: `Token ${AVWX_TOKEN}` },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as AvwxMetarResponse
  console.log('[AVWX] Response:', data)
  return data
}
