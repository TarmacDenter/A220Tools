import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TowerWindMatrix from '../../app/components/TowerWindMatrix.vue'
import { buildTowerWindMatrix } from '#shared/domain/runwayMatrix'

function mountMatrix(referenceWindDirection: number) {
  return mount(TowerWindMatrix, {
    props: {
      phase: 'landing',
      matrix: buildTowerWindMatrix({
        phase: 'landing',
        rcamCode: 6,
        runwayHeading: 360,
        referenceWindDirection,
      }),
      currentReadout: null,
    },
  })
}

describe('TowerWindMatrix', () => {
  it('renders every wind direction three times for wrap-around scrolling', () => {
    const rows = mountMatrix(70).findAll('tbody tr')
    expect(rows).toHaveLength(108)
    expect(rows.filter((row) => row.attributes('aria-hidden') === 'true')).toHaveLength(72)
  })

  it('announces exactly one copy, starting from the centered matrix window', () => {
    const accessibleRows = mountMatrix(70)
      .findAll('tbody tr')
      .filter((row) => row.attributes('aria-hidden') === undefined)

    expect(accessibleRows).toHaveLength(36)
    expect(accessibleRows.slice(0, 7).map((row) => row.find('.col-direction').text())).toEqual([
      '040°',
      '050°',
      '060°',
      '070°',
      '080°',
      '090°',
      '100°',
    ])
    expect(accessibleRows[3]?.classes()).toContain('reference-row')
  })

  it('shows the first rendered rows as the centered window before scrolling', () => {
    const firstRows = mountMatrix(350).findAll('tbody tr').slice(0, 7)
    expect(firstRows.map((row) => row.find('.col-direction').text())).toEqual([
      '320°',
      '330°',
      '340°',
      '350°',
      '000°',
      '010°',
      '020°',
    ])
  })

  it('keeps the matrix label and hides re-center until the pilot scrolls away', () => {
    const wrapper = mountMatrix(70)
    expect(wrapper.text()).toContain('Tower Wind Matrix (Magnetic)')
    expect(wrapper.find('.recenter-btn').exists()).toBe(false)
  })
})
