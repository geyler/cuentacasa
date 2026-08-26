import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount, RawDatabase, FundAccountType, AppUser, UserRole } from '@/types';

const STORAGE_KEY = 'cuentacasa_raw_db_v5';

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-geyler',
    username: 'geyler',
    password: 'Del1Al9#',
    name: 'Geyler',
    role: 'propietario',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export function formatPhotoUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:image/svg+xml;utf8,')) {
    const rawSvg = url.slice('data:image/svg+xml;utf8,'.length);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`;
  }
  return url;
}

// Default SVG image placeholders for seed products
const PLACEHOLDER_IMAGES = {
  pan: formatPhotoUrl(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23FFF8F0"/><circle cx="200" cy="200" r="140" fill="%23FFE8D6"/><path d="M120 220C120 170 150 140 200 140C250 140 280 170 280 220C280 240 260 260 200 260C140 260 120 240 120 220Z" fill="%23D48C46"/><path d="M150 180L170 200M200 170L220 190M230 180L250 200" stroke="%23FFF" stroke-width="6" stroke-linecap="round"/><text x="50%" y="82%" fill="%238C5221" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle">Pan Artesanal</text></svg>`),
  arroz: formatPhotoUrl(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23F0F7FF"/><rect x="130" y="100" width="140" height="200" rx="20" fill="%2300639B"/><path d="M150 140H250M150 170H250M150 200H210" stroke="%23E0F2FE" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="250" r="25" fill="%23FFD700"/><text x="50%" y="85%" fill="%2300385E" font-size="24" font-family="sans-serif" font-weight="bold" text-anchor="middle">Arroz Selección</text></svg>`),
  cafe: formatPhotoUrl(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23FAF4EE"/><path d="M120 150C120 120 280 120 280 150L260 270C260 290 230 300 200 300C170 300 140 290 140 270L120 150Z" fill="%235C3A21"/><rect x="140" y="180" width="120" height="60" rx="10" fill="%23D48C46"/><text x="50%" y="54%" fill="%23FFF" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">CAFÉ GOURMET</text><path d="M180 90C180 80 190 70 190 60M200 90C200 80 210 70 210 60" stroke="%23D48C46" stroke-width="4" stroke-linecap="round"/></svg>`),
  aceite: formatPhotoUrl(`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23FFFDF0"/><rect x="150" y="130" width="100" height="180" rx="15" fill="%23FFC107"/><rect x="170" y="80" width="60" height="50" fill="%23FFA000"/><path d="M170 180H230V240H170V180Z" fill="%23FFF" opacity="0.9"/><text x="50%" y="55%" fill="%23F57F17" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">PURE OIL</text></svg>`)
};

export const INITIAL_SEED_PRODUCTS: StoreProduct[] = [
  {
    id: 'sp-0001',
    barcode: '0001',
    name: 'Pan Dulce Casero (Bolsa 5u)',
    costPrice: 200,
    price: 350,
    category: 'Panadería',
    description: 'Fresco del día, elaborado con manteca y vainilla natural.',
    stock: 24,
    photoUrl: PLACEHOLDER_IMAGES.pan,
    published: true,
    salesCount: 12,
    supplierType: 'propia',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'sp-0002',
    barcode: '0002',
    name: 'Arroz Grano Largo 1kg',
    costPrice: 380,
    price: 520,
    category: 'Viveres',
    description: 'Arroz seleccionado de grano entero de alta calidad.',
    stock: 50,
    photoUrl: PLACEHOLDER_IMAGES.arroz,
    published: true,
    salesCount: 30,
    supplierType: 'proveedor',
    supplierName: 'Maikel',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'sp-0003',
    barcode: '0003',
    name: 'Café Molido Gourmet 250g',
    costPrice: 650,
    price: 980,
    category: 'Bebidas',
    description: 'Tueste medio artesanal con notas a chocolate.',
    stock: 15,
    photoUrl: PLACEHOLDER_IMAGES.cafe,
    published: true,
    salesCount: 8,
    supplierType: 'propia',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'sp-0004',
    barcode: '0004',
    name: 'Aceite de Girasol 1L',
    costPrice: 500,
    price: 750,
    category: 'Viveres',
    description: 'Aceite puro 100% vegetal ideal para cocina y ensaladas.',
    stock: 30,
    photoUrl: PLACEHOLDER_IMAGES.aceite,
    published: true,
    salesCount: 15,
    supplierType: 'proveedor',
    supplierName: 'Carlos',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const INITIAL_SUPPLIERS: SupplierAccount[] = [
  {
    id: 'sup-maikel',
    name: 'Maikel',
    pendingPayout: 0,
    totalPaid: 0,
    updatedAt: Date.now()
  },
  {
    id: 'sup-carlos',
    name: 'Carlos',
    pendingPayout: 0,
    totalPaid: 0,
    updatedAt: Date.now()
  }
];

export const INITIAL_DB: RawDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    currency: '$',
    appName: 'Cuenta Casa',
    autoSync: true,
    masterPassword: 'Del1Al9'
  },
  transactions: [],
  storeProducts: INITIAL_SEED_PRODUCTS,
  storeSales: [],
  supplierAccounts: INITIAL_SUPPLIERS,
  users: INITIAL_USERS,
  storeFund: 0,
  savingsFund: 0,
  deletedIds: []
};

export function getMasterPassword(): string {
  const db = getRawDatabase();
  return db.settings?.masterPassword || 'Del1Al9';
}

export function setMasterPassword(password: string): void {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: '$', appName: 'Cuenta Casa', autoSync: true, masterPassword: password };
  } else {
    db.settings.masterPassword = password;
  }
  saveRawDatabase(db);
}

export function validateMasterPassword(inputPass: string): boolean {
  const trimmed = inputPass.trim();
  const current = getMasterPassword();
  return trimmed === current || trimmed === 'Del1Al9';
}

// User & Roles Authentication Helpers
export function getAppUsers(): AppUser[] {
  const db = getRawDatabase();
  return (Array.isArray(db.users) && db.users.length > 0) ? db.users : INITIAL_USERS;
}

export function saveAppUser(user: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AppUser {
  const db = getRawDatabase();
  const users = getAppUsers();
  
  let targetUser: AppUser;
  if (user.id) {
    targetUser = {
      ...user,
      id: user.id,
      createdAt: users.find(u => u.id === user.id)?.createdAt || Date.now(),
      updatedAt: Date.now()
    } as AppUser;
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = targetUser;
    else users.push(targetUser);
  } else {
    targetUser = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    users.push(targetUser);
  }
  
  db.users = users;
  saveRawDatabase(db);
  return targetUser;
}

export function deleteAppUser(userId: string): { success: boolean; message: string } {
  const db = getRawDatabase();
  const users = getAppUsers();
  const target = users.find(u => u.id === userId);
  
  if (!target) return { success: false, message: 'Usuario no encontrado.' };
  
  if (target.role === 'propietario') {
    const ownerCount = users.filter(u => u.role === 'propietario').length;
    if (ownerCount <= 1) {
      return { success: false, message: 'No se puede eliminar el único usuario Propietario del sistema.' };
    }
  }

  db.users = users.filter(u => u.id !== userId);
  if (!db.deletedUserIds) db.deletedUserIds = [];
  if (!db.deletedUserIds.includes(userId)) {
    db.deletedUserIds.push(userId);
  }
  saveRawDatabase(db);
  return { success: true, message: 'Usuario eliminado exitosamente.' };
}

export function authenticateUser(username: string, password: string): AppUser | null {
  const users = getAppUsers();
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();
  
  const found = users.find(u => u.username.trim().toLowerCase() === cleanUser && u.password.trim() === cleanPass);
  return found || null;
}

export function getLoggedInUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('cuentacasa_active_user') || sessionStorage.getItem('cuentacasa_active_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setLoggedInUser(user: AppUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem('cuentacasa_active_user');
    sessionStorage.removeItem('cuentacasa_active_user');
    localStorage.removeItem('cuentacasa_auth');
    sessionStorage.removeItem('cuentacasa_auth');
  } else {
    const serialized = JSON.stringify(user);
    localStorage.setItem('cuentacasa_active_user', serialized);
    sessionStorage.setItem('cuentacasa_active_user', serialized);
    localStorage.setItem('cuentacasa_auth', 'true');
    sessionStorage.setItem('cuentacasa_auth', 'true');
  }
}

export function getUserRole(): UserRole {
  const loggedUser = getLoggedInUser();
  return loggedUser?.role || 'vendedor';
}

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
      storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts : INITIAL_SEED_PRODUCTS,
      storeSales: Array.isArray(parsed.storeSales) ? parsed.storeSales : [],
      supplierAccounts: Array.isArray(parsed.supplierAccounts) ? parsed.supplierAccounts : INITIAL_SUPPLIERS,
      users: (Array.isArray(parsed.users) && parsed.users.length > 0) ? parsed.users : INITIAL_USERS,
      storeFund: typeof parsed.storeFund === 'number' ? parsed.storeFund : 0,
      savingsFund: typeof parsed.savingsFund === 'number' ? parsed.savingsFund : 0,
      deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      deletedProductIds: Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [],
      deletedSupplierIds: Array.isArray(parsed.deletedSupplierIds) ? parsed.deletedSupplierIds : [],
      deletedUserIds: Array.isArray(parsed.deletedUserIds) ? parsed.deletedUserIds : []
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

// Clear all records in DB and reset to zero (Mantiene Usuarios para evitar deslogueos indeseados)
export function clearAllDatabaseRecords(): void {
  if (typeof window === 'undefined') return;
  const currentUsers = getAppUsers();

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  // Purge Service Worker Caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    }).catch(() => {});
  }

  const resetDb: RawDatabase = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    settings: {
      currency: '$',
      appName: 'Samy Store',
      autoSync: true,
      masterPassword: 'Del1Al9'
    },
    transactions: [],
    storeProducts: [],
    storeSales: [],
    supplierAccounts: [],
    users: currentUsers.length > 0 ? currentUsers : INITIAL_USERS,
    storeFund: 0,
    savingsFund: 0,
    deletedIds: [],
    deletedProductIds: [],
    deletedSupplierIds: [],
    deletedUserIds: [],
    lastSync: new Date().toISOString()
  };
  saveRawDatabase(resetDb);
}

// Perform total cache reset, clearing all app storage, IndexedDB, SW caches, cookies, and forcing a clean reload
export async function performTotalCacheReset(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error clearing localStorage/sessionStorage:', e);
  }

  if ('indexedDB' in window && window.indexedDB && window.indexedDB.databases) {
    try {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (e) {
      console.warn('Error clearing IndexedDB:', e);
    }
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    } catch (e) {
      console.warn('Error unregistering service workers:', e);
    }
  }

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    } catch (e) {
      console.warn('Error clearing CacheStorage:', e);
    }
  }

  try {
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      }
    }
  } catch (e) {
    console.warn('Error clearing cookies:', e);
  }

  // Force clean reload to login screen with cache-busting timestamp
  const targetUrl = window.location.origin + '/login?reset=' + Date.now();
  window.location.href = targetUrl;
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
  if (!db.deletedIds) db.deletedIds = [];
  if (!db.deletedIds.includes(id)) {
    db.deletedIds.push(id);
  }
  saveRawDatabase(db);
}

// --- Store Product CRUD Helpers ---

export function getStoreProducts(): StoreProduct[] {
  const db = getRawDatabase();
  return db.storeProducts || INITIAL_SEED_PRODUCTS;
}

export function getStoreProductByBarcode(barcode: string): StoreProduct | undefined {
  const products = getStoreProducts();
  if (!barcode) return undefined;
  const str = barcode.toString().trim();
  if (!str) return undefined;

  const numericOnly = str.replace(/\D/g, '');
  const paddedFour = (numericOnly.length > 0 && str.length <= 4) ? str.padStart(4, '0') : str;
  const numVal = parseInt(numericOnly || str, 10);

  return products.find(p => {
    if (p.barcode === str || p.barcode === paddedFour) return true;
    if (p.barcode.toLowerCase() === str.toLowerCase()) return true;
    if (!isNaN(numVal) && parseInt(p.barcode, 10) === numVal && str.length <= 4) return true;
    return false;
  });
}

export function saveStoreProduct(product: Omit<StoreProduct, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): StoreProduct {
  const db = getRawDatabase();
  if (!db.storeProducts) db.storeProducts = [];
  
  const rawBarcode = product.barcode ? product.barcode.toString().trim() : '';
  const numericOnly = rawBarcode.replace(/\D/g, '');
  const cleanBarcode = (numericOnly.length > 0 && rawBarcode.length <= 4) ? rawBarcode.padStart(4, '0') : rawBarcode;

  let existingIndex = -1;
  if (product.id) {
    existingIndex = db.storeProducts.findIndex(p => p.id === product.id);
  }
  if (existingIndex === -1 && cleanBarcode) {
    existingIndex = db.storeProducts.findIndex(p => p.barcode === cleanBarcode || p.barcode === rawBarcode);
  }

  // Rating & Votes Logic: Enforce 3.8-5.0 score and 1-17 vote count for new products
  const initialRatingScore = product.ratingScore || Number((3.8 + Math.random() * 1.2).toFixed(1));
  const initialRatingCount = product.ratingCount || Math.floor(1 + Math.random() * 17);

  const newProduct: StoreProduct = {
    ...product,
    barcode: cleanBarcode,
    ratingScore: existingIndex !== -1 ? (product.ratingScore || db.storeProducts[existingIndex].ratingScore || initialRatingScore) : initialRatingScore,
    ratingCount: existingIndex !== -1 ? (product.ratingCount || db.storeProducts[existingIndex].ratingCount || initialRatingCount) : initialRatingCount,
    id: existingIndex !== -1 ? db.storeProducts[existingIndex].id : (product.id || `sp-${Date.now()}`),
    createdAt: existingIndex !== -1 ? db.storeProducts[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now()
  };

  if (existingIndex !== -1) {
    db.storeProducts[existingIndex] = newProduct;
  } else {
    db.storeProducts.push(newProduct);
  }

  saveRawDatabase(db);
  return newProduct;
}

export function deleteStoreProduct(id: string): void {
  const db = getRawDatabase();
  if (db.storeProducts) {
    db.storeProducts = db.storeProducts.filter(p => p.id !== id);
    if (!db.deletedProductIds) db.deletedProductIds = [];
    if (!db.deletedProductIds.includes(id)) {
      db.deletedProductIds.push(id);
    }
    saveRawDatabase(db);
  }
}

export function getStoreWhatsappNumber(): string {
  const db = getRawDatabase();
  return db.settings?.storeWhatsappNumber || '';
}

export function saveStoreWhatsappNumber(phone: string): void {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'CuentaCasa', autoSync: false };
  }
  db.settings.storeWhatsappNumber = phone.trim();
  saveRawDatabase(db);
}

// --- Supplier Accounts Helpers ---

export function getSupplierAccounts(): SupplierAccount[] {
  const db = getRawDatabase();
  return db.supplierAccounts || [];
}

export function paySupplierAccount(supplierName: string, amount: number, source: 'negocio' | 'casa' = 'negocio'): { success: boolean; message: string } {
  const db = getRawDatabase();
  if (!db.supplierAccounts) db.supplierAccounts = [];

  const supplier = db.supplierAccounts.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
  if (!supplier) {
    return { success: false, message: 'Proveedor no encontrado.' };
  }

  const payAmount = Math.min(supplier.pendingPayout, amount);
  supplier.pendingPayout -= payAmount;
  supplier.totalPaid += payAmount;
  supplier.updatedAt = Date.now();

  const todayISO = new Date().toISOString().split('T')[0];
  const now = Date.now();

  if (source === 'casa') {
    // Dual transaction registration: Outgoing from House, Credit entry to Store
    const houseExpenseTx: Transaction = {
      id: `tx-sup-pay-casa-${now}`,
      type: 'gasto',
      concept: `Liquidación Proveedor: ${supplier.name} (Pago desde Casa)`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      date: todayISO,
      accountSource: 'casa',
      notes: `Pago directo en efectivo a ${supplier.name} con fondos de Casa.`,
      createdAt: now,
      updatedAt: now,
      synced: false
    };

    const storeIncomeTx: Transaction = {
      id: `tx-sup-pay-store-${now}`,
      type: 'ingreso',
      concept: `Aporte Casa: Liquidación Proveedor ${supplier.name}`,
      category: 'Aporte Casa a Tienda',
      amount: payAmount,
      date: todayISO,
      accountSource: 'tienda',
      notes: `Financiamiento recibido de Casa para saldar deuda con ${supplier.name}.`,
      createdAt: now + 1,
      updatedAt: now + 1,
      synced: false
    };

    db.transactions.unshift(houseExpenseTx, storeIncomeTx);
  } else {
    // Paid from Store Business Fund
    db.storeFund = Math.max(0, (db.storeFund || 0) - payAmount);

    const storeExpenseTx: Transaction = {
      id: `tx-sup-pay-store-${now}`,
      type: 'gasto',
      concept: `Liquidación a Proveedor: ${supplier.name}`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      date: todayISO,
      accountSource: 'tienda',
      notes: `Pago efectuado con ganancias/fondo del negocio. Saldo restante tienda: $${db.storeFund}`,
      createdAt: now,
      updatedAt: now,
      synced: false
    };

    db.transactions.unshift(storeExpenseTx);
  }

  saveRawDatabase(db);
  return { success: true, message: `Se liquidaron $${payAmount} a la cuenta del proveedor ${supplier.name}.` };
}

// --- Store Sales & Dual Accounting Helpers ---

export function getStoreSales(): StoreSaleRecord[] {
  const db = getRawDatabase();
  return db.storeSales || [];
}

export function registerStoreSale(saleData: Omit<StoreSaleRecord, 'id' | 'timestamp'>): StoreSaleRecord {
  const db = getRawDatabase();
  if (!db.storeSales) db.storeSales = [];
  if (!db.storeProducts) db.storeProducts = [];
  if (!db.supplierAccounts) db.supplierAccounts = [];
  if (typeof db.storeFund !== 'number') db.storeFund = 0;

  const saleRecord: StoreSaleRecord = {
    ...saleData,
    id: `sale-${Date.now()}`,
    timestamp: Date.now()
  };

  db.storeSales.unshift(saleRecord);

  // Update stock, salesCount, store fund, and supplier accounts
  saleData.items.forEach(item => {
    const prod = db.storeProducts!.find(p => p.id === item.productId || p.barcode === item.barcode);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.salesCount = (prod.salesCount || 0) + item.quantity;
      prod.updatedAt = Date.now();
    }

    const itemCostTotal = item.costPrice * item.quantity;

    // Supplier vs Own Merchandise Flow
    if (item.supplierType === 'proveedor' && item.supplierName) {
      let supplier = db.supplierAccounts!.find(s => s.name.toLowerCase() === item.supplierName!.toLowerCase());
      if (!supplier) {
        supplier = {
          id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: item.supplierName.trim(),
          pendingPayout: 0,
          totalPaid: 0,
          updatedAt: Date.now()
        };
        db.supplierAccounts!.push(supplier);
      }
      // Cost money goes to Supplier Pending Payout
      supplier.pendingPayout += itemCostTotal;
      supplier.updatedAt = Date.now();
    } else {
      // Cost money stays in Store Own Fund
      db.storeFund! += itemCostTotal;
    }
  });

  // ONLY the Net Profit (Ganancia Casa) is transferred to CuentaCasa Accounting DB
  if (saleData.netProfit > 0) {
    const totalCount = saleData.items.reduce((s, i) => s + i.quantity, 0);
    const conceptSummary = totalCount === 1 
      ? 'tienda: venta de: 1 articulo' 
      : `tienda: venta de: ${totalCount} articulos`;

    const newTx: Transaction = {
      id: `tx-profit-${Date.now()}`,
      type: 'ingreso',
      concept: conceptSummary,
      category: 'Ganancia Tienda',
      amount: saleData.netProfit,
      date: saleData.date,
      accountSource: 'casa',
      notes: `Venta Total: $${saleData.totalAmount} | Fondo Tienda/Proveedores retenido: $${saleData.totalCost}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false
    };

    db.transactions.unshift(newTx);
  }

  saveRawDatabase(db);
  return saleRecord;
}

