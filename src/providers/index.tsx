import React from 'react'

import { ClarityProvider } from './Clarity'
import { CommandPaletteProvider } from './CommandPalette'
import { GTMProvider } from './GTM'
import { HeaderThemeProvider } from './HeaderTheme'
import { OpenPanelProvider } from './OpenPanel'
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
            <OpenPanelProvider />
            <UTMCapture />
            {children}
          </CommandPaletteProvider>
        </ClarityProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
