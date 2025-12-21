'use client'

import React, { createContext, useContext } from 'react'
import { StateConfig } from '@/config/states/types'

interface StateContextValue {
  state: StateConfig
}

const StateContext = createContext<StateContextValue | null>(null)

export function StateProvider({
  state,
  children,
}: {
  state: StateConfig
  children: React.ReactNode
}) {
  return <StateContext.Provider value={{ state }}>{children}</StateContext.Provider>
}

export function useStateConfig(): StateConfig {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useStateConfig must be used within a StateProvider')
  }
  return context.state
}

export function useOptionalStateConfig(): StateConfig | null {
  const context = useContext(StateContext)
  return context?.state || null
}
