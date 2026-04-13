'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CommandPalette } from '@/components/CommandPalette'
import { trackClicked, getPageContext } from '@/analytics'

interface CommandPaletteContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export const useCommandPalette = () => useContext(CommandPaletteContext)

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
    const pageContext = getPageContext()
    trackClicked({ name: 'command_palette',
      page_name: pageContext.page_name || 'Unknown',
      trigger: 'programmatic',
    })
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        const pageContext = getPageContext()
        trackClicked({ name: 'command_palette',
          page_name: pageContext.page_name || 'Unknown',
          trigger: 'keyboard',
        })
      }
      return !prev
    })
  }, [])

  // Global keyboard listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} />
    </CommandPaletteContext.Provider>
  )
}
