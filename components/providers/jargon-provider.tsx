'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { JargonTerm, JargonCategory, JargonContextType } from '@/types/jargon'
import { 
  JARGON_DICTIONARY, 
  getTermById, 
  getTermByName, 
  getTermsByCategory,
  searchTerms as searchDictionary
} from '@/lib/jargon/dictionary'
import { useUserMode } from './user-mode-provider'

// State interface
interface JargonState {
  terms: Map<string, JargonTerm>
  isLoading: boolean
  error: string | null
  isEnabled: boolean
  showAdvancedTerms: boolean
  preferredComplexity: 'basic' | 'detailed' | 'comprehensive'
  learnedTerms: Set<string>
  viewedTerms: Map<string, number> // termId -> view count
}

// Action types
type JargonAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INITIALIZE_DICTIONARY'; payload: JargonTerm[] }
  | { type: 'TOGGLE_TOOLTIPS' }
  | { type: 'SET_COMPLEXITY'; payload: 'basic' | 'detailed' | 'comprehensive' }
  | { type: 'SET_SHOW_ADVANCED'; payload: boolean }
  | { type: 'MARK_TERM_LEARNED'; payload: string }
  | { type: 'TRACK_TOOLTIP_VIEW'; payload: string }
  | { type: 'LOAD_USER_PREFERENCES'; payload: Partial<JargonState> }

// Initial state
const initialState: JargonState = {
  terms: new Map(),
  isLoading: true,
  error: null,
  isEnabled: true,
  showAdvancedTerms: false,
  preferredComplexity: 'basic',
  learnedTerms: new Set(),
  viewedTerms: new Map()
}

// Reducer
function jargonReducer(state: JargonState, action: JargonAction): JargonState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'INITIALIZE_DICTIONARY':
      const termsMap = new Map<string, JargonTerm>()
      action.payload.forEach(term => {
        termsMap.set(term.term.toLowerCase(), term)
        termsMap.set(term.id, term)
      })
      return { 
        ...state, 
        terms: termsMap, 
        isLoading: false,
        error: null
      }
    
    case 'TOGGLE_TOOLTIPS':
      return { ...state, isEnabled: !state.isEnabled }
    
    case 'SET_COMPLEXITY':
      return { ...state, preferredComplexity: action.payload }
    
    case 'SET_SHOW_ADVANCED':
      return { ...state, showAdvancedTerms: action.payload }
    
    case 'MARK_TERM_LEARNED':
      const newLearnedTerms = new Set(state.learnedTerms)
      newLearnedTerms.add(action.payload)
      return { ...state, learnedTerms: newLearnedTerms }
    
    case 'TRACK_TOOLTIP_VIEW':
      const newViewedTerms = new Map(state.viewedTerms)
      const currentCount = newViewedTerms.get(action.payload) || 0
      newViewedTerms.set(action.payload, currentCount + 1)
      return { ...state, viewedTerms: newViewedTerms }
    
    case 'LOAD_USER_PREFERENCES':
      return { ...state, ...action.payload }
    
    default:
      return state
  }
}

// Context
const JargonContext = createContext<JargonContextType | null>(null)

