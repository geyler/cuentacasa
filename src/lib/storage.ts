import { Transaction, RawDatabase } from '@/types';

const STORAGE_KEY = 'cuentacasa_raw_db_v1';

export const INITIAL_DB: RawDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    currency: '$',
    appName: 'Cuenta Casa',
    autoSync: true
  },
  transactions: [],
  deletedIds: []
};

// Retrieve full raw DB
export function getRawDatabase(): RawDatabase {
  if (typeof window === 'undefined') return INITIAL_DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveRawDatabase(INITIAL_DB);
      return INITIAL_DB;
    }
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : []
    };
  } catch (err) {
    console.error('Error parsing raw DB from LocalStorage:', err);
    return INITIAL_DB;
  }
}

// Save full raw DB
export function saveRawDatabase(db: RawDatabase): void {
  if (typeof window === 'undefined') return;
  db.lastUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db, null, 2));
}

// Get raw JSON string directly for viewing/editing
export function getRawDatabaseString(): string {
  const db = getRawDatabase();
  return JSON.stringify(db, null, 2);
}

// Save raw JSON string directly from editor
export function saveRawDatabaseString(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      return { success: false, error: 'El archivo JSON debe contener un arreglo "transactions".' };
    }
    saveRawDatabase(parsed);
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido al procesar JSON';
    return { success: false, error: `Sintaxis JSON inválida: ${message}` };
  }
}

// Add transaction
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
  const db = getRawDatabase();
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false
  };
  db.transactions.unshift(newTx);
  saveRawDatabase(db);
  return newTx;
}

// Update transaction
export function updateTransaction(tx: Transaction): void {
  const db = getRawDatabase();
  const index = db.transactions.findIndex(t => t.id === tx.id);
  if (index !== -1) {
    db.transactions[index] = {
      ...tx,
      updatedAt: Date.now(),
      synced: false
    };
    saveRawDatabase(db);
  }
}

// Delete transaction & clean up photo memory completely
export function deleteTransaction(id: string): void {
  const db = getRawDatabase();
  
  // Clean photo payload on deletion
  db.transactions = db.transactions.filter(t => t.id !== id);
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }
  saveRawDatabase(db);
}

// Download DB as JSON file
export function exportDatabaseFile(): void {
  const dataStr = getRawDatabaseString();
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateTag = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `cuentacasa_db_backup_${dateTag}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Resize and compress uploaded images to max 400x400 px JPEG (~20-40KB) for storage efficiency
export function fileToBase64(file: File, maxWidth = 400, maxHeight = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedBase64);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = err => reject(err);
    };
    reader.onerror = error => reject(error);
  });
}
