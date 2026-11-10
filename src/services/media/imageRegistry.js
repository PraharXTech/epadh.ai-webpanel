// Remembers the FULL-size version of a photo while the student is in the app.
//
// A chat message keeps only a small thumbnail (a data: URL, so it survives a reload and stays
// small enough for localStorage). The real upload needs the full image, and "Retry" after a
// failed reply must be able to send it again. This map links the thumbnail to the full Blob;
// it lives in memory only, and keeps the last few photos.
const MAX_KEPT = 8;
const full = new Map();

export const rememberImage = (key, blob) => {
  full.delete(key);
  full.set(key, blob);
  while (full.size > MAX_KEPT) {
    full.delete(full.keys().next().value);
  }
};

// The full Blob for a thumbnail, or null (after a reload, or when it was pushed out).
export const recallImage = key => full.get(key) ?? null;
