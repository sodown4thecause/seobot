'use client'

import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  UserMode,
  UserModeLevel,
  UserModeConfig,
  UserModePreferences,
  USER_MODE_CONFIGS,
  MODE_TRANSITIONS,
  ModeTransition
} from '@/types/user-mode'

// TODO: Implement user_mode_configs table in schema
// Tables needed: user_mode_configs
// Table schema: id, user_id, current_mode, preferences, customizations, onboarding_completed, created_at, updated_at

// Precompute mode-to-transitions map for O(1) lookups
const modeTransitionsMap: Record<UserModeLevel, ModeTransition[]> = MODE_TRANSITIONS.reduce(
  (acc, transition) => {
    if (!acc[transition.from]) {
      acc[transition.from] = []
    }
    acc[transition.from].push(transition)
    return acc
  },
  {} as Record<UserModeLevel, ModeTransition[]>
)

// State interface
interface UserModeState {
  currentMode: UserMode | null
  config: UserModeConfig | null
  isLoading: boolean
  error: string | null
  availableTransitions: ModeTransition[]
  isTransitioning: boolean
}

// Action types
type UserModeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MODE_CONFIG'; payload: UserModeConfig }
  | { type: 'SET_CURRENT_MODE'; payload: UserMode }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserModePreferences> }
  | { type: 'SET_AVAILABLE_TRANSITIONS'; payload: ModeTransition[] }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'RESET_STATE' }

// Initial state
const initialState: UserModeState = {
  currentMode: null,
  config: null,
  isLoading: true,
  error: null,
  availableTransitions: [],
  isTransitioning: false
}

// Reducer
function userModeReducer(state: UserModeState, action: UserModeAction): UserModeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'SET_MODE_CONFIG':
      return {
        ...state,
        config: action.payload,
        currentMode: createUserModeFromConfig(action.payload),
        isLoading: false,
        error: null
      }

    case 'SET_CURRENT_MODE':
      return { ...state, currentMode: action.payload }

    case 'UPDATE_PREFERENCES':
      if (!state.currentMode) return state
      return {
        ...state,
        currentMode: {
          ...state.currentMode,
          preferences: { ...state.currentMode.preferences, ...action.payload }
        }
      }

    case 'SET_AVAILABLE_TRANSITIONS':
      return { ...state, availableTransitions: action.payload }

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload }

    case 'RESET_STATE':
      return initialState

    default:
      return state
  }
}

// Helper function to create UserMode from config
function createUserModeFromConfig(config: UserModeConfig): UserMode {
  // Handle both current_mode (database) and currentMode (local)
  const modeLevel = config.currentMode || config.currentMode
  const baseConfig = USER_MODE_CONFIGS[modeLevel]
  return {
    level: modeLevel,
    ...baseConfig,
    preferences: { ...baseConfig.preferences, ...config.preferences }
  }
}

// Context interface
interface UserModeContextType {
  state: UserModeState
  actions: {
    // Mode management
    switchMode: (newMode: UserModeLevel) => Promise<boolean>
    updatePreferences: (preferences: Partial<UserModePreferences>) => Promise<boolean>
    resetToDefaults: () => Promise<boolean>

    // Mode validation
    canTransitionTo: (targetMode: UserModeLevel) => Promise<boolean>
    getTransitionRequirements: (targetMode: UserModeLevel) => ModeTransition | null

    // Utility
    refreshConfig: () => Promise<void>
    clearError: () => void
  }
}

