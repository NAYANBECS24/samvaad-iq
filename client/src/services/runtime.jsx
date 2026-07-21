/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import seed from '../data/demoSeed.json'
import { createIntelligenceCore } from '../../../functions/api/core/index.mjs'
import { enrichInvestigationResult } from '../../../functions/api/core/insights.mjs'
import { api, isRetryableApiError, storeApiToken } from './api.js'

const RuntimeContext = createContext(null)
const offlineCore = createIntelligenceCore(seed, { total: 250 })
const offlineDemoPassword = import.meta.env.VITE_OFFLINE_DEMO_PASSWORD || ''
const OFFLINE_SESSION_KEY = 'netra_offline_demo_session'

function offlineSessionSelected() {
  return window.sessionStorage.getItem(OFFLINE_SESSION_KEY) === 'true'
}

const offlineTruth = {
  apiReachable: false,
  authentication: { available: false },
  dataSource: { available: true, kind: 'browser-seed', provider: 'Browser synthetic seed' },
  persistence: { available: false },
  generativeAi: { available: false, configured: false },
  quickMl: { available: false },
  ocr: { available: false },
  storage: { available: false },
  reports: { available: false },
  orchestration: { available: false },
}

const initialRuntime = {
  mode: 'checking',
  label: 'Checking Catalyst',
  tone: 'amber',
  capabilities: null,
  truth: { ...offlineTruth, apiReachable: null },
  apiReachable: null,
  limitations: [],
  lastChecked: null,
}

function offlineRuntime(message = 'Catalyst API is unavailable; the read-only deterministic demo is active.') {
  return {
    mode: 'offline-demo',
    label: 'Offline Demo',
    tone: 'amber',
    capabilities: null,
    truth: offlineTruth,
    apiReachable: false,
    limitations: [message, 'Changes are not persisted and server-generated reports are disabled.'],
    lastChecked: new Date().toISOString(),
  }
}

function localRetrievalQuery(query, context = {}) {
  const previousFirIds = [
    ...(Array.isArray(context.previousFirIds) ? context.previousFirIds : []),
    ...(Array.isArray(context.contextRefs) ? context.contextRefs : []),
  ].filter((item) => /^SYN-[A-Z0-9-]+$/i.test(String(item))).map((item) => String(item).toUpperCase())
  const uniqueIds = [...new Set(previousFirIds)].slice(0, 5)
  const looksLikeFollowUp = /\b(it|that|those|this|them|first|second|same|previous|former|latter|what about|compare|summari[sz]e|show that station)\b|ಅದು|ಇದು|ಮೊದಲ|ಎರಡನೇ|ಹಿಂದಿನ/i.test(query)
  if (!looksLikeFollowUp || !uniqueIds.length) return query
  if (/\bfirst|former\b|ಮೊದಲ/i.test(query)) return `${query} Context FIR: ${uniqueIds[0]}`
  if (/\bsecond|latter\b|ಎರಡನೇ/i.test(query) && uniqueIds[1]) return `${query} Context FIR: ${uniqueIds[1]}`
  return `${query} Context FIRs: ${uniqueIds.slice(0, 3).join(' ')}`
}

