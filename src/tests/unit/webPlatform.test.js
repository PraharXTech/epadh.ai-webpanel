import { clearTokens, loadTokens, saveTokens } from '@/services/storage/secureStorage'
import { __setOnlineForTests, isOnline, subscribeNetwork } from '@/services/network/network'
import { ensureOnline } from '@/services/network/ensureOnline'
import { setAlertListener } from '@/services/alerts/alertStore'
import { API_BASE_URL, USE_MOCK_API } from '@/config/env'
import { PATHS, PATTERNS } from '@/routes/routePaths'

describe('secureStorage (web)', () => {
  afterEach(() => clearTokens())

  it('keeps the access token in memory and the refresh token in localStorage', async () => {
    await saveTokens({ accessToken: 'a1', refreshToken: 'r1' })
    expect(await loadTokens()).toEqual({ accessToken: 'a1', refreshToken: 'r1' })
    expect(window.localStorage.getItem('epadhai.refresh')).toBe('r1')
    expect(JSON.stringify({ ...window.localStorage })).not.toContain('a1')
  })

  it('after a reload only the refresh token is left', async () => {
    window.localStorage.setItem('epadhai.refresh', 'r9')
    expect(await loadTokens()).toEqual({ accessToken: null, refreshToken: 'r9' })
  })

  it('returns null when nothing is stored and after clearing', async () => {
    expect(await loadTokens()).toBeNull()
    await saveTokens({ accessToken: 'a', refreshToken: 'r' })
    await clearTokens()
    expect(await loadTokens()).toBeNull()
    expect(window.localStorage.getItem('epadhai.refresh')).toBeNull()
  })
})

describe('network (web)', () => {
  afterEach(() => {
    __setOnlineForTests(true)
    setAlertListener(null)
  })

  it('notifies subscribers when the state flips', () => {
    const seen = []
    const off = subscribeNetwork(v => seen.push(v))
    __setOnlineForTests(false)
    __setOnlineForTests(true)
    off()
    __setOnlineForTests(false)
    expect(seen).toEqual([false, true])
    expect(isOnline()).toBe(false)
  })

  it('ensureOnline passes online and warns offline', () => {
    const alerts = []
    setAlertListener(a => alerts.push(a))
    expect(ensureOnline('ai')).toBe(true)
    __setOnlineForTests(false)
    expect(ensureOnline('ai')).toBe(false)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toMatch(/offline/i)
  })
})

describe('config and routes', () => {
  it('reads env from Vite', () => {
    expect(API_BASE_URL).toMatch(/^https?:\/\//)
    expect(typeof USE_MOCK_API).toBe('boolean')
  })

  it('path builders match their route patterns', () => {
    const fill = (pattern, params) =>
      pattern.replace(/:(\w+)/g, (_, k) => params[k])
    expect(PATHS.topic('t1')).toBe(fill(PATTERNS.topic, { topicId: 't1' }))
    expect(PATHS.chapter('e', 's', 'c')).toBe(
      fill(PATTERNS.chapter, { examId: 'e', subjectId: 's', chapterId: 'c' }),
    )
    expect(PATHS.checkout('p')).toBe(fill(PATTERNS.checkout, { planId: 'p' }))
    expect(PATHS.omrResult('x')).toBe(fill(PATTERNS.omrResult, { scanId: 'x' }))
  })
})
