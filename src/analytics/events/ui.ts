/**
 * UI Events
 * Events related to user interface interactions (buttons, themes, links, etc.)
 */

import { track } from '../tracker'
import type {
  ButtonClickedProperties,
  ThemeChangedProperties,
  NavigationOccurredProperties,
  LinkClickedProperties,
  ShareInitiatedProperties,
} from '../types'

// ============================================
// Button Clicks
// ============================================

/**
 * Track generic button click
 */
export const buttonClicked = (properties: ButtonClickedProperties) => {
  track('button_clicked', {
    button_name: properties.button_name,
    button_label: properties.button_label,
    button_location: properties.button_location,
    element_id: properties.element_id,
    page_name: properties.page_name,
    ...properties.context,
  })
}

/**
 * Track command palette open
 */
export const commandPaletteOpened = (
  properties: Partial<ButtonClickedProperties> & {
    page_name: string
    trigger?: 'keyboard' | 'button' | 'programmatic'
  },
) => {
  track('command_palette_opened', {
    trigger: properties.trigger,
    page_name: properties.page_name,
  })
}

/**
 * Track command palette command execution
 */
export const commandPaletteCommandExecuted = (
  properties: ButtonClickedProperties & {
    command_name: string
  },
) => {
  track('command_palette_command_executed', {
    command_name: properties.command_name,
    page_name: properties.page_name,
  })
}

// ============================================
// Theme Changes
// ============================================

/**
 * Track when user changes theme preference
 */
export const themeChanged = (properties: ThemeChangedProperties) => {
  track('theme_changed', {
    theme: properties.theme,
    previous_theme: properties.previous_theme,
    page_name: properties.page_name,
  })
}

// ============================================
// Navigation
// ============================================

/**
 * Track navigation between pages
 */
export const navigationOccurred = (properties: NavigationOccurredProperties) => {
  track('navigation_occurred', {
    from_page: properties.from_page,
    to_page: properties.to_page,
    navigation_type: properties.navigation_type,
    page_name: properties.page_name,
  })
}

// ============================================
// Link Clicks
// ============================================

/**
 * Track link clicks
 */
export const linkClicked = (properties: LinkClickedProperties) => {
  track('link_clicked', {
    link_url: properties.link_url,
    link_text: properties.link_text,
    link_location: properties.link_location,
    is_external: properties.is_external ?? false,
    page_name: properties.page_name,
  })
}

/**
 * Track footer link clicks
 */
export const footerLinkClicked = (
  properties: LinkClickedProperties & {
    link_name: string
  },
) => {
  track('footer_link_clicked', {
    link_name: properties.link_name,
    link_url: properties.link_url,
    page_name: properties.page_name,
  })
}

/**
 * Track external link clicks
 */
export const externalLinkClicked = (
  properties: LinkClickedProperties & {
    domain?: string
  },
) => {
  track('external_link_clicked', {
    link_url: properties.link_url,
    domain: properties.domain,
    page_name: properties.page_name,
  })
}

// ============================================
// Share Events
// ============================================

/**
 * Track when user initiates sharing
 */
export const shareInitiated = (properties: ShareInitiatedProperties) => {
  track('share_initiated', {
    share_platform: properties.share_platform,
    content_type: properties.content_type,
    content_id: properties.content_id,
    page_name: properties.page_name,
  })
}

/**
 * Track when share completes successfully
 */
export const shareCompleted = (properties: ShareInitiatedProperties) => {
  track('share_completed', {
    share_platform: properties.share_platform,
    content_type: properties.content_type,
    content_id: properties.content_id,
    page_name: properties.page_name,
  })
}

// ============================================
// Form Interactions
// ============================================

/**
 * Track form submission
 */
export const formSubmitted = (
  properties: ButtonClickedProperties & {
    form_name: string
    form_fields: Record<string, boolean> // which fields were filled
  },
) => {
  track('form_submitted', {
    form_name: properties.form_name,
    filled_fields_count: Object.values(properties.form_fields).filter(Boolean).length,
    page_name: properties.page_name,
  })
}

/**
 * Track form field changes
 */
export const formFieldChanged = (
  properties: ButtonClickedProperties & {
    form_name: string
    field_name: string
    field_type?: string
  },
) => {
  track('form_field_changed', {
    form_name: properties.form_name,
    field_name: properties.field_name,
    field_type: properties.field_type,
    page_name: properties.page_name,
  })
}

// ============================================
// Export namespace
// ============================================

export const ui = {
  buttonClicked,
  commandPaletteOpened,
  commandPaletteCommandExecuted,
  themeChanged,
  navigationOccurred,
  linkClicked,
  footerLinkClicked,
  externalLinkClicked,
  shareInitiated,
  shareCompleted,
  formSubmitted,
  formFieldChanged,
}
