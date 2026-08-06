import {
  DISPLAY_WIND_CAP_KT,
  LANDING_TAILWIND_LIMIT_KT,
  MATRIX_WINDOW_RADIUS_ROWS,
  PROXIMITY_THRESHOLD,
  RCAM_LDG,
  RCAM_TO,
  TAKEOFF_TAILWIND_LIMIT_KT,
  type RCAM_KEYS,
  WIND_DIRECTION_STEP_DEG,
} from '@/constants'
import { calculateRunwayWindComponents, degToRad, normalizeDeg } from './windAngles'

export type { RunwayWindComponents } from './windAngles'

export type TowerWindPhase = 'takeoff' | 'landing'
export type LimitingComponent = 'XW' | 'TW'
export type ComponentStatus = 'safe' | 'warning' | 'unsafe' | 'info'

export interface TowerWindMatrixInput {
  phase: TowerWindPhase
  rcamCode: RCAM_KEYS
  runwayHeading: number
  referenceWindDirection: number
}

export interface TowerWindMatrixRow {
  windDirection: number
  maxWindKt: number | null
  displayMaxWind: string
  limitingComponent: LimitingComponent
  isReference: boolean
}

export interface TowerWindMatrix {
  crosswindLimitKt: number
  tailwindLimitKt: number
  allRows: TowerWindMatrixRow[]
  visibleRows: TowerWindMatrixRow[]
}

export interface CurrentWindComponentReadoutInput {
  runwayHeading: number
  windDirection: number
  windSpeed: number
  phase: TowerWindPhase
  rcamCode: RCAM_KEYS
}

export interface CurrentWindComponentReadout {
  crosswind: {
    valueKt: number
    limitKt: number
    status: ComponentStatus
  }
  longitudinal: {
    type: 'HW' | 'TW'
    valueKt: number
    limitKt: number | null
    status: ComponentStatus
  }
}

function getCrosswindLimit(phase: TowerWindPhase, rcamCode: RCAM_KEYS): number {
  return phase === 'takeoff' ? RCAM_TO[rcamCode] : RCAM_LDG[rcamCode]
}

function getTailwindLimit(phase: TowerWindPhase): number {
  return phase === 'takeoff' ? TAKEOFF_TAILWIND_LIMIT_KT : LANDING_TAILWIND_LIMIT_KT
}

function nearestWindDirection(direction: number): number {
  return normalizeDeg(
    Math.round(normalizeDeg(direction) / WIND_DIRECTION_STEP_DEG) * WIND_DIRECTION_STEP_DEG,
  )
}

function componentStatus(valueKt: number, limitKt: number): ComponentStatus {
  if (valueKt > limitKt) return 'unsafe'
  if (valueKt >= limitKt * PROXIMITY_THRESHOLD) return 'warning'
  return 'safe'
}

export { calculateRunwayWindComponents }

export function getCurrentWindComponentReadout(
  input: CurrentWindComponentReadoutInput,
): CurrentWindComponentReadout {
  const crosswindLimitKt = getCrosswindLimit(input.phase, input.rcamCode)
  const tailwindLimitKt = getTailwindLimit(input.phase)
  const components = calculateRunwayWindComponents(input)

  return {
    crosswind: {
      valueKt: Math.round(components.crosswindKt),
      limitKt: crosswindLimitKt,
      status: componentStatus(components.crosswindKt, crosswindLimitKt),
    },
    longitudinal: {
      type: components.longitudinalType,
      valueKt: Math.round(components.longitudinalKt),
      limitKt: components.longitudinalType === 'TW' ? tailwindLimitKt : null,
      status:
        components.longitudinalType === 'TW'
          ? componentStatus(components.longitudinalKt, tailwindLimitKt)
          : 'info',
    },
  }
}

function maxWindForDirection(
  windDirection: number,
  runwayHeading: number,
  crosswindLimitKt: number,
  tailwindLimitKt: number,
): Pick<TowerWindMatrixRow, 'maxWindKt' | 'displayMaxWind' | 'limitingComponent'> {
  const diffRad = degToRad(normalizeDeg(windDirection - runwayHeading))
  const crosswindFactor = Math.abs(Math.sin(diffRad))
  const tailwindFactor = Math.max(-Math.cos(diffRad), 0)
  const crosswindMax =
    crosswindFactor > 0.0001 ? crosswindLimitKt / crosswindFactor : Number.POSITIVE_INFINITY
  const tailwindMax =
    tailwindFactor > 0.0001 ? tailwindLimitKt / tailwindFactor : Number.POSITIVE_INFINITY
  const limitingComponent: LimitingComponent = tailwindMax < crosswindMax ? 'TW' : 'XW'
  const rawMaxWind = Math.min(crosswindMax, tailwindMax)

  if (!Number.isFinite(rawMaxWind) || rawMaxWind > DISPLAY_WIND_CAP_KT) {
    return { maxWindKt: null, displayMaxWind: `>${DISPLAY_WIND_CAP_KT} kt`, limitingComponent }
  }

  const maxWindKt = Math.round(rawMaxWind)
  return { maxWindKt, displayMaxWind: `${maxWindKt} kt`, limitingComponent }
}

export function buildTowerWindMatrix(input: TowerWindMatrixInput): TowerWindMatrix {
  const crosswindLimitKt = getCrosswindLimit(input.phase, input.rcamCode)
  const tailwindLimitKt = getTailwindLimit(input.phase)
  const referenceDirection = nearestWindDirection(input.referenceWindDirection)
  const allRows = Array.from({ length: 36 }, (_, index) => {
    const windDirection = index * WIND_DIRECTION_STEP_DEG
    return {
      windDirection,
      isReference: windDirection === referenceDirection,
      ...maxWindForDirection(windDirection, input.runwayHeading, crosswindLimitKt, tailwindLimitKt),
    }
  })
  const visibleRows = Array.from({ length: MATRIX_WINDOW_RADIUS_ROWS * 2 + 1 }, (_, index) => {
    const offset = index - MATRIX_WINDOW_RADIUS_ROWS
    const windDirection = normalizeDeg(referenceDirection + offset * WIND_DIRECTION_STEP_DEG)
    return allRows.find((row) => row.windDirection === windDirection)
  }).filter((row): row is TowerWindMatrixRow => row !== undefined)

  return { crosswindLimitKt, tailwindLimitKt, allRows, visibleRows }
}
