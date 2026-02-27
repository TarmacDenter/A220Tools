import { createRouter, createWebHistory } from 'vue-router'
import { normalizePathForBase } from '@/utils/basePath'

const baseUrl = import.meta.env.BASE_URL

if (typeof window !== 'undefined') {
  const normalizedPath = normalizePathForBase(window.location.pathname, baseUrl)
  if (normalizedPath) {
    const normalizedLocation = `${normalizedPath}${window.location.search}${window.location.hash}`
    window.history.replaceState(window.history.state, '', normalizedLocation)
  }
}

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes: [],
})

export default router
