import React from 'react'

import { ClarityProvider } from './Clarity'
import { CommandPaletteProvider } from './CommandPalette'
import { GTMProvider } from './GTM'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { UTMCapture } from './UTMCapture'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <ClarityProvider>
          <CommandPaletteProvider>
            <GTMProvider />
            <UTMCapture />
            {children}
          </CommandPaletteProvider>
        </ClarityProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