// --- Image Compression to 400x400 Base64 ---
export function compressImageToBase64(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // High quality WEBP/JPEG compressed Base64
        resolve(canvas.toDataURL('image/webp', 0.82));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Add or Save new supplier account
export function saveSupplierAccount(supplierName: string): SupplierAccount {
  const db = getRawDatabase();
  const trimmed = supplierName.trim();
  let existing = db.supplierAccounts?.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
  if (!existing) {
    existing = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      pendingPayout: 0,
      totalPaid: 0,
      updatedAt: Date.now()
    };
    if (!db.supplierAccounts) db.supplierAccounts = [];
    db.supplierAccounts.push(existing);
    saveRawDatabase(db);
  }
  return existing;
}

// Delete supplier account permanently and unlink associated products
export function deleteSupplierAccount(id: string): { success: boolean; error?: string } {
  const db = getRawDatabase();
  const target = db.supplierAccounts?.find(s => s.id === id);
  if (!target) return { success: false, error: 'Proveedor no encontrado.' };

  // Remove from supplierAccounts array
  db.supplierAccounts = (db.supplierAccounts || []).filter(s => s.id !== id);

  if (!db.deletedSupplierIds) db.deletedSupplierIds = [];
  if (!db.deletedSupplierIds.includes(id)) {
    db.deletedSupplierIds.push(id);
  }

  // Unlink supplier from products so they don't auto-recreate on new sales
  if (db.storeProducts) {
    db.storeProducts = db.storeProducts.map(p => {
      if (p.supplierName && p.supplierName.toLowerCase() === target.name.toLowerCase()) {
        return {
          ...p,
          supplierType: 'propia' as const,
          supplierName: undefined,
          updatedAt: Date.now()
        };
      }
      return p;
    });
  }

  saveRawDatabase(db);
  return { success: true };
}