// Provider component
export function JargonProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(jargonReducer, initialState)
  const { state: userModeState } = useUserMode()

  // Initialize dictionary and user preferences
  useEffect(() => {
    initializeJargonSystem()
  }, [])

  // Update preferences based on user mode
  useEffect(() => {
    if (userModeState.currentMode) {
      const { preferences } = userModeState.currentMode
      
      // Auto-adjust settings based on user mode
      dispatch({ 
        type: 'LOAD_USER_PREFERENCES', 
        payload: {
          isEnabled: preferences.jargonTooltips,
          showAdvancedTerms: userModeState.currentMode.level !== 'beginner',
          preferredComplexity: getComplexityForMode(userModeState.currentMode.level)
        }
      })
    }
  }, [userModeState.currentMode])

  const initializeJargonSystem = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Initialize dictionary
      dispatch({ type: 'INITIALIZE_DICTIONARY', payload: JARGON_DICTIONARY })
      
      // Load user preferences from localStorage
      loadUserPreferences()
      
    } catch (error) {
      console.error('[JargonProvider] Failed to initialize:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load jargon dictionary' })
    }
  }

  const loadUserPreferences = () => {
    try {
      const saved = localStorage.getItem('jargon-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        dispatch({ 
          type: 'LOAD_USER_PREFERENCES', 
          payload: {
            learnedTerms: new Set(preferences.learnedTerms || []),
            viewedTerms: new Map(preferences.viewedTerms || []),
            preferredComplexity: preferences.preferredComplexity || 'basic'
          }
        })
      }
    } catch (error) {
      console.warn('[JargonProvider] Failed to load preferences:', error)
    }
  }

  const saveUserPreferences = () => {
    try {
      const preferences = {
        learnedTerms: Array.from(state.learnedTerms),
        viewedTerms: Array.from(state.viewedTerms.entries()),
        preferredComplexity: state.preferredComplexity
      }
      localStorage.setItem('jargon-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.warn('[JargonProvider] Failed to save preferences:', error)
    }
  }

  // Save preferences when they change
  useEffect(() => {
    if (!state.isLoading) {
      saveUserPreferences()
    }
  }, [state.learnedTerms, state.viewedTerms, state.preferredComplexity])

  // Helper function to get complexity based on user mode
  const getComplexityForMode = (mode: string): 'basic' | 'detailed' | 'comprehensive' => {
    switch (mode) {
      case 'beginner': return 'basic'
      case 'practitioner': return 'detailed'
      case 'agency': return 'comprehensive'
      default: return 'basic'
    }
  }

  // Context value
  const contextValue: JargonContextType = {
    // State
    terms: state.terms,
    isLoading: state.isLoading,
    error: state.error,
    isEnabled: state.isEnabled,
    showAdvancedTerms: state.showAdvancedTerms,
    preferredComplexity: state.preferredComplexity,

    // Term lookup methods
    getTerm: (term: string): JargonTerm | null => {
      const found = state.terms.get(term.toLowerCase()) || getTermByName(term)
      return found || null
    },

    searchTerms: (query: string): JargonTerm[] => {
      if (!query.trim()) return []
      return searchDictionary(query).filter(term => {
        // Filter based on user preferences
        if (!state.showAdvancedTerms && term.difficulty === 'advanced') {
          return false
        }
        return true
      })
    },

    getTermsByCategory: (category: JargonCategory): JargonTerm[] => {
      return getTermsByCategory(category).filter(term => {
        if (!state.showAdvancedTerms && term.difficulty === 'advanced') {
          return false
        }
        return true
      })
    },

    // Actions
    toggleTooltips: () => {
      dispatch({ type: 'TOGGLE_TOOLTIPS' })
    },

    setComplexity: (level: 'basic' | 'detailed' | 'comprehensive') => {
      dispatch({ type: 'SET_COMPLEXITY', payload: level })
    },

    markTermAsLearned: (termId: string) => {
      dispatch({ type: 'MARK_TERM_LEARNED', payload: termId })
    },

    trackTooltipView: (termId: string) => {
      dispatch({ type: 'TRACK_TOOLTIP_VIEW', payload: termId })
    },

    getLearnedTerms: (): string[] => {
      return Array.from(state.learnedTerms)
    }
  }

  return (
    <JargonContext.Provider value={contextValue}>
      {children}
    </JargonContext.Provider>
  )
}

// Hook to use jargon context
export function useJargon() {
  const context = useContext(JargonContext)
  if (!context) {
    throw new Error('useJargon must be used within a JargonProvider')
  }
  return context
}

// Utility hooks
export function useJargonTerm(term: string) {
  const { getTerm, trackTooltipView } = useJargon()
  
  const jargonTerm = getTerm(term)
  
  const trackView = () => {
    if (jargonTerm) {
      trackTooltipView(jargonTerm.id)
    }
  }

  return {
    term: jargonTerm,
    trackView,
    exists: !!jargonTerm
  }
}