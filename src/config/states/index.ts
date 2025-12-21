/**
 * State Registry
 * Central registry for all state configurations
 */

import { StateConfig } from './types'
import { tamilNaduConfig } from './tamil-nadu'

// Registry of all state configurations
const stateRegistry: Map<string, StateConfig> = new Map()

// Register Tamil Nadu
stateRegistry.set('TN', tamilNaduConfig)
stateRegistry.set('tamil-nadu', tamilNaduConfig)

/**
 * Get state config by state code (e.g., "TN")
 */
export function getStateByCode(code: string): StateConfig | undefined {
    return stateRegistry.get(code.toUpperCase())
}

/**
 * Get state config by URL slug (e.g., "tamil-nadu")
 */
export function getStateBySlug(slug: string): StateConfig | undefined {
    return stateRegistry.get(slug.toLowerCase())
}

/**
 * Get all registered state configs
 */
export function getAllStates(): StateConfig[] {
    // Get unique states (avoid duplicates from code/slug mapping)
    const seen = new Set<string>()
    const states: StateConfig[] = []

    stateRegistry.forEach((config) => {
        if (!seen.has(config.code)) {
            seen.add(config.code)
            states.push(config)
        }
    })

    return states
}

/**
 * Get party color for a specific state
 */
export function getPartyColor(stateCode: string, partyCode: string): string {
    const config = getStateByCode(stateCode)
    if (config?.partyColors[partyCode]) {
        return config.partyColors[partyCode]
    }
    // Default gray for unknown parties
    return '#808080'
}

/**
 * Get leader image for a party in a specific state
 */
export function getLeaderImage(stateCode: string, partyCode: string): string | null {
    const config = getStateByCode(stateCode)
    return config?.leaderImages[partyCode] || null
}

/**
 * Get bloc configuration for a state
 */
export function getBlocs(stateCode: string) {
    const config = getStateByCode(stateCode)
    return config?.blocs || []
}

// Export types
export * from './types'
export { tamilNaduConfig }
