import { Transaction, StoreProduct, StoreSaleRecord, StoreSaleItem, SupplierAccount, RawDatabase, FundAccountType, AppUser, UserRole, StoreShiftRecord, ShiftInventorySnapshot, QRSyncPayload, CurrencyType, CurrencyMode } from '@/types';

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
    db.settings = { currency: '$', appName: 'Cuenta Casa', autoSync: true, masterPassword: password, updatedAt: Date.now() };
  } else {
    db.settings.masterPassword = password;
    db.settings.updatedAt = Date.now();
  }
  saveRawDatabase(db);
}

export function validateMasterPassword(inputPass: string): boolean {
  const trimmed = inputPass.trim();
  const current = getMasterPassword();
  const loggedUser = getLoggedInUser();
  const userPass = loggedUser?.password?.trim();
  return trimmed === current || trimmed === 'Del1Al9' || (!!userPass && trimmed === userPass);
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
let memoryDbCache: RawDatabase | null = null;
let memoryRawString: string | null = null;

export function getRawDatabase(): RawDatabase {
  if (typeof window === 'undefined') return INITIAL_DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveRawDatabase(INITIAL_DB);
      return INITIAL_DB;
    }
    if (memoryDbCache && memoryRawString === raw) {
      return memoryDbCache;
    }
    const parsed = JSON.parse(raw);
    const db: RawDatabase = {
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
    memoryDbCache = db;
    memoryRawString = raw;
    return db;
  } catch (err) {
    console.error('Error parsing raw DB from LocalStorage:', err);
    return INITIAL_DB;
  }
}

// Save full raw DB
export function saveRawDatabase(db: RawDatabase): void {
  if (typeof window === 'undefined') return;
  db.lastUpdated = new Date().toISOString();
  const rawStr = JSON.stringify(db, null, 2);
  localStorage.setItem(STORAGE_KEY, rawStr);
  memoryDbCache = db;
  memoryRawString = rawStr;
  try {
    window.dispatchEvent(new CustomEvent('cuentacasa-db-changed'));
    window.dispatchEvent(new CustomEvent('cuentacasa-currency-mode-changed', { detail: db.settings }));
  } catch (e) {}
}

// Clear all database records and reset funds to zero (Mantiene Usuarios y sesión activa)
export function clearAllDatabaseRecords(): void {
  if (typeof window === 'undefined') return;
  const currentUsers = getAppUsers();
  const activeUser = getLoggedInUser();

  const resetDb: RawDatabase = {
    version: '1.3.0',
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

  if (activeUser) {
    setLoggedInUser(activeUser);
  }
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

  const oldStock = existingIndex !== -1 ? (db.storeProducts[existingIndex].stock || 0) : 0;
  const newStock = product.stock || 0;

  if (existingIndex !== -1) {
    db.storeProducts[existingIndex] = newProduct;
  } else {
    db.storeProducts.push(newProduct);
  }

  saveRawDatabase(db);

  // Automatically update active shift snapshot if stock was increased or added
  const addedQty = existingIndex !== -1 ? (newStock - oldStock) : newStock;
  if (addedQty > 0) {
    addStockToActiveShift(newProduct.id, addedQty);

    // Register transaction movement for added merchandise into store account log
    if ((newProduct.costPrice || 0) > 0) {
      const isConsignment = newProduct.supplierType === 'proveedor';
      const totalInvestment = Math.round(addedQty * (newProduct.costPrice || 0) * 100) / 100;
      const todayISO = new Date().toISOString().split('T')[0];
      const now = Date.now();

      const addStockTx: Transaction = {
        id: `tx-stock-add-${now}`,
        type: 'gasto',
        concept: `Entrada de Mercancía: ${newProduct.name} (+${addedQty}u)`,
        category: isConsignment ? 'Mercancía Consignación' : 'Compra de Mercancía',
        amount: totalInvestment,
        currency: newProduct.currency || 'CUP',
        date: todayISO,
        accountSource: 'tienda',
        notes: `Proveedor: ${newProduct.supplierName || 'Propia'} | Entrada de ${addedQty}u @ $${newProduct.costPrice}/u`,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift(addStockTx);
      saveRawDatabase(db);
    }
  }

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
  const activeUserId = db.settings?.activeWhatsappUserId;
  if (activeUserId && Array.isArray(db.users)) {
    const user = db.users.find(u => u.id === activeUserId);
    if (user && user.whatsappNumber) return user.whatsappNumber;
  }
  return db.settings?.storeWhatsappNumber || '';
}

export function getActiveWhatsappUserId(): string | undefined {
  const db = getRawDatabase();
  return db.settings?.activeWhatsappUserId;
}

export function saveStoreWhatsappNumber(phone: string, activeUserId?: string): void {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: false, updatedAt: Date.now() };
  }
  db.settings.storeWhatsappNumber = phone.trim();
  db.settings.activeWhatsappUserId = activeUserId;
  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);
}

// --- Supplier Accounts Helpers ---