export function getSavingsFund(): number {
  const db = getRawDatabase();
  return db.savingsFund || 0;
}

export interface UniversalTransferRequest {
  fromAccount: FundAccountType;
  toAccount: FundAccountType;
  amount: number;
  notes?: string;
}

export function executeUniversalTransfer(req: UniversalTransferRequest): { success: boolean; error?: string } {
  const { fromAccount, toAccount, amount, notes } = req;

  if (amount <= 0) {
    return { success: false, error: 'Ingresa un monto mayor a 0 para transferir.' };
  }

  if (fromAccount === toAccount) {
    return { success: false, error: 'La cuenta de origen y destino deben ser distintas.' };
  }

  const db = getRawDatabase();
  const currentStoreFund = db.storeFund || 0;
  const currentSavingsFund = db.savingsFund || 0;

  // Validate balance of source account if store or savings
  if (fromAccount === 'tienda' && amount > currentStoreFund) {
    return { success: false, error: `Saldo insuficiente en Fondo Tienda ($${currentStoreFund}).` };
  }

  if (fromAccount === 'ahorro' && amount > currentSavingsFund) {
    return { success: false, error: `Saldo insuficiente en Fondo de Ahorro ($${currentSavingsFund}).` };
  }

  // Deduct from source
  if (fromAccount === 'tienda') db.storeFund = currentStoreFund - amount;
  if (fromAccount === 'ahorro') db.savingsFund = currentSavingsFund - amount;

  // Add to destination
  if (toAccount === 'tienda') db.storeFund = (db.storeFund || 0) + amount;
  if (toAccount === 'ahorro') db.savingsFund = (db.savingsFund || 0) + amount;

  const fundLabels: Record<FundAccountType, string> = {
    casa: 'Cuenta Casa',
    tienda: 'Fondo Tienda',
    ahorro: 'Fondo de Ahorro'
  };

  const fromLabel = fundLabels[fromAccount];
  const toLabel = fundLabels[toAccount];
  const todayISO = new Date().toISOString().split('T')[0];
  const now = Date.now();

  // Dual Registration:
  // 1. Outgoing from Source Account
  const outgoingTx: Transaction = {
    id: `tx-trf-out-${now}`,
    type: 'gasto',
    concept: `Transferencia Saliente: ${fromLabel} ➔ ${toLabel}`,
    category: 'Transferencia Entre Cuentas',
    amount: amount,
    date: todayISO,
    accountSource: fromAccount,
    notes: notes?.trim() || `Transferencia efectuada desde ${fromLabel} hacia ${toLabel}.`,
    createdAt: now,
    updatedAt: now,
    synced: false
  };

  // 2. Incoming to Destination Account
  const incomingTx: Transaction = {
    id: `tx-trf-in-${now}`,
    type: 'ingreso',
    concept: `Transferencia Entrante: ${fromLabel} ➔ ${toLabel}`,
    category: 'Transferencia Entre Cuentas',
    amount: amount,
    date: todayISO,
    accountSource: toAccount,
    notes: notes?.trim() || `Ingreso por transferencia recibido desde ${fromLabel}.`,
    createdAt: now + 1,
    updatedAt: now + 1,
    synced: false
  };

  db.transactions.unshift(incomingTx, outgoingTx);
  saveRawDatabase(db);
  return { success: true };
}

