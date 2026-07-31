import type { HeadingRow, MagneticCorrection, ParsedWind, WindResult } from '@/types/wind'
import { TAILWIND_LIMIT_KT } from '@/constants/windLimits'

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function trueToMagnetic(trueDeg: number, declination: number): number {
  return normalizeDeg(trueDeg - declination)
}

/**
 * Headwind component (positive = headwind, negative = tailwind)
 * windMag: wind FROM direction in magnetic degrees
 * hdg: aircraft heading in magnetic degrees
 * spd: wind speed
 */
export function headwindComponent(windMag: number, hdg: number, spd: number): number {
  const diff = ((windMag - hdg) * Math.PI) / 180
  return spd * Math.cos(diff)
}

/**
 * Returns the two critical headings H1 and H2 where tailwind exactly equals limit.
 * Returns null if all headings are safe (speed <= limit).
 * H1 → H2 clockwise is the UNSAFE arc.
 */
export function criticalHeadings(
  windMag: number,
  spd: number,
  limit: number,
): { h1: number; h2: number } | null {
  if (spd <= limit) return null

  const windOpposite = normalizeDeg(windMag + 180)
  const halfArcRad = Math.acos(limit / spd)
  const halfArcDeg = (halfArcRad * 180) / Math.PI

  const h1 = normalizeDeg(windOpposite - halfArcDeg)
  const h2 = normalizeDeg(windOpposite + halfArcDeg)

  return { h1, h2 }
}

export function buildHeadingTable(windMag: number, spd: number, limit: number): HeadingRow[] {
  const rows: HeadingRow[] = []
  for (let hdg = 0; hdg < 360; hdg += 5) {
    const hw = headwindComponent(windMag, hdg, spd)
    // tailwind magnitude is -hw when hw < 0; taxi speed reduces tailwind directly
    const tailwind = hw < 0 ? -hw : 0
    const minTaxi = tailwind > limit ? Math.ceil(tailwind - limit) : 0
    rows.push({
      heading: hdg,
      headwindComponent: hw,
      isSafe: hw >= -limit, // safe when tailwind doesn't exceed limit
      minTaxiSpeed: minTaxi,
    })
  }
  return rows
}

export function computeWindResult(parsedWind: ParsedWind, magCorr: MagneticCorrection, maxTaxiSpeed: number = 0): WindResult {
  const limit = TAILWIND_LIMIT_KT

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

  const taxiLimit = limit + maxTaxiSpeed

  let windDirectionMagnetic = 0
  let h1: number | null = null
  let h2: number | null = null
  let h1Taxi: number | null = null
  let h2Taxi: number | null = null
  let allHeadingsSafe = true

  if (!parsedWind.isCalm && !parsedWind.isVariable) {
    const dirTrue = parsedWind.directionTrue as number
    windDirectionMagnetic = trueToMagnetic(dirTrue, magCorr.declination)
    console.log(`Direction: ${dirTrue}°T − ${magCorr.declination}° decl = ${windDirectionMagnetic.toFixed(1)}°M`)
    console.log(`Effective speed used: ${parsedWind.effectiveSpeed} kt (limit: ${limit} kt)`)

    const crit = criticalHeadings(windDirectionMagnetic, parsedWind.effectiveSpeed, limit)
    if (crit) {
      h1 = crit.h1
      h2 = crit.h2
      allHeadingsSafe = false
      console.log(`Critical headings: H1=${h1.toFixed(1)}°M, H2=${h2.toFixed(1)}°M`)
      console.log(`Unsafe arc: ${h1.toFixed(1)}°M → ${h2.toFixed(1)}°M (clockwise)`)

      // Taxi-adjusted critical headings: where tailwind exceeds limit + max taxi speed
      const critTaxi = criticalHeadings(windDirectionMagnetic, parsedWind.effectiveSpeed, taxiLimit)
      if (critTaxi) {
        h1Taxi = critTaxi.h1
        h2Taxi = critTaxi.h2
        console.log(`Taxi-exceeded headings: H1T=${h1Taxi.toFixed(1)}°M, H2T=${h2Taxi.toFixed(1)}°M`)
      } else {
        console.log('All headings manageable with taxi ≤ ' + maxTaxiSpeed + ' kt')
      }
    } else {
      console.log('All headings safe — effective speed ≤ limit')
    }
  } else if (parsedWind.isCalm) {
    console.log('Calm winds — all headings safe, no arc math needed')
  } else if (parsedWind.isVariable) {
    if (parsedWind.effectiveSpeed <= limit) {
      allHeadingsSafe = true
      console.log('Variable winds within limit — treat as all headings safe')
    } else {
      allHeadingsSafe = false
      console.warn('Variable winds — cannot determine safe arcs, any heading may be unsafe')
    }
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
