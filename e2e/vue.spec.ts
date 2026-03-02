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

test('manual entry reflects theme toggle for dark/light backgrounds', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toHaveText('A220 Engine Start Wind Checker')
  await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/)

  const manualToggle = page.locator('.manual-toggle input[type="checkbox"]')
  await expect(manualToggle).toBeEnabled()
  await manualToggle.check()
  await expect(manualToggle).toBeChecked()

  const manualEntry = page.locator('.manual-entry')
  await expect(manualEntry).toHaveCount(1)
  await expect(manualEntry).toBeVisible()
  await expect(manualEntry).toHaveAttribute('data-theme', 'dark')

  await page.locator('button.theme-toggle').click()
  await expect(manualEntry).toHaveAttribute('data-theme', 'light')
})