export function getSupplierAccounts(): SupplierAccount[] {
  const db = getRawDatabase();
  return db.supplierAccounts || [];
}

export function paySupplierAccount(
  supplierIdOrName: string, 
  amount: number, 
  source: 'negocio' | 'casa' = 'negocio',
  currency: CurrencyType = 'CUP'
): { success: boolean; message?: string; error?: string } {
  const db = getRawDatabase();
  if (!db.supplierAccounts) db.supplierAccounts = [];

  const supplier = db.supplierAccounts.find(
    s => s.id === supplierIdOrName || s.name.toLowerCase() === supplierIdOrName.toLowerCase()
  );
  if (!supplier) {
    return { success: false, error: 'Proveedor no encontrado.' };
  }

  if (amount <= 0) {
    return { success: false, error: 'El monto a liquidar debe ser mayor a 0.' };
  }

  const payAmount = Math.min(supplier.pendingPayout, amount);
  if (payAmount <= 0) {
    return { success: false, error: 'El proveedor no tiene saldo pendiente por liquidar.' };
  }

  supplier.pendingPayout = Math.max(0, supplier.pendingPayout - payAmount);
  supplier.totalPaid = (supplier.totalPaid || 0) + payAmount;
  supplier.updatedAt = Date.now();

  const todayISO = new Date().toISOString().split('T')[0];
  const now = Date.now();
  if (!db.transactions) db.transactions = [];

  if (source === 'casa') {
    // Dual transaction registration: Outgoing from House, Credit entry to Store
    const houseExpenseTx: Transaction = {
      id: `tx-sup-pay-casa-${now}`,
      type: 'gasto',
      concept: `Liquidación Proveedor: ${supplier.name} (Pago desde Casa)`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      currency: currency,
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
      currency: currency,
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
    if (currency === 'USD') {
      db.storeFundUSD = Math.max(0, (db.storeFundUSD || 0) - payAmount);
    } else {
      db.storeFund = Math.max(0, (db.storeFund || 0) - payAmount);
    }

    const storeExpenseTx: Transaction = {
      id: `tx-sup-pay-store-${now}`,
      type: 'gasto',
      concept: `Liquidación a Proveedor: ${supplier.name}`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      currency: currency,
      date: todayISO,
      accountSource: 'tienda',
      notes: `Pago a proveedor efectuado con ganancias/fondo del negocio. Saldo restante tienda: $${db.storeFund}`,
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
  if (!db.transactions) db.transactions = [];
  if (typeof db.storeFund !== 'number') db.storeFund = 0;
  if (typeof db.storeFundUSD !== 'number') db.storeFundUSD = 0;

  // Determine explicit sale currency
  const saleCurrency: CurrencyType = saleData.currency || 
    (saleData.items[0]?.currency as CurrencyType) || 
    (saleData.items[0]?.productId ? (db.storeProducts.find(p => p.id === saleData.items[0].productId)?.currency as CurrencyType) : undefined) || 
    'CUP';

  const saleRecord: StoreSaleRecord = {
    ...saleData,
    currency: saleCurrency,
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
          pendingPayoutUSD: 0,
          totalPaid: 0,
          totalPaidUSD: 0,
          updatedAt: Date.now()
        };
        db.supplierAccounts!.push(supplier);
      }
      const itemCurr = item.currency || saleCurrency;
      // Cost money goes to Supplier Pending Payout (separated by currency)
      if (itemCurr === 'USD') {
        supplier.pendingPayoutUSD = (supplier.pendingPayoutUSD || 0) + itemCostTotal;
      } else {
        supplier.pendingPayout = (supplier.pendingPayout || 0) + itemCostTotal;
      }
      supplier.updatedAt = Date.now();
    } else {
      const itemCurr = item.currency || saleCurrency;
      // Cost money stays in Store Own Fund (separated by currency)
      if (itemCurr === 'USD') {
        db.storeFundUSD = (db.storeFundUSD || 0) + itemCostTotal;
      } else {
        db.storeFund = (db.storeFund || 0) + itemCostTotal;
      }
    }
  });

  const totalCount = saleData.items.reduce((s, i) => s + i.quantity, 0);
  const conceptSummary = totalCount === 1 
    ? `tienda: venta de: ${saleData.items[0]?.name || '1 artículo'}` 
    : `tienda: venta de: ${totalCount} artículos`;

  const now = Date.now();
  const currSymbol = saleCurrency === 'USD' ? 'US$' : '$';

  // Granular Ticket-style item breakdown
  const ticketItemsList = saleData.items
    .map(i => `• ${i.quantity}x ${i.name} (${currSymbol}${i.unitPrice} c/u = ${currSymbol}${i.quantity * i.unitPrice})`)
    .join('\n');

  const formattedTicketNotes = `[TICKET_DE_VENTA]\n${ticketItemsList}\n-------------------\nTotal: ${currSymbol}${saleData.totalAmount} | Moneda: ${saleCurrency} | Vendedor: ${saleData.sellerId || 'General'}`;

  // 1. Register Gross Sale Income in Store Account Log
  const storeSaleTx: Transaction = {
    id: `tx-sale-store-${now}`,
    type: 'ingreso',
    concept: conceptSummary,
    category: 'Ventas del Negocio',
    amount: saleData.totalAmount,
    currency: saleCurrency,
    date: saleData.date,
    accountSource: 'tienda',
    notes: formattedTicketNotes,
    createdAt: now,
    updatedAt: now,
    synced: false
  };
  db.transactions.unshift(storeSaleTx);

  // 2. Net Profit (Ganancia Casa) is transferred to CuentaCasa Accounting DB
  if (saleData.netProfit > 0) {
    const newTx: Transaction = {
      id: `tx-profit-${now + 1}`,
      type: 'ingreso',
      concept: `Ganancia Tienda: ${conceptSummary}`,
      category: 'Ganancia Tienda',
      amount: saleData.netProfit,
      currency: saleCurrency,
      date: saleData.date,
      accountSource: 'casa',
      notes: `Venta Total: ${currSymbol}${saleData.totalAmount} | Fondo Tienda/Proveedores retenido: ${currSymbol}${saleData.totalCost}`,
      createdAt: now + 1,
      updatedAt: now + 1,
      synced: false
    };

    db.transactions.unshift(newTx);
  }

  saveRawDatabase(db);
  recordShiftSaleInActiveShift(saleData.items, saleData.totalAmount, 'cash', saleData.sellerId, saleCurrency);
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

