import {
  LANDING_TAILWIND_LIMIT_KT,
  RCAM_LDG,
  RCAM_TO,
  TAKEOFF_TAILWIND_LIMIT_KT,
  type RCAM_KEYS,
} from '@/constants/windLimits'
import { normalizeDeg } from '@/composables/useWindCalculations'

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

export interface RunwayWindComponentInput {
  runwayHeading: number
  windDirection: number
  windSpeed: number
}

export interface RunwayWindComponents {
  crosswindKt: number
  longitudinalKt: number
  longitudinalType: 'HW' | 'TW'
}

export interface CurrentWindComponentReadoutInput extends RunwayWindComponentInput {
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

const WIND_DIRECTION_STEP_DEG = 10
const MATRIX_WINDOW_RADIUS_ROWS = 3
const DISPLAY_WIND_CAP_KT = 99
const PROXIMITY_THRESHOLD = 0.8

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function roundWindSpeed(value: number): number {
  return Math.round(value)
}

function getCrosswindLimit(phase: TowerWindPhase, rcamCode: RCAM_KEYS): number {
  return phase === 'takeoff' ? RCAM_TO[rcamCode] : RCAM_LDG[rcamCode]
}

function getTailwindLimit(phase: TowerWindPhase): number {
  return phase === 'takeoff' ? TAKEOFF_TAILWIND_LIMIT_KT : LANDING_TAILWIND_LIMIT_KT
}

function nearestWindDirection(direction: number): number {
  return normalizeDeg(Math.round(normalizeDeg(direction) / WIND_DIRECTION_STEP_DEG) * WIND_DIRECTION_STEP_DEG)
}

function componentStatus(valueKt: number, limitKt: number): ComponentStatus {
  if (valueKt > limitKt) return 'unsafe'
  if (valueKt >= limitKt * PROXIMITY_THRESHOLD) return 'warning'
  return 'safe'
}

export function calculateRunwayWindComponents(input: RunwayWindComponentInput): RunwayWindComponents {
  const diffRad = degToRad(normalizeDeg(input.windDirection - input.runwayHeading))
  const headwind = input.windSpeed * Math.cos(diffRad)
  const crosswind = Math.abs(input.windSpeed * Math.sin(diffRad))

  return {
    crosswindKt: crosswind,
    longitudinalKt: Math.abs(headwind),
    longitudinalType: headwind >= 0 ? 'HW' : 'TW',
  }
}

export function getCurrentWindComponentReadout(input: CurrentWindComponentReadoutInput): CurrentWindComponentReadout {
  const crosswindLimitKt = getCrosswindLimit(input.phase, input.rcamCode)
  const tailwindLimitKt = getTailwindLimit(input.phase)
  const components = calculateRunwayWindComponents(input)
  const crosswindValueKt = roundWindSpeed(components.crosswindKt)
  const longitudinalValueKt = roundWindSpeed(components.longitudinalKt)

  return {
    crosswind: {
      valueKt: crosswindValueKt,
      limitKt: crosswindLimitKt,
      status: componentStatus(components.crosswindKt, crosswindLimitKt),
    },
    longitudinal: {
      type: components.longitudinalType,
      valueKt: longitudinalValueKt,
      limitKt: components.longitudinalType === 'TW' ? tailwindLimitKt : null,
      status: components.longitudinalType === 'TW' ? componentStatus(components.longitudinalKt, tailwindLimitKt) : 'info',
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
  const crosswindMax = crosswindFactor > 0.0001 ? crosswindLimitKt / crosswindFactor : Number.POSITIVE_INFINITY
  const tailwindMax = tailwindFactor > 0.0001 ? tailwindLimitKt / tailwindFactor : Number.POSITIVE_INFINITY
  const limitingComponent: LimitingComponent = tailwindMax < crosswindMax ? 'TW' : 'XW'
  const rawMaxWind = Math.min(crosswindMax, tailwindMax)

  if (!Number.isFinite(rawMaxWind) || rawMaxWind > DISPLAY_WIND_CAP_KT) {
    return {
      maxWindKt: null,
      displayMaxWind: `>${DISPLAY_WIND_CAP_KT} kt`,
      limitingComponent,
    }
  }

  const maxWindKt = roundWindSpeed(rawMaxWind)
  return {
    maxWindKt,
    displayMaxWind: `${maxWindKt} kt`,
    limitingComponent,
  }
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

  return {
    crosswindLimitKt,
    tailwindLimitKt,
    allRows,
    visibleRows,
  }
}
