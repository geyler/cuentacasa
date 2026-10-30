import { getRawDatabase, saveRawDatabase, applyGlobalSettingsAndBroadcast, getAppNamespace } from './storage';
import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount, AppUser, StoreShiftRecord, CustomerDebtRecord, RawDatabase } from '@/types';
import { applyBrandPaletteToDocument, normalizeHexColor } from './themePalette';
import { formatRecordDateTime } from './dateUtils';

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSync?: string;
}

export interface PendingSyncDetailItem {
  id: string;
  type: 'transaction' | 'delete_transaction' | 'product_delete' | 'supplier_delete' | 'user_delete' | 'user_update' | 'product_update' | 'sale' | 'shift' | 'supplier_update' | 'debt_update' | 'debt_delete' | 'settings_update' | 'reset_db';
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

  // 0. Pending Full Database Reset
  if (db.pendingReset) {
    items.push({
      id: 'pending-reset-db',
      type: 'reset_db',
      title: 'Reinicio de Base de Datos Programado',
      subtitle: 'Se limpiará el historial antiguo en la nube y se conservarán tus nuevos movimientos',
      badgeText: 'Reinicio Pendiente',
      badgeColor: '#DC2626'
    });
  }

  // 1. Unsynced transactions
  const unsyncedTxs = (db.transactions || []).filter(t => !t.synced);
  unsyncedTxs.forEach(t => {
    const isIngreso = t.type === 'ingreso';
    items.push({
      id: t.id,
      type: 'transaction',
      title: `${isIngreso ? 'Ingreso' : 'Gasto'}: ${t.concept}`,
      subtitle: `$${t.amount.toLocaleString()} • ${formatRecordDateTime(t.createdAt, t.date)} (${t.accountSource || 'casa'})`,
      badgeText: isIngreso ? 'Ingreso Pendiente' : 'Gasto Pendiente',
      badgeColor: isIngreso ? '#047857' : '#B91C1C',
      date: t.date
    });
  });

  // 2. Unsynced / modified products
  const unsyncedProducts = (db.storeProducts || []).filter(p => (p.updatedAt || p.createdAt || 0) > lastSyncTime);
  unsyncedProducts.forEach(p => {
    items.push({
      id: p.id,
      type: 'product_update',
      title: `Producto: ${p.name}`,
      subtitle: `Precio: $${p.price} ${p.currency || 'CUP'} • Stock: ${p.stock}u • Code: ${p.barcode}`,
      badgeText: 'Producto',
      badgeColor: '#1D4ED8'
    });
  });

  // 3. Unsynced / new sales
  const unsyncedSales = (db.storeSales || []).filter(s => (s.timestamp || 0) > lastSyncTime);
  unsyncedSales.forEach(s => {
    items.push({
      id: s.id,
      type: 'sale',
      title: `Venta POS: Ticket #${s.id.slice(-6)}`,
      subtitle: `Total: $${s.totalAmount} ${s.currency || 'CUP'} • ${s.items.length} artículos`,
      badgeText: 'Venta',
      badgeColor: '#059669'
    });
  });

  // 4. Unsynced / modified shifts & arqueos
  const unsyncedShifts = (db.shifts || []).filter(s => (s.closedAt || s.openedAt || 0) > lastSyncTime);
  unsyncedShifts.forEach(s => {
    items.push({
      id: s.id,
      type: 'shift',
      title: `Turno de Caja: ${s.sellerName}`,
      subtitle: `Estado: ${s.status.toUpperCase()} • Fondo Inicial: $${s.initialCashFund}`,
      badgeText: s.status === 'activo' ? 'Turno Activo' : 'Turno Cerrado',
      badgeColor: '#475569'
    });
  });

  // 5. Unsynced / modified suppliers
  const unsyncedSuppliers = (db.supplierAccounts || []).filter(sup => (sup.updatedAt || 0) > lastSyncTime);
  unsyncedSuppliers.forEach(sup => {
    const usdPart = sup.pendingPayoutUSD ? ` (+ $${sup.pendingPayoutUSD} USD)` : '';
    items.push({
      id: sup.id,
      type: 'supplier_update',
      title: `Proveedor: ${sup.name}`,
      subtitle: `Pendiente pago: $${sup.pendingPayout} CUP${usdPart} | Total pagado: $${sup.totalPaid} CUP`,
      badgeText: 'Proveedor',
      badgeColor: '#B45309'
    });
  });

  // 6. Unsynced / modified app users
  const unsyncedUsers = (db.users || []).filter(u => (u.updatedAt || 0) > lastSyncTime);
  unsyncedUsers.forEach(u => {
    items.push({
      id: u.id,
      type: 'user_update',
      title: `Usuario: ${u.name}`,
      subtitle: `@${u.username} (${u.role}) • Pendiente de sincronizar`,
      badgeText: 'Usuario',
      badgeColor: '#475569'
    });
  });