export function getCalculatedStoreFund(): number {
  const db = getRawDatabase();
  const salesRecords = (db.storeSales || []).filter(s => (s.currency || 'CUP') === 'CUP');
  const suppliers = db.supplierAccounts || [];

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalAccumulatedHouseProfits = salesRecords.reduce((acc, s) => acc + (s.netProfit || 0), 0);
  const totalPendingSupplierDebt = suppliers.reduce((acc, s) => acc + (s.pendingPayout || 0), 0);

  const houseCapitalTransactions = (db.transactions || []).filter(t => 
    (t.currency || 'CUP') === 'CUP' &&
    ((t.concept + ' ' + (t.notes || '')).toLowerCase().includes('fondo negocio') || 
     (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('tienda'))
  );
  const netTransferredToCasa = houseCapitalTransactions
    .filter(t => t.type === 'ingreso' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);
  const netInjectedFromCasa = houseCapitalTransactions
    .filter(t => t.type === 'gasto' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, (totalAccumulatedSalesRevenue - totalAccumulatedHouseProfits - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));
}

export function getCalculatedStoreFundUSD(): number {
  const db = getRawDatabase();
  const salesRecords = (db.storeSales || []).filter(s => s.currency === 'USD');
  const suppliers = db.supplierAccounts || [];

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalAccumulatedHouseProfits = salesRecords.reduce((acc, s) => acc + (s.netProfit || 0), 0);
  const totalPendingSupplierDebt = suppliers.reduce((acc, s) => acc + (s.pendingPayoutUSD || 0), 0);

  const houseCapitalTransactions = (db.transactions || []).filter(t => 
    t.currency === 'USD' &&
    ((t.concept + ' ' + (t.notes || '')).toLowerCase().includes('fondo negocio') || 
     (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('tienda'))
  );
  const netTransferredToCasa = houseCapitalTransactions
    .filter(t => t.type === 'ingreso' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);
  const netInjectedFromCasa = houseCapitalTransactions
    .filter(t => t.type === 'gasto' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, (totalAccumulatedSalesRevenue - totalAccumulatedHouseProfits - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));
}

export function getSavingsFund(): number {
  const db = getRawDatabase();
  return db.savingsFund || 0;
}

export function getStoreFundUSD(): number {
  const db = getRawDatabase();
  return db.storeFundUSD || 0;
}

export function getSavingsFundUSD(): number {
  const db = getRawDatabase();
  return db.savingsFundUSD || 0;
}

export interface CurrencySettings {
  currencyMode: CurrencyMode;
  exchangeRateUSD: number; // e.g. 320 CUP per 1 USD
}

export function getCurrencySettings(): CurrencySettings {
  const db = getRawDatabase();
  return {
    currencyMode: (db.settings?.currencyMode as CurrencyMode) || 'BOTH',
    exchangeRateUSD: db.settings?.exchangeRateUSD || 320
  };
}

export function saveCurrencySettings(settings: Partial<CurrencySettings>): CurrencySettings {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  if (settings.currencyMode !== undefined) db.settings.currencyMode = settings.currencyMode;
  if (settings.exchangeRateUSD !== undefined) db.settings.exchangeRateUSD = settings.exchangeRateUSD;
  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);
  return getCurrencySettings();
}

export function switchCurrencyMode(newMode: CurrencyMode): CurrencySettings {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  db.settings.currencyMode = newMode;
  db.settings.updatedAt = Date.now();

  // Automate transition of inactive currency published products to "draft" (unpublished)
  if (newMode === 'USD') {
    if (db.storeProducts) {
      db.storeProducts = db.storeProducts.map(p => {
        const pCurrency = p.currency || 'CUP';
        if (pCurrency === 'CUP' && p.published) {
          return { ...p, published: false, updatedAt: Date.now() };
        }
        return p;
      });
    }
  } else if (newMode === 'CUP') {
    if (db.storeProducts) {
      db.storeProducts = db.storeProducts.map(p => {
        const pCurrency = p.currency || 'CUP';
        if (pCurrency === 'USD' && p.published) {
          return { ...p, published: false, updatedAt: Date.now() };
        }
        return p;
      });
    }
  }

  saveRawDatabase(db);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cuentacasa-currency-mode-changed', { detail: { newMode } }));
  }

  return getCurrencySettings();
}

