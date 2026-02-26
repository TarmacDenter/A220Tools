import { expect, test } from '@playwright/test'

test('shows app title and pilot disclaimer', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('A220 Engine Start Wind Checker')
  await expect(
    page.getByText(
      'Pilot advisory: This is not an official Airbus or airline app. Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures).'
    )
  ).toBeVisible()
})
