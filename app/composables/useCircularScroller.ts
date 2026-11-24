import {
  computed,
  nextTick,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { useDebounceFn, useEventListener, useResizeObserver } from '@vueuse/core'
import { distanceFromCenter, wrapScrollTop } from '@/utils/circularScroll'

export interface UseCircularScrollerOptions {
  /** The scrolling element. */
  scroller: Ref<HTMLElement | null>
  /** First row of copy A (top of the scrollable content, below any sticky header). */
  firstRow: Ref<HTMLElement | null>
  /** First row of copy B; centering scrolls this row to the top of the viewport. */
  periodStartRow: Ref<HTMLElement | null>
  /** Rows in one copy of the list. */
  rowsPerPeriod: MaybeRefOrGetter<number>
  /** Rows visible in the viewport. */
  visibleRows: MaybeRefOrGetter<number>
  /** Re-centers whenever this value changes. */
  centerKey: MaybeRefOrGetter<unknown>
}

const WRAP_SETTLE_MS = 120

export function useCircularScroller(options: UseCircularScrollerOptions) {
  const periodPx = ref(0)
  const viewportHeightPx = ref<number | null>(null)
  const isOffCenter = ref(false)

  function contentTop(row: HTMLElement, scroller: HTMLElement): number {
    return (
      scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    )
  }

  function measure(): boolean {
    const scroller = options.scroller.value
    const firstRow = options.firstRow.value
    const periodStartRow = options.periodStartRow.value
    if (!scroller || !firstRow || !periodStartRow) return false

    const firstTop = contentTop(firstRow, scroller)
    const period = contentTop(periodStartRow, scroller) - firstTop
    if (period <= 0) return false

    periodPx.value = period
    const rowHeight = period / toValue(options.rowsPerPeriod)
    viewportHeightPx.value = Math.round(firstTop + rowHeight * toValue(options.visibleRows))
    return true
  }

  function updateOffCenter(): void {
    const scroller = options.scroller.value
    if (!scroller || periodPx.value <= 0) return
    const halfRow = periodPx.value / toValue(options.rowsPerPeriod) / 2
    isOffCenter.value = distanceFromCenter(scroller.scrollTop, periodPx.value) > halfRow
  }

  async function recenter(): Promise<void> {
    await nextTick()
    if (!measure()) return
    const scroller = options.scroller.value
    if (!scroller) return
    // Wait for the measured viewport height to render before positioning.
    await nextTick()
    scroller.scrollTop = periodPx.value
    isOffCenter.value = false
  }

  function wrap(): void {
    const scroller = options.scroller.value
    if (!scroller || periodPx.value <= 0) return
    const next = wrapScrollTop(scroller.scrollTop, periodPx.value)
    if (next !== scroller.scrollTop) scroller.scrollTop = next
  }

  // Re-wrap only once scrolling settles so iOS momentum scrolling is not interrupted.
  // Copies A and C give a full period of buffer on each side for an in-flight fling.
  const debouncedWrap = useDebounceFn(wrap, WRAP_SETTLE_MS)

  useEventListener(
    options.scroller,
    'scroll',
    () => {
      updateOffCenter()
      void debouncedWrap()
    },
    { passive: true },
  )
  useEventListener(options.scroller, 'scrollend', wrap, { passive: true })

  // Fonts or width changes alter row height: re-measure while keeping the pilot's position.
  useResizeObserver(options.firstRow, () => {
    const scroller = options.scroller.value
    const previousPeriod = periodPx.value
    const previousTop = scroller?.scrollTop ?? 0
    if (!measure() || !scroller || previousPeriod <= 0) return
    scroller.scrollTop = (previousTop / previousPeriod) * periodPx.value
  })

  onMounted(() => {
    void recenter()
  })

  watch(
    () => toValue(options.centerKey),
    () => {
      void recenter()
    },
  )

  return {
    isOffCenter: computed(() => isOffCenter.value),
    viewportHeightPx: computed(() => viewportHeightPx.value),
    recenter,
  }
}