export interface UniversalTransferRequest {
  fromAccount: FundAccountType;
  toAccount: FundAccountType;
  amount: number;                // Monto a debitar en la cuenta de origen
  currency?: CurrencyType;       // Moneda de Origen ('CUP' | 'USD')
  targetCurrency?: CurrencyType; // Moneda de Destino ('CUP' | 'USD')
  exchangeRate?: number;         // Tipo de cambio utilizado (1 USD = X CUP)
  targetAmount?: number;         // Monto a acreditar en la moneda de destino
  notes?: string;
}

export function executeUniversalTransfer(req: UniversalTransferRequest): { success: boolean; error?: string } {
  const { 
    fromAccount, 
    toAccount, 
    amount, 
    currency = 'CUP', 
    targetCurrency = currency,
    exchangeRate = 320,
    targetAmount: customTargetAmount,
    notes 
  } = req;

  if (amount <= 0) {
    return { success: false, error: 'Ingresa un monto mayor a 0 para transferir.' };
  }

  const isCrossCurrency = currency !== targetCurrency;

  if (fromAccount === toAccount && !isCrossCurrency) {
    return { success: false, error: 'La cuenta de origen y destino deben ser distintas a menos que estés convirtiendo de moneda.' };
  }

  const db = getRawDatabase();

  // Determine effective target amount
  let finalTargetAmount = customTargetAmount;
  if (finalTargetAmount === undefined || finalTargetAmount <= 0) {
    if (isCrossCurrency) {
      if (currency === 'USD' && targetCurrency === 'CUP') {
        finalTargetAmount = Math.round(amount * exchangeRate * 100) / 100;
      } else if (currency === 'CUP' && targetCurrency === 'USD') {
        finalTargetAmount = Math.round((amount / exchangeRate) * 100) / 100;
      } else {
        finalTargetAmount = amount;
      }
    } else {
      finalTargetAmount = amount;
    }
  }

  // Deduct from Source Account (in source currency)
  if (currency === 'USD') {
    const currentStoreUSD = db.storeFundUSD || 0;
    const currentSavingsUSD = db.savingsFundUSD || 0;

    if (fromAccount === 'tienda' && amount > currentStoreUSD) {
      return { success: false, error: `Saldo insuficiente en Fondo Negocio USD (US$ ${currentStoreUSD}).` };
    }
    if (fromAccount === 'ahorro' && amount > currentSavingsUSD) {
      return { success: false, error: `Saldo insuficiente en Ahorro USD (US$ ${currentSavingsUSD}).` };
    }

    if (fromAccount === 'tienda') db.storeFundUSD = currentStoreUSD - amount;
    if (fromAccount === 'ahorro') db.savingsFundUSD = currentSavingsUSD - amount;
  } else {
    const currentStoreCUP = db.storeFund || 0;
    const currentSavingsCUP = db.savingsFund || 0;

    if (fromAccount === 'tienda' && amount > currentStoreCUP) {
      return { success: false, error: `Saldo insuficiente en Fondo Tienda ($${currentStoreCUP}).` };
    }
    if (fromAccount === 'ahorro' && amount > currentSavingsCUP) {
      return { success: false, error: `Saldo insuficiente en Fondo Ahorro ($${currentSavingsCUP}).` };
    }

    if (fromAccount === 'tienda') db.storeFund = currentStoreCUP - amount;
    if (fromAccount === 'ahorro') db.savingsFund = currentSavingsCUP - amount;
  }

  // Add to Target Account (in target currency)
  if (targetCurrency === 'USD') {
    if (toAccount === 'tienda') db.storeFundUSD = (db.storeFundUSD || 0) + finalTargetAmount;
    if (toAccount === 'ahorro') db.savingsFundUSD = (db.savingsFundUSD || 0) + finalTargetAmount;
  } else {
    if (toAccount === 'tienda') db.storeFund = (db.storeFund || 0) + finalTargetAmount;
    if (toAccount === 'ahorro') db.savingsFund = (db.savingsFund || 0) + finalTargetAmount;
  }

  const fundLabels: Record<FundAccountType, string> = {
    casa: 'Fondo de la Casa',
    tienda: 'Fondo del Negocio',
    ahorro: 'Fondo de Ahorro'
  };

  const fromLabel = fundLabels[fromAccount];
  const toLabel = fundLabels[toAccount];
  const todayISO = new Date().toISOString().split('T')[0];
  const now = Date.now();

  const srcSymbol = currency === 'USD' ? 'US$' : '$';
  const tgtSymbol = targetCurrency === 'USD' ? 'US$' : '$';

  // Dual Registration:
  // 1. Outgoing from Source Account
  const outgoingConcept = isCrossCurrency
    ? `Conversión Saliente: ${fromLabel} (${currency}) ➔ ${toLabel} (${targetCurrency})`
    : `Transferencia Saliente: ${fromLabel} ➔ ${toLabel}`;

  const outgoingNotes = isCrossCurrency
    ? (notes?.trim() ? `${notes.trim()} | ` : '') + `Conversión: Se debitan ${srcSymbol}${amount} ${currency} (Tasa: 1 USD = ${exchangeRate} CUP). Recibirá ${tgtSymbol}${finalTargetAmount} ${targetCurrency} en ${toLabel}.`
    : notes?.trim() || `Transferencia efectuada en ${currency} desde ${fromLabel} hacia ${toLabel}.`;

  const outgoingTx: Transaction = {
    id: `tx-trf-out-${now}`,
    type: 'gasto',
    concept: outgoingConcept,
    category: isCrossCurrency ? 'Conversión de Moneda' : 'Transferencia Entre Cuentas',
    amount: amount,
    currency: currency,
    date: todayISO,
    accountSource: fromAccount,
    notes: outgoingNotes,
    createdAt: now,
    updatedAt: now,
    synced: false
  };

  // 2. Incoming to Destination Account
  const incomingConcept = isCrossCurrency
    ? `Conversión Entrante: ${fromLabel} (${currency}) ➔ ${toLabel} (${targetCurrency})`
    : `Transferencia Entrante: ${fromLabel} ➔ ${toLabel}`;

  const incomingNotes = isCrossCurrency
    ? (notes?.trim() ? `${notes.trim()} | ` : '') + `Conversión: Se acreditan ${tgtSymbol}${finalTargetAmount} ${targetCurrency} (Tasa: 1 USD = ${exchangeRate} CUP) tras debitar ${srcSymbol}${amount} ${currency} de ${fromLabel}.`
    : notes?.trim() || `Ingreso por transferencia en ${currency} recibido desde ${fromLabel}.`;

  const incomingTx: Transaction = {
    id: `tx-trf-in-${now}`,
    type: 'ingreso',
    concept: incomingConcept,
    category: isCrossCurrency ? 'Conversión de Moneda' : 'Transferencia Entre Cuentas',
    amount: finalTargetAmount,
    currency: targetCurrency,
    date: todayISO,
    accountSource: toAccount,
    notes: incomingNotes,
    createdAt: now + 1,
    updatedAt: now + 1,
    synced: false
  };

  db.transactions.unshift(incomingTx, outgoingTx);
  saveRawDatabase(db);
  return { success: true };
}

