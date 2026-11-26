import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type OpStub = ((...args: unknown[]) => void) & { q?: unknown[][] }
const win = () => window as unknown as { op?: OpStub }

const load = async (env: { clientId?: string; nodeEnv?: string }) => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_OPENPANEL_CLIENT_ID', env.clientId ?? '')
  vi.stubEnv('NODE_ENV', env.nodeEnv ?? 'production')
  return import('@/analytics/providers/openpanel')
}

describe('OpenPanel analytics provider', () => {
  beforeEach(() => {
    delete win().op
    Object.defineProperty(window.navigator, 'doNotTrack', { value: null, configurable: true })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is disabled and a no-op without a client id', async () => {
    const m = await load({})
    expect(m.isOpenPanelEnabled()).toBe(false)
    m.openPanelProvider.track('assembly_viewed', { assembly_id: 'ac001' })
    expect(win().op).toBeUndefined()
  })

  it('is disabled outside production', async () => {
    const m = await load({ clientId: 'abc', nodeEnv: 'development' })
    expect(m.isOpenPanelEnabled()).toBe(false)
  })

  it('queues events with init first and same name/properties', async () => {
    const m = await load({ clientId: 'abc' })
    expect(m.isOpenPanelEnabled()).toBe(true)
    m.openPanelProvider.track('assembly_viewed', { assembly_id: 'ac001', page_name: 'Assembly Detail' })
    const q = win().op!.q!
    expect(q[0]?.[0]).toBe('init')
    expect(q[0]?.[1]).toMatchObject({
      clientId: 'abc',
      apiUrl: '/_e',
      trackScreenViews: true,
      trackAttributes: false,
    })
    expect(q[1]).toEqual(['track', 'assembly_viewed', { assembly_id: 'ac001', page_name: 'Assembly Detail' }])
  })

  it('respects Do Not Track', async () => {
    Object.defineProperty(window.navigator, 'doNotTrack', { value: '1', configurable: true })
    const m = await load({ clientId: 'abc' })
    m.openPanelProvider.track('assembly_viewed', {})
    expect(win().op).toBeUndefined()
  })

  it('filter source agrees with openPanelAllowed', async () => {
    const m = await load({ clientId: 'abc' })
    const filter = new Function(`return (${m.OPENPANEL_DNT_FILTER})`)() as () => boolean
    expect(filter()).toBe(true)
    Object.defineProperty(window.navigator, 'doNotTrack', { value: '1', configurable: true })
    expect(filter()).toBe(false)
    expect(m.openPanelAllowed()).toBe(false)
  })
})
