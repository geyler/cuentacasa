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
  transactions: [
    {
      id: 'tx-101',
      type: 'ingreso',
      concept: 'Pago por desarrollo de webs',
      category: 'Trabajo / Webs',
      amount: 45000,
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      notes: 'Pago cliente proyecto web corporativa',
      createdAt: Date.now() - 2 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
      synced: true
    },
    {
      id: 'tx-102',
      type: 'gasto',
      concept: 'Bulto de comida (Arroz, Frijoles, Aceite)',
      category: 'Comida',
      amount: 18500,
      date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      notes: 'Compra mayorista para la casa',
      createdAt: Date.now() - 1 * 86400000,
      updatedAt: Date.now() - 1 * 86400000,
      synced: true
    },
    {
      id: 'tx-103',
      type: 'gasto',
      concept: 'Compra de Pan (5 barras) y Azúcar (3 lb)',
      category: 'Comida',
      amount: 1400,
      date: new Date().toISOString().split('T')[0],
      notes: 'Desayunos de la semana',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false
    },
    {
      id: 'tx-104',
      type: 'ingreso',
      concept: 'Pago por venta de laptop usada',
      category: 'Venta de Artículos',
      amount: 28000,
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      notes: 'Venta laptop Dell en revolico',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
      synced: true
    },
    {
      id: 'tx-105',
      type: 'gasto',
      concept: 'Hamburguesas y refrescos en familia',
      category: 'Comida',
      amount: 3200,
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      notes: 'Salida de domingo',
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 3 * 86400000,
      synced: true
    }
  ]
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
    return JSON.parse(raw);
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

// Delete transaction
export function deleteTransaction(id: string): void {
  const db = getRawDatabase();
  db.transactions = db.transactions.filter(t => t.id !== id);
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

// Convert image File to base64 Data URI for offline storage
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
