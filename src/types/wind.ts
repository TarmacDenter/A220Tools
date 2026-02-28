export interface MetarData {
  icaoId: string
  rawOb: string
  issuedAt: number | null
  wdir: number | 'VRB' | null // null = calm
  wspd: number
  wgst: number | null
  lat: number
  lon: number
  name: string
}

export interface ParsedWind {
  directionTrue: number | 'VRB' | 'CALM'
  speed: number
  gust: number | null
  effectiveSpeed: number // gust if present, else speed
  isVariable: boolean
  isCalm: boolean
  source: 'metar' | 'manual'
}

export interface MagneticCorrection {
  declination: number // east positive
  source: 'airport_api' | 'geomagnetism_package' | 'manual_magnetic' | 'manual_entered'
  rawMagdecString: string | null
}

export interface WindResult {
  parsedWind: ParsedWind
  magneticCorrection: MagneticCorrection
  windDirectionMagnetic: number
  tailwindLimitKt: number
  h1: number | null
  h2: number | null // critical headings
  allHeadingsSafe: boolean
}

export interface HeadingRow {
  heading: number
  headwindComponent: number
  isSafe: boolean
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error'
