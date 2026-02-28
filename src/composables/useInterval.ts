import { onMounted, onUnmounted } from 'vue'

/**
 * Manages a repeating interval that starts automatically on mount
 * and is cleaned up on unmount. Must be called within component setup.
 */
export function useInterval(fn: () => void, ms: number): void {
  let id: number | null = null

  onMounted(() => {
    id = window.setInterval(fn, ms)
  })

  onUnmounted(() => {
    if (id !== null) window.clearInterval(id)
  })
}