  // 6.5 Unsynced / modified customer debts (fiados)
  const unsyncedDebts = (db.customerDebts || []).filter(d => (d.updatedAt || d.timestamp || 0) > lastSyncTime);
  unsyncedDebts.forEach(d => {
    items.push({
      id: d.id,
      type: 'debt_update',
      title: `Fiado: ${d.customerName}`,
      subtitle: `Pendiente: $${Math.max(0, d.amountCUP - (d.paidCUP || 0))} CUP • Estado: ${d.status.toUpperCase()}`,
      badgeText: 'Fiado',
      badgeColor: '#D97706'
    });
  });

  // 7. System Settings Changes (Global Currency, Exchange Rate, WhatsApp, App Config)
  if (db.settings && (db.settings.updatedAt || 0) > lastSyncTime) {
    items.push({
      id: 'sys-settings-update',
      type: 'settings_update',
      title: `Configuración del Sistema`,
      subtitle: `Modo Moneda: ${db.settings.currencyMode || 'BOTH'} • Tasa: 1 USD = $${db.settings.exchangeRateUSD || 320} CUP`,
      badgeText: 'Ajustes',
      badgeColor: '#0369A1'
    });
  }

  // 8. Deleted transactions pending cloud removal
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

  // 9. Deleted products pending cloud removal
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

  // 10. Deleted suppliers pending cloud removal
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

  // 11. Deleted users pending cloud removal
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

