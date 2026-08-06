// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import InstallPrompt from '@/components/InstallPrompt.vue'

describe('InstallPrompt SSR', () => {
  it('renders without accessing navigator during server-side rendering', async () => {
    const app = createSSRApp(InstallPrompt)

    await expect(renderToString(app)).resolves.toBe('<!---->')
  })
})
