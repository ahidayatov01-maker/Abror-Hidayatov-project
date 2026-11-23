const DB_NAME = 'gui_research_library_blobs_v1';
const STORE_NAME = 'material_blobs';
const DB_VERSION = 1;

export interface StoredMaterialBlob {
  materialId: string;
  mimeType: string;
  fileName: string;
  blob: Blob;
  previewDataUrl?: string;
  updatedAt: string;
}

function openBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in this browser environment.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'materialId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB.'));
  });
}

export async function saveMaterialBlob(record: StoredMaterialBlob): Promise<void> {
  try {
    const db = await openBlobDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to save binary blob.'));
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB saveMaterialBlob warning:', err);
  }
}

export async function getMaterialBlob(materialId: string): Promise<StoredMaterialBlob | null> {
  try {
    const db = await openBlobDb();
    const record = await new Promise<StoredMaterialBlob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(materialId);
      req.onsuccess = () => resolve((req.result as StoredMaterialBlob | undefined) ?? null);
      req.onerror = () => reject(req.error || new Error('Failed to load binary blob.'));
    });
    db.close();
    return record;
  } catch {
    return null;
  }
}

export async function deleteMaterialBlob(materialId: string): Promise<void> {
  try {
    const db = await openBlobDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(materialId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Failed to delete binary blob.'));
    });
    db.close();
  } catch {
    // ignore cleanup failures
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export async function getMaterialBlobAsBase64(
  materialId: string
): Promise<{ base64: string; mimeType: string } | null> {
  const rec = await getMaterialBlob(materialId);
  if (!rec) return null;
  // Cap at ~11MB raw binary (~15MB base64) so JSON body stays comfortably under 16MB server cap
  if (rec.blob.size > 11 * 1024 * 1024) {
    return null;
  }
  const base64 = await blobToBase64(rec.blob);
  return { base64, mimeType: rec.mimeType };
}