  // 12. Deleted customer debts pending cloud removal
  (db.deletedDebtIds || []).forEach(id => {
    items.push({
      id,
      type: 'debt_delete',
      title: `Eliminar Fiado`,
      subtitle: `ID: ${id} • Pendiente de borrar en servidor`,
      badgeText: 'Borrado Fiado',
      badgeColor: '#EF4444'
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
        'Cache-Control': 'no-cache',
        'x-app-instance': getAppNamespace()
      },
      body: JSON.stringify({
        clientLastSync: lastSyncTime,
        pendingReset: !!db.pendingReset,
        pendingResetAt: db.pendingResetAt || 0,
        transactions: db.transactions,
        deletedIds: db.deletedIds || [],
        storeProducts: db.storeProducts || [],
        deletedProductIds: db.deletedProductIds || [],
        storeSales: db.storeSales || [],
        shifts: db.shifts || [],
        supplierAccounts: db.supplierAccounts || [],
        deletedSupplierIds: db.deletedSupplierIds || [],
        users: db.users || [],
        deletedUserIds: db.deletedUserIds || [],
        customerDebts: db.customerDebts || [],
        deletedDebtIds: db.deletedDebtIds || [],
        storeFund: db.storeFund !== undefined ? db.storeFund : 0,
        storeFundUSD: db.storeFundUSD !== undefined ? db.storeFundUSD : 0,
        savingsFund: db.savingsFund !== undefined ? db.savingsFund : 0,
        savingsFundUSD: db.savingsFundUSD !== undefined ? db.savingsFundUSD : 0,
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

      // 1. Lightweight safety snapshot of local DB prior to applying remote state (without duplicating heavy Base64 photos)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const lightDb = {
            ...db,
            storeProducts: (db.storeProducts || []).map(p => ({ ...p, photoUrl: undefined }))
          };
          window.localStorage.setItem('cuentacasa_offline_safety_snapshot', JSON.stringify({
            timestamp: Date.now(),
            previousDb: lightDb
          }));
        }
      } catch (e) {}

      const serverDeletedIds: string[] = Array.isArray(data.deletedIds) ? data.deletedIds : [];
      const serverDeletedProductIds: string[] = Array.isArray(data.deletedProductIds) ? data.deletedProductIds : [];
      const serverDeletedSupplierIds: string[] = Array.isArray(data.deletedSupplierIds) ? data.deletedSupplierIds : [];
      const serverDeletedUserIds: string[] = Array.isArray(data.deletedUserIds) ? data.deletedUserIds : [];
      const serverDeletedDebtIds: string[] = Array.isArray(data.deletedDebtIds) ? data.deletedDebtIds : [];

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

      const mergedShifts: StoreShiftRecord[] = Array.isArray(data.shifts)
        ? data.shifts
        : (db.shifts || []);

      const rawMergedSuppliers: SupplierAccount[] = Array.isArray(data.supplierAccounts)
        ? data.supplierAccounts
        : (db.supplierAccounts || []);

      const rawMergedUsers: AppUser[] = Array.isArray(data.users)
        ? data.users
        : (db.users || []);

      const rawMergedDebts: CustomerDebtRecord[] = Array.isArray(data.customerDebts)
        ? data.customerDebts
        : (db.customerDebts || []);

      // Filter out any tombstone deleted items
      const mergedTransactions = rawMergedTxs.filter(t => !serverDeletedIds.includes(t.id));
      const mergedProducts = rawMergedProducts.filter(p => !serverDeletedProductIds.includes(p.id));
      const mergedSuppliers = rawMergedSuppliers.filter(s => !serverDeletedSupplierIds.includes(s.id));
      const mergedUsers = rawMergedUsers.filter(u => !serverDeletedUserIds.includes(u.id));
      const mergedDebts = rawMergedDebts.filter(d => !serverDeletedDebtIds.includes(d.id));

      // Safeguard: Retain any local unsynced transactions not yet in server list
      const returnedTxIds = new Set(mergedTransactions.map(t => t.id));
      const unsyncedLocals = (db.transactions || []).filter(t => !t.synced && !returnedTxIds.has(t.id));
      const finalTransactions = [...unsyncedLocals, ...mergedTransactions];

      // Safeguard: Retain any local product created post-reset not yet in server list
      const returnedProdIds = new Set(mergedProducts.map(p => p.id));
      const localProducts = (db.storeProducts || []).filter(p => !returnedProdIds.has(p.id) && (p.createdAt || 0) > (db.pendingResetAt || 0));
      const finalProducts = [...localProducts, ...mergedProducts];

      const updatedDb: RawDatabase = {
        ...db,
        transactions: finalTransactions,
        storeProducts: finalProducts,
        storeSales: mergedSales,
        shifts: mergedShifts,
        supplierAccounts: mergedSuppliers,
        users: mergedUsers,
        customerDebts: mergedDebts,
        storeFund: data.storeFund !== undefined ? data.storeFund : (db.storeFund || 0),
        storeFundUSD: data.storeFundUSD !== undefined ? data.storeFundUSD : (db.storeFundUSD || 0),
        savingsFund: data.savingsFund !== undefined ? data.savingsFund : (db.savingsFund || 0),
        savingsFundUSD: data.savingsFundUSD !== undefined ? data.savingsFundUSD : (db.savingsFundUSD || 0),
        settings: {
          ...(db.settings || {}),
          ...(data.settings || {}),
          currencyMode: data.settings?.currencyMode || db.settings?.currencyMode || 'BOTH',
          exchangeRateUSD: data.settings?.exchangeRateUSD || db.settings?.exchangeRateUSD || 320
        },
        pendingReset: false,
        pendingResetAt: undefined,
        deletedIds: [],
        deletedProductIds: [],
        deletedSupplierIds: [],
        deletedUserIds: [],
        deletedDebtIds: [],
        lastSync: new Date().toISOString()
      };

      saveRawDatabase(updatedDb);
      if (updatedDb.settings) {
        applyGlobalSettingsAndBroadcast(updatedDb.settings);
      }

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

/**
 * Read-only public catalog sync for anonymous storefront visitors.
 * If the device is authenticated as store staff, delegates to full syncDatabaseWithCloud.
 * Otherwise performs GET /api/sync?public=1 so private financial/user data is never downloaded or overwritten.
 */
export async function syncPublicCatalog(force: boolean = false): Promise<{ success: boolean; productCount: number }> {
  if (typeof window !== 'undefined') {
    const isAuthed = window.localStorage.getItem('cuentacasa_auth') === 'true';
    if (isAuthed) {
      const res = await syncDatabaseWithCloud(force);
      return { success: res.success, productCount: res.productCount || 0 };
    }
    if (!navigator.onLine && !force) {
      return { success: false, productCount: 0 };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch('/api/sync?public=1', {
      method: 'GET',
      headers: { 
        'Cache-Control': 'no-cache',
        'x-app-instance': getAppNamespace()
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.success && Array.isArray(data.storeProducts)) {
      const db = getRawDatabase();
      const deletedProductIds: string[] = Array.isArray(data.deletedProductIds) ? data.deletedProductIds : [];
      const publicProducts: StoreProduct[] = data.storeProducts.filter((p: StoreProduct) => !deletedProductIds.includes(p.id));

      const updatedDb: RawDatabase = {
        ...db,
        storeProducts: publicProducts,
        settings: {
          ...(db.settings || {}),
          ...(data.settings || {}),
          currencyMode: data.settings?.currencyMode || db.settings?.currencyMode || 'BOTH',
          exchangeRateUSD: data.settings?.exchangeRateUSD || db.settings?.exchangeRateUSD || 320
        },
        lastSync: new Date().toISOString()
      };
      saveRawDatabase(updatedDb);
      if (updatedDb.settings) {
        applyGlobalSettingsAndBroadcast(updatedDb.settings);
      }
      return { success: true, productCount: publicProducts.length };
    }
  } catch (e) {
    clearTimeout(timeoutId);
  }
  return { success: false, productCount: 0 };
}

let instantSyncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Dispara una sincronización silenciosa inmediata con la base de datos MySQL en la nube,
 * consolidando cambios estéticos y de configuración en todos los dispositivos.
 */
export function triggerInstantCloudSync() {
  if (typeof window === 'undefined') return;
  if (instantSyncDebounceTimer) clearTimeout(instantSyncDebounceTimer);
  instantSyncDebounceTimer = setTimeout(() => {
    syncDatabaseWithCloud(true).catch(err => {
      console.warn('Persistencia en la nube de ajustes en segundo plano:', err);
    });
  }, 400);
}

if (typeof window !== 'undefined') {
  window.addEventListener('cuentacasa-trigger-cloud-sync', () => {
    triggerInstantCloudSync();
  });
}