// Transfer funds from Store Business Fund (Fondo Tienda) to Cuenta Casa Accounting
export function transferStoreFundToCasa(amount: number, notes?: string, currency: CurrencyType = 'CUP'): { success: boolean; error?: string } {
  return executeUniversalTransfer({ fromAccount: 'tienda', toAccount: 'casa', amount, currency, notes });
}

// Transfer funds from House (Cuenta Casa) to Store Business Fund (Fondo Tienda)
export function transferCasaToStoreFund(amount: number, notes?: string, currency: CurrencyType = 'CUP'): { success: boolean; error?: string } {
  return executeUniversalTransfer({ fromAccount: 'casa', toAccount: 'tienda', amount, currency, notes });
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

// ==================== STORE SHIFT & CASH REGISTER FUNCTIONS ====================

export function getStoreShifts(): StoreShiftRecord[] {
  const db = getRawDatabase();
  return db.shifts || [];
}

export function getActiveShift(): StoreShiftRecord | null {
  const shifts = getStoreShifts();
  return shifts.find(s => s.status !== 'cerrado') || null;
}

export function openStoreShift(
  sellerId: string,
  initialCashFund: number,
  notes?: string
): StoreShiftRecord {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const active = shifts.find(s => s.status !== 'cerrado');
  if (active) {
    throw new Error(`Ya existe un turno abierto (${active.sellerName} - @${active.sellerUsername}). Ciérralo antes de abrir uno nuevo.`);
  }

  const currentUser = getLoggedInUser();
  const users = getAppUsers();
  const seller = users.find(u => u.id === sellerId);
  if (!seller) {
    throw new Error('Vendedor no encontrado.');
  }

  const products = getStoreProducts();
  const inventorySnapshots: ShiftInventorySnapshot[] = products.map(p => ({
    productId: p.id,
    productName: p.name,
    initialStock: p.stock || 0,
    addedStock: 0,
    soldByShiftUser: 0,
    soldByOthers: 0,
    expectedFinalStock: p.stock || 0
  }));

  const now = Date.now();
  const newShift: StoreShiftRecord = {
    id: `shift-${now}`,
    sellerId: seller.id,
    sellerName: seller.name,
    sellerUsername: seller.username,
    openedByUserId: currentUser?.id || 'admin',
    openedByName: currentUser?.name || 'Administrador',
    openedAt: now,
    initialCashFund: Number(initialCashFund) || 0,
    totalCashSales: 0,
    totalDigitalSales: 0,
    expectedCashInRegister: Number(initialCashFund) || 0,
    inventorySnapshots,
    status: (currentUser?.id === seller.id || currentUser?.role === 'propietario') ? 'activo' : 'apertura_pendiente',
    sellerAcceptedOpening: (currentUser?.id === seller.id || currentUser?.role === 'propietario'),
    notes: notes?.trim() || ''
  };

  shifts.unshift(newShift);
  db.shifts = shifts;
  saveRawDatabase(db);
  return newShift;
}

export function acceptShiftOpening(shiftId: string): StoreShiftRecord {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) throw new Error('Turno no encontrado.');

  shift.sellerAcceptedOpening = true;
  shift.status = 'activo';
  db.shifts = shifts;
  saveRawDatabase(db);
  return shift;
}

