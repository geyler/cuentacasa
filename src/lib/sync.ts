import { getRawDatabase, saveRawDatabase } from './storage';
import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount, RawDatabase } from '@/types';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSync?: string;
}

export function getPendingSyncCount(): number {
  const db = getRawDatabase();
  const pendingTxs = db.transactions.filter(t => !t.synced).length;
  const pendingDeletes = (db.deletedIds || []).length;
  const pendingProductDeletes = (db.deletedProductIds || []).length;
  const pendingSupplierDeletes = (db.deletedSupplierIds || []).length;
  const pendingUserDeletes = (db.deletedUserIds || []).length;
  return pendingTxs + pendingDeletes + pendingProductDeletes + pendingSupplierDeletes + pendingUserDeletes;
}

export async function syncDatabaseWithCloud(force: boolean = false): Promise<{ success: boolean; syncedCount: number; productCount?: number; message: string }> {
  const db = getRawDatabase();
  
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: '📶 Modo 100% Offline activo. Los datos permanecen guardados localmente.'
    };
  }

  const pendingCount = getPendingSyncCount();
  const lastSyncTime = db.lastSync ? new Date(db.lastSync).getTime() : 0;
  const timeSinceLastSync = Date.now() - lastSyncTime;

  // Optimize Vercel traffic: skip request if no pending changes and synced < 5 mins ago (unless forced)
  if (!force && pendingCount === 0 && timeSinceLastSync < 5 * 60 * 1000) {
    return {
      success: true,
      syncedCount: db.transactions.length,
      productCount: (db.storeProducts || []).length,
      message: 'La base de datos está al día.'
    };
  }

  // 4s AbortController timeout to prevent UI freezes on slow/unstable networks
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        transactions: db.transactions,
        deletedIds: db.deletedIds || [],
        storeProducts: db.storeProducts || [],
        deletedProductIds: db.deletedProductIds || [],
        storeSales: db.storeSales || [],
        supplierAccounts: db.supplierAccounts || [],
        deletedSupplierIds: db.deletedSupplierIds || [],
        users: db.users || [],
        deletedUserIds: db.deletedUserIds || [],
        storeFund: db.storeFund !== undefined ? db.storeFund : 0,
        savingsFund: db.savingsFund !== undefined ? db.savingsFund : 0,
        settings: db.settings || {}
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.transactions)) {
      const mergedTransactions: Transaction[] = data.transactions.map((t: Transaction) => ({
        ...t,
        synced: true
      }));

      const mergedProducts: StoreProduct[] = Array.isArray(data.storeProducts) 
        ? data.storeProducts 
        : (db.storeProducts || []);

      const mergedSales: StoreSaleRecord[] = Array.isArray(data.storeSales)
        ? data.storeSales
        : (db.storeSales || []);

      const mergedSuppliers: SupplierAccount[] = Array.isArray(data.supplierAccounts)
        ? data.supplierAccounts
        : (db.supplierAccounts || []);

      const mergedUsers = Array.isArray(data.users) && data.users.length > 0
        ? data.users
        : (db.users || []);

      const updatedDb: RawDatabase = {
        ...db,
        transactions: mergedTransactions,
        storeProducts: mergedProducts,
        storeSales: mergedSales,
        supplierAccounts: mergedSuppliers,
        users: mergedUsers,
        storeFund: data.storeFund !== undefined ? data.storeFund : (db.storeFund || 0),
        savingsFund: data.savingsFund !== undefined ? data.savingsFund : (db.savingsFund || 0),
        settings: {
          ...db.settings,
          ...(data.settings || {})
        },
        deletedIds: [],
        deletedProductIds: [],
        deletedSupplierIds: [],
        deletedUserIds: [],
        lastSync: new Date().toISOString()
      };

      saveRawDatabase(updatedDb);

      return {
        success: true,
        syncedCount: mergedTransactions.length,
        productCount: mergedProducts.length,
        message: `Sincronización exitosa. ${mergedTransactions.length} movimientos y ${mergedProducts.length} productos unificados.`
      };
    } else {
      throw new Error(data.message || 'Respuesta inválida del servidor');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Conexión inestable o sin internet, trabajando offline:', error);
    return {
      success: false,
      syncedCount: 0,
      productCount: 0,
      message: '📶 Operando en modo offline. Los cambios permanecen guardados en este dispositivo.'
    };
  }
}

