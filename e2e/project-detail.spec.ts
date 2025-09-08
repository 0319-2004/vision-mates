import { test, expect } from '@playwright/test'

test('discover -> project detail (demo)', async ({ page }) => {
  await page.goto('/discover')
  const enterLinks = page.getByRole('link', { name: 'ENTER' })
  await expect(enterLinks.first()).toBeVisible()
  await enterLinks.first().click()
  await expect(page).toHaveURL(/\/projects\//)
  // プロジェクトタイトルのh1（2番目のh1）
  await expect(page.getByRole('heading', { level: 1 }).nth(1)).toBeVisible()
})