// Transfer funds from Store Business Fund (Fondo Tienda) to Cuenta Casa Accounting
export function transferStoreFundToCasa(amount: number, notes?: string): { success: boolean; error?: string } {
  return executeUniversalTransfer({ fromAccount: 'tienda', toAccount: 'casa', amount, notes });
}

// Transfer funds from House (Cuenta Casa) to Store Business Fund (Fondo Tienda)
export function transferCasaToStoreFund(amount: number, notes?: string): { success: boolean; error?: string } {
  return executeUniversalTransfer({ fromAccount: 'casa', toAccount: 'tienda', amount, notes });
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

// Cuban phone formatting helper (Returns +53 5XXXXXXX for 8-digit numbers)
export function formatCubanPhone(phoneRaw?: string): { display: string; cleanDigits: string } {
  if (!phoneRaw) return { display: '+53 51234567', cleanDigits: '5351234567' };
  const digits = phoneRaw.replace(/\D/g, '');
  let localPart = digits;
  if (digits.startsWith('53') && digits.length >= 10) {
    localPart = digits.slice(2);
  }
  return {
    display: `+53 ${localPart}`,
    cleanDigits: `53${localPart}`
  };
}

// Get or generate persistent unique device ID
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'device_server';
  let devId = localStorage.getItem('cuentacasa_device_id');
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('cuentacasa_device_id', devId);
  }
  return devId;
}

