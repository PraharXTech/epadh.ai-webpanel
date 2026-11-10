// Storage engine for redux-persist: an async wrapper over localStorage (the web stand-in
// for the mobile AsyncStorage).
//
// Why not `import storage from 'redux-persist/lib/storage'`? That file is CommonJS. Under
// Vite's browser dev server the default import arrives as the module wrapper, not the
// storage object, so `storage.getItem is not a function` crashes the app on load (while the
// same import works in Vitest, which hides the bug). Writing the three methods ourselves
// removes the interop question.
//
// If localStorage is unavailable (blocked, private mode) it falls back to memory: the app
// works, saved data just does not survive a reload.
const memory = new Map();

const read = key => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
};

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
};

const remove = key => {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // nothing to remove from
  }
};

const persistStorage = {
  getItem: key => Promise.resolve(read(key)),
  setItem: (key, value) => {
    write(key, value);
    return Promise.resolve();
  },
  removeItem: key => {
    remove(key);
    return Promise.resolve();
  },
};

export default persistStorage;
