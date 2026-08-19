import { getRawDatabase, saveRawDatabase } from './storage';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  isSyncing: boolean;
}

export function getPendingSyncCount(): number {
  const db = getRawDatabase();
  return db.transactions.filter(t => !t.synced).length;
}

export async function syncDatabaseWithCloud(): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const db = getRawDatabase();
  const pending = db.transactions.filter(t => !t.synced);
  
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, message: 'Todos los datos ya están alineados con la nube.' };
  }

  // Simulate cloud sync HTTP push/pull
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Mark all pending transactions as synced
  db.transactions = db.transactions.map(t => ({
    ...t,
    synced: true
  }));
  
  saveRawDatabase(db);

  return {
    success: true,
    syncedCount: pending.length,
    message: `¡Se alinearon ${pending.length} registros exitosamente con la nube!`
  };
}
