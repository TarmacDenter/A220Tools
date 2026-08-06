export interface RunwayWindComponents {
  crosswindKt: number
  longitudinalKt: number
  longitudinalType: 'HW' | 'TW'
}

export interface RunwayWindComponentInput {
  runwayHeading: number
  windDirection: number
  windSpeed: number
}

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function trueToMagnetic(trueDeg: number, declination: number): number {
  return normalizeDeg(trueDeg - declination)
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function headwindComponent(windMag: number, hdg: number, spd: number): number {
  return spd * Math.cos(degToRad(windMag - hdg))
}

export function calculateRunwayWindComponents(
  input: RunwayWindComponentInput,
): RunwayWindComponents {
  const diffRad = degToRad(normalizeDeg(input.windDirection - input.runwayHeading))
  const headwind = input.windSpeed * Math.cos(diffRad)

  return {
    crosswindKt: Math.abs(input.windSpeed * Math.sin(diffRad)),
    longitudinalKt: Math.abs(headwind),
    longitudinalType: headwind >= 0 ? 'HW' : 'TW',
  }
}
