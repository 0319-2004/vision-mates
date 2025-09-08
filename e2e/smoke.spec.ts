import { test, expect } from '@playwright/test'

test('home -> discover -> random section visible', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/VisionMates|Next.js/i)

  await page.goto('/discover')
  await expect(page.getByRole('heading', { name: '発見', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: '🎲 ランダム発見' })).toBeVisible()
})
