import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// The mobile tests were written for Jest. Vitest's `vi` has the same API for the parts
// they use (fn, spyOn, useFakeTimers), so old tests keep working while they are ported.
globalThis.jest = globalThis.vi

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
