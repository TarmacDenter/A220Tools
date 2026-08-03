export type {
  AirportApiRecord,
  AirportConditionsResponse,
  MetarApiRecord,
  RunwaySelection,
} from '../schemas/airportConditions'

export interface ActivityRow {
  icao: string
  hits: number
  uniqueCallers: number
  hourly: Record<string, number>
}

export interface NearestAirportResponse {
  icao: string
}
