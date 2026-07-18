import { expect, test } from '@playwright/test'

async function signIn(page, role = 'Admin') {
  await page.goto('/#/login')
  await page.locator('.credential-card').filter({ hasText: role }).click()
  await page.getByRole('button', { name: 'Enter NETRA OS' }).click()
  await expect(page.locator('.workspace-command-bar')).toBeVisible()
}

test('NETRA OS exposes keyboard launcher, shared context, and judge mission', async ({ page }) => {
  await signIn(page)

  await page.keyboard.press('Control+K')
  const launcher = page.getByRole('dialog', { name: 'Open an application or command' })
  await expect(launcher).toBeVisible()
  await launcher.getByRole('textbox', { name: 'Search NETRA OS applications' }).fill('crime dna')
  await launcher.getByRole('button', { name: /Crime DNA/ }).click()
  await expect(page).toHaveURL(/#\/similar$/)

  await page.getByRole('button', { name: 'Open evidence and task inspector' }).click()
  const inspector = page.getByRole('dialog', { name: 'Investigation evidence and task inspector' })
  await expect(inspector).toContainText('Judge mission workspace')
  await inspector.getByRole('button', { name: 'Close context inspector' }).click()

  await page.getByRole('button', { name: '3-min mission' }).click()
  await expect(page.getByRole('dialog', { name: 'NETRA OS Judge Mission' })).toBeVisible()
})

test('client role guard and dock agree for restricted applications', async ({ page }) => {
  await signIn(page, 'Analyst')
  const navigation = page.getByRole('navigation', { name: 'Primary workspace' })
  await expect(navigation.getByRole('link', { name: 'Evidence Lab' })).toHaveCount(0)
  await expect(navigation.getByRole('link', { name: 'Tablet Patrol' })).toHaveCount(0)
  await expect(navigation.getByRole('link', { name: 'Pipeline' })).toHaveCount(0)
  await expect(navigation.getByRole('link', { name: 'Admin Data' })).toHaveCount(0)

  await page.goto('/#/evidence-lab')
  await expect(page).toHaveURL(/#\/chat$/)
  await page.goto('/#/pipeline')
  await expect(page).toHaveURL(/#\/chat$/)
})

test('mobile uses a reachable bottom application dock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page)
  await expect(page.locator('.sidebar')).toBeHidden()
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile applications' })
  await expect(mobileNavigation).toBeVisible()
  await mobileNavigation.getByRole('button', { name: 'Open all NETRA OS applications' }).click()
  await expect(page.getByRole('dialog', { name: 'Open an application or command' })).toBeVisible()
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true)
})