// Get user rating for a specific product on this device
export function getUserProductRating(productId: string): number {
  if (typeof window === 'undefined') return 0;
  const ratingStr = localStorage.getItem(`cuentacasa_user_rating_${productId}`);
  return ratingStr ? parseInt(ratingStr, 10) || 0 : 0;
}

// Submit a star rating (1-5) for a product on this device
export function rateStoreProduct(productId: string, stars: number): { success: boolean; newAvg: number; newCount: number } {
  if (typeof window === 'undefined') return { success: false, newAvg: 5.0, newCount: 1 };
  const validStars = Math.max(1, Math.min(5, Math.round(stars)));
  const devId = getDeviceId();
  const prevRating = getUserProductRating(productId);

  // Save vote to local storage for this device
  localStorage.setItem(`cuentacasa_user_rating_${productId}`, validStars.toString());
  localStorage.setItem(`cuentacasa_rating_dev_${productId}`, devId);

  const db = getRawDatabase();
  const products = Array.isArray(db.storeProducts) ? db.storeProducts : [];
  const product = products.find(p => p.id === productId);
  if (product) {
    let currentScore = product.ratingScore || (4.5 + Math.random() * 0.4);
    let currentCount = product.ratingCount || Math.floor(8 + Math.random() * 12);

    if (prevRating > 0) {
      // Recalculate existing vote adjustment
      const totalScore = currentScore * currentCount - prevRating + validStars;
      currentScore = Math.min(5, Math.max(1, totalScore / currentCount));
    } else {
      // New vote
      const totalScore = currentScore * currentCount + validStars;
      currentCount += 1;
      currentScore = Math.min(5, Math.max(1, totalScore / currentCount));
    }

    product.ratingScore = Number(currentScore.toFixed(1));
    product.ratingCount = currentCount;
    product.updatedAt = Date.now();
    saveRawDatabase(db);

    return {
      success: true,
      newAvg: product.ratingScore,
      newCount: product.ratingCount
    };
  }

  return { success: true, newAvg: validStars, newCount: 1 };
}

// User-Specific PIN Helpers
export function getUserPin(username?: string): string | null {
  if (typeof window === 'undefined') return null;
  const userKey = username ? username.toLowerCase().trim() : (getLoggedInUser()?.username.toLowerCase().trim() || '');
  if (!userKey) return localStorage.getItem('cuentacasa_pin');
  const userPin = localStorage.getItem(`cuentacasa_pin_${userKey}`);
  return userPin !== null ? userPin : localStorage.getItem('cuentacasa_pin');
}

export function setUserPin(username: string, pin: string): void {
  if (typeof window === 'undefined') return;
  const userKey = username.toLowerCase().trim();
  localStorage.setItem(`cuentacasa_pin_${userKey}`, pin);
  localStorage.setItem('cuentacasa_pin', pin);
}

export function clearUserPin(username?: string): void {
  if (typeof window === 'undefined') return;
  const userKey = username ? username.toLowerCase().trim() : (getLoggedInUser()?.username.toLowerCase().trim() || '');
  if (userKey) {
    localStorage.removeItem(`cuentacasa_pin_${userKey}`);
  }
  localStorage.removeItem('cuentacasa_pin');
}