export function recordShiftSaleInActiveShift(
  items: StoreSaleItem[],
  totalAmount: number,
  paymentMethod: 'cash' | 'digital' = 'cash',
  sellerId?: string,
  currency: CurrencyType = 'CUP'
): void {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const activeShift = shifts.find(s => s.status === 'activo' || s.status === 'apertura_pendiente');
  if (!activeShift) return;

  if (currency === 'USD') {
    if (paymentMethod === 'cash') {
      activeShift.totalCashSalesUSD = (activeShift.totalCashSalesUSD || 0) + totalAmount;
    } else {
      activeShift.totalDigitalSalesUSD = (activeShift.totalDigitalSalesUSD || 0) + totalAmount;
    }
    activeShift.expectedCashInRegisterUSD = (activeShift.initialCashFundUSD || 0) + (activeShift.totalCashSalesUSD || 0);
  } else {
    if (paymentMethod === 'cash') {
      activeShift.totalCashSales += totalAmount;
    } else {
      activeShift.totalDigitalSales += totalAmount;
    }
    activeShift.expectedCashInRegister = activeShift.initialCashFund + activeShift.totalCashSales;
  }

  const currentSaleSellerId = sellerId || getLoggedInUser()?.id;
  const isShiftUserSale = currentSaleSellerId === activeShift.sellerId;

  const products = getStoreProducts();

  items.forEach(saleItem => {
    let snap = activeShift.inventorySnapshots.find(s => s.productId === saleItem.productId);
    if (!snap) {
      const prodName = products.find(p => p.id === saleItem.productId)?.name || 'Producto';
      snap = {
        productId: saleItem.productId,
        productName: prodName,
        initialStock: 0,
        addedStock: 0,
        soldByShiftUser: 0,
        soldByOthers: 0,
        expectedFinalStock: 0
      };
      activeShift.inventorySnapshots.push(snap);
    }

    if (isShiftUserSale) {
      snap.soldByShiftUser += saleItem.quantity;
    } else {
      snap.soldByOthers += saleItem.quantity;
    }

    snap.expectedFinalStock = snap.initialStock + snap.addedStock - snap.soldByShiftUser - snap.soldByOthers;
  });

  db.shifts = shifts;
  saveRawDatabase(db);
}

export function addStockToActiveShift(productId: string, addedQty: number): void {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const activeShift = shifts.find(s => s.status === 'activo' || s.status === 'apertura_pendiente');
  if (!activeShift) return;

  const products = getStoreProducts();
  const prod = products.find(p => p.id === productId);

  let snap = activeShift.inventorySnapshots.find(s => s.productId === productId);
  if (!snap) {
    snap = {
      productId: productId,
      productName: prod ? prod.name : 'Producto',
      initialStock: 0,
      addedStock: 0,
      soldByShiftUser: 0,
      soldByOthers: 0,
      expectedFinalStock: 0
    };
    activeShift.inventorySnapshots.push(snap);
  }

  snap.addedStock += addedQty;
  snap.expectedFinalStock = snap.initialStock + snap.addedStock - snap.soldByShiftUser - snap.soldByOthers;

  db.shifts = shifts;
  saveRawDatabase(db);
}

