import { getRawDatabase, saveRawDatabase } from './storage';
import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount, AppUser, RawDatabase } from '@/types';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSync?: string;
}

export interface PendingSyncDetailItem {
  id: string;
  type: 'transaction' | 'delete_transaction' | 'product_delete' | 'supplier_delete' | 'user_delete' | 'user_update';
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  date?: string;
}

export function getPendingSyncDetails(): {
  totalCount: number;
  items: PendingSyncDetailItem[];
} {
  const db = getRawDatabase();
  const items: PendingSyncDetailItem[] = [];
  const lastSyncTime = db.lastSync ? new Date(db.lastSync).getTime() : 0;

  // 1. Unsynced transactions
  const unsyncedTxs = (db.transactions || []).filter(t => !t.synced);
  unsyncedTxs.forEach(t => {
    const isIngreso = t.type === 'ingreso';
    items.push({
      id: t.id,
      type: 'transaction',
      title: `${isIngreso ? '🟢 Ingreso' : '🔴 Gasto'}: ${t.concept}`,
      subtitle: `$${t.amount.toLocaleString()} • ${t.date} (${t.accountSource || 'casa'})`,
      badgeText: isIngreso ? 'Ingreso Pendiente' : 'Gasto Pendiente',
      badgeColor: isIngreso ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)',
      date: t.date
    });
  });

  // 2. Unsynced / modified users
  const unsyncedUsers = (db.users || []).filter(u => (u.updatedAt || 0) > lastSyncTime);
  unsyncedUsers.forEach(u => {
    items.push({
      id: u.id,
      type: 'user_update',
      title: `Usuario: ${u.name}`,
      subtitle: `@${u.username} (${u.role}) • Pendiente de sincronizar`,
      badgeText: 'Usuario Modificado',
      badgeColor: '#8B5CF6'
    });
  });

  // 3. Deleted transactions pending cloud removal
  (db.deletedIds || []).forEach(id => {
    items.push({
      id,
      type: 'delete_transaction',
      title: `Eliminar Transacción`,
      subtitle: `ID: ${id} • Pendiente de borrar en servidor`,
      badgeText: 'Borrado Transacción',
      badgeColor: '#DC2626'
    });
  });

  // 4. Deleted products pending cloud removal
  (db.deletedProductIds || []).forEach(id => {
    items.push({
      id,
      type: 'product_delete',
      title: `Eliminar Producto`,
      subtitle: `ID: ${id} • Pendiente de borrar en servidor`,
      badgeText: 'Borrado Producto',
      badgeColor: '#E11D48'
    });
  });

  // 5. Deleted suppliers pending cloud removal
  (db.deletedSupplierIds || []).forEach(id => {
    items.push({
      id,
      type: 'supplier_delete',
      title: `Eliminar Proveedor`,
      subtitle: `ID: ${id} • Pendiente de borrar en servidor`,
      badgeText: 'Borrado Proveedor',
      badgeColor: '#D97706'
    });
  });

  // 6. Deleted users pending cloud removal
  (db.deletedUserIds || []).forEach(id => {
    items.push({
      id,
      type: 'user_delete',
      title: `Eliminar Usuario`,
      subtitle: `ID: ${id} • Pendiente de borrar en servidor`,
      badgeText: 'Borrado Usuario',
      badgeColor: '#9333EA'
    });
  });

  return {
    totalCount: items.length,
    items
  };
}

export function getPendingSyncCount(): number {
  return getPendingSyncDetails().totalCount;
}

let lastSyncFailedTime = 0;

export async function syncDatabaseWithCloud(force: boolean = false): Promise<{ success: boolean; syncedCount: number; productCount?: number; message: string }> {
  const db = getRawDatabase();
  
  if (typeof window !== 'undefined' && !navigator.onLine && !force) {
    return {
      success: false,
      syncedCount: 0,
      message: '📶 Modo 100% Offline activo. Los datos permanecen guardados localmente.'
    };
  }

  // Force sync resets failure timestamp so manual retry always attempts connection
  if (force) {
    lastSyncFailedTime = 0;
  } else if (Date.now() - lastSyncFailedTime < 3 * 60 * 1000) {
    return {
      success: false,
      syncedCount: 0,
      message: '📶 Conexión inestable detectada previamente. Operando en modo local.'
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

  // 30s timeout for manual forced syncs on slow/unstable mobile networks, 6s for background polls
  const timeoutMs = force ? 30000 : 6000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        clientLastSync: lastSyncTime,
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
      lastSyncFailedTime = 0; // Reset failure timestamp on success

      const serverDeletedIds: string[] = Array.isArray(data.deletedIds) ? data.deletedIds : [];
      const serverDeletedProductIds: string[] = Array.isArray(data.deletedProductIds) ? data.deletedProductIds : [];
      const serverDeletedSupplierIds: string[] = Array.isArray(data.deletedSupplierIds) ? data.deletedSupplierIds : [];
      const serverDeletedUserIds: string[] = Array.isArray(data.deletedUserIds) ? data.deletedUserIds : [];

      const rawMergedTxs: Transaction[] = data.transactions.map((t: Transaction) => ({
        ...t,
        synced: true
      }));

      const rawMergedProducts: StoreProduct[] = Array.isArray(data.storeProducts) 
        ? data.storeProducts 
        : (db.storeProducts || []);

      const mergedSales: StoreSaleRecord[] = Array.isArray(data.storeSales)
        ? data.storeSales
        : (db.storeSales || []);

      const rawMergedSuppliers: SupplierAccount[] = Array.isArray(data.supplierAccounts)
        ? data.supplierAccounts
        : (db.supplierAccounts || []);

      const rawMergedUsers: AppUser[] = Array.isArray(data.users)
        ? data.users
        : (db.users || []);

      // Filter out any tombstone deleted items
      const mergedTransactions = rawMergedTxs.filter(t => !serverDeletedIds.includes(t.id));
      const mergedProducts = rawMergedProducts.filter(p => !serverDeletedProductIds.includes(p.id));
      const mergedSuppliers = rawMergedSuppliers.filter(s => !serverDeletedSupplierIds.includes(s.id));
      const mergedUsers = rawMergedUsers.filter(u => !serverDeletedUserIds.includes(u.id));

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
        message: `Sincronización exitosa. ${mergedTransactions.length} movimientos y ${mergedProducts.length} productos unificados con el servidor.`
      };
    } else {
      throw new Error(data.message || 'Respuesta inválida del servidor');
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    lastSyncFailedTime = Date.now(); // Mark network error/timeout timestamp
    const isAbort = error?.name === 'AbortError';
    console.warn('Conexión inestable o sin internet, trabajando offline:', error);
    return {
      success: false,
      syncedCount: 0,
      productCount: 0,
      message: isAbort 
        ? '⏳ Tiempo de espera agotado debido a conexión muy lenta. Reintenta con "Subir Pendientes Manualmente".'
        : '📶 Operando en modo offline. Los cambios permanecen guardados en este dispositivo.'
    };
  }
}



