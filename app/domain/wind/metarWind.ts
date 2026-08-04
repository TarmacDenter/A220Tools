import type { MetarData, ParsedWind } from '@/types/wind'

export function parseMetarWind(metar: MetarData): ParsedWind {
  const isCalm = metar.wdir === 0 && metar.wspd === 0
  const isVariable = metar.wdir === 'VRB'

  let directionTrue: number | 'VRB' | 'CALM'
  if (isCalm) {
    directionTrue = 'CALM'
  } else if (isVariable) {
    directionTrue = 'VRB'
  } else {
    directionTrue = metar.wdir as number
  }

  const speed = metar.wspd
  const gust = metar.wgst
  const effectiveSpeed = gust !== null ? gust : speed

  return {
    directionTrue,
    speed,
    gust,
    effectiveSpeed,
    isVariable,
    isCalm,
    source: 'metar',
  }
}
