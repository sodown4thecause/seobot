'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { ActionItem, ActionStatus, ActionFeedback } from '@/types/actions'

interface ActionContextType {
    actions: ActionItem[]
    pendingActions: ActionItem[]
    completedActions: ActionItem[]
    setActions: (actions: ActionItem[]) => void
    addAction: (action: ActionItem) => void
    updateActionStatus: (actionId: string, status: ActionStatus, notes?: string) => void
    completeAction: (actionId: string, feedback?: ActionFeedback) => void
    removeAction: (actionId: string) => void
}

const ActionContext = createContext<ActionContextType | undefined>(undefined)

interface ActionProviderProps {
    children: ReactNode
}

export function ActionProvider({ children }: ActionProviderProps) {
    const [actions, setActionsState] = useState<ActionItem[]>([])

    const setActions = useCallback((newActions: ActionItem[]) => {
        setActionsState(newActions)
    }, [])

    const addAction = useCallback((action: ActionItem) => {
        setActionsState(prev => [...prev, action])
    }, [])

    const updateActionStatus = useCallback((actionId: string, status: ActionStatus, notes?: string) => {
        setActionsState(prev =>
            prev.map(action =>
                action.id === actionId
                    ? { ...action, status, notes: notes || action.notes, updatedAt: new Date() }
                    : action
            )
        )
    }, [])

    const completeAction = useCallback((actionId: string, feedback?: ActionFeedback) => {
        setActionsState(prev =>
            prev.map(action =>
                action.id === actionId
                    ? {
                        ...action,
                        status: 'completed' as ActionStatus,
                        completedAt: new Date(),
                        updatedAt: new Date(),
                        feedback
                    }
                    : action
            )
        )
    }, [])

    const removeAction = useCallback((actionId: string) => {
        setActionsState(prev => prev.filter(action => action.id !== actionId))
    }, [])

    const pendingActions = actions.filter(a => a.status === 'pending' || a.status === 'in_progress')
    const completedActions = actions.filter(a => a.status === 'completed')

    return (
        <ActionContext.Provider value={{
            actions,
            pendingActions,
            completedActions,
            setActions,
            addAction,
            updateActionStatus,
            completeAction,
            removeAction,
        }}>
            {children}
        </ActionContext.Provider>
    )
}

export function useActions() {
    const context = useContext(ActionContext)
    if (context === undefined) {
        throw new Error('useActions must be used within an ActionProvider')
    }
    return context
}
