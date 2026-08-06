import { HEADING_TABLE_STEP_DEG } from './calculationPolicy'
import { TAILWIND_LIMIT_KT } from './windLimits'
import type { HeadingRow, MagneticCorrection, ParsedWind, WindResult } from './wind'
import { headwindComponent, normalizeDeg, radToDeg, trueToMagnetic } from './windAngles'

export function criticalHeadings(
  windMag: number,
  spd: number,
  limit: number,
): { h1: number; h2: number } | null {
  if (spd <= limit) return null

  const halfArcDeg = radToDeg(Math.acos(limit / spd))
  const opposite = normalizeDeg(windMag + 180)
  return {
    h1: normalizeDeg(opposite - halfArcDeg),
    h2: normalizeDeg(opposite + halfArcDeg),
  }
}

export function buildHeadingTable(windMag: number, spd: number, limit: number): HeadingRow[] {
  return Array.from({ length: 360 / HEADING_TABLE_STEP_DEG }, (_, index) => {
    const heading = index * HEADING_TABLE_STEP_DEG
    const headwind = headwindComponent(windMag, heading, spd)
    const tailwind = headwind < 0 ? -headwind : 0

    return {
      heading,
      headwindComponent: headwind,
      isSafe: headwind >= -limit,
      minTaxiSpeed: tailwind > limit ? Math.ceil(tailwind - limit) : 0,
    }
  })
}

export function computeWindResult(
  parsedWind: ParsedWind,
  magCorr: MagneticCorrection,
  maxTaxiSpeed = 0,
): WindResult {
  const limit = TAILWIND_LIMIT_KT
  const taxiLimit = limit + maxTaxiSpeed

  console.group('[WindCalc] computeWindResult')
  console.log('Input wind:', {
    directionTrue: parsedWind.directionTrue,
    speed: parsedWind.speed,
    gust: parsedWind.gust,
    effectiveSpeed: parsedWind.effectiveSpeed,
    isCalm: parsedWind.isCalm,
    isVariable: parsedWind.isVariable,
    source: parsedWind.source,
  })
  console.log('Magnetic correction:', {
    declination: magCorr.declination,
    source: magCorr.source,
    rawMagdecString: magCorr.rawMagdecString,
  })

  let windDirectionMagnetic = 0
  let h1: number | null = null
  let h2: number | null = null
  let h1Taxi: number | null = null
  let h2Taxi: number | null = null
  let allHeadingsSafe = true

  if (!parsedWind.isCalm && !parsedWind.isVariable) {
    const dirTrue = parsedWind.directionTrue as number
    windDirectionMagnetic = trueToMagnetic(dirTrue, magCorr.declination)
    console.log(
      `Direction: ${dirTrue}°T − ${magCorr.declination}° decl = ${windDirectionMagnetic.toFixed(1)}°M`,
    )
    console.log(`Effective speed used: ${parsedWind.effectiveSpeed} kt (limit: ${limit} kt)`)

    const critical = criticalHeadings(windDirectionMagnetic, parsedWind.effectiveSpeed, limit)
    if (critical) {
      ;({ h1, h2 } = critical)
      allHeadingsSafe = false
      console.log(`Critical headings: H1=${h1.toFixed(1)}°M, H2=${h2.toFixed(1)}°M`)
      console.log(`Unsafe arc: ${h1.toFixed(1)}°M → ${h2.toFixed(1)}°M (clockwise)`)

      const taxiCritical = criticalHeadings(
        windDirectionMagnetic,
        parsedWind.effectiveSpeed,
        taxiLimit,
      )
      if (taxiCritical) {
        ;({ h1: h1Taxi, h2: h2Taxi } = taxiCritical)
        console.log(
          `Taxi-exceeded headings: H1T=${h1Taxi.toFixed(1)}°M, H2T=${h2Taxi.toFixed(1)}°M`,
        )
      } else {
        console.log(`All headings manageable with taxi ≤ ${maxTaxiSpeed} kt`)
      }
    } else {
      console.log('All headings safe — effective speed ≤ limit')
    }
  } else if (parsedWind.isCalm) {
    console.log('Calm winds — all headings safe, no arc math needed')
  } else if (parsedWind.isVariable && parsedWind.effectiveSpeed > limit) {
    allHeadingsSafe = false
    console.warn('Variable winds — cannot determine safe arcs, any heading may be unsafe')
  } else if (parsedWind.isVariable) {
    console.log('Variable winds within limit — treat as all headings safe')
  }

  console.groupEnd()
  return {
    parsedWind,
    magneticCorrection: magCorr,
    windDirectionMagnetic,
    tailwindLimitKt: limit,
    h1,
    h2,
    h1Taxi,
    h2Taxi,
    allHeadingsSafe,
  }
}
