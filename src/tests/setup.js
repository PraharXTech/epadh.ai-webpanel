import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// The mobile tests were written for Jest. Vitest's `vi` has the same API for the parts
// they use (fn, spyOn, useFakeTimers), so old tests keep working while they are ported.
globalThis.jest = globalThis.vi;

// jsdom has no matchMedia; react-hot-toast reads `prefers-reduced-motion` through it.
window.matchMedia ??= query => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom has no layout engine and no observers. The components that measure things (PDF
// pages, the article reader) only need these to exist; tests that care about sizes mock the
// element properties themselves.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// A page "scrolls into view" immediately, so lazy PDF pages render in tests.
globalThis.IntersectionObserver ??= class {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.callback([{ isIntersecting: true, target: element }]);
  }
  unobserve() {}
  disconnect() {}
};
