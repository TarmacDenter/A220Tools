import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { RCAM_KEYS } from '@/constants/windLimits'
import {
  buildTowerWindMatrix,
  getCurrentWindComponentReadout,
  type CurrentWindComponentReadout,
  type TowerWindMatrix,
  type TowerWindPhase,
} from '@/utils/towerWindMatrix'

export interface UseTowerWindMatrixOptions {
  phase: MaybeRefOrGetter<TowerWindPhase | null>
  rcamCode: MaybeRefOrGetter<RCAM_KEYS>
  runwayHeading: MaybeRefOrGetter<number | null>
  referenceWindDirection: MaybeRefOrGetter<number | null>
  windSpeed: MaybeRefOrGetter<number | null>
  isVariableWind?: MaybeRefOrGetter<boolean>
}

export interface UseTowerWindMatrixReturn {
  matrix: ComputedRef<TowerWindMatrix | null>
  currentReadout: ComputedRef<CurrentWindComponentReadout | null>
  isAvailable: ComputedRef<boolean>
}

export function useTowerWindMatrix(options: UseTowerWindMatrixOptions): UseTowerWindMatrixReturn {
  const matrix = computed<TowerWindMatrix | null>(() => {
    const phase = toValue(options.phase)
    const runwayHeading = toValue(options.runwayHeading)
    const referenceWindDirection = toValue(options.referenceWindDirection)

    if (phase === null || runwayHeading === null || referenceWindDirection === null) return null

    return buildTowerWindMatrix({
      phase,
      rcamCode: toValue(options.rcamCode),
      runwayHeading,
      referenceWindDirection,
    })
  })

  const currentReadout = computed<CurrentWindComponentReadout | null>(() => {
    const phase = toValue(options.phase)
    const runwayHeading = toValue(options.runwayHeading)
    const referenceWindDirection = toValue(options.referenceWindDirection)
    const windSpeed = toValue(options.windSpeed)
    const isVariableWind = options.isVariableWind === undefined ? false : toValue(options.isVariableWind)

    if (
      phase === null
      || runwayHeading === null
      || referenceWindDirection === null
      || windSpeed === null
      || isVariableWind
    ) {
      return null
    }

    return getCurrentWindComponentReadout({
      phase,
      rcamCode: toValue(options.rcamCode),
      runwayHeading,
      windDirection: referenceWindDirection,
      windSpeed,
    })
  })

  const isAvailable = computed(() => matrix.value !== null)

  return {
    matrix,
    currentReadout,
    isAvailable,
  }
}