export function closeStoreShift(
  shiftId: string,
  realCashInRegister: number,
  realStockCounts: Record<string, number>,
  notes?: string
): StoreShiftRecord {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) throw new Error('Turno no encontrado.');

  const currentUser = getLoggedInUser();

  shift.closedAt = Date.now();
  shift.closedByUserId = currentUser?.id || 'admin';
  shift.closedByName = currentUser?.name || 'Administrador';
  shift.realCashInRegister = Number(realCashInRegister) || 0;
  shift.cashDifference = shift.realCashInRegister - shift.expectedCashInRegister;

  shift.inventorySnapshots.forEach(snap => {
    const physical = realStockCounts[snap.productId];
    if (physical !== undefined) {
      snap.realFinalStock = physical;
      snap.difference = physical - snap.expectedFinalStock;
    } else {
      snap.realFinalStock = snap.expectedFinalStock;
      snap.difference = 0;
    }
  });

  shift.status = 'cerrado';
  shift.sellerAcceptedClosing = true;
  if (notes) shift.notes = (shift.notes ? `${shift.notes}\n` : '') + `Cierre: ${notes}`;

  db.shifts = shifts;
  saveRawDatabase(db);
  return shift;
}

// ==================== OFFLINE QR SYNC & CART SHARING FUNCTIONS ====================

export interface CartQRPayload {
  type: 'SAMY_STORE_CART_V1';
  timestamp: number;
  customerName?: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    barcode: string;
    name: string;
    price: number;
    costPrice?: number;
    quantity: number;
    currency?: CurrencyType;
    supplierType?: 'propia' | 'proveedor';
    supplierName?: string;
  }>;
}

export function generateCartQRPayload(cart: { product: StoreProduct; quantity: number }[]): string {
  const currentUser = getLoggedInUser();
  const items = cart.map(item => ({
    productId: item.product.id,
    barcode: item.product.barcode,
    name: item.product.name,
    price: item.product.price,
    costPrice: item.product.costPrice || Math.round(item.product.price * 0.7),
    quantity: item.quantity,
    currency: item.product.currency || 'CUP',
    supplierType: item.product.supplierType || 'propia',
    supplierName: item.product.supplierName
  }));

  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const payload: CartQRPayload = {
    type: 'SAMY_STORE_CART_V1',
    timestamp: Date.now(),
    customerName: currentUser?.name || 'Cliente Tienda',
    totalAmount,
    items
  };

  return JSON.stringify(payload);
}

export function generateSyncQRPayload(): string {
  const db = getRawDatabase();
  const currentUser = getLoggedInUser();

  // Compact array schema for products (v2):
  // [id, barcode, name, price, costPrice, stock, currency, category, supplierType, supplierName, updatedAt]
  const p = (db.storeProducts || []).map(prod => [
    prod.id,
    prod.barcode || '',
    prod.name,
    prod.price,
    prod.costPrice || 0,
    prod.stock || 0,
    prod.currency || 'CUP',
    prod.category || '',
    prod.supplierType || 'propia',
    prod.supplierName || '',
    prod.updatedAt || Date.now()
  ]);

  // Compact array schema for sales (last 25 sales to fit in QR size):
  // [id, date, totalAmount, totalCost, netProfit, currency, timestamp]
  const s = (db.storeSales || []).slice(0, 25).map(sale => [
    sale.id,
    sale.date,
    sale.totalAmount,
    sale.totalCost || 0,
    sale.netProfit || 0,
    sale.currency || 'CUP',
    sale.timestamp || Date.now()
  ]);

  // Compact array schema for shifts (last 10 shifts):
  // [id, sellerId, sellerName, status, openedAt, closedAt, initialCashFund, initialCashFundUSD, totalCashSales, totalCashSalesUSD]
  const h = (db.shifts || []).slice(0, 10).map(shift => [
    shift.id,
    shift.sellerId,
    shift.sellerName,
    shift.status,
    shift.openedAt,
    shift.closedAt || 0,
    shift.initialCashFund || 0,
    shift.initialCashFundUSD || 0,
    shift.totalCashSales || 0,
    shift.totalCashSalesUSD || 0
  ]);

  // Compact Settings
  const st = {
    e: db.settings?.exchangeRateUSD || 320,
    m: db.settings?.currencyMode || 'BOTH',
    c: db.settings?.currency || 'CUP'
  };

  const payload = {
    type: 'SAMY_SYNC_V2',
    senderName: currentUser?.name || 'Administrador',
    ts: Date.now(),
    p,
    s,
    h,
    st
  };

  return JSON.stringify(payload);
}

export interface MergeSyncResult {
  success: boolean;
  addedProducts: number;
  updatedProducts: number;
  addedSales: number;
  addedShifts: number;
  updatedShifts: number;
  addedTransactions?: number;
  message: string;
}

