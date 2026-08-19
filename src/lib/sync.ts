import { getRawDatabase, saveRawDatabase } from './storage';
import { Transaction, RawDatabase } from '@/types';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSync?: string;
}

export function getPendingSyncCount(): number {
  const db = getRawDatabase();
  const pendingTxs = db.transactions.filter(t => !t.synced).length;
  const pendingDeletes = (db.deletedIds || []).length;
  return pendingTxs + pendingDeletes;
}

export async function syncDatabaseWithCloud(): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const db = getRawDatabase();
  
  if (!navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Sin conexión a internet. Los datos permanecerán guardados localmente.'
    };
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        transactions: db.transactions,
        deletedIds: db.deletedIds || []
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      const mergedTransactions: Transaction[] = data.transactions.map((t: Transaction) => ({
        ...t,
        synced: true
      }));

      const updatedDb: RawDatabase = {
        ...db,
        transactions: mergedTransactions,
        deletedIds: [], // Cleared deletedIds after successful server sync
        lastSync: new Date().toISOString()
      };

      saveRawDatabase(updatedDb);

      return {
        success: true,
        syncedCount: mergedTransactions.length,
        message: `Sincronización exitosa con la base de datos (${data.storage || 'Cloud'}). ${mergedTransactions.length} registros actualizados.`
      };
    } else {
      throw new Error(data.message || 'Error en respuesta del servidor');
    }
  } catch (error) {
    console.error('Error sincronizando con la base de datos:', error);
    return {
      success: false,
      syncedCount: 0,
      message: 'No se pudo contactar al servidor de base de datos.'
    };
  }
}
