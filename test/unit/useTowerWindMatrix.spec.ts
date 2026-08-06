import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTowerWindMatrix } from '@/composables/useTowerWindMatrix'
import {
  buildTowerWindMatrix,
  calculateRunwayWindComponents,
  getCurrentWindComponentReadout,
} from '@/domain/runwayMatrix'

describe('buildTowerWindMatrix', () => {
  it('generates all absolute wind directions and centers the visible window on the reference wind', () => {
    const matrix = buildTowerWindMatrix({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 360,
      referenceWindDirection: 70,
    })

    expect(matrix.allRows).toHaveLength(36)
    expect(matrix.visibleRows.map((row) => row.windDirection)).toEqual([
      40, 50, 60, 70, 80, 90, 100,
    ])
    expect(matrix.visibleRows.find((row) => row.windDirection === 70)?.isReference).toBe(true)
    expect(matrix.visibleRows.find((row) => row.windDirection === 90)).toMatchObject({
      maxWindKt: 29,
      limitingComponent: 'XW',
      displayMaxWind: '29 kt',
    })
  })

  it('wraps the centered matrix window through 000', () => {
    const matrix = buildTowerWindMatrix({
      phase: 'takeoff',
      rcamCode: 6,
      runwayHeading: 360,
      referenceWindDirection: 350,
    })

    expect(matrix.visibleRows.map((row) => row.windDirection)).toEqual([
      320, 330, 340, 350, 0, 10, 20,
    ])
  })

  it('uses tailwind as the limiting component on tailwind rows', () => {
    const matrix = buildTowerWindMatrix({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 360,
      referenceWindDirection: 180,
    })

    expect(matrix.visibleRows.find((row) => row.windDirection === 180)).toMatchObject({
      maxWindKt: 10,
      limitingComponent: 'TW',
    })
  })

  it('caps very high display values at greater than 99 kt', () => {
    const matrix = buildTowerWindMatrix({
      phase: 'takeoff',
      rcamCode: 6,
      runwayHeading: 360,
      referenceWindDirection: 0,
    })

    expect(matrix.visibleRows.find((row) => row.windDirection === 0)?.displayMaxWind).toBe('>99 kt')
  })
})

describe('calculateRunwayWindComponents', () => {
  it('calculates crosswind and headwind from magnetic wind and runway heading', () => {
    const components = calculateRunwayWindComponents({
      runwayHeading: 360,
      windDirection: 70,
      windSpeed: 30,
    })

    expect(components.crosswindKt).toBeCloseTo(28.2, 1)
    expect(components.longitudinalType).toBe('HW')
    expect(components.longitudinalKt).toBeCloseTo(10.3, 1)
  })
})

describe('getCurrentWindComponentReadout', () => {
  it('marks current wind components warning at 80 percent of the active limit', () => {
    const readout = getCurrentWindComponentReadout({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 360,
      windDirection: 70,
      windSpeed: 30,
    })

    expect(readout.crosswind).toMatchObject({
      valueKt: 28,
      limitKt: 29,
      status: 'warning',
    })
    expect(readout.longitudinal).toMatchObject({
      type: 'HW',
      valueKt: 10,
      status: 'info',
    })
  })

  it('marks current tailwind unsafe when it exceeds the active tailwind limit', () => {
    const readout = getCurrentWindComponentReadout({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 360,
      windDirection: 190,
      windSpeed: 11,
    })

    expect(readout.longitudinal).toMatchObject({
      type: 'TW',
      valueKt: 11,
      limitKt: 10,
      status: 'unsafe',
    })
  })

  it('uses raw component values for limit status before rounding display values', () => {
    const readout = getCurrentWindComponentReadout({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 360,
      windDirection: 180,
      windSpeed: 10.4,
    })

    expect(readout.longitudinal).toMatchObject({
      type: 'TW',
      valueKt: 10,
      limitKt: 10,
      status: 'unsafe',
    })
  })
})

describe('useTowerWindMatrix', () => {
  it('updates the matrix when a reactive runway heading becomes available', () => {
    const runwayHeading = ref<number | null>(null)
    const { matrix } = useTowerWindMatrix({
      phase: 'takeoff',
      rcamCode: 6,
      runwayHeading,
      referenceWindDirection: 270,
      windSpeed: 20,
    })

    expect(matrix.value).toBeNull()
    runwayHeading.value = 220
    expect(matrix.value).not.toBeNull()
  })

  it('does not return a current component readout for variable wind', () => {
    const { currentReadout } = useTowerWindMatrix({
      phase: 'landing',
      rcamCode: 6,
      runwayHeading: 220,
      referenceWindDirection: 270,
      windSpeed: 20,
      isVariableWind: true,
    })

    expect(currentReadout.value).toBeNull()
  })
})
