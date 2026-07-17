import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'

const translations = {
  en: {
    'language.english': 'English',
    'language.kannada': 'Kannada',
    'language.label': 'Language',
    'language.mode': 'Interface',
    'language.enShort': 'EN',
    'language.knShort': 'KA',
    'shell.systems': 'Runtime status verified',
    'shell.signedIn': 'Signed in',
    'shell.logout': 'Logout',
    'nav.dashboard': 'Dashboard',
    'nav.commandCenter': 'Command Center',
    'nav.askSamvaad': 'Ask SAMVAAD',
    'nav.caseWorkspace': 'Case Workspace',
    'nav.analytics': 'Intelligence Analytics',
    'nav.investigation': 'Investigation',
    'nav.cases': 'Cases',
    'nav.hotspots': 'Hotspots',
    'nav.network': 'Network',
    'nav.evidenceLab': 'Evidence Lab',
    'nav.digitalEvidence': 'Digital Evidence',
    'nav.crimeDna': 'Crime DNA',
    'nav.coldCases': 'Cold Cases',
    'nav.diffusion': 'Diffusion',
    'nav.patrol': 'Patrol',
    'nav.tabletPatrol': 'Tablet Patrol',
    'nav.reports': 'Reports',
    'nav.adminData': 'Admin Data',
    'nav.pipeline': 'Pipeline',
    'nav.governance': 'Governance',
    'chat.eyebrow': 'Investigation Chat',
    'chat.title': 'Evidence-Grounded Query Workspace',
    'chat.placeholder': 'Ask in English or Kanglish...',
    'chat.voice': 'Voice',
    'chat.listening': 'Listening',
    'chat.ask': 'Ask',
    'chat.processing': 'Processing',
    'chat.answer': 'Answer',
    'chat.nextActions': 'Next Actions',
    'chat.followUp': 'Human-Led Follow-Up',
    'chat.skepticNotes': 'Skeptic Notes',
    'chat.guardrails': 'Guardrails',
    'chat.sessionHistory': 'Session History',
    'chat.recentQueries': 'Recent Queries',
    'chat.voiceReady': 'Voice input ready',
    'chat.voiceUnavailable': 'Voice input is not available in this browser',
    'chat.voiceListening': 'Listening...',
    'chat.voiceCaptured': 'Captured:',
    'chat.voiceStopped': 'Voice capture stopped; text input is available',
    'chat.agentAnalyzing': 'KAVACH agents are analyzing your query...',
    'chat.map': 'Map',
    'chat.graph': 'Graph',
    'chat.dna': 'DNA',
    'chat.report': 'Report',
    'chat.kavachVoice': 'KAVACH Voice Output',
    'chat.speakSummary': 'Speak',
    'chat.stopVoice': 'Stop',
    'chat.speechReady': 'Ready to brief investigator',
    'chat.speechStarting': 'Preparing spoken brief...',
    'chat.speechSpeaking': 'Speaking investigation summary',
    'chat.speechStopped': 'Voice brief stopped',
    'chat.speechDone': 'Voice brief complete',
    'chat.speechUnsupported': 'Text-to-speech is not available in this browser',
    'chat.speechError': 'Voice output stopped; readable answer remains available',
  },
  kn: {
    'language.english': 'English',
    'language.kannada': 'ಕನ್ನಡ',
    'language.label': 'ಭಾಷೆ',
    'language.mode': 'ಇಂಟರ್ಫೇಸ್',
    'language.enShort': 'EN',
    'language.knShort': 'ಕ',
    'shell.systems': 'ರನ್‌ಟೈಮ್ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    'shell.signedIn': 'ಸೈನ್ ಇನ್',
    'shell.logout': 'ಲಾಗ್ ಔಟ್',
    'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'nav.commandCenter': 'ಕಮಾಂಡ್ ಸೆಂಟರ್',
    'nav.askSamvaad': 'SAMVAAD ಕೇಳಿ',
    'nav.caseWorkspace': 'ಪ್ರಕರಣ ಕಾರ್ಯಕ್ಷೇತ್ರ',
    'nav.analytics': 'ಬುದ್ಧಿವಂತ ವಿಶ್ಲೇಷಣೆ',
    'nav.investigation': 'ತನಿಖೆ',
    'nav.cases': 'ಪ್ರಕರಣಗಳು',
    'nav.hotspots': 'ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು',
    'nav.network': 'ನೆಟ್‌ವರ್ಕ್',
    'nav.evidenceLab': 'ಸಾಕ್ಷ್ಯ ಲ್ಯಾಬ್',
    'nav.digitalEvidence': 'ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯ',
    'nav.crimeDna': 'ಅಪರಾಧ DNA',
    'nav.coldCases': 'ಹಳೆಯ ಪ್ರಕರಣಗಳು',
    'nav.diffusion': 'ಪ್ರಸರಣ',
    'nav.patrol': 'ಗಸ್ತು',
    'nav.tabletPatrol': 'ಟ್ಯಾಬ್ಲೆಟ್ ಗಸ್ತು',
    'nav.reports': 'ವರದಿಗಳು',
    'nav.adminData': 'ಆಡಳಿತ ಡೇಟಾ',
    'nav.pipeline': 'ಪೈಪ್‌ಲೈನ್',
    'nav.governance': 'ಆಡಳಿತ',
    'chat.eyebrow': 'ತನಿಖಾ ಚಾಟ್',
    'chat.title': 'ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಪ್ರಶ್ನಾ ಕಾರ್ಯಕ್ಷೇತ್ರ',
    'chat.placeholder': 'ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ...',
    'chat.voice': 'ಧ್ವನಿ',
    'chat.listening': 'ಆಲಿಸುತ್ತಿದೆ',
    'chat.ask': 'ಕೇಳಿ',
    'chat.processing': 'ಪ್ರಕ್ರಿಯೆ',
    'chat.answer': 'ಉತ್ತರ',
    'chat.nextActions': 'ಮುಂದಿನ ಕ್ರಮಗಳು',
    'chat.followUp': 'ಮಾನವ ನೇತೃತ್ವದ ಮುಂದಿನ ಕ್ರಮ',
    'chat.skepticNotes': 'ಎಚ್ಚರಿಕೆ ಟಿಪ್ಪಣಿಗಳು',
    'chat.guardrails': 'ರಕ್ಷಣೆ ನಿಯಮಗಳು',
    'chat.sessionHistory': 'ಸೆಷನ್ ಇತಿಹಾಸ',
    'chat.recentQueries': 'ಇತ್ತೀಚಿನ ಪ್ರಶ್ನೆಗಳು',
    'chat.voiceReady': 'ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಸಿದ್ಧ',
    'chat.voiceUnavailable': 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ',
    'chat.voiceListening': 'ಆಲಿಸುತ್ತಿದೆ...',
    'chat.voiceCaptured': 'ಸೆರೆಯಾಯಿತು:',
    'chat.voiceStopped': 'ಧ್ವನಿ ಸೆರೆ ನಿಂತಿದೆ; ಪಠ್ಯ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿದೆ',
    'chat.agentAnalyzing': 'KAVACH ಏಜೆಂಟ್‌ಗಳು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿವೆ...',
    'chat.map': 'ನಕ್ಷೆ',
    'chat.graph': 'ಗ್ರಾಫ್',
    'chat.dna': 'DNA',
    'chat.report': 'ವರದಿ',
    'chat.kavachVoice': 'KAVACH ಧ್ವನಿ ಔಟ್‌ಪುಟ್',
    'chat.speakSummary': 'ಮಾತನಾಡಿ',
    'chat.stopVoice': 'ನಿಲ್ಲಿಸಿ',
    'chat.speechReady': 'ತನಿಖಾಧಿಕಾರಿಗೆ ಬ್ರಿಫ್ ಮಾಡಲು ಸಿದ್ಧ',
    'chat.speechStarting': 'ಧ್ವನಿ ಬ್ರಿಫ್ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...',
    'chat.speechSpeaking': 'ತನಿಖಾ ಸಾರಾಂಶವನ್ನು ಮಾತನಾಡುತ್ತಿದೆ',
    'chat.speechStopped': 'ಧ್ವನಿ ಬ್ರಿಫ್ ನಿಂತಿದೆ',
    'chat.speechDone': 'ಧ್ವನಿ ಬ್ರಿಫ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
    'chat.speechUnsupported': 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಪಠ್ಯದಿಂದ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ',
    'chat.speechError': 'ಧ್ವನಿ ಔಟ್‌ಪುಟ್ ನಿಂತಿದೆ; ಓದಲು ಉತ್ತರ ಲಭ್ಯವಿದೆ',
  },
}

const LanguageContext = createContext(null)

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem('samvaad_language')
  return stored === 'kn' ? 'kn' : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem('samvaad_language', language)
    document.documentElement.lang = language === 'kn' ? 'kn-IN' : 'en-IN'
  }, [language])

  const value = useMemo(() => {
    const t = (key) => translations[language]?.[key] ?? translations.en[key] ?? key
    return {
      language,
      setLanguage,
      t,
      isKannada: language === 'kn',
    }
  }, [language])

  return createElement(LanguageContext.Provider, { value }, children)
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
