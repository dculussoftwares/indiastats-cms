import React from 'react'

import { ClarityProvider } from './Clarity'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <ClarityProvider>{children}</ClarityProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
