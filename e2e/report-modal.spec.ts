import { test, expect } from '@playwright/test'

test('open and close report modal on ProjectCard', async ({ page }) => {
  await page.goto('/discover')
  // ProjectCardの通報ボタン（aria-labelに「を通報する」を含む）
  const reportBtn = page.getByRole('button', { name: /を通報する/ }).first()
  await expect(reportBtn).toBeVisible()
  await reportBtn.click()
  await expect(page.getByRole('dialog', { name: /REPORT/i })).toBeVisible()
  await page.getByRole('button', { name: 'CANCEL' }).click()
  await expect(page.getByRole('dialog', { name: /REPORT/i })).toHaveCount(0)
})
