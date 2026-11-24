/**
 * Pure scroll math for a list rendered as three identical copies (A, B, C) inside a scroller.
 * The "home" position is the start of copy B, one period from the top. Shifting scrollTop by
 * exactly one period lands on visually identical content, so the list can wrap without end.
 */

/** Returns the scrollTop that shows the same content but stays within the middle copy's band. */
export function wrapScrollTop(scrollTop: number, periodPx: number): number {
  if (periodPx <= 0) return scrollTop
  if (scrollTop < periodPx * 0.5) return scrollTop + periodPx
  if (scrollTop > periodPx * 1.5) return scrollTop - periodPx
  return scrollTop
}

/** Distance in px from scrollTop to the nearest centered position (any copy), always >= 0. */
export function distanceFromCenter(scrollTop: number, periodPx: number): number {
  if (periodPx <= 0) return 0
  const offset = (((scrollTop - periodPx) % periodPx) + periodPx) % periodPx
  return Math.min(offset, periodPx - offset)
}
