/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import seed from '../data/demoSeed.json'
import { createIntelligenceCore } from '../../../functions/api/core/index.mjs'
import { enrichInvestigationResult } from '../../../functions/api/core/insights.mjs'
import { api, storeApiToken } from './api.js'
import { catalystAccessToken, currentCatalystUser, registerCatalystUser, signOutCatalyst } from './catalystAuth.js'

const RuntimeContext = createContext(null)
const offlineCore = createIntelligenceCore(seed, { total: 250 })
const offlineDemoPassword = import.meta.env.VITE_OFFLINE_DEMO_PASSWORD || ''

const initialRuntime = {
  mode: 'checking',
  label: 'Checking Catalyst',
  tone: 'amber',
  capabilities: null,
  limitations: [],
  lastChecked: null,
}

function offlineRuntime(message = 'Catalyst API is unavailable; the read-only deterministic demo is active.') {
  return {
    mode: 'offline-demo',
    label: 'Offline Demo',
    tone: 'amber',
    capabilities: null,
    limitations: [message, 'Changes are not persisted and server-generated reports are disabled.'],
    lastChecked: new Date().toISOString(),
  }
}

export function RuntimeProvider({ children }) {
  const [runtime, setRuntime] = useState(initialRuntime)

  const probe = useCallback(async () => {
    setRuntime((current) => ({ ...current, mode: 'checking', label: 'Checking Catalyst', tone: 'amber' }))
    try {
      const [health, capabilities] = await Promise.all([api.health(), api.capabilities()])
      const live = health.mode === 'catalyst-live'
      setRuntime({
        mode: health.mode,
        label: live ? 'Catalyst Live' : 'Offline Demo',
        tone: live ? 'green' : 'amber',
        capabilities: capabilities.capabilities,
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
    if (runtime.mode === 'catalyst-live') {
      try {
        return await api.query(query, context)
      } catch (error) {
        setRuntime(offlineRuntime(`Catalyst query failed: ${error.message}`))
        const fallback = offlineCore.answer(query, { mode: 'offline-demo' })
        fallback.limitations.unshift(`Catalyst request failed (${error.code || 'API_ERROR'}); this answer was recomputed locally.`)
        return enrichInvestigationResult(fallback, { answerMode: context.answerMode })
      }
    }
    return enrichInvestigationResult(offlineCore.answer(query, { mode: 'offline-demo' }), { answerMode: context.answerMode })
  }, [runtime.mode])

  const analyzeEvidence = useCallback(async (prepared) => {
    if (runtime.mode === 'catalyst-live') {
      try {
        return await api.analyzeEvidence(prepared.file.sha256.slice(0, 16), prepared)
      } catch (error) {
        setRuntime(offlineRuntime(`Catalyst evidence analysis failed: ${error.message}`))
      }
    }
    return offlineCore.analyzeEvidence({ ...prepared, mode: 'offline-demo', limitations: [...(prepared.limitations || []), 'Analysis ran locally and was not persisted.'] })
  }, [runtime.mode])

  const login = useCallback(async (email, password) => {
    if (runtime.mode === 'catalyst-live') {
      const session = await api.login(email, password)
      storeApiToken(session.token)
      return session.user
    }
    const normalized = email.trim().toLowerCase().replace('@samvaad.local', '@ksp.demo')
    const user = seed.users.find((item) => item.email === normalized)
    if (offlineDemoPassword && password !== offlineDemoPassword) throw new Error('Invalid offline demo credentials')
    if (!user) throw new Error('Invalid offline demo credentials')
    return {
      ...user,
      landing: user.role === 'Analyst' || user.role === 'Admin' ? '/dashboard' : user.role === 'Supervisor' ? '/analytics' : '/chat',
      sessionMode: 'offline-demo',
      authMethod: offlineDemoPassword ? 'environment-password' : 'read-only-profile',
    }
  }, [runtime.mode])

  const completeCatalystLogin = useCallback(async () => {
    const user = await currentCatalystUser()
    const token = await catalystAccessToken().catch(() => null)
    if (token) storeApiToken(token, 'Zoho-oauthtoken')
    return user
  }, [])

  const register = useCallback((details) => registerCatalystUser(details), [])

  const logout = useCallback((sessionMode) => {
    storeApiToken(null)
    if (sessionMode === 'catalyst-auth') signOutCatalyst().catch(() => null)
  }, [])

  const value = useMemo(() => ({ runtime, probe, runQuery, analyzeEvidence, login, completeCatalystLogin, register, logout, offlineCore }), [runtime, probe, runQuery, analyzeEvidence, login, completeCatalystLogin, register, logout])
  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
}

export function useRuntime() {
  const context = useContext(RuntimeContext)
  if (!context) throw new Error('useRuntime must be used inside RuntimeProvider')
  return context
}
