// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

function readPublicFile(path: string) {
  return readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8')
}

describe('PWA assets', () => {
  it('uses root start_url and scope in web manifest for Nuxt Netlify deploys', () => {
    const manifest = JSON.parse(readPublicFile('manifest.webmanifest')) as {
      start_url: string
      scope: string
    }

    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('service worker handles Nuxt backend API routes', () => {
    const serviceWorker = readPublicFile('sw.js')

    expect(serviceWorker).toContain("'/api/metar/'")
    expect(serviceWorker).toContain("'/api/airport/'")
    expect(serviceWorker).toContain('API_CACHE')
  })
})
