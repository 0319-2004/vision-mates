import { test, expect } from '@playwright/test'

test('RandomSwipeCard shows login prompt when not logged in', async ({ page }) => {
  await page.goto('/discover')
  const randomSection = page.getByRole('heading', { name: '🎲 ランダム発見' })
  await expect(randomSection).toBeVisible()
  // ランダムカード内のボタンテキストは「👀 気になる」
  const watchBtn = page.locator('text=👀 気になる').first()
  await watchBtn.click()
  await expect(page.getByRole('dialog', { name: 'ログインが必要です' })).toBeVisible()
})
