import type { MetarData, ParsedWind } from '@/types/wind'

export type ManualWindSource = 'atis_mag' | 'metar_true' | 'aerodata_true'
export interface ManualWindInput { direction: string; speed: string; gust: string; source: ManualWindSource; declinationMagnitude: string; declinationDir: 'E' | 'W' }

export function parseManualWind(input: ManualWindInput): ParsedWind | null {
  const dirStr = input.direction.trim().toUpperCase(); const speedStr = input.speed.trim(); const gustStr = input.gust.trim()
  const speed = parseFloat(speedStr); if (isNaN(speed) || speed < 0) return null
  let directionTrue: ParsedWind['directionTrue']; let isVariable = false; let isCalm = false
  if (dirStr === 'VRB' || dirStr === 'V') { directionTrue = 'VRB'; isVariable = true }
  else if (dirStr === 'CALM' || dirStr === 'C' || (dirStr === '0' && speed === 0)) { directionTrue = 'CALM'; isCalm = true }
  else { const dir = parseFloat(dirStr); if (isNaN(dir) || dir < 0 || dir > 360) return null; directionTrue = dir % 360 }
  const gust = gustStr ? parseFloat(gustStr) : null; const validGust = gust !== null && !isNaN(gust) ? gust : null
  return { directionTrue, speed, gust: validGust, effectiveSpeed: validGust ?? speed, isVariable, isCalm, source: 'manual' }
}

export function parseMetarWind(metar: MetarData): ParsedWind {
  const isCalm = metar.wdir === 0 && metar.wspd === 0; const isVariable = metar.wdir === 'VRB'
  return { directionTrue: isCalm ? 'CALM' : isVariable ? 'VRB' : metar.wdir as number, speed: metar.wspd, gust: metar.wgst, effectiveSpeed: metar.wgst ?? metar.wspd, isVariable, isCalm, source: 'metar' }
}