export function mergeSyncQRPayload(jsonString: string): MergeSyncResult {
  let rawObj: any;
  try {
    rawObj = JSON.parse(jsonString);
  } catch {
    throw new Error('El código QR escaneado no contiene un formato de sincronización válido de Samy Store.');
  }

  const db = getRawDatabase();
  if (!db.storeProducts) db.storeProducts = [];
  if (!db.storeSales) db.storeSales = [];
  if (!db.shifts) db.shifts = [];
  if (!db.supplierAccounts) db.supplierAccounts = [];
  if (!db.users) db.users = [];
  if (!db.transactions) db.transactions = [];

  let addedProducts = 0;
  let updatedProducts = 0;
  let addedSales = 0;
  let addedShifts = 0;
  let updatedShifts = 0;
  let senderName = 'Otro Dispositivo';

  if (rawObj.type === 'SAMY_SYNC_V2') {
    senderName = rawObj.senderName || senderName;

    // Merge Settings
    if (rawObj.st) {
      db.settings = {
        ...(db.settings || {}),
        exchangeRateUSD: rawObj.st.e || 320,
        currencyMode: rawObj.st.m || 'BOTH',
        currency: rawObj.st.c || 'CUP'
      };
    }

    // Merge Products
    if (Array.isArray(rawObj.p)) {
      rawObj.p.forEach((item: any) => {
        const incProd: StoreProduct = {
          id: item[0],
          barcode: item[1],
          name: item[2],
          price: item[3],
          costPrice: item[4],
          stock: item[5],
          currency: item[6] || 'CUP',
          category: item[7] || '',
          supplierType: item[8] || 'propia',
          supplierName: item[9] || '',
          published: true,
          createdAt: item[10] || Date.now(),
          updatedAt: item[10] || Date.now()
        };

        const idx = db.storeProducts!.findIndex(p => p.id === incProd.id || (p.barcode && incProd.barcode && p.barcode === incProd.barcode));
        if (idx === -1) {
          db.storeProducts!.push(incProd);
          addedProducts++;
        } else {
          const existing = db.storeProducts![idx];
          if ((incProd.updatedAt || 0) >= (existing.updatedAt || 0)) {
            db.storeProducts![idx] = { ...existing, ...incProd };
            updatedProducts++;
          }
        }
      });
    }

    // Merge Sales
    if (Array.isArray(rawObj.s)) {
      rawObj.s.forEach((item: any) => {
        const incSaleId = item[0];
        const exists = db.storeSales!.some(s => s.id === incSaleId);
        if (!exists) {
          db.storeSales!.push({
            id: incSaleId,
            date: item[1],
            items: [],
            totalAmount: item[2],
            totalCost: item[3],
            netProfit: item[4],
            currency: item[5] || 'CUP',
            timestamp: item[6] || Date.now()
          });
          addedSales++;
        }
      });
      db.storeSales.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Merge Shifts
    if (Array.isArray(rawObj.h)) {
      rawObj.h.forEach((item: any) => {
        const shiftId = item[0];
        const idx = db.shifts!.findIndex(s => s.id === shiftId);
        const incShift: any = {
          id: shiftId,
          sellerId: item[1],
          sellerName: item[2],
          status: item[3],
          openedAt: item[4],
          closedAt: item[5],
          initialCashFund: item[6],
          initialCashFundUSD: item[7],
          totalCashSales: item[8],
          totalCashSalesUSD: item[9]
        };

        if (idx === -1) {
          db.shifts!.unshift(incShift);
          addedShifts++;
        } else {
          db.shifts![idx] = { ...db.shifts![idx], ...incShift };
          updatedShifts++;
        }
      });
    }
  } else if (rawObj.type === 'SAMY_STORE_SYNC_V1') {
    senderName = rawObj.senderName || senderName;
    const payload = rawObj as QRSyncPayload;

    if (payload.settings) {
      db.settings = { ...(db.settings || {}), ...(payload.settings || {}) };
    }

    if (Array.isArray(payload.products)) {
      payload.products.forEach(incProd => {
        const idx = db.storeProducts!.findIndex(p => p.id === incProd.id || (p.barcode && incProd.barcode && p.barcode === incProd.barcode));
        if (idx === -1) {
          db.storeProducts!.push(incProd);
          addedProducts++;
        } else {
          const existing = db.storeProducts![idx];
          if ((incProd.updatedAt || 0) >= (existing.updatedAt || 0)) {
            db.storeProducts![idx] = { ...existing, ...incProd };
            updatedProducts++;
          }
        }
      });
    }

    if (Array.isArray(payload.sales)) {
      payload.sales.forEach(incSale => {
        const exists = db.storeSales!.some(s => s.id === incSale.id);
        if (!exists) {
          db.storeSales!.push(incSale);
          addedSales++;
        }
      });
    }
  } else {
    throw new Error('Formato de código QR no compatible.');
  }

  db.lastUpdated = new Date().toISOString();
  saveRawDatabase(db);

  const summaryParts: string[] = [];
  if (addedProducts > 0) summaryParts.push(`${addedProducts} productos nuevos`);
  if (updatedProducts > 0) summaryParts.push(`${updatedProducts} productos actualizados`);
  if (addedSales > 0) summaryParts.push(`${addedSales} ventas sincronizadas`);
  if (addedShifts > 0 || updatedShifts > 0) summaryParts.push(`turnos sincronizados`);

  const summaryMsg = summaryParts.length > 0
    ? `Sincronizados de ${senderName}: ${summaryParts.join(', ')}.`
    : `Tus datos ya estaban al día con ${senderName}.`;

  return {
    success: true,
    addedProducts,
    updatedProducts,
    addedSales,
    addedShifts,
    updatedShifts,
    message: summaryMsg
  };
}


