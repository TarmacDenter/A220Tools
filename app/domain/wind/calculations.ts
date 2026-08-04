import type { HeadingRow, MagneticCorrection, ParsedWind, WindResult } from '@/types/wind'
import { TAILWIND_LIMIT_KT } from '@/constants/windLimits'

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function trueToMagnetic(trueDeg: number, declination: number): number {
  return normalizeDeg(trueDeg - declination)
}

/**
 * Headwind component (positive = headwind, negative = tailwind).
 * windMag is the wind FROM direction in magnetic degrees.
 * hdg is the aircraft heading in magnetic degrees.
 * spd is the wind speed.
 */
export function headwindComponent(windMag: number, hdg: number, spd: number): number {
  const diff = ((windMag - hdg) * Math.PI) / 180
  return spd * Math.cos(diff)
}

/**
 * Returns the two critical headings H1 and H2 where tailwind equals the limit.
 * Returns null if all headings are safe.
 * H1 to H2 clockwise is the unsafe arc.
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
    const tailwind = hw < 0 ? -hw : 0
    const minTaxi = tailwind > limit ? Math.ceil(tailwind - limit) : 0
    rows.push({
      heading: hdg,
      headwindComponent: hw,
      isSafe: hw >= -limit,
      minTaxiSpeed: minTaxi,
    })
  }
  return rows
}

export function computeWindResult(parsedWind: ParsedWind, magCorr: MagneticCorrection, maxTaxiSpeed: number = 0): WindResult {
  const limit = TAILWIND_LIMIT_KT
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

    const crit = criticalHeadings(windDirectionMagnetic, parsedWind.effectiveSpeed, limit)
    if (crit) {
      h1 = crit.h1
      h2 = crit.h2
      allHeadingsSafe = false

      const critTaxi = criticalHeadings(windDirectionMagnetic, parsedWind.effectiveSpeed, taxiLimit)
      if (critTaxi) {
        h1Taxi = critTaxi.h1
        h2Taxi = critTaxi.h2
      }
    }
  } else if (parsedWind.isVariable && parsedWind.effectiveSpeed > limit) {
    allHeadingsSafe = false
  }

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
