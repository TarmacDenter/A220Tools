export interface ActivityRow {
  icao: string
  hits: number
  uniqueCallers: number
  hourly: Record<string, number>
}

export interface NearestAirportResponse {
  icao: string
}

export interface AirportApiRecord {
  icaoId?: string
  name?: string
  magdec?: string | null
  lat?: number
  lon?: number
}

export interface MetarApiRecord {
  icaoId?: string
  rawOb?: string
  wdir?: number | 'VRB' | null
  wspd?: number
  wgst?: number | null
  lat?: number
  lon?: number
  name?: string
}

export interface AirportConditionsResponse {
  airport: AirportApiRecord
  metar: MetarApiRecord
}
