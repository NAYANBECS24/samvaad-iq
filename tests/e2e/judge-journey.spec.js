import { expect, test } from '@playwright/test'

const roles = [
  { role: 'Admin', landing: 'dashboard', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance', 'Admin Data'] },
  { role: 'Investigator', landing: 'chat', nav: ['Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance'] },
  { role: 'Analyst', landing: 'dashboard', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Reports', 'Pipeline', 'Governance'] },
  { role: 'Supervisor', landing: 'analytics', nav: ['Command Center', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance'] },
]

async function signIn(page, profile) {
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'SAMVAAD-IQ' })).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeDisabled()
  await page.locator('.credential-card').filter({ hasText: profile.role }).click()
  await page.getByRole('button', { name: 'Enter Command Workspace' }).click()
  await expect(page).toHaveURL(new RegExp(`#/${profile.landing}$`))
  await expect(page.locator('.sidebar')).toBeVisible()
  await expect(page.locator('.session-panel')).toContainText(profile.role)
  await expect(page.locator('.runtime-badge')).toContainText(/Offline Demo|Catalyst Live/)
}

test('Catalyst login portal stays bounded without horizontal or nested-frame overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/#/login')
  await page.getByRole('tab', { name: 'Catalyst Login' }).click()
  await page.locator('#catalyst-signin').evaluate((host) => {
    host.replaceChildren(document.createElement('iframe'))
  })

  const frameBox = await page.locator('.catalyst-signin-frame').boundingBox()
  const panelBox = await page.locator('.login-action-panel').boundingBox()
  expect(frameBox.height).toBeLessThanOrEqual(391)
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(1080)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

for (const profile of roles) {
  test(`${profile.role} receives the correct role-aware workspace`, async ({ page }) => {
    await signIn(page, profile)
    const navigation = page.getByRole('navigation', { name: 'Primary workspace' })
    for (const label of profile.nav) await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible()
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
  await expect(page.locator('.query-status').first()).toContainText(/Offline (AI )?demo response completed|Catalyst response completed/)
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
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()
  await expect(page.locator('.query-status')).toContainText('Offline browser-print fallback opened')
})

test('text and voice queries both return grounded AI demo replies', async ({ page }) => {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      start() {
        this.onstart?.()
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: 'Find similar cases to SYN-2025-BLR-001 using Crime DNA' }]] })
          this.onend?.()
        }, 10)
      }
      stop() { this.onend?.() }
      abort() { this.onend?.() }
    }
    window.SpeechRecognition = MockSpeechRecognition
  })

  await signIn(page, roles[1])
  await expect(page.getByRole('heading', { name: 'Evidence-grounded answer' })).toBeVisible()

  await page.getByLabel('Investigation query').fill('Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.query-status').first()).toContainText(/AI demo response completed|Catalyst response completed/)
  await expect(page.locator('.citation-card')).not.toHaveCount(0)

  await page.locator('.query-form').getByRole('button', { name: 'Voice' }).click()
  await expect(page.getByLabel('Investigation query')).toHaveValue('Find similar cases to SYN-2025-BLR-001 using Crime DNA')
  await expect(page.locator('.query-status').first()).toContainText(/AI demo response completed|Catalyst response completed/)
  await expect(page.getByRole('heading', { name: 'Factor-level explanation' })).toBeVisible()
})

test('next-level copilot modes expose pipeline, coverage, timeline, and skeptic checks', async ({ page }) => {
  await signIn(page, roles[1])
  await expect(page.getByRole('group', { name: 'Response mode' })).toBeVisible()

  await page.getByRole('button', { name: /Timeline/ }).click()
  await page.getByLabel('Investigation query').fill('Summarize motorcycle theft cases with cited evidence')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Claim-to-source coverage' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How this answer was produced' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Evidence timeline' })).toBeVisible()
  await expect(page.getByText('timeline mode', { exact: true })).toBeVisible()
  await expect(page.getByText('No uncited FIR identifier detected in the answer.')).toBeVisible()

  await page.getByRole('button', { name: /Skeptic/ }).click()
  await page.getByLabel('Investigation query').fill('Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Consistency and contradiction checks' })).toBeVisible()
  await expect(page.getByText('contradictions mode', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'New investigation' }).click()
  await expect(page.getByText('New investigation session ready. Select a response mode or ask a cited database question.')).toBeVisible()
})
