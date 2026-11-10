import fs from 'node:fs';
import path from 'node:path';
import persistStorage from '@/services/storage/persistStorage';

describe('persistStorage (redux-persist engine)', () => {
  it('has the three async methods redux-persist calls', async () => {
    expect(typeof persistStorage.getItem).toBe('function');
    expect(typeof persistStorage.setItem).toBe('function');
    expect(typeof persistStorage.removeItem).toBe('function');
    expect(persistStorage.getItem('x')).toBeInstanceOf(Promise);
  });

  it('round-trips a value through localStorage and removes it', async () => {
    await persistStorage.setItem('persist:k', '{"a":1}');
    expect(window.localStorage.getItem('persist:k')).toBe('{"a":1}');
    expect(await persistStorage.getItem('persist:k')).toBe('{"a":1}');
    await persistStorage.removeItem('persist:k');
    expect(await persistStorage.getItem('persist:k')).toBeNull();
  });

  it('falls back to memory when localStorage is blocked', async () => {
    const blocked = () => {
      throw new Error('SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    await persistStorage.setItem('k', 'v');
    expect(await persistStorage.getItem('k')).toBe('v');
    await persistStorage.removeItem('k');
    expect(await persistStorage.getItem('k')).toBeNull();
    vi.restoreAllMocks();
  });
});

// Regression guard for the blank-page bug: `redux-persist/lib/storage` is CommonJS and its
// default import breaks in the browser dev server (but not in Vitest), so nothing may
// import it. Import `@/services/storage/persistStorage` instead.
describe('no CommonJS storage import', () => {
  it('no source file imports redux-persist/lib/storage', () => {
    const root = path.resolve(import.meta.dirname, '../..');
    const offenders = [];
    const walk = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (
          /\.(js|jsx)$/.test(entry.name) &&
          !full.endsWith('persistStorage.test.js')
        ) {
          // comment lines may mention the import (persistStorage.js explains why not)
          const text = fs
            .readFileSync(full, 'utf8')
            .split('\n')
            .filter(line => !line.trim().startsWith('//'))
            .join('\n');
          if (/from\s+['"]redux-persist\/lib\/storage/.test(text))
            offenders.push(full);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
