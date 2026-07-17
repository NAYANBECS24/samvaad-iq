const SDK_URL = 'https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js'
const INIT_URL = '/__catalyst/sdk/init.js'

let sdkPromise = null

function isLocalHost() {
  return ['127.0.0.1', 'localhost'].includes(window.location.hostname)
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id)
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve()
      else {
        existing.addEventListener('load', resolve, { once: true })
        existing.addEventListener('error', reject, { once: true })
      }
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = false
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true })
    document.head.appendChild(script)
  })
}

export async function loadCatalystWebSdk() {
  if (isLocalHost()) throw new Error('Catalyst Web SDK is available only on the hosted Catalyst/Slate origin.')
  if (!sdkPromise) {
    sdkPromise = (async () => {
      await loadScript(SDK_URL, 'samvaad-catalyst-web-sdk')
      await loadScript(INIT_URL, 'samvaad-catalyst-init')
      if (!window.catalyst?.auth) throw new Error('Catalyst authentication did not initialize for this deployment.')
      return window.catalyst
    })().catch((error) => {
      sdkPromise = null
      throw error
    })
  }
  return sdkPromise
}

function mapRole(roleName = '') {
  const normalized = String(roleName).trim().toLowerCase()
  if (normalized === 'admin' || normalized.includes('administrator')) return 'Admin'
  if (normalized.includes('supervisor')) return 'Supervisor'
  if (normalized.includes('analyst')) return 'Analyst'
  return 'Investigator'
}

function landingFor(role) {
  if (role === 'Admin' || role === 'Analyst') return '/dashboard'
  if (role === 'Supervisor') return '/analytics'
  return '/chat'
}

export function normalizeCatalystUser(raw = {}) {
  const role = mapRole(raw.role_details?.role_name || raw.role_name || raw.role)
  return {
    id: raw.user_id || raw.zaaid || raw.zuid || raw.email_id,
    email: raw.email_id || raw.email,
    firstName: raw.first_name || '',
    lastName: raw.last_name || '',
    role,
    access: role === 'Investigator' ? 'Case search, cited analysis, evidence review' : 'Role-controlled Catalyst workspace access',
    landing: landingFor(role),
    sessionMode: 'catalyst-auth',
    authMethod: 'catalyst-web-sdk',
  }
}

export async function currentCatalystUser() {
  const sdk = await loadCatalystWebSdk()
  const response = await sdk.auth.isUserAuthenticated()
  const raw = response?.content || response
  if (!raw?.email_id && !raw?.email) throw new Error('No active Catalyst user session was found.')
  return normalizeCatalystUser(raw)
}

export async function renderCatalystSignIn(elementId) {
  const sdk = await loadCatalystWebSdk()
  sdk.auth.signIn(elementId)
  return sdk
}

export async function registerCatalystUser({ firstName, lastName, email }) {
  const sdk = await loadCatalystWebSdk()
  const response = await sdk.auth.signUp({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email_id: email.trim().toLowerCase(),
    platform_type: 'web',
    redirect_url: `${window.location.origin}${window.location.pathname}#/login`,
  })
  return response?.content || response
}

export async function catalystAccessToken() {
  const sdk = await loadCatalystWebSdk()
  if (typeof sdk.auth.generateAuthToken !== 'function') return null
  const response = await sdk.auth.generateAuthToken()
  return response?.access_token || response?.content?.access_token || null
}

export async function signOutCatalyst() {
  const sdk = await loadCatalystWebSdk()
  sdk.auth.signOut(`${window.location.origin}${window.location.pathname}#/login`)
}

