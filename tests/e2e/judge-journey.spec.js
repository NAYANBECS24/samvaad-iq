import { expect, test } from '@playwright/test'

const roles = [
  { role: 'Admin', landing: 'dashboard', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Governance', 'Admin Data'] },
  { role: 'Investigator', landing: 'chat', nav: ['Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Governance'] },
  { role: 'Analyst', landing: 'dashboard', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Intelligence Analytics', 'Governance'] },
  { role: 'Supervisor', landing: 'analytics', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Governance'] },
]

async function signIn(page, profile) {
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'SAMVAAD-IQ' })).toBeVisible()
  await page.locator('.credential-card').filter({ hasText: profile.role }).click()
  await page.getByRole('button', { name: 'Enter Command Workspace' }).click()
  await expect(page).toHaveURL(new RegExp(`#/${profile.landing}$`))
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('.session-panel')).toContainText(profile.role)
  await expect(page.locator('.runtime-badge')).toContainText(/Offline Demo|Catalyst Live/)
}

for (const profile of roles) {
  test(`${profile.role} receives the correct role-aware workspace`, async ({ page }) => {
    await signIn(page, profile)
    const navigation = page.getByRole('navigation', { name: 'Primary workspace' })
    for (const label of profile.nav) await expect(navigation.getByRole('link', { name: label })).toBeVisible()
    if (profile.role !== 'Admin') {
      await page.goto('/#/admin-data')
      await expect(page).toHaveURL(/#\/chat$/)
      await expect(page.getByRole('link', { name: 'Admin Data' })).toHaveCount(0)
    }
  })
}

test('three-minute judge journey remains cited, provenance-aware, and supervisor-gated', async ({ page }) => {
  await signIn(page, roles[3])

  await page.getByRole('link', { name: 'Ask SAMVAAD' }).click()
  await expect(page.getByRole('heading', { name: 'Evidence-grounded answer' })).toBeVisible()
  await page.getByLabel('Investigation query').fill('Mysuru alli motorcycle theft hotspot show maadi')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.query-status').first()).toContainText(/Offline demo response completed|Catalyst response completed/)
  await expect(page.getByRole('heading', { name: 'Why this answer can be checked' })).toBeVisible()
  await expect(page.locator('.citation-card')).not.toHaveCount(0)

  await page.locator('.citation-card').first().click()
  await expect(page).toHaveURL(/#\/cases\/SYN-/)
  await expect(page.locator('h1')).toBeVisible()

  await page.getByRole('link', { name: 'Intelligence Analytics' }).click()
  await expect(page.getByRole('heading', { name: 'One Evidence-Grounded Analysis Workspace' })).toBeVisible()
  await expect(page.getByRole('link', { name: /KAVACH Crime DNA/ })).toBeVisible()

  await page.getByRole('link', { name: 'Evidence Lab' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'judge-evidence.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('fir_id,artifact,detail\nSYN-BLR-0001,PH-HASH-711,motorcycle evening pattern\n'),
  })
  await expect(page.getByRole('heading', { name: 'Prepared file record' })).toBeVisible()
  await expect(page.locator('.hash-cell code')).toHaveText(/^[a-f0-9]{64}$/)
  await page.getByRole('button', { name: 'Run grounded analysis' }).click()
  await expect(page.getByRole('heading', { name: 'Facts separated from interpretation' })).toBeVisible()

  await page.goto('/#/report')
  await expect(page.getByRole('heading', { name: 'Auditable Investigation Report' })).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Open local print fallback' }).click()
  await expect(page.locator('.query-status')).toContainText('Offline browser-print fallback opened')
})
