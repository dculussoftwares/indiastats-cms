/**
 * Analytics Module Validation Tests
 * Verifies that the standardized analytics system works correctly
 */

import { normalizeEventName, normalizeProperties, getPageContext, setPageContext, clearPageContext } from '../tracker'
import { trackViewed, trackClicked, trackImpression } from '../events'
import { PAGE_NAMES, BUTTON_NAMES, SHARE_PLATFORMS, SEARCH_TYPES, ERROR_SEVERITY } from '../constants'

describe('Analytics - Naming Normalization', () => {
  test('normalizeEventName: converts space-separated to snake_case', () => {
    expect(normalizeEventName('View Assembly')).toBe('view_assembly')
    expect(normalizeEventName('Search Performed')).toBe('search_performed')
    expect(normalizeEventName('Button Click')).toBe('button_click')
  })

  test('normalizeEventName: converts camelCase to snake_case', () => {
    expect(normalizeEventName('viewAssembly')).toBe('view_assembly')
    expect(normalizeEventName('searchPerformed')).toBe('search_performed')
    expect(normalizeEventName('buttonClick')).toBe('button_click')
  })

  test('normalizeEventName: handles already snake_case', () => {
    expect(normalizeEventName('view_assembly')).toBe('view_assembly')
    expect(normalizeEventName('search_performed')).toBe('search_performed')
  })
})

describe('Analytics - Property Normalization', () => {
  test('normalizeProperties: includes page context', () => {
    setPageContext({
      page_name: 'Assembly Detail',
      page_url: 'https://example.com',
    })

    const props = normalizeProperties({
      assembly_id: 'ac001',
    })

    expect(props.page_name).toBe('Assembly Detail')
    expect(props.page_url).toBe('https://example.com')
    expect(props.assembly_id).toBe('ac001')

    clearPageContext()
  })

  test('normalizeProperties: filters null/undefined values', () => {
    const props = normalizeProperties({
      value1: 'test',
      value2: null,
      value3: undefined,
      value4: 'keep',
    })

    expect(props.value1).toBe('test')
    expect(props.value2).toBeUndefined()
    expect(props.value3).toBeUndefined()
    expect(props.value4).toBe('keep')
  })
})

describe('Analytics - Page Context', () => {
  beforeEach(() => {
    clearPageContext()
  })

  test('setPageContext: stores page information', () => {
    const context = {
      page_name: 'Assembly Detail',
      page_url: 'https://example.com/assembly',
      page_path: '/assembly/ac001',
    }

    setPageContext(context)
    const stored = getPageContext()

    expect(stored.page_name).toBe('Assembly Detail')
    expect(stored.page_url).toBe('https://example.com/assembly')
    expect(stored.page_path).toBe('/assembly/ac001')
  })

  test('getPageContext: returns current context', () => {
    setPageContext({ page_name: 'Homepage' })
    expect(getPageContext().page_name).toBe('Homepage')
  })

  test('clearPageContext: removes all context', () => {
    setPageContext({ page_name: 'Assembly Detail' })
    clearPageContext()
    expect(Object.keys(getPageContext()).length).toBe(0)
  })
})

describe('Analytics - Event Functions', () => {
  test('trackViewed is a function', () => {
    expect(typeof trackViewed).toBe('function')
  })

  test('trackClicked is a function', () => {
    expect(typeof trackClicked).toBe('function')
  })

  test('trackImpression is a function', () => {
    expect(typeof trackImpression).toBe('function')
  })
})

describe('Analytics - Constants', () => {
  test('PAGE_NAMES constants are defined', () => {
    expect(PAGE_NAMES.HOMEPAGE).toBe('Homepage')
    expect(PAGE_NAMES.ASSEMBLY_DETAIL).toBe('Assembly Detail')
    expect(PAGE_NAMES.SEARCH_RESULTS).toBe('Search Results')
    expect(PAGE_NAMES.NOT_FOUND).toBe('404 Not Found')
  })

  test('BUTTON_NAMES constants are defined', () => {
    expect(BUTTON_NAMES.VIEW_ASSEMBLY).toBe('view_assembly')
    expect(BUTTON_NAMES.DOWNLOAD_QUICK_VIEW).toBe('download_quick_view')
    expect(BUTTON_NAMES.SEARCH).toBe('search')
  })

  test('SHARE_PLATFORMS constants are defined', () => {
    expect(SHARE_PLATFORMS.TWITTER).toBe('twitter')
    expect(SHARE_PLATFORMS.INSTAGRAM).toBe('instagram')
    expect(SHARE_PLATFORMS.COPY_LINK).toBe('copy_link')
  })

  test('SEARCH_TYPES constants are defined', () => {
    expect(SEARCH_TYPES.ASSEMBLY).toBe('assembly')
    expect(SEARCH_TYPES.DISTRICT).toBe('district')
    expect(SEARCH_TYPES.DIRECT).toBe('direct')
  })

  test('ERROR_SEVERITY constants are defined', () => {
    expect(ERROR_SEVERITY.LOW).toBe('low')
    expect(ERROR_SEVERITY.MEDIUM).toBe('medium')
    expect(ERROR_SEVERITY.HIGH).toBe('high')
    expect(ERROR_SEVERITY.CRITICAL).toBe('critical')
  })
})

describe('Analytics - Integration', () => {
  beforeEach(() => {
    clearPageContext()
  })

  test('complete workflow: trackViewed does not throw', () => {
    expect(() => {
      trackViewed('assembly', {
        page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
        page_url: 'https://example.com/assembly/ac001',
        page_path: '/assembly/ac001',
        assembly_id: 'ac001',
        assembly_name: 'Chennai South',
        district_name: 'Chennai',
      })
    }).not.toThrow()
  })

  test('complete workflow: trackClicked does not throw', () => {
    expect(() => {
      trackClicked('button', {
        page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
        button_name: BUTTON_NAMES.DOWNLOAD_QUICK_VIEW,
        button_label: 'Download PNG',
      })
    }).not.toThrow()

    expect(() => {
      trackClicked('search', {
        page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
        search_query: 'Chennai',
        search_type: SEARCH_TYPES.ASSEMBLY,
        results_count: 5,
      })
    }).not.toThrow()
  })

  test('complete workflow: trackImpression does not throw', () => {
    expect(() => {
      trackImpression('search_results', {
        page_name: PAGE_NAMES.SEARCH_RESULTS,
        search_query: 'Chennai',
        results_count: 5,
      })
    }).not.toThrow()
  })
})

describe('Analytics - Export Validation', () => {
  test('all event functions are callable', () => {
    const eventFunctions = [trackViewed, trackClicked, trackImpression]
    eventFunctions.forEach((fn) => {
      expect(typeof fn).toBe('function')
    })
  })

  test('constants are objects with string values', () => {
    const constants = [PAGE_NAMES, BUTTON_NAMES, SHARE_PLATFORMS, SEARCH_TYPES, ERROR_SEVERITY]

    constants.forEach((constant) => {
      expect(typeof constant).toBe('object')
      Object.values(constant).forEach((value) => {
        expect(typeof value).toBe('string')
      })
    })
  })
})
