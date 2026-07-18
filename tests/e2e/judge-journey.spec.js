import { expect, test } from '@playwright/test'

const roles = [
  { role: 'Admin', landing: 'dashboard', nav: ['Dashboard', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance', 'Admin Data'] },
  { role: 'Investigator', landing: 'chat', nav: ['Dashboard', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance'] },
  { role: 'Analyst', landing: 'dashboard', nav: ['Dashboard', 'Ask SAMVAAD', 'Case Workspace', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Reports', 'Pipeline', 'Governance'] },
  { role: 'Supervisor', landing: 'analytics', nav: ['Dashboard', 'Ask SAMVAAD', 'Case Workspace', 'Evidence Lab', 'Intelligence Analytics', 'Hotspots', 'Network', 'Digital Evidence', 'Crime DNA', 'Cold Cases', 'Diffusion', 'Patrol', 'Tablet Patrol', 'Reports', 'Pipeline', 'Governance'] },
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

test('login uses the direct role gateway without embedded Catalyst authentication', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'Role-Based Demo Access' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Catalyst Login' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Register' })).toHaveCount(0)
  await expect(page.locator('#catalyst-signin, iframe')).toHaveCount(0)
  await expect(page.locator('.credential-card')).toHaveCount(4)

  const panelBox = await page.locator('.login-action-panel').boundingBox()
  expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(1080)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})

for (const profile of roles) {
  test(`${profile.role} receives the correct role-aware workspace`, async ({ page }) => {
    await signIn(page, profile)
    const navigation = page.getByRole('navigation', { name: 'Primary workspace' })
    for (const label of profile.nav) {
      const link = navigation.getByRole('link', { name: label, exact: true })
      await expect(link).toBeAttached()
    }
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
  await expect(page.getByText(/Hello! I’m SAMVAAD-IQ/)).toBeVisible()
  await page.getByLabel('Investigation query').fill('Mysuru alli motorcycle theft hotspot show maadi')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.query-status').first()).toContainText(/SAMVAAD replied/)
  await expect(page.getByRole('heading', { name: 'Investigation details' })).toBeVisible()
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
  await expect(page.getByText(/Hello! I’m SAMVAAD-IQ/)).toBeVisible()

  await page.getByLabel('Investigation query').fill('Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.query-status').first()).toContainText(/SAMVAAD replied/)
  await expect(page.locator('.citation-card')).not.toHaveCount(0)

  await page.locator('.query-form').getByRole('button', { name: 'Voice' }).click()
  await expect(page.locator('.chat-message.is-user').last()).toContainText('Find similar cases to SYN-2025-BLR-001 using Crime DNA')
  await expect(page.getByLabel('Investigation query')).toHaveValue('')
  await expect(page.locator('.query-status').first()).toContainText(/SAMVAAD replied/)
  await expect(page.getByRole('heading', { name: 'Factor-level explanation' })).toBeVisible()
})

test('greetings receive a normal conversational reply without a fake evidence failure', async ({ page }) => {
  await signIn(page, roles[1])
  await page.getByLabel('Investigation query').fill('HELLO')
  await page.locator('.query-form').getByRole('button', { name: 'Ask', exact: true }).click()

  const assistantReply = page.locator('.chat-message.is-assistant').last()
  await expect(assistantReply).toContainText('Hello! I’m SAMVAAD-IQ')
  await expect(assistantReply).toContainText('Conversational response · no database claim made')
  await expect(page.getByText('AMBIGUOUS QUERY')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Investigation details' })).toHaveCount(0)
  await expect(page.locator('.query-status').first()).toContainText('SAMVAAD replied in read-only demo mode')
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
  await expect(page.getByText('New conversation ready. Ask naturally by text or voice.')).toBeVisible()
})
