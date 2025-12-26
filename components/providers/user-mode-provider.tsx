'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  UserMode,
  UserModeLevel,
  UserModeConfig,
  UserModePreferences,
  USER_MODE_CONFIGS,
  MODE_TRANSITIONS,
  ModeTransition
} from '@/types/user-mode'

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
// Handles both camelCase (local) and snake_case (database) formats
function createUserModeFromConfig(config: UserModeConfig): UserMode {
  // Handle both current_mode (database) and currentMode (local)
  const modeLevel = config.current_mode || config.currentMode
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

// Context
const UserModeContext = createContext<UserModeContextType | null>(null)

// Provider component
export function UserModeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userModeReducer, initialState)

  // Initialize user mode on mount
  useEffect(() => {
    initializeUserMode()
  }, [])

  // Update available transitions when mode changes
  useEffect(() => {
    if (state.currentMode) {
      const transitions = MODE_TRANSITIONS.filter(t => t.from === state.currentMode!.level)
      dispatch({ type: 'SET_AVAILABLE_TRANSITIONS', payload: transitions })
    }
  }, [state.currentMode?.level])

  // Initialize user mode from database or create default
  const initializeUserMode = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // Not authenticated - use default beginner mode
        const defaultConfig = createDefaultConfig('guest')
        dispatch({ type: 'SET_MODE_CONFIG', payload: defaultConfig })
        return
      }

      // Try to fetch existing user mode config
      const { data: existingConfig, error: fetchError } = await supabase
        .from('user_mode_configs')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingConfig) {
        // Map snake_case db response to internal format
        const config: UserModeConfig = {
          id: existingConfig.id,
          userId: existingConfig.user_id,
          user_id: existingConfig.user_id,
          currentMode: existingConfig.current_mode,
          current_mode: existingConfig.current_mode,
          preferences: existingConfig.preferences,
          customizations: existingConfig.customizations,
          onboardingCompleted: existingConfig.onboarding_completed,
          onboarding_completed: existingConfig.onboarding_completed,
          created_at: existingConfig.created_at,
          updated_at: existingConfig.updated_at
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: config })
      } else {
        // Create new config - use ONLY snake_case for db insert
        const dbInsert = {
          user_id: user.id,
          current_mode: 'beginner' as const,
          preferences: USER_MODE_CONFIGS.beginner.preferences,
          customizations: {
            dashboardLayout: [],
            hiddenFeatures: [],
            pinnedTools: []
          },
          onboarding_completed: {
            beginner: false,
            practitioner: false,
            agency: false
          }
        }

        const { data: createdConfig, error: createError } = await supabase
          .from('user_mode_configs')
          .insert(dbInsert)
          .select()
          .single()

        if (createError) {
          throw createError
        }

        // Map response to internal format
        const config: UserModeConfig = {
          id: createdConfig.id,
          userId: createdConfig.user_id,
          user_id: createdConfig.user_id,
          currentMode: createdConfig.current_mode,
          current_mode: createdConfig.current_mode,
          preferences: createdConfig.preferences,
          customizations: createdConfig.customizations,
          onboardingCompleted: createdConfig.onboarding_completed,
          onboarding_completed: createdConfig.onboarding_completed,
          created_at: createdConfig.created_at,
          updated_at: createdConfig.updated_at
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: config })
      }
    } catch (error) {
      console.error('[UserModeProvider] Failed to initialize user mode:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user preferences' })

      // Fallback to default mode
      const fallbackConfig = createDefaultConfig('fallback')
      dispatch({ type: 'SET_MODE_CONFIG', payload: fallbackConfig })
    }
  }

  // Create default configuration - uses snake_case for database columns
  const createDefaultConfig = (userId: string): UserModeConfig => ({
    id: `default-${userId}`,
    userId,
    user_id: userId, // Database uses snake_case
    currentMode: 'beginner',
    current_mode: 'beginner', // Database uses snake_case
    preferences: USER_MODE_CONFIGS.beginner.preferences,
    customizations: {
      dashboardLayout: [],
      hiddenFeatures: [],
      pinnedTools: []
    },
    onboardingCompleted: {
      beginner: false,
      practitioner: false,
      agency: false
    },
    onboarding_completed: { // Database uses snake_case
      beginner: false,
      practitioner: false,
      agency: false
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  // Actions
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

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        // Update configuration - uses snake_case for database
        const updatedConfig = {
          current_mode: newMode,
          preferences: {
            ...USER_MODE_CONFIGS[newMode].preferences,
            // Preserve some user customizations
            ...state.config.preferences
          },
          updated_at: new Date().toISOString()
        }

        const { data: updated, error } = await supabase
          .from('user_mode_configs')
          .update(updatedConfig)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Map snake_case db response to internal format
        const mappedConfig: UserModeConfig = {
          id: updated.id,
          userId: updated.user_id,
          user_id: updated.user_id,
          currentMode: updated.current_mode,
          current_mode: updated.current_mode,
          preferences: updated.preferences,
          customizations: updated.customizations,
          onboardingCompleted: updated.onboarding_completed,
          onboarding_completed: updated.onboarding_completed,
          created_at: updated.created_at,
          updated_at: updated.updated_at
        }
        dispatch({ type: 'SET_MODE_CONFIG', payload: mappedConfig })
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

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          throw new Error('User not authenticated')
        }

        const updatedPreferences = { ...state.config.preferences, ...preferences }

        const { data: updated, error } = await supabase
          .from('user_mode_configs')
          .update({
            preferences: updatedPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Map snake_case db response to internal format
        const mappedConfig: UserModeConfig = {
          id: updated.id,
          userId: updated.user_id,
          user_id: updated.user_id,
          currentMode: updated.current_mode,
          current_mode: updated.current_mode,
          preferences: updated.preferences,
          customizations: updated.customizations,
          onboardingCompleted: updated.onboarding_completed,
          onboarding_completed: updated.onboarding_completed,
          created_at: updated.created_at,
          updated_at: updated.updated_at
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
        return await actions.updatePreferences(defaultPreferences)
      } catch (error) {
        console.error('[UserModeProvider] Failed to reset to defaults:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Failed to reset preferences' })
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
      await initializeUserMode()
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