// Helper to create default config
function createDefaultConfig(userId: string): UserModeConfig {
  return {
    id: 'temp',
    userId,
    currentMode: 'beginner',
    preferences: USER_MODE_CONFIGS.beginner.preferences,
    customizations: {},
    onboardingCompleted: {
      beginner: false,
      practitioner: false,
      agency: false
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Context
const UserModeContext = createContext<UserModeContextType | null>(null)

// Provider component
export function UserModeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userModeReducer, initialState)

  // Initialize user mode on mount
  useEffect(() => {
    try {
      // Check if user has saved mode preference in localStorage
      const savedMode = localStorage.getItem('user_mode_preference') as UserModeLevel | null

      if (savedMode && ['beginner', 'practitioner', 'agency'].includes(savedMode)) {
        // Use saved mode preference
        const configWithSavedMode: UserModeConfig = {
          ...createDefaultConfig('guest'),
          currentMode: savedMode,
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: configWithSavedMode })
      } else {
        // No saved preference, use default beginner mode
        const defaultConfig = createDefaultConfig('guest')
        dispatch({ type: 'SET_MODE_CONFIG', payload: defaultConfig })
      }
    } catch (error) {
      console.error('[UserModeProvider] Error initializing user mode:', error)
      // Fallback to default config if anything fails
      const defaultConfig = createDefaultConfig('guest')
      dispatch({ type: 'SET_MODE_CONFIG', payload: defaultConfig })
    }
  }, [])

  // Update available transitions when mode changes
  useEffect(() => {
    if (state.currentMode) {
      const transitions = modeTransitionsMap[state.currentMode!.level] || []
      dispatch({ type: 'SET_AVAILABLE_TRANSITIONS', payload: transitions })
    }
  }, [state.currentMode?.level])

  // Context actions
  const actions: UserModeContextType['actions'] = {
    switchMode: async (newMode: UserModeLevel): Promise<boolean> => {
      try {
        dispatch({ type: 'SET_TRANSITIONING', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })

        if (!state.config) {
          throw new Error('No user configuration available')
        }

        // Validate transition
        const canTransition = await actions.canTransitionTo(newMode)
        if (!canTransition) {
          throw new Error(`Cannot transition to ${newMode} mode`)
        }

        // TODO: Update user mode config in database
        // await db.update(userModeConfigs)
        //   .set({ currentMode: newMode, updatedAt: new Date() })
        //   .where(eq(userModeConfigs.userId, userId))

        // Dispatch updated mode
        const updatedConfig = {
          ...state.config,
          currentMode: newMode,
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: updatedConfig })

        // Save mode preference to localStorage
        localStorage.setItem('user_mode_preference', newMode)

        return true
      } catch (error) {
        console.error('[UserModeProvider] Failed to switch mode:', error)
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to switch mode' })
        return false
      } finally {
        dispatch({ type: 'SET_TRANSITIONING', payload: false })
      }
    },

    updatePreferences: async (preferences: Partial<UserModePreferences>): Promise<boolean> => {
      try {
        if (!state.config) {
          throw new Error('No user configuration available')
        }

        const updatedPreferences = { ...state.config.preferences, ...preferences }

        // TODO: Update user mode config in database
        // await db.update(userModeConfigs)
        //   .set({ 
        //     preferences: updatedPreferences,
        //     updatedAt: new Date() 
        //   })
        //   .where(eq(userModeConfigs.userId, userId))

        // Map snake_case db response to internal format
        const mappedConfig: UserModeConfig = {
          id: state.config.id,
          userId: state.config.userId,
          currentMode: state.config.currentMode,
          preferences: updatedPreferences,
          customizations: state.config.customizations,
          onboardingCompleted: state.config.onboardingCompleted,
          created_at: state.config.created_at,
          updated_at: state.config.updated_at
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: mappedConfig })
        return true
      } catch (error) {
        console.error('[UserModeProvider] Failed to update preferences:', error)
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update preferences' })
        return false
      }
    },

    resetToDefaults: async (): Promise<boolean> => {
      try {
        if (!state.config) {
          throw new Error('No user configuration available')
        }

        const defaultPreferences = USER_MODE_CONFIGS[state.config.currentMode].preferences

        // TODO: Update user mode config in database
        // await db.update(userModeConfigs)
        //   .set({ 
        //     preferences: defaultPreferences,
        //     updatedAt: new Date() 
        //   })
        //   .where(eq(userModeConfigs.userId, userId))

        // Dispatch updated config
        dispatch({ type: 'SET_ERROR', payload: null })
        return true
      } catch (error) {
        console.error('[UserModeProvider] Failed to reset to defaults:', error)
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to reset preferences' })
        return false
      }
    },

    canTransitionTo: async (targetMode: UserModeLevel): Promise<boolean> => {
      if (!state.currentMode) return false

      // Allow same mode (no-op)
      if (state.currentMode.level === targetMode) return true

      // Find transition rule
      const transition = MODE_TRANSITIONS.find(
        t => t.from === state.currentMode!.level && t.to === targetMode
      )

      if (!transition) return false

      // If no requirements, allow transition
      if (!transition.requirements) return true

      // TODO: Implement requirement checking
      // For now, allow all transitions
      return true
    },

    getTransitionRequirements: (targetMode: UserModeLevel): ModeTransition | null => {
      if (!state.currentMode) return null

      return MODE_TRANSITIONS.find(
        t => t.from === state.currentMode!.level && t.to === targetMode
      ) || null
    },

    refreshConfig: async (): Promise<void> => {
      // TODO: Implement refresh from database
    },

    clearError: (): void => {
      dispatch({ type: 'SET_ERROR', payload: null })
    }
  }

  return (
    <UserModeContext.Provider value={{ state, actions }}>
      {children}
    </UserModeContext.Provider>
  )
}

// Hook to use user mode context
export function useUserMode() {
  const context = useContext(UserModeContext)
  if (!context) {
    throw new Error('useUserMode must be used within a UserModeProvider')
  }
  return context
}

// Utility hooks for common use cases
export function useCurrentMode(): UserMode | null {
  const { state } = useUserMode()
  return state.currentMode
}

export function useModePreferences(): UserModePreferences | null {
  const { state } = useUserMode()
  return state.currentMode?.preferences || null
}

export function useFeatureAccess() {
  const { state } = useUserMode()
  return state.currentMode?.featureAccess || null
}
