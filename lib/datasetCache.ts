// IndexedDB-backed dataset cache — stores up to MAX_CACHED full datasets.
// Keyed by dataset UUID. Oldest entries evicted first when the cap is reached.

const DB_NAME    = 'empyrean-datasets';
const STORE_NAME = 'datasets';
const MAX_CACHED = 15;
const DB_VERSION = 1;

interface CachedDataset {
  id:        string;
  data:      unknown;       // the full { dataset } object returned by /api/datasets/:id
  cachedAt:  number;        // Date.now() — used for LRU eviction
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function getCached(id: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        const entry = req.result as CachedDataset | undefined;
        resolve(entry ? entry.data : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

export async function setCached(id: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    // Evict oldest entries if over cap
    const all = await new Promise<CachedDataset[]>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as CachedDataset[]);
      req.onerror   = () => reject(req.error);
    });

    if (all.length >= MAX_CACHED) {
      const sorted  = all.sort((a, b) => a.cachedAt - b.cachedAt);
      const toEvict = sorted.slice(0, all.length - MAX_CACHED + 1).map(e => e.id);
      const evictTx = db.transaction(STORE_NAME, 'readwrite');
      const store   = evictTx.objectStore(STORE_NAME);
      toEvict.forEach(eid => store.delete(eid));
      await new Promise<void>((res, rej) => {
        evictTx.oncomplete = () => res();
        evictTx.onerror    = () => rej(evictTx.error);
      });
    }

    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const entry: CachedDataset = { id, data, cachedAt: Date.now() };
      const req   = tx.objectStore(STORE_NAME).put(entry);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch { /* silently skip caching on error */ }
}

export async function getCachedIds(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror   = () => reject(req.error);
    });
  } catch { return []; }
}

export async function removeCached(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx  = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  } catch {}
}