export function RuntimeProvider({ children }) {
  const [runtime, setRuntime] = useState(initialRuntime)

  const probe = useCallback(async () => {
    if (offlineSessionSelected()) {
      setRuntime(offlineRuntime('A read-only Judge Demo session was selected; server persistence and protected APIs are intentionally disabled.'))
      return
    }
    setRuntime((current) => ({ ...current, mode: 'checking', label: 'Checking Catalyst', tone: 'amber' }))
    try {
      const [health, capabilities] = await Promise.all([api.health(), api.capabilities()])
      const truth = capabilities.runtime || health.runtime || { ...offlineTruth, apiReachable: true }
      const live = health.mode === 'catalyst-live' && truth.persistence?.available
      const serverAi = truth.generativeAi?.available
      setRuntime({
        mode: health.mode,
        label: live ? 'Catalyst Live' : serverAi ? 'Server AI · Synthetic Seed' : 'Server · Synthetic Seed',
        tone: live || serverAi ? 'green' : 'amber',
        capabilities: capabilities.capabilities,
        truth: { ...truth, apiReachable: true },
        apiReachable: true,
        limitations: capabilities.limitations || [],
        dataVersion: health.dataVersion,
        lastChecked: new Date().toISOString(),
      })
    } catch (error) {
      setRuntime(offlineRuntime(error.message))
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(probe, 0)
    return () => window.clearTimeout(timer)
  }, [probe])

  const runQuery = useCallback(async (query, context = {}) => {
    const startedAt = performance.now()
    if (runtime.apiReachable !== false) {
      try {
        const result = await api.query(query, context)
        setRuntime((current) => {
          const generated = Boolean(result.provider?.kind && result.provider.kind !== 'deterministic')
          const truth = generated
            ? { ...current.truth, apiReachable: true, generativeAi: { ...(current.truth?.generativeAi || {}), available: true, verified: true, provider: result.provider.name, model: result.provider.model } }
            : { ...current.truth, apiReachable: true }
          return { ...current, apiReachable: true, truth, label: generated && !truth.persistence?.available ? 'Server AI · Synthetic Seed' : current.label }
        })
        return result
      } catch (error) {
        if (!isRetryableApiError(error)) throw error
        const groundedQuery = localRetrievalQuery(query, context)
        const fallback = offlineCore.answer(groundedQuery, { mode: 'offline-demo' })
        fallback.limitations.unshift(`Server request failed (${error.code || 'NETWORK_ERROR'}); this answer was recomputed locally and was not persisted.`)
        const result = enrichInvestigationResult(fallback, { answerMode: context.answerMode })
        const reachable = Boolean(error.status && error.code !== 'NON_JSON_API')
        setRuntime((current) => ({
          ...current,
          apiReachable: reachable,
          truth: { ...current.truth, apiReachable: reachable },
          limitations: [...new Set([`Latest server query failed: ${error.message}`, ...(current.limitations || [])])],
        }))
        return {
          ...result,
          conversationId: context.conversationId,
          messageId: `MSG-LOCAL-${Date.now().toString(36)}`,
          dataVersion: offlineCore.dataset.version,
          provider: { name: 'KAVACH deterministic core', model: 'browser-shared-domain', kind: 'deterministic' },
          latency: { totalMs: Math.round(performance.now() - startedAt) },
          queryPlan: { language: context.language || context.interfaceLanguage || 'en', intent: result.intent, filters: result.filters, contextResolution: context.previousFirIds?.length ? 'browser-context' : 'standalone', retrieval: result.answerClass === 'DATABASE_GROUNDED' ? 'browser synthetic FIR retrieval' : 'no FIR retrieval', groundingRequired: result.answerClass === 'DATABASE_GROUNDED' },
          claimCitations: result.citations || [],
        }
      }
    }
    const groundedQuery = localRetrievalQuery(query, context)
    const fallback = offlineCore.answer(groundedQuery, { mode: 'offline-demo' })
    const result = enrichInvestigationResult(fallback, { answerMode: context.answerMode, contextUsed: groundedQuery !== query })
    return {
      ...result,
      conversationId: context.conversationId,
      messageId: `MSG-LOCAL-${Date.now().toString(36)}`,
      dataVersion: offlineCore.dataset.version,
      provider: { name: 'KAVACH deterministic core', model: 'browser-shared-domain', kind: 'deterministic' },
      latency: { totalMs: Math.round(performance.now() - startedAt) },
      claimCitations: result.citations || [],
    }
  }, [runtime.apiReachable])

  const analyzeEvidence = useCallback(async (prepared) => {
    if (runtime.apiReachable) {
      try {
        const { contentBase64, ...analysisPayload } = prepared
        let evidenceId = `EV-${prepared.file.sha256.slice(0, 16).toUpperCase()}`
        let upload = null
        if (runtime.truth?.storage?.configured || runtime.truth?.storage?.available) {
          upload = await api.createEvidenceUpload({ file: prepared.file, contentBase64, collectedAt: prepared.collectedAt })
          evidenceId = upload.evidence.evidenceId
          setRuntime((current) => ({
            ...current,
            truth: {
              ...current.truth,
              storage: { ...(current.truth?.storage || {}), available: true, verified: true, provider: upload.evidence.storage.provider },
            },
          }))
        }
        const result = await api.analyzeEvidence(evidenceId, analysisPayload)
        return { ...result, upload: upload?.evidence || null }
      } catch (error) {
        if (runtime.truth?.storage?.configured || runtime.truth?.storage?.available) throw error
        if (!isRetryableApiError(error)) throw error
        setRuntime((current) => ({ ...current, limitations: [...new Set([`Server evidence analysis failed: ${error.message}`, ...(current.limitations || [])])] }))
      }
    }
    return offlineCore.analyzeEvidence({ ...prepared, mode: 'offline-demo', limitations: [...(prepared.limitations || []), 'Analysis ran locally and was not persisted.'] })
  }, [runtime.apiReachable, runtime.truth?.storage?.available, runtime.truth?.storage?.configured])

  const login = useCallback(async (email, password, options = {}) => {
    if (runtime.apiReachable && !options.forceOffline) {
      try {
        const session = password ? await api.login(email, password) : await api.demoSession(email)
        window.sessionStorage.removeItem(OFFLINE_SESSION_KEY)
        storeApiToken(session.token)
        setRuntime((current) => ({
          ...current,
          truth: { ...current.truth, authentication: { ...(current.truth?.authentication || {}), available: true, verified: true, provider: 'Server demo session' } },
        }))
        return session.user
      } catch (error) {
        const offlineEligible = options.allowOfflineProfile && ['DEMO_AUTH_DISABLED', 'DEMO_AUTH_UNCONFIGURED', 'NON_JSON_API', 'NETWORK_ERROR', 'API_TIMEOUT'].includes(error.code)
        if (!offlineEligible) throw error
      }
    }
    const normalized = email.trim().toLowerCase().replace('@samvaad.local', '@ksp.demo')
    const user = seed.users.find((item) => item.email === normalized)
    if (offlineDemoPassword && password !== offlineDemoPassword) throw new Error('Invalid offline demo credentials')
    if (!user) throw new Error('Invalid offline demo credentials')
    window.sessionStorage.setItem(OFFLINE_SESSION_KEY, 'true')
    storeApiToken(null)
    setRuntime(offlineRuntime('Judge Demo is running locally because a server demo session is not configured.'))
    return {
      ...user,
      landing: user.role === 'Analyst' || user.role === 'Admin' ? '/dashboard' : user.role === 'Supervisor' ? '/analytics' : '/chat',
      sessionMode: 'offline-demo',
      authMethod: offlineDemoPassword ? 'environment-password' : 'read-only-profile',
    }
  }, [runtime.apiReachable])

  const restoreSession = useCallback(async () => {
    if (!runtime.apiReachable) return null
    try {
      const response = await api.currentUser()
      setRuntime((current) => ({
        ...current,
        truth: { ...current.truth, authentication: { ...(current.truth?.authentication || {}), available: true, verified: true, provider: response.user?.provider === 'catalyst-auth' ? 'Catalyst Auth' : 'Signed session' } },
      }))
      return response.user || null
    } catch {
      return null
    }
  }, [runtime.apiReachable])

  const logout = useCallback(async () => {
    if (runtime.apiReachable) await api.logout().catch(() => null)
    storeApiToken(null)
    window.sessionStorage.removeItem(OFFLINE_SESSION_KEY)
    setRuntime((current) => ({
      ...current,
      truth: { ...current.truth, authentication: { ...(current.truth?.authentication || {}), available: false, verified: false } },
    }))
  }, [runtime.apiReachable])

  const value = useMemo(() => ({ runtime, probe, runQuery, analyzeEvidence, login, restoreSession, logout, offlineCore }), [runtime, probe, runQuery, analyzeEvidence, login, restoreSession, logout])
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
}

export function useRuntime() {
  const context = useContext(RuntimeContext)
  if (!context) throw new Error('useRuntime must be used inside RuntimeProvider')
  return context
}
