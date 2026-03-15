import { expect, test } from '@playwright/test'

test('cache:prune-hits task runs and returns result', async ({ request }) => {
  const response = await request.post('/_nitro/tasks/run/cache:prune-hits')

  expect(response.ok()).toBe(true)

  const body = await response.json()
  expect(body).toHaveProperty('result')
  expect(typeof body.result).toBe('string')
  expect(body.result).toMatch(/^pruned \d+ airports?$/)
})

test('cache:prune-hits task is listed in available tasks', async ({ request }) => {
  const response = await request.get('/_nitro/tasks')

  expect(response.ok()).toBe(true)

  const body = await response.json()
  expect(body.tasks).toHaveProperty('cache:prune-hits')
  expect(body.tasks['cache:prune-hits'].description).toBe('Remove stale (> 1 week) airport hits')
})
