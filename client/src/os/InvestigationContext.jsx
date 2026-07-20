/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'netra_os_investigation_v1'
const InvestigationContext = createContext(null)

function createInitialState() {
  return {
    version: 1,
    activeInvestigation: {
      id: 'INV-LOCAL-001',
      title: 'Active Investigation',
      status: 'Working draft',
    },
    pinnedCases: [],
    selectedEvidence: [],
    analysisRuns: [],
    reportDraft: { state: 'Not started', updatedAt: null },
    notes: [],
    tasks: [],
    recentRoutes: [],
    lastResult: null,
    dataVersion: 'SYN-DEMO-250',
  }
}

function readStoredState() {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (!stored || stored.version !== 1) return createInitialState()
    return { ...createInitialState(), ...stored }
  } catch {
    return createInitialState()
  }
}

function readLastChat() {
  try {
    return JSON.parse(window.localStorage.getItem('samvaad_last_chat') || 'null')
  } catch {
    return null
  }
}

function uniqueCitations(result) {
  const seen = new Set()
  return (result?.citations || []).filter((citation) => {
    const key = citation.firId || citation.id
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function withRecordedResult(current, result) {
  if (!result?.requestId || current.lastResult?.requestId === result.requestId) return current
  const citations = uniqueCitations(result)
  const reviewTask = citations.length
    ? [{
      id: `REVIEW-${result.requestId}`,
      title: `Verify ${citations.length} cited synthetic source${citations.length === 1 ? '' : 's'}`,
      detail: 'Human review is required before any case link or report becomes actionable.',
      status: 'pending',
      source: result.requestId,
    }]
    : []
  return {
    ...current,
    dataVersion: result.dataVersion || current.dataVersion,
    lastResult: {
      requestId: result.requestId,
      query: result.query,
      answer: result.answer,
      intent: result.intent,
      confidence: result.confidence,
      citations,
      limitations: result.limitations || [],
      auditRef: result.auditRef,
    },
    analysisRuns: [
      {
        id: result.requestId,
        intent: result.intent || 'query',
        citationCount: citations.length,
        confidence: result.confidence?.score || 0,
      },
      ...current.analysisRuns.filter((item) => item.id !== result.requestId),
    ].slice(0, 8),
    tasks: [...reviewTask, ...current.tasks.filter((task) => task.source !== result.requestId)].slice(0, 12),
  }
}

export function InvestigationProvider({ children }) {
  const [state, setState] = useState(readStoredState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const recordWorkspace = useCallback((path, label) => {
    setState((current) => {
      const recentRoutes = [
        { path, label, visitedAt: new Date().toISOString() },
        ...current.recentRoutes.filter((item) => item.path !== path),
      ].slice(0, 8)
      return { ...current, recentRoutes }
    })
  }, [])

  const setDataVersion = useCallback((dataVersion) => {
    if (!dataVersion) return
    setState((current) => current.dataVersion === dataVersion ? current : { ...current, dataVersion })
  }, [])

  const renameInvestigation = useCallback((title) => {
    const nextTitle = String(title || '').trim()
    if (!nextTitle) return
    setState((current) => ({
      ...current,
      activeInvestigation: { ...current.activeInvestigation, title: nextTitle },
    }))
  }, [])

  const pinCase = useCallback((firId) => {
    if (!firId) return
    setState((current) => current.pinnedCases.includes(firId)
      ? current
      : { ...current, pinnedCases: [firId, ...current.pinnedCases].slice(0, 8) })
  }, [])

  const unpinCase = useCallback((firId) => {
    setState((current) => ({ ...current, pinnedCases: current.pinnedCases.filter((item) => item !== firId) }))
  }, [])

  const addNote = useCallback((text) => {
    const content = String(text || '').trim()
    if (!content) return
    setState((current) => ({
      ...current,
      notes: [
        { id: `NOTE-${Date.now()}`, text: content, createdAt: new Date().toISOString() },
        ...current.notes,
      ].slice(0, 12),
    }))
  }, [])

  const toggleTask = useCallback((taskId) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId
        ? { ...task, status: task.status === 'complete' ? 'pending' : 'complete' }
        : task),
    }))
  }, [])

  const recordResult = useCallback((result) => {
    setState((current) => withRecordedResult(current, result))
  }, [])

  const syncLastResult = useCallback(() => {
    const result = readLastChat()
    if (result?.requestId) setState((current) => withRecordedResult(current, result))
  }, [])

  const resetInvestigation = useCallback(() => setState(createInitialState()), [])

  const value = useMemo(() => ({
    ...state,
    recordWorkspace,
    setDataVersion,
    renameInvestigation,
    pinCase,
    unpinCase,
    addNote,
    toggleTask,
    recordResult,
    syncLastResult,
    resetInvestigation,
  }), [state, recordWorkspace, setDataVersion, renameInvestigation, pinCase, unpinCase, addNote, toggleTask, recordResult, syncLastResult, resetInvestigation])

  return <InvestigationContext.Provider value={value}>{children}</InvestigationContext.Provider>
}

export function useInvestigation() {
  const context = useContext(InvestigationContext)
  if (!context) throw new Error('useInvestigation must be used inside InvestigationProvider')
  return context
}
