import { Transaction, StoreProduct, StoreSaleRecord, StoreSaleItem, SupplierAccount, RawDatabase, FundAccountType, AppUser, UserRole, StoreShiftRecord, ShiftInventorySnapshot, QRSyncPayload, CurrencyType, CurrencyMode, CustomerDebtRecord, StoreSalePaymentBreakdown, StoreCustomizationSettings, StoreLogoDisplayMode, StoreModulesConfig, DEFAULT_STORE_MODULES } from '@/types';
export type { StoreCustomizationSettings, StoreLogoDisplayMode, StoreModulesConfig };
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, normalizeHexColor, deriveHarmoniousSecondary, applyBrandPaletteToDocument } from '@/lib/themePalette';
import { updateDocumentIcons } from '@/lib/imageProcessing';
import { DEFAULT_LOGO_FONT } from '@/lib/logoFonts';

/**
 * Determina el espacio de nombres (namespace / tenant) único de la instancia.
 * Permite que diferentes tiendas (ej. 'samystore' vs 'sandrashein' o diferentes subdominios/puertos)
 * NUNCA crucen sus datos en LocalStorage ni pisen su base de datos local.
 */
export function getAppNamespace(): string {
  // 1. Variable de entorno explícita (e.g. NEXT_PUBLIC_APP_INSTANCE_ID='sandrashein' o 'samy')
  const envInstance = process.env.NEXT_PUBLIC_APP_INSTANCE_ID || process.env.NEXT_PUBLIC_STORE_SLUG;
  if (envInstance && envInstance.trim()) {
    return envInstance.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }

  // 2. Extracción dinámica por hostname en el navegador
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname.toLowerCase();
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      const parts = host.split('.');
      if (parts.length >= 3) {
        return parts[0].replace(/[^a-z0-9_-]/g, '_');
      }
      return host.replace(/[^a-z0-9_-]/g, '_');
    }
  }

  // 3. Fallback en desarrollo
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'cuentacasa';
  return appName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export function getScopedStorageKey(baseKey: string): string {
  const ns = getAppNamespace();
  return `${ns}_${baseKey}`;
}

export function getScopedItem(baseKey: string): string | null {
  if (typeof window === 'undefined') return null;
  const scopedKey = getScopedStorageKey(baseKey);
  const val = localStorage.getItem(scopedKey);
  if (val !== null) return val;

  // Migración transparente si existía guardado bajo el nombre global antiguo
  const legacyVal = localStorage.getItem(`cuentacasa_${baseKey}`);
  if (legacyVal !== null) {
    try {
      localStorage.setItem(scopedKey, legacyVal);
    } catch {}
    return legacyVal;
  }
  return null;
}

export function setScopedItem(baseKey: string, value: string): void {
  if (typeof window === 'undefined') return;
  const scopedKey = getScopedStorageKey(baseKey);
  localStorage.setItem(scopedKey, value);
}

export function removeScopedItem(baseKey: string): void {
  if (typeof window === 'undefined') return;
  const scopedKey = getScopedStorageKey(baseKey);
  localStorage.removeItem(scopedKey);
  localStorage.removeItem(`cuentacasa_${baseKey}`);
}

const STORAGE_KEY = 'raw_db_v5';

export const DEFAULT_EXCHANGE_RATE_USD = 320;

export function getLocalISODate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Havana',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: '1234',
    name: 'Administrador',
    role: 'propietario',
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
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

export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF1F5"/>
      <stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
    <linearGradient id="bag" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F43F5E"/>
      <stop offset="100%" stop-color="#DB2777"/>
    </linearGradient>
  </defs>
  <rect width="500" height="500" fill="url(#bg)"/>
  <circle cx="250" cy="225" r="140" fill="#FFFFFF" fill-opacity="0.85"/>
  <path d="M195 185 C195 145 220 120 250 120 C280 120 305 145 305 185" stroke="#BE185D" stroke-width="14" stroke-linecap="round" fill="none"/>
  <rect x="165" y="175" width="170" height="185" rx="26" fill="url(#bag)" />
  <path d="M250 230 L256 248 L274 254 L256 260 L250 278 L244 260 L226 254 L244 248 Z" fill="#FFFFFF"/>
  <circle cx="295" cy="220" r="7" fill="#FDE047"/>
  <circle cx="205" cy="285" r="5" fill="#FFFFFF" fill-opacity="0.8"/>
  <text x="250" y="415" fill="#9D174D" font-size="28" font-family="'Dancing Script', cursive, sans-serif" font-weight="900" text-anchor="middle">Samy Store</text>
  <text x="250" y="445" fill="#BE185D" font-size="13" font-family="sans-serif" font-weight="800" letter-spacing="2" text-anchor="middle">PRODUCTO OFICIAL</text>
</svg>
`)}`;

export const DEFAULT_CATEGORY_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none">
  <defs>
    <linearGradient id="catbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDF2F8"/>
      <stop offset="100%" stop-color="#FCE7F3"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" rx="36" fill="url(#catbg)"/>
  <circle cx="150" cy="135" r="75" fill="#FFFFFF" fill-opacity="0.9"/>
  <path d="M120 115 C120 90 135 75 150 75 C165 75 180 90 180 115" stroke="#DB2777" stroke-width="8" stroke-linecap="round" fill="none"/>
  <rect x="105" y="110" width="90" height="100" rx="18" fill="#DB2777"/>
  <path d="M150 145 L154 156 L165 160 L154 164 L150 175 L146 164 L135 160 L146 156 Z" fill="#FFFFFF"/>
  <text x="150" y="250" fill="#9D174D" font-size="16" font-family="sans-serif" font-weight="800" text-anchor="middle">Samy Store</text>
</svg>
`)}`;

export function formatPhotoUrl(url?: string): string {
  if (!url || !url.trim()) return DEFAULT_PRODUCT_IMAGE;
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
  return trimmed === current || trimmed === 'Del1Al9' || trimmed === '1234' || (!!userPass && trimmed === userPass);
}

// User & Roles Authentication Helpers
export function getAppUsers(): AppUser[] {
  const db = getRawDatabase();
  let users = (Array.isArray(db.users) && db.users.length > 0) ? db.users : [...INITIAL_USERS];

  // Garantizar que el usuario admin / 1234 (propietario) esté siempre disponible para desarrollo y trabajo local
  const adminIdx = users.findIndex(u => u.username.trim().toLowerCase() === 'admin');
  if (adminIdx === -1) {
    const adminUser: AppUser = {
      id: 'usr-admin',
      username: 'admin',
      password: '1234',
      name: 'Administrador',
      role: 'propietario',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    users = [adminUser, ...users];
    db.users = users;
    saveRawDatabase(db);
  } else if (!users[adminIdx].password || users[adminIdx].password !== '1234' || users[adminIdx].role !== 'propietario') {
    users[adminIdx] = {
      ...users[adminIdx],
      password: '1234',
      role: 'propietario',
      updatedAt: Date.now()
    };
    db.users = users;
    saveRawDatabase(db);
  }

  return users;
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
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  // Acceso directo instantáneo y garantizado para el administrador local admin / 1234
  if (cleanUser === 'admin' && cleanPass === '1234') {
    const users = getAppUsers();
    const adminFound = users.find(u => u.username.trim().toLowerCase() === 'admin');
    if (adminFound) return adminFound;
    return {
      id: 'usr-admin',
      username: 'admin',
      password: '1234',
      name: 'Administrador',
      role: 'propietario',
      createdAt: 1700000000000,
      updatedAt: Date.now()
    };
  }

  const users = getAppUsers();
  const found = users.find(u => u.username.trim().toLowerCase() === cleanUser && u.password.trim() === cleanPass);
  return found || null;
}

export function getLoggedInUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = getScopedItem('active_user') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(getScopedStorageKey('active_user')) : null);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setLoggedInUser(user: AppUser | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    removeScopedItem('active_user');
    removeScopedItem('auth');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(getScopedStorageKey('active_user'));
      sessionStorage.removeItem(getScopedStorageKey('auth'));
      sessionStorage.removeItem('cuentacasa_active_user');
      sessionStorage.removeItem('cuentacasa_auth');
    }
  } else {
    const serialized = JSON.stringify(user);
    setScopedItem('active_user', serialized);
    setScopedItem('auth', 'true');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(getScopedStorageKey('active_user'), serialized);
      sessionStorage.setItem(getScopedStorageKey('auth'), 'true');
    }
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
    const raw = getScopedItem(STORAGE_KEY);
    if (!raw) {
      saveRawDatabase(INITIAL_DB);
      return INITIAL_DB;
    }
    if (memoryDbCache && memoryRawString === raw) {
      return memoryDbCache;
    }
    const parsed = JSON.parse(raw);
    let needsMigration = false;
    const rawTxs = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    const sanitizedTxs = rawTxs.map((tx: any) => {
      if (tx && (tx.category === 'Ganancia Tienda' || (tx.id && tx.id.startsWith('tx-profit-'))) && tx.accountSource === 'casa') {
        needsMigration = true;
        return { ...tx, accountSource: 'tienda' };
      }
      return tx;
    });

    const db: RawDatabase = {
      ...parsed,
      transactions: sanitizedTxs,
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
    if (needsMigration) {
      saveRawDatabase(db);
    }
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
  try {
    setScopedItem(STORAGE_KEY, rawStr);
  } catch (quotaErr) {
    // Free up space by clearing the offline safety snapshot and retry
    try {
      removeScopedItem('offline_safety_snapshot');
      setScopedItem(STORAGE_KEY, rawStr);
    } catch (retryErr) {
      console.error('LocalStorage quota exceeded:', retryErr);
    }
  }
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

  const now = Date.now();
  const resetDb: RawDatabase = {
    version: '1.3.0',
    lastUpdated: new Date().toISOString(),
    settings: {
      currency: '$',
      currencyMode: 'CUP',
      appName: 'Samy Store',
      autoSync: true,
      masterPassword: 'Del1Al9'
    },
    transactions: [],
    storeProducts: [],
    storeSales: [],
    supplierAccounts: [],
    shifts: [],
    users: currentUsers.length > 0 ? currentUsers : INITIAL_USERS,
    storeFund: 0,
    storeFundUSD: 0,
    savingsFund: 0,
    savingsFundUSD: 0,
    deletedIds: [],
    deletedProductIds: [],
    deletedSupplierIds: [],
    deletedUserIds: [],
    pendingReset: true,
    pendingResetAt: now,
    lastSync: undefined
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
  applyTransactionFundEffect(db, newTx, 1);
  db.transactions.unshift(newTx);
  saveRawDatabase(db);
  return newTx;
}

function applyTransactionFundEffect(db: RawDatabase, tx: Transaction, multiplier: 1 | -1): void {
  const source = tx.accountSource || 'casa';
  const curr = tx.currency || 'CUP';
  const signedAmount = (tx.type === 'ingreso' ? Number(tx.amount || 0) : -Number(tx.amount || 0)) * multiplier;

  if (source === 'tienda') {
    if (curr === 'USD') {
      db.storeFundUSD = Math.max(0, (db.storeFundUSD || 0) + signedAmount);
    } else {
      db.storeFund = Math.max(0, (db.storeFund || 0) + signedAmount);
    }
  } else if (source === 'ahorro') {
    if (curr === 'USD') {
      db.savingsFundUSD = Math.max(0, (db.savingsFundUSD || 0) + signedAmount);
    } else {
      db.savingsFund = Math.max(0, (db.savingsFund || 0) + signedAmount);
    }
  }
}

// Update transaction
export function updateTransaction(tx: Transaction): void {
  const db = getRawDatabase();
  const index = db.transactions.findIndex(t => t.id === tx.id);
  if (index !== -1) {
    const previousTx = db.transactions[index];
    applyTransactionFundEffect(db, previousTx, -1);
    db.transactions[index] = {
      ...tx,
      updatedAt: Date.now(),
      synced: false
    };
    applyTransactionFundEffect(db, db.transactions[index], 1);
    saveRawDatabase(db);
  }
}

// Delete transaction
export function deleteTransaction(id: string): void {
  const db = getRawDatabase();
  const targetTx = db.transactions.find(t => t.id === id);
  const idsToDelete = new Set<string>([id]);

  if (targetTx) {
    applyTransactionFundEffect(db, targetTx, -1);

    // If deleting one side of a dual transfer, also reverse and remove its paired counterpart
    let pairedId: string | null = null;
    if (id.startsWith('tx-trf-out-')) {
      pairedId = id.replace('tx-trf-out-', 'tx-trf-in-');
    } else if (id.startsWith('tx-trf-in-')) {
      pairedId = id.replace('tx-trf-in-', 'tx-trf-out-');
    }
    if (pairedId) {
      const pairedTx = db.transactions.find(t => t.id === pairedId);
      if (pairedTx) {
        applyTransactionFundEffect(db, pairedTx, -1);
        idsToDelete.add(pairedId);
      }
    }
  }

  db.transactions = db.transactions.filter(t => !idsToDelete.has(t.id));
  if (!db.deletedIds) db.deletedIds = [];
  idsToDelete.forEach(delId => {
    if (!db.deletedIds!.includes(delId)) {
      db.deletedIds!.push(delId);
    }
  });
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

  const currentSettings = getCurrencySettings();
  const rate = currentSettings.exchangeRateUSD || DEFAULT_EXCHANGE_RATE_USD;
  const pCurr = product.currency === 'USD' ? 'USD' : 'CUP';

  let computedPriceUSD: number;
  let computedCostPriceUSD: number;

  if (pCurr === 'USD') {
    computedPriceUSD = product.price;
    computedCostPriceUSD = product.costPrice || 0;
  } else {
    computedPriceUSD = product.priceUSD !== undefined ? product.priceUSD : Math.round((product.price / rate) * 10000) / 10000;
    computedCostPriceUSD = product.costPriceUSD !== undefined ? product.costPriceUSD : Math.round(((product.costPrice || 0) / rate) * 10000) / 10000;
  }

  const newProduct: StoreProduct = {
    ...product,
    barcode: cleanBarcode,
    currency: pCurr,
    priceUSD: computedPriceUSD,
    costPriceUSD: computedCostPriceUSD,
    ratingScore: existingIndex !== -1 ? (product.ratingScore || db.storeProducts[existingIndex].ratingScore || initialRatingScore) : initialRatingScore,
    ratingCount: existingIndex !== -1 ? (product.ratingCount || db.storeProducts[existingIndex].ratingCount || initialRatingCount) : initialRatingCount,
    id: existingIndex !== -1 ? db.storeProducts[existingIndex].id : (product.id || `sp-${Date.now()}`),
    createdAt: existingIndex !== -1 ? db.storeProducts[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now()
  };

  const oldStock = existingIndex !== -1 ? (db.storeProducts[existingIndex].stock || 0) : 0;
  const newStock = product.stock || 0;
  const addedQty = existingIndex !== -1 ? (newStock - oldStock) : newStock;
  const isConsignment = newProduct.supplierType === 'proveedor';
  const totalInvestment = Math.round((addedQty > 0 ? addedQty : 0) * (newProduct.costPrice || 0) * 100) / 100;

  // Strict Money Control: Validate available liquidity in Fondo del Negocio before purchasing own merchandise
  if (addedQty > 0 && (newProduct.costPrice || 0) > 0 && !isConsignment) {
    const currentFund = pCurr === 'USD' ? (db.storeFundUSD || 0) : (db.storeFund || 0);
    if (totalInvestment > currentFund) {
      const currSym = pCurr === 'USD' ? 'US$' : '$';
      throw new Error(
        `Saldo insuficiente en el Fondo del Negocio (${currSym}${currentFund} disponible, ${currSym}${totalInvestment} requerido para ${addedQty}u de ${newProduct.name}). ` +
        `Si el dinero provino del exterior ("el aire"), primero agrégalo como Ingreso en Casa, luego transfiérelo al Fondo del Negocio antes de comprar mercancía.`
      );
    }
  }

  if (existingIndex !== -1) {
    db.storeProducts[existingIndex] = newProduct;
  } else {
    db.storeProducts.push(newProduct);
  }

  // Deduct cost of own merchandise directly from business fund
  if (addedQty > 0 && (newProduct.costPrice || 0) > 0 && !isConsignment) {
    if (pCurr === 'USD') {
      db.storeFundUSD = Math.max(0, (db.storeFundUSD || 0) - totalInvestment);
    } else {
      db.storeFund = Math.max(0, (db.storeFund || 0) - totalInvestment);
    }
  }

  saveRawDatabase(db);

  // Automatically update active shift snapshot if stock was increased or added
  if (addedQty > 0) {
    addStockToActiveShift(newProduct.id, addedQty);

    // Register transaction movement for added merchandise into store account log
    if ((newProduct.costPrice || 0) > 0) {
      const todayISO = getLocalISODate();
      const now = Date.now();

      const currSym = (newProduct.currency || 'CUP') === 'USD' ? 'US$' : '$';
      const buyTicketNotes = `[TICKET_DE_COMPRA]\n• ${addedQty}x ${newProduct.name} (${currSym}${newProduct.costPrice} c/u = ${currSym}${totalInvestment})\n-------------------\nTotal: ${currSym}${totalInvestment} | Moneda: ${newProduct.currency || 'CUP'} | Proveedor: ${newProduct.supplierName || 'Propia'} | Stock Resultante: ${newProduct.stock || addedQty}u`;

      const addStockTx: Transaction = {
        id: `tx-stock-add-${now}`,
        type: 'gasto',
        concept: `Entrada de Mercancía: ${newProduct.name} (+${addedQty}u)`,
        category: isConsignment ? 'Mercancía Consignación' : 'Compra de Mercancía',
        amount: totalInvestment,
        currency: newProduct.currency || 'CUP',
        date: todayISO,
        accountSource: 'tienda',
        notes: buyTicketNotes,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift(addStockTx);

      // Registrar lote / capa de inventario FIFO
      if (!newProduct.batches) newProduct.batches = [];
      newProduct.batches.push({
        id: `batch-${now}`,
        barcode: newProduct.barcode,
        costPrice: newProduct.costPrice || 0,
        costPriceUSD: newProduct.costPriceUSD || 0,
        initialStock: addedQty,
        remainingStock: addedQty,
        supplierName: newProduct.supplierName,
        createdAt: now
      });

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

export function getCasaAvailableBalance(currency: CurrencyType = 'CUP'): number {
  const db = getRawDatabase();
  const casaTxList = (db.transactions || []).filter(t => {
    if (t.accountSource) return t.accountSource === 'casa';
    const isStoreTx = (t.category || '').toLowerCase().includes('tienda') || 
                      (t.category || '').toLowerCase().includes('fondo tienda') || 
                      (t.category || '').toLowerCase().includes('proveedor') ||
                      (t.concept || '').toLowerCase().includes('venta pos');
    return !isStoreTx;
  });
  return casaTxList.reduce((acc, t) => {
    const tCurr = t.currency || 'CUP';
    if (tCurr !== currency) return acc;
    return acc + (t.type === 'ingreso' ? t.amount : -t.amount);
  }, 0);
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

  const isUSD = currency === 'USD';
  const pendingDebt = isUSD ? (supplier.pendingPayoutUSD || 0) : (supplier.pendingPayout || 0);

  const payAmount = Math.min(pendingDebt, amount);
  if (payAmount <= 0) {
    return { success: false, error: `El proveedor no tiene saldo pendiente por liquidar en ${isUSD ? 'USD' : 'CUP'}.` };
  }

  // Validar liquidez disponible según origen y moneda
  const currSym = isUSD ? 'US$' : '$';
  if (source === 'negocio') {
    const availFund = isUSD ? (db.storeFundUSD || 0) : (db.storeFund || 0);
    if (payAmount > availFund) {
      return { success: false, error: `Saldo insuficiente en Fondo del Negocio (${currSym}${availFund} disponible) para liquidar ${currSym}${payAmount}.` };
    }
  } else if (source === 'casa') {
    const availCasa = getCasaAvailableBalance(currency);
    if (payAmount > availCasa) {
      return { success: false, error: `Saldo insuficiente en Fondo de la Casa (${currSym}${availCasa} disponible) para financiar el pago al proveedor.` };
    }
  }

  // Actualizar deuda retenida y total histórico pagado según moneda
  if (isUSD) {
    supplier.pendingPayoutUSD = Math.max(0, (supplier.pendingPayoutUSD || 0) - payAmount);
    supplier.totalPaidUSD = (supplier.totalPaidUSD || 0) + payAmount;
  } else {
    supplier.pendingPayout = Math.max(0, (supplier.pendingPayout || 0) - payAmount);
    supplier.totalPaid = (supplier.totalPaid || 0) + payAmount;
  }
  supplier.updatedAt = Date.now();

  const todayISO = getLocalISODate();
  const now = Date.now();
  if (!db.transactions) db.transactions = [];

  // Recopilar artículos vendidos de este proveedor desde la última liquidación
  const prevPayoutTx = (db.transactions || []).find(t => 
    (t.category === 'Pago Proveedor Consignación' || (t.concept && t.concept.includes('Liquidación'))) &&
    (t.concept || '').toLowerCase().includes(supplier.name.toLowerCase())
  );
  const lastPayoutTime = prevPayoutTx ? (prevPayoutTx.createdAt || 0) : 0;

  const supplierSales = (db.storeSales || []).filter(s => (s.timestamp || 0) >= lastPayoutTime);
  const soldItemsMap: { [prodKey: string]: { name: string; qty: number; costPrice: number; totalCost: number; currency: string } } = {};

  supplierSales.forEach(sale => {
    (sale.items || []).forEach(item => {
      if (item.supplierType === 'proveedor' && (item.supplierName || '').toLowerCase() === supplier.name.toLowerCase()) {
        const itemCurr = item.currency || (isUSD ? 'USD' : 'CUP');
        if (itemCurr === currency) {
          const key = `${item.productId || item.name}_${item.costPrice}`;
          if (!soldItemsMap[key]) {
            soldItemsMap[key] = {
              name: item.name,
              qty: 0,
              costPrice: item.costPrice,
              totalCost: 0,
              currency: itemCurr
            };
          }
          soldItemsMap[key].qty += item.quantity;
          soldItemsMap[key].totalCost += item.quantity * item.costPrice;
        }
      }
    });
  });

  const soldItemsList = Object.values(soldItemsMap);
  let itemsTicketText = '';
  if (soldItemsList.length > 0) {
    itemsTicketText = soldItemsList
      .map(it => `• ${it.qty}x ${it.name} (${currSym}${it.costPrice} c/u = ${currSym}${it.totalCost})`)
      .join('\n');
  } else {
    itemsTicketText = `• Liquidación a cuenta de deuda acumulada con ${supplier.name}`;
  }

  const payoutTicketNotes = `[TICKET_DE_LIQUIDACION]\n${itemsTicketText}\n-------------------\nTotal Liquidado: ${currSym}${payAmount} | Moneda: ${currency} | Proveedor: ${supplier.name} | Origen: ${source === 'casa' ? 'Fondo de la Casa' : 'Fondo del Negocio'}`;

  if (source === 'casa') {
    // Registro doble: Salida de Casa y Aporte Entrante a Tienda
    const houseExpenseTx: Transaction = {
      id: `tx-sup-pay-casa-${now}`,
      type: 'gasto',
      concept: `Liquidación Proveedor: ${supplier.name} (${isUSD ? 'USD' : 'CUP'} desde Casa)`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      currency: currency,
      date: todayISO,
      accountSource: 'casa',
      notes: payoutTicketNotes,
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
      notes: payoutTicketNotes,
      createdAt: now + 1,
      updatedAt: now + 1,
      synced: false
    };

    db.transactions.unshift(houseExpenseTx, storeIncomeTx);
  } else {
    // Pago directo desde el Fondo del Negocio (Tienda)
    if (isUSD) {
      db.storeFundUSD = Math.max(0, (db.storeFundUSD || 0) - payAmount);
    } else {
      db.storeFund = Math.max(0, (db.storeFund || 0) - payAmount);
    }

    const storeExpenseTx: Transaction = {
      id: `tx-sup-pay-store-${now}`,
      type: 'gasto',
      concept: `Liquidación a Proveedor: ${supplier.name} (${isUSD ? 'USD' : 'CUP'})`,
      category: 'Pago Proveedor Consignación',
      amount: payAmount,
      currency: currency,
      date: todayISO,
      accountSource: 'tienda',
      notes: payoutTicketNotes,
      createdAt: now,
      updatedAt: now,
      synced: false
    };

    db.transactions.unshift(storeExpenseTx);
  }

  saveRawDatabase(db);
  return { success: true, message: `Se liquidaron ${currSym}${payAmount} a la cuenta del proveedor ${supplier.name}.` };
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

  const currentUser = getLoggedInUser();
  const activeShift = getActiveShift();
  const effectiveSellerId = saleData.sellerId || activeShift?.sellerId || currentUser?.id || 'usr-admin';
  const effectiveSellerUsername = saleData.sellerUsername || activeShift?.sellerUsername || currentUser?.username || 'admin';
  const effectiveSellerName = saleData.sellerName || activeShift?.sellerName || currentUser?.name || (currentUser?.username ? `@${currentUser.username}` : 'Administrador');

  // Calcular desglose de cobro por moneda si hay ítems mixtos o desglosados
  let subtotalCUPFromItems = 0;
  let subtotalUSDFromItems = 0;

  saleData.items.forEach(item => {
    const itemCurr = item.currency || saleData.currency || 'CUP';
    const sub = item.subtotal !== undefined ? item.subtotal : (item.unitPrice * item.quantity);
    if (itemCurr === 'USD') {
      subtotalUSDFromItems += sub;
    } else {
      subtotalCUPFromItems += sub;
    }
  });

  const hasMixedItems = subtotalCUPFromItems > 0 && subtotalUSDFromItems > 0;
  const isExplicitMixed = saleData.currency === 'MIXED' || (saleData.totalAmountCUP !== undefined && saleData.totalAmountUSD !== undefined);

  // Determinar si registramos doble transacción o transacción única
  const isMixedSale = hasMixedItems || isExplicitMixed;

  const totalAmountCUP = saleData.totalAmountCUP !== undefined ? saleData.totalAmountCUP : subtotalCUPFromItems;
  const totalAmountUSD = saleData.totalAmountUSD !== undefined ? saleData.totalAmountUSD : subtotalUSDFromItems;

  const saleCurrency: CurrencyType = isMixedSale ? 'MIXED' : (saleData.currency || (subtotalUSDFromItems > 0 ? 'USD' : 'CUP'));

  const saleRecord: StoreSaleRecord = {
    ...saleData,
    sellerId: effectiveSellerId,
    sellerUsername: effectiveSellerUsername,
    sellerName: effectiveSellerName,
    currency: saleCurrency,
    totalAmountCUP: isMixedSale ? totalAmountCUP : (saleCurrency === 'CUP' ? saleData.totalAmount : 0),
    totalAmountUSD: isMixedSale ? totalAmountUSD : (saleCurrency === 'USD' ? saleData.totalAmount : 0),
    id: `sale-${Date.now()}`,
    timestamp: Date.now()
  };

  db.storeSales.unshift(saleRecord);

  // Actualizar inventario, contadores de ventas y cuentas de proveedores
  saleData.items.forEach(item => {
    const prod = db.storeProducts!.find(p => p.id === item.productId || p.barcode === item.barcode);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.salesCount = (prod.salesCount || 0) + item.quantity;
      
      // Consumir capas de lotes FIFO si existen
      if (prod.batches && prod.batches.length > 0) {
        let toTake = item.quantity;
        for (const batch of prod.batches) {
          if (toTake <= 0) break;
          if (batch.remainingStock > 0) {
            const deduct = Math.min(batch.remainingStock, toTake);
            batch.remainingStock -= deduct;
            toTake -= deduct;
          }
        }
      }
      
      prod.updatedAt = Date.now();
    }

    const itemCostTotal = Math.round(item.costPrice * item.quantity * 100) / 100;
    const itemCurr = item.currency || (saleCurrency === 'USD' ? 'USD' : 'CUP');

    // Registrar costo acumulado adeudado a proveedores en consignación
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
      if (itemCurr === 'USD') {
        supplier.pendingPayoutUSD = Math.round(((supplier.pendingPayoutUSD || 0) + itemCostTotal) * 100) / 100;
      } else {
        supplier.pendingPayout = Math.round(((supplier.pendingPayout || 0) + itemCostTotal) * 100) / 100;
      }
      supplier.updatedAt = Date.now();
    }
  });

  // Cálculo matemático estricto de dinero líquido efectivamente recaudado de inmediato (excluyendo fiados)
  let immediateCollectedCUP = 0;
  let immediateCollectedUSD = 0;

  if (saleData.paymentBreakdown) {
    const bd = saleData.paymentBreakdown;
    immediateCollectedCUP = Math.round(((bd.cashCUP || 0) + (bd.transferCUP || 0)) * 100) / 100;
    immediateCollectedUSD = Math.round((bd.cashUSD || 0) * 100) / 100;
  } else if (saleData.paymentMethod === 'fiado') {
    immediateCollectedCUP = 0;
    immediateCollectedUSD = 0;
  } else if (isMixedSale) {
    immediateCollectedCUP = Math.round(totalAmountCUP * 100) / 100;
    immediateCollectedUSD = Math.round(totalAmountUSD * 100) / 100;
  } else if (saleCurrency === 'USD') {
    immediateCollectedUSD = Math.round(saleData.totalAmount * 100) / 100;
  } else {
    immediateCollectedCUP = Math.round(saleData.totalAmount * 100) / 100;
  }

  // Incrementar el fondo de liquidez del negocio ÚNICAMENTE con el dinero real cobrado de inmediato
  if (immediateCollectedCUP > 0) {
    db.storeFund = Math.round(((db.storeFund || 0) + immediateCollectedCUP) * 100) / 100;
  }
  if (immediateCollectedUSD > 0) {
    db.storeFundUSD = Math.round(((db.storeFundUSD || 0) + immediateCollectedUSD) * 100) / 100;
  }

  const totalCount = saleData.items.reduce((s, i) => s + i.quantity, 0);
  const conceptSummary = totalCount === 1 
    ? `tienda: venta de: ${saleData.items[0]?.name || '1 artículo'}` 
    : `tienda: venta de: ${totalCount} artículos`;

  const now = Date.now();

  // Desglose de ítems para el ticket de venta
  const ticketItemsList = saleData.items
    .map(i => `• ${i.quantity}x ${i.name} (${i.currency === 'USD' ? 'US$' : '$'}${i.unitPrice} c/u = ${i.currency === 'USD' ? 'US$' : '$'}${i.quantity * i.unitPrice})`)
    .join('\n');

  let breakdownSummary = '';
  if (saleData.paymentBreakdown) {
    const bd = saleData.paymentBreakdown;
    const parts: string[] = [];
    if (bd.cashCUP > 0) parts.push(`Efectivo: $${bd.cashCUP} CUP`);
    if (bd.transferCUP > 0) parts.push(`Transferencia: $${bd.transferCUP} CUP${bd.transferRef ? ` (Ref: ${bd.transferRef})` : ''}`);
    if (bd.cashUSD > 0) parts.push(`Efectivo: US$${bd.cashUSD} USD`);
    if (bd.debtCUP > 0) parts.push(`Fiado CUP (${bd.debtTypeCUP || 'efectivo'}): $${bd.debtCUP} a ${bd.customerName || 'Cliente'}`);
    if (bd.debtUSD > 0) parts.push(`Fiado USD: US$${bd.debtUSD} a ${bd.customerName || 'Cliente'}`);
    breakdownSummary = parts.length > 0 ? `\nDesglose de Cobro: ${parts.join(' | ')}` : '';

    // Si hay deuda o fiado pendiente, registrar en cuentas por cobrar
    if (bd.debtCUP > 0 || bd.debtUSD > 0) {
      if (!db.customerDebts) db.customerDebts = [];
      const newDebt: CustomerDebtRecord = {
        id: `debt-${now}-${Math.random().toString(36).substring(2, 6)}`,
        saleId: saleRecord.id,
        customerName: bd.customerName?.trim() || 'Cliente Sin Nombre',
        customerPhone: bd.customerPhone?.trim(),
        debtTypeCUP: bd.debtTypeCUP || (bd.transferCUP > 0 ? 'transferencia' : 'efectivo'),
        amountCUP: Math.round((bd.debtCUP || 0) * 100) / 100,
        amountUSD: Math.round((bd.debtUSD || 0) * 100) / 100,
        paidCUP: 0,
        paidUSD: 0,
        status: 'pendiente',
        date: saleData.date,
        timestamp: now,
        updatedAt: now,
        notes: bd.notes
      };
      db.customerDebts.unshift(newDebt);
    }
  }

  // Registrar transacciones contables en el libro mayor reflejando exactamente el dinero cobrado
  if (isMixedSale) {
    const formattedTicketNotes = `[TICKET_DE_VENTA_MIXTO]\n${ticketItemsList}\n-------------------\nTotal CUP: $${totalAmountCUP} | Total USD: US$${totalAmountUSD} | Vendedor: ${effectiveSellerName}${breakdownSummary}`;

    if (immediateCollectedCUP > 0) {
      const storeSaleTxCUP: Transaction = {
        id: `tx-sale-store-cup-${now}`,
        type: 'ingreso',
        concept: `${conceptSummary} (CUP)`,
        category: 'Ventas del Negocio',
        amount: immediateCollectedCUP,
        currency: 'CUP',
        date: saleData.date,
        accountSource: 'tienda',
        notes: formattedTicketNotes,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      db.transactions.unshift(storeSaleTxCUP);
    }

    if (immediateCollectedUSD > 0) {
      const storeSaleTxUSD: Transaction = {
        id: `tx-sale-store-usd-${now + 1}`,
        type: 'ingreso',
        concept: `${conceptSummary} (USD)`,
        category: 'Ventas del Negocio',
        amount: immediateCollectedUSD,
        currency: 'USD',
        date: saleData.date,
        accountSource: 'tienda',
        notes: formattedTicketNotes,
        createdAt: now + 1,
        updatedAt: now + 1,
        synced: false
      };
      db.transactions.unshift(storeSaleTxUSD);
    }

    // Registro informativo si fue venta 100% fiada sin cobro inmediato
    if (immediateCollectedCUP === 0 && immediateCollectedUSD === 0) {
      const storeSaleCreditTx: Transaction = {
        id: `tx-sale-store-credit-${now}`,
        type: 'ingreso',
        concept: `${conceptSummary} (A Crédito / Fiado)`,
        category: 'Ventas a Crédito',
        amount: 0,
        currency: 'MIXED',
        date: saleData.date,
        accountSource: 'tienda',
        notes: formattedTicketNotes + '\n(Pendiente de cobro en Cuentas por Cobrar)',
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      db.transactions.unshift(storeSaleCreditTx);
    }
  } else {
    const currSymbol = saleCurrency === 'USD' ? 'US$' : '$';
    const formattedTicketNotes = `[TICKET_DE_VENTA]\n${ticketItemsList}\n-------------------\nTotal: ${currSymbol}${saleData.totalAmount} | Moneda: ${saleCurrency} | Vendedor: ${effectiveSellerName}${breakdownSummary}`;
    const immediateAmount = saleCurrency === 'USD' ? immediateCollectedUSD : immediateCollectedCUP;

    if (immediateAmount > 0) {
      const storeSaleTx: Transaction = {
        id: `tx-sale-store-${now}`,
        type: 'ingreso',
        concept: conceptSummary,
        category: 'Ventas del Negocio',
        amount: immediateAmount,
        currency: saleCurrency === 'USD' ? 'USD' : 'CUP',
        date: saleData.date,
        accountSource: 'tienda',
        notes: formattedTicketNotes,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      db.transactions.unshift(storeSaleTx);
    } else {
      // Venta a crédito total: se anota con monto 0 en libro mayor para no duplicar ingresos cuando el cliente pague
      const storeSaleCreditTx: Transaction = {
        id: `tx-sale-store-credit-${now}`,
        type: 'ingreso',
        concept: `${conceptSummary} (A Crédito / Fiado)`,
        category: 'Ventas a Crédito',
        amount: 0,
        currency: saleCurrency === 'USD' ? 'USD' : 'CUP',
        date: saleData.date,
        accountSource: 'tienda',
        notes: formattedTicketNotes + `\n(Monto adeudado de ${currSymbol}${saleData.totalAmount} a cobrar por ${saleData.paymentBreakdown?.customerName || 'Cliente'})`,
        createdAt: now,
        updatedAt: now,
        synced: false
      };
      db.transactions.unshift(storeSaleCreditTx);
    }
  }

  saveRawDatabase(db);
  recordShiftSaleInActiveShift(
    saleData.items,
    saleData.totalAmount,
    saleData.paymentMethod === 'transferencia' ? 'digital' : 'cash',
    saleData.sellerId,
    saleCurrency,
    saleData.totalAmountCUP,
    saleData.totalAmountUSD,
    saleData.paymentBreakdown
  );
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
  if (db.storeFund !== undefined && !isNaN(Number(db.storeFund))) {
    return Number(db.storeFund);
  }
  const salesRecords = (db.storeSales || []).filter(s => (s.currency || 'CUP') === 'CUP');
  const suppliers = db.supplierAccounts || [];

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
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

  return Math.max(0, (totalAccumulatedSalesRevenue - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));
}

export function getCalculatedStoreFundUSD(): number {
  const db = getRawDatabase();
  if (db.storeFundUSD !== undefined && !isNaN(Number(db.storeFundUSD))) {
    return Number(db.storeFundUSD);
  }
  const salesRecords = (db.storeSales || []).filter(s => s.currency === 'USD');
  const suppliers = db.supplierAccounts || [];

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
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

  return Math.max(0, (totalAccumulatedSalesRevenue - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));
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
  exchangeRateUSD: number; // e.g. 675 CUP per 1 USD
  exchangeRateTrend?: 'up' | 'down' | 'stable';
  autoSyncElToque?: boolean;
  lastElToqueSync?: number;
  usdIndexedPricing?: boolean;
}

export function getCurrencySettings(): CurrencySettings {
  const db = getRawDatabase();
  return {
    currencyMode: (db.settings?.currencyMode as CurrencyMode) || 'CUP',
    exchangeRateUSD: db.settings?.exchangeRateUSD || DEFAULT_EXCHANGE_RATE_USD,
    exchangeRateTrend: db.settings?.exchangeRateTrend || 'stable',
    autoSyncElToque: db.settings?.autoSyncElToque !== undefined ? db.settings.autoSyncElToque : true,
    lastElToqueSync: db.settings?.lastElToqueSync || 0,
    usdIndexedPricing: db.settings?.usdIndexedPricing !== undefined ? db.settings.usdIndexedPricing : false
  };
}

export function saveCurrencySettings(settings: Partial<CurrencySettings>): CurrencySettings {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  if (settings.currencyMode !== undefined) db.settings.currencyMode = settings.currencyMode;
  if (settings.exchangeRateUSD !== undefined) db.settings.exchangeRateUSD = settings.exchangeRateUSD;
  if (settings.exchangeRateTrend !== undefined) db.settings.exchangeRateTrend = settings.exchangeRateTrend;
  if (settings.autoSyncElToque !== undefined) db.settings.autoSyncElToque = settings.autoSyncElToque;
  if (settings.lastElToqueSync !== undefined) db.settings.lastElToqueSync = settings.lastElToqueSync;
  if (settings.usdIndexedPricing !== undefined) db.settings.usdIndexedPricing = settings.usdIndexedPricing;

  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cuentacasa-currency-settings-changed', { detail: getCurrencySettings() }));
  }

  return getCurrencySettings();
}

export async function syncElToqueExchangeRate(): Promise<CurrencySettings> {
  const current = getCurrencySettings();
  if (!current.autoSyncElToque) {
    return current;
  }

  try {
    const res = await fetch(`/api/eltoque?current=${current.exchangeRateUSD}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.synced && data.usd && !isNaN(data.usd)) {
        return saveCurrencySettings({
          exchangeRateUSD: data.usd,
          exchangeRateTrend: data.trend || 'stable',
          lastElToqueSync: Date.now()
        });
      }
    }
  } catch (err) {
    // Offline or network error
  }
  return current;
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

export function getPrimaryThemeColor(): string {
  const db = getRawDatabase();
  if (db.settings?.primaryColor) {
    return normalizeHexColor(db.settings.primaryColor, DEFAULT_PRIMARY_COLOR);
  }
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cuentacasa_theme_color');
    if (cached) return normalizeHexColor(cached, DEFAULT_PRIMARY_COLOR);
  }
  return DEFAULT_PRIMARY_COLOR;
}

export function getSecondaryThemeColor(): string {
  const db = getRawDatabase();
  if (db.settings?.secondaryColor) {
    return normalizeHexColor(db.settings.secondaryColor, DEFAULT_SECONDARY_COLOR);
  }
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('cuentacasa_secondary_theme_color');
    if (cached) return normalizeHexColor(cached, DEFAULT_SECONDARY_COLOR);
  }
  return deriveHarmoniousSecondary(getPrimaryThemeColor());
}

export function hasCustomSecondaryThemeColor(): boolean {
  const db = getRawDatabase();
  if (db.settings?.secondaryColor) return true;
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('cuentacasa_secondary_theme_color');
  }
  return false;
}

export function savePrimaryThemeColor(hexColor: string, secondaryHexColor?: string | null): string {
  const normalized = normalizeHexColor(hexColor, DEFAULT_PRIMARY_COLOR);
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  db.settings.primaryColor = normalized;

  let resolvedSec: string | undefined = db.settings.secondaryColor;
  if (secondaryHexColor === null) {
    delete db.settings.secondaryColor;
    resolvedSec = undefined;
  } else if (typeof secondaryHexColor === 'string' && secondaryHexColor.trim()) {
    resolvedSec = normalizeHexColor(secondaryHexColor, DEFAULT_SECONDARY_COLOR);
    db.settings.secondaryColor = resolvedSec;
  }

  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);

  if (typeof window !== 'undefined') {
    localStorage.setItem('cuentacasa_theme_color', normalized);
    if (secondaryHexColor === null) {
      localStorage.removeItem('cuentacasa_secondary_theme_color');
    } else if (resolvedSec) {
      localStorage.setItem('cuentacasa_secondary_theme_color', resolvedSec);
    }
    const finalSecondary = resolvedSec || deriveHarmoniousSecondary(normalized);
    applyBrandPaletteToDocument(normalized, finalSecondary);
    window.dispatchEvent(new CustomEvent('cuentacasa-theme-color-changed', {
      detail: { primaryColor: normalized, secondaryColor: finalSecondary }
    }));
  }
  return normalized;
}

export function saveSecondaryThemeColor(secondaryHexColor: string | null): string {
  const primary = getPrimaryThemeColor();
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }

  let resolvedSec: string;
  if (secondaryHexColor === null || !secondaryHexColor.trim()) {
    delete db.settings.secondaryColor;
    resolvedSec = deriveHarmoniousSecondary(primary);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cuentacasa_secondary_theme_color');
    }
  } else {
    resolvedSec = normalizeHexColor(secondaryHexColor, DEFAULT_SECONDARY_COLOR);
    db.settings.secondaryColor = resolvedSec;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cuentacasa_secondary_theme_color', resolvedSec);
    }
  }

  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);

  if (typeof window !== 'undefined') {
    applyBrandPaletteToDocument(primary, resolvedSec);
    window.dispatchEvent(new CustomEvent('cuentacasa-theme-color-changed', {
      detail: { primaryColor: primary, secondaryColor: resolvedSec }
    }));
  }
  return resolvedSec;
}

// ==========================================
// PERSONALIZADOR DE TIENDA PÚBLICA E IDENTIDAD
// ==========================================

export const DEFAULT_STORE_CUSTOMIZATION: StoreCustomizationSettings = {
  logoMode: 'both',
  logoSquareUrl: '/images/logo-nav.png',
  logoWideUrl: '',
  logoFontId: DEFAULT_LOGO_FONT.id,
  logoFontFamily: DEFAULT_LOGO_FONT.family,
  storeName: 'Samy Store',
  storeSeoName: 'Samy Store - Tienda Online de Productos y Víveres',
  storeSeoDescription: 'Tienda de víveres, alimentos y artículos esenciales con existencias reales en almacén y entregas rápidas en Las Tunas, Cuba.',
  heroBadgeText: 'Tienda Online • Las Tunas, Cuba',
  heroTitle: 'Todo para tu Hogar, Rápido y sin Complicaciones',
  heroSubtitle: 'Explora el catálogo completo de Samy Store organizado por categorías con existencias reales en almacén y pedidos directos por WhatsApp con entrega en toda la ciudad.'
};

export function getStoreCustomizationSettings(): StoreCustomizationSettings {
  const db = getRawDatabase();
  const s = db.settings;
  return {
    logoMode: (s?.storeLogoMode as StoreLogoDisplayMode) || DEFAULT_STORE_CUSTOMIZATION.logoMode,
    logoSquareUrl: s?.storeLogoSquare !== undefined ? s.storeLogoSquare : DEFAULT_STORE_CUSTOMIZATION.logoSquareUrl,
    logoWideUrl: s?.storeLogoWide !== undefined ? s.storeLogoWide : DEFAULT_STORE_CUSTOMIZATION.logoWideUrl,
    logoFontId: s?.storeLogoFontId || DEFAULT_LOGO_FONT.id,
    logoFontFamily: s?.storeLogoFontFamily || DEFAULT_LOGO_FONT.family,
    storeName: (s?.storeName && s.storeName.trim()) ? s.storeName : (s?.appName && s.appName.trim() ? s.appName : DEFAULT_STORE_CUSTOMIZATION.storeName),
    storeSeoName: (s?.storeSeoName && s.storeSeoName.trim()) ? s.storeSeoName : DEFAULT_STORE_CUSTOMIZATION.storeSeoName,
    storeSeoDescription: (s?.storeSeoDescription && s.storeSeoDescription.trim()) ? s.storeSeoDescription : DEFAULT_STORE_CUSTOMIZATION.storeSeoDescription,
    heroBadgeText: (s?.heroBadgeText && s.heroBadgeText.trim()) ? s.heroBadgeText : DEFAULT_STORE_CUSTOMIZATION.heroBadgeText,
    heroTitle: (s?.heroTitle && s.heroTitle.trim()) ? s.heroTitle : DEFAULT_STORE_CUSTOMIZATION.heroTitle,
    heroSubtitle: (s?.heroSubtitle && s.heroSubtitle.trim()) ? s.heroSubtitle : DEFAULT_STORE_CUSTOMIZATION.heroSubtitle
  };
}

export function saveStoreCustomizationSettings(settings: Partial<StoreCustomizationSettings>): StoreCustomizationSettings {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  if (settings.logoMode !== undefined) db.settings.storeLogoMode = settings.logoMode;
  if (settings.logoSquareUrl !== undefined) {
    db.settings.storeLogoSquare = settings.logoSquareUrl;
    if (typeof window !== 'undefined' && settings.logoSquareUrl) {
      try {
        updateDocumentIcons(settings.logoSquareUrl);
      } catch {}
    }
  }
  if (settings.logoWideUrl !== undefined) db.settings.storeLogoWide = settings.logoWideUrl;
  if (settings.logoFontId !== undefined) db.settings.storeLogoFontId = settings.logoFontId;
  if (settings.logoFontFamily !== undefined) db.settings.storeLogoFontFamily = settings.logoFontFamily;
  if (settings.storeName !== undefined) {
    db.settings.storeName = settings.storeName;
    db.settings.appName = settings.storeName;
  }
  if (settings.storeSeoName !== undefined) db.settings.storeSeoName = settings.storeSeoName;
  if (settings.storeSeoDescription !== undefined) db.settings.storeSeoDescription = settings.storeSeoDescription;
  if (settings.heroBadgeText !== undefined) db.settings.heroBadgeText = settings.heroBadgeText;
  if (settings.heroTitle !== undefined) db.settings.heroTitle = settings.heroTitle;
  if (settings.heroSubtitle !== undefined) db.settings.heroSubtitle = settings.heroSubtitle;

  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);

  const updated = getStoreCustomizationSettings();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cuentacasa-store-customization-changed', {
      detail: updated
    }));
  }

  return updated;
}

/**
 * Gestión de Módulos Activos y Desactivados del Negocio
 * Permite a tiendas de ropa, calzado, tecnología, ferretería, etc. apagar
 * módulos de alimentos (tasaciones, vencimientos, lotes) o compras a terceros.
 */
export function getStoreModulesConfig(): StoreModulesConfig {
  const db = getRawDatabase();
  const s = db.settings;
  return {
    enableFoodTraceability: s?.enableFoodTraceability !== undefined ? Boolean(s.enableFoodTraceability) : DEFAULT_STORE_MODULES.enableFoodTraceability,
    enableSuppliers: s?.enableSuppliers !== undefined ? Boolean(s.enableSuppliers) : DEFAULT_STORE_MODULES.enableSuppliers,
    enableCustomerDebts: s?.enableCustomerDebts !== undefined ? Boolean(s.enableCustomerDebts) : DEFAULT_STORE_MODULES.enableCustomerDebts,
    enableShiftManagement: s?.enableShiftManagement !== undefined ? Boolean(s.enableShiftManagement) : DEFAULT_STORE_MODULES.enableShiftManagement,
    enableExternalProducts: s?.enableExternalProducts !== undefined ? Boolean(s.enableExternalProducts) : DEFAULT_STORE_MODULES.enableExternalProducts
  };
}

export function saveStoreModulesConfig(modules: Partial<StoreModulesConfig>): StoreModulesConfig {
  const db = getRawDatabase();
  if (!db.settings) {
    db.settings = { currency: 'CUP', appName: 'Samy Store', autoSync: true, updatedAt: Date.now() };
  }
  if (modules.enableFoodTraceability !== undefined) db.settings.enableFoodTraceability = Boolean(modules.enableFoodTraceability);
  if (modules.enableSuppliers !== undefined) db.settings.enableSuppliers = Boolean(modules.enableSuppliers);
  if (modules.enableCustomerDebts !== undefined) db.settings.enableCustomerDebts = Boolean(modules.enableCustomerDebts);
  if (modules.enableShiftManagement !== undefined) db.settings.enableShiftManagement = Boolean(modules.enableShiftManagement);
  if (modules.enableExternalProducts !== undefined) db.settings.enableExternalProducts = Boolean(modules.enableExternalProducts);

  db.settings.updatedAt = Date.now();
  saveRawDatabase(db);

  const updated = getStoreModulesConfig();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cuentacasa-store-modules-changed', {
      detail: updated
    }));
  }
  return updated;
}

/**
 * Aplica la configuración recibida del servidor o la nube a todo el documento cliente
 * y propaga los eventos a todos los componentes React en tiempo real.
 */
export function applyGlobalSettingsAndBroadcast(settings: any): void {
  if (typeof window === 'undefined' || !settings) return;
  try {
    if (settings.primaryColor) {
      const pColor = normalizeHexColor(settings.primaryColor, DEFAULT_PRIMARY_COLOR);
      const sColor = settings.secondaryColor ? normalizeHexColor(settings.secondaryColor, deriveHarmoniousSecondary(pColor)) : deriveHarmoniousSecondary(pColor);
      applyBrandPaletteToDocument(pColor, sColor);
    }
    const cust = getStoreCustomizationSettings();
    window.dispatchEvent(new CustomEvent('cuentacasa-store-customization-changed', {
      detail: cust
    }));
    const modules = getStoreModulesConfig();
    window.dispatchEvent(new CustomEvent('cuentacasa-store-modules-changed', {
      detail: modules
    }));
    if (cust.logoSquareUrl) {
      try {
        updateDocumentIcons(cust.logoSquareUrl);
      } catch {}
    }
  } catch {}
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

  if ((fromAccount === 'tienda' && toAccount === 'ahorro') || (fromAccount === 'ahorro' && toAccount === 'tienda')) {
    return { success: false, error: 'No se permite transferir directamente entre el Negocio y el Ahorro. El dinero debe pasar primero por la Casa.' };
  }

  if (fromAccount === 'ahorro' && toAccount !== 'casa') {
    return { success: false, error: 'Desde la cuenta de Ahorro solo se permite transferir hacia la Casa.' };
  }

  if (toAccount === 'ahorro' && fromAccount !== 'casa') {
    return { success: false, error: 'A la cuenta de Ahorro solo se permite transferir desde la Casa.' };
  }

  // Deduct from Source Account (in source currency)
  if (currency === 'USD') {
    const currentStoreUSD = db.storeFundUSD || 0;
    const currentSavingsUSD = db.savingsFundUSD || 0;
    const currentCasaUSD = getCasaAvailableBalance('USD');

    if (fromAccount === 'casa' && amount > currentCasaUSD) {
      return { success: false, error: `Saldo insuficiente en Fondo de la Casa USD (US$ ${currentCasaUSD}).` };
    }
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
    const currentCasaCUP = getCasaAvailableBalance('CUP');

    if (fromAccount === 'casa' && amount > currentCasaCUP) {
      return { success: false, error: `Saldo insuficiente en Fondo de la Casa ($${currentCasaCUP}).` };
    }
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
  const todayISO = getLocalISODate();
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

// Retirar fondos de Ahorro como Gasto del Sistema
export function withdrawSavingsAsExpense(
  amount: number,
  concept: string,
  currency: CurrencyType = 'CUP',
  notes?: string
): { success: boolean; error?: string } {
  const db = getRawDatabase();
  if (amount <= 0) return { success: false, error: 'El monto a retirar debe ser mayor a 0.' };

  if (currency === 'USD') {
    const currentSavingsUSD = db.savingsFundUSD || 0;
    if (amount > currentSavingsUSD) {
      return { success: false, error: `Saldo insuficiente en Ahorro USD (US$ ${currentSavingsUSD}).` };
    }
    db.savingsFundUSD = currentSavingsUSD - amount;
  } else {
    const currentSavingsCUP = db.savingsFund || 0;
    if (amount > currentSavingsCUP) {
      return { success: false, error: `Saldo insuficiente en Fondo Ahorro ($${currentSavingsCUP}).` };
    }
    db.savingsFund = currentSavingsCUP - amount;
  }

  const now = Date.now();
  const todayISO = getLocalISODate();

  const expenseTx: Transaction = {
    id: `tx-savings-exp-${now}`,
    type: 'gasto',
    concept: concept.trim() || 'Gasto / Retiro del Fondo de Ahorro',
    category: 'Gasto de Ahorro',
    amount: amount,
    currency: currency,
    date: todayISO,
    accountSource: 'ahorro',
    notes: notes?.trim() || 'Ahorros retirados del sistema como gasto.',
    createdAt: now,
    updatedAt: now,
    synced: false
  };

  if (!db.transactions) db.transactions = [];
  db.transactions.unshift(expenseTx);
  saveRawDatabase(db);
  return { success: true };
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
  const dateTag = getLocalISODate();
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
  notes?: string,
  initialCashFundUSD: number = 0
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

  const roundCents = (val: number) => Math.round((Number(val) || 0) * 100) / 100;
  const initialCUP = roundCents(initialCashFund);
  const initialUSD = roundCents(initialCashFundUSD);

  const now = Date.now();
  const newShift: StoreShiftRecord = {
    id: `shift-${now}`,
    sellerId: seller.id,
    sellerName: seller.name,
    sellerUsername: seller.username,
    openedByUserId: currentUser?.id || 'admin',
    openedByName: currentUser?.name || 'Administrador',
    openedAt: now,
    initialCashFund: initialCUP,
    initialCashFundUSD: initialUSD,
    totalCashSales: 0,
    totalDigitalSales: 0,
    totalCashSalesUSD: 0,
    totalDigitalSalesUSD: 0,
    expectedCashInRegister: initialCUP,
    expectedCashInRegisterUSD: initialUSD,
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
  currency: CurrencyType = 'CUP',
  totalAmountCUP?: number,
  totalAmountUSD?: number,
  breakdown?: StoreSalePaymentBreakdown
): void {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const activeShift = shifts.find(s => s.status === 'activo' || s.status === 'apertura_pendiente');
  if (!activeShift) return;

  if (breakdown) {
    if (breakdown.cashCUP > 0) {
      activeShift.totalCashSales += breakdown.cashCUP;
    }
    if (breakdown.transferCUP > 0) {
      activeShift.totalDigitalSales += breakdown.transferCUP;
    }
    if (breakdown.debtCUP > 0) {
      activeShift.totalDebtSalesCUP = (activeShift.totalDebtSalesCUP || 0) + breakdown.debtCUP;
    }
    if (breakdown.cashUSD > 0) {
      activeShift.totalCashSalesUSD = (activeShift.totalCashSalesUSD || 0) + breakdown.cashUSD;
    }
    if (breakdown.debtUSD > 0) {
      activeShift.totalDebtSalesUSD = (activeShift.totalDebtSalesUSD || 0) + breakdown.debtUSD;
    }
    activeShift.expectedCashInRegister = activeShift.initialCashFund + activeShift.totalCashSales;
    activeShift.expectedCashInRegisterUSD = (activeShift.initialCashFundUSD || 0) + (activeShift.totalCashSalesUSD || 0);
  } else if (currency === 'MIXED') {
    const cupPart = totalAmountCUP !== undefined ? totalAmountCUP : 0;
    const usdPart = totalAmountUSD !== undefined ? totalAmountUSD : 0;
    if (cupPart > 0) {
      if (paymentMethod === 'cash') {
        activeShift.totalCashSales += cupPart;
      } else {
        activeShift.totalDigitalSales += cupPart;
      }
      activeShift.expectedCashInRegister = activeShift.initialCashFund + activeShift.totalCashSales;
    }
    if (usdPart > 0) {
      if (paymentMethod === 'cash') {
        activeShift.totalCashSalesUSD = (activeShift.totalCashSalesUSD || 0) + usdPart;
      } else {
        activeShift.totalDigitalSalesUSD = (activeShift.totalDigitalSalesUSD || 0) + usdPart;
      }
      activeShift.expectedCashInRegisterUSD = (activeShift.initialCashFundUSD || 0) + (activeShift.totalCashSalesUSD || 0);
    }
  } else if (currency === 'USD') {
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

export function applyDebtPaymentToActiveShift(
  db: RawDatabase,
  payCUP: number,
  payUSD: number,
  method: 'efectivo' | 'transferencia'
): void {
  const shifts = db.shifts || [];
  const activeShift = shifts.find(s => s.status === 'activo' || s.status === 'apertura_pendiente');
  if (!activeShift) return;

  const validCUP = Math.round(Math.max(0, payCUP) * 100) / 100;
  const validUSD = Math.round(Math.max(0, payUSD) * 100) / 100;

  if (method === 'efectivo') {
    if (validCUP > 0) {
      activeShift.totalCashSales = Math.round(((activeShift.totalCashSales || 0) + validCUP) * 100) / 100;
    }
    if (validUSD > 0) {
      activeShift.totalCashSalesUSD = Math.round(((activeShift.totalCashSalesUSD || 0) + validUSD) * 100) / 100;
    }
  } else {
    if (validCUP > 0) {
      activeShift.totalDigitalSales = Math.round(((activeShift.totalDigitalSales || 0) + validCUP) * 100) / 100;
    }
    if (validUSD > 0) {
      activeShift.totalDigitalSalesUSD = Math.round(((activeShift.totalDigitalSalesUSD || 0) + validUSD) * 100) / 100;
    }
  }

  activeShift.expectedCashInRegister = Math.round(((activeShift.initialCashFund || 0) + (activeShift.totalCashSales || 0)) * 100) / 100;
  activeShift.expectedCashInRegisterUSD = Math.round(((activeShift.initialCashFundUSD || 0) + (activeShift.totalCashSalesUSD || 0)) * 100) / 100;
}

export function recordDebtPaymentInActiveShift(
  payCUP: number,
  payUSD: number,
  method: 'efectivo' | 'transferencia'
): void {
  const db = getRawDatabase();
  applyDebtPaymentToActiveShift(db, payCUP, payUSD, method);
  saveRawDatabase(db);
}

export function closeStoreShift(
  shiftId: string,
  realCashInRegister: number,
  realStockCounts: Record<string, number>,
  notes?: string,
  realCashInRegisterUSD?: number
): StoreShiftRecord {
  const db = getRawDatabase();
  const shifts = db.shifts || [];
  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) throw new Error('Turno no encontrado.');

  const currentUser = getLoggedInUser();

  const roundCents = (val: number) => Math.round((Number(val) || 0) * 100) / 100;

  shift.closedAt = Date.now();
  shift.closedByUserId = currentUser?.id || 'admin';
  shift.closedByName = currentUser?.name || 'Administrador';
  shift.realCashInRegister = roundCents(realCashInRegister);
  shift.cashDifference = roundCents(shift.realCashInRegister - (shift.expectedCashInRegister || 0));

  if (realCashInRegisterUSD !== undefined) {
    shift.realCashInRegisterUSD = roundCents(realCashInRegisterUSD);
    shift.cashDifferenceUSD = roundCents(shift.realCashInRegisterUSD - (shift.expectedCashInRegisterUSD || 0));
  }

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
  const items = cart.map(item => {
    const obj: any = {
      productId: item.product.id,
      barcode: item.product.barcode || '',
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      currency: item.product.currency || 'CUP'
    };
    if (item.product.costPrice) obj.costPrice = item.product.costPrice;
    if (item.product.supplierType && item.product.supplierType !== 'propia') obj.supplierType = item.product.supplierType;
    if (item.product.supplierName) obj.supplierName = item.product.supplierName;
    return obj;
  });

  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

  const payload: CartQRPayload = {
    type: 'SAMY_STORE_CART_V1',
    timestamp: Date.now(),
    customerName: currentUser?.name || 'Cliente',
    totalAmount,
    items
  };

  return JSON.stringify(payload);
}

/**
 * Automatically parses scanned barcode strings for GS1 Application Identifiers
 * or ISO date patterns to auto-fill manufacturing date (MFG) and expiration date (EXP).
 */
export function parseBarcodeDates(barcode: string): { mfgDate?: string; expDate?: string } {
  if (!barcode || typeof barcode !== 'string') return {};

  let mfgDate: string | undefined = undefined;
  let expDate: string | undefined = undefined;

  // 1. GS1 AI (17) EXP date YYMMDD
  const gs1ExpMatch = barcode.match(/(?:(?:17|\(17\))(\d{2})(\d{2})(\d{2}))/);
  if (gs1ExpMatch) {
    const yy = parseInt(gs1ExpMatch[1], 10);
    const mm = gs1ExpMatch[2];
    const dd = gs1ExpMatch[3];
    const year = yy >= 70 ? `19${yy}` : `20${yy.toString().padStart(2, '0')}`;
    const mNum = parseInt(mm, 10);
    const dNum = parseInt(dd, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      expDate = `${year}-${mm}-${dd}`;
    }
  }

  // 2. GS1 AI (11) MFG date YYMMDD
  const gs1MfgMatch = barcode.match(/(?:(?:11|\(11\))(\d{2})(\d{2})(\d{2}))/);
  if (gs1MfgMatch) {
    const yy = parseInt(gs1MfgMatch[1], 10);
    const mm = gs1MfgMatch[2];
    const dd = gs1MfgMatch[3];
    const year = yy >= 70 ? `19${yy}` : `20${yy.toString().padStart(2, '0')}`;
    const mNum = parseInt(mm, 10);
    const dNum = parseInt(dd, 10);
    if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
      mfgDate = `${year}-${mm}-${dd}`;
    }
  }

  // 3. Fallback ISO YYYY-MM-DD or YYYYMMDD text formats (e.g., EXP: 2026-12-31 or EXP20261231)
  if (!expDate) {
    const isoExpMatch = barcode.match(/(?:EXP|VENC|FVAL|EXPIRATION)[:\s-]*(\d{4})[-/]?(\d{2})[-/]?(\d{2})/i);
    if (isoExpMatch) {
      const year = isoExpMatch[1];
      const mm = isoExpMatch[2];
      const dd = isoExpMatch[3];
      const mNum = parseInt(mm, 10);
      const dNum = parseInt(dd, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        expDate = `${year}-${mm}-${dd}`;
      }
    }
  }

  if (!mfgDate) {
    const isoMfgMatch = barcode.match(/(?:MFG|FAB|FABR|PROD)[:\s-]*(\d{4})[-/]?(\d{2})[-/]?(\d{2})/i);
    if (isoMfgMatch) {
      const year = isoMfgMatch[1];
      const mm = isoMfgMatch[2];
      const dd = isoMfgMatch[3];
      const mNum = parseInt(mm, 10);
      const dNum = parseInt(dd, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        mfgDate = `${year}-${mm}-${dd}`;
      }
    }
  }

  return { mfgDate, expDate };
}

export function generateSyncQRPayload(): string {
  const db = getRawDatabase();
  const currentUser = getLoggedInUser();

  // Compact array schema for products (v2):
  // [id, barcode, name, price, costPrice, stock, currency, category, supplierType, supplierName, updatedAt, unit]
  const p = (db.storeProducts || []).slice(0, 15).map(prod => [
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
    prod.updatedAt || Date.now(),
    prod.unit || 'u'
  ]);

  // Compact array schema for sales (last 10 sales to fit in QR size):
  // [id, date, totalAmount, totalCost, netProfit, currency, timestamp]
  const s = (db.storeSales || []).slice(0, 10).map(sale => [
    sale.id,
    sale.date,
    sale.totalAmount,
    sale.totalCost || 0,
    sale.netProfit || 0,
    sale.currency || 'CUP',
    sale.timestamp || Date.now()
  ]);

  // Compact array schema for shifts (last 5 shifts):
  // [id, sellerId, sellerName, status, openedAt, closedAt, initialCashFund, initialCashFundUSD, totalCashSales, totalCashSalesUSD]
  const h = (db.shifts || []).slice(0, 5).map(shift => [
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

  // Compact array schema for customer debts (last 10 debts):
  // [id, saleId, customerName, debtTypeCUP, amountCUP, amountUSD, paidCUP, paidUSD, status, date, timestamp, updatedAt]
  const d = (db.customerDebts || []).slice(0, 10).map(debt => [
    debt.id,
    debt.saleId,
    debt.customerName,
    debt.debtTypeCUP || 'efectivo',
    debt.amountCUP || 0,
    debt.amountUSD || 0,
    debt.paidCUP || 0,
    debt.paidUSD || 0,
    debt.status,
    debt.date,
    debt.timestamp,
    debt.updatedAt || debt.timestamp
  ]);

  // Compact Settings
  const st = {
    e: db.settings?.exchangeRateUSD || 320,
    m: db.settings?.currencyMode || 'CUP',
    c: db.settings?.currency || 'CUP'
  };

  const payload = {
    type: 'SAMY_SYNC_V2',
    senderName: currentUser?.name || 'Administrador',
    ts: Date.now(),
    p,
    s,
    h,
    d,
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
        currencyMode: rawObj.st.m || 'CUP',
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
          updatedAt: item[10] || Date.now(),
          unit: item[11] || 'u'
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

    // Merge Customer Debts
    if (Array.isArray(rawObj.d)) {
      if (!db.customerDebts) db.customerDebts = [];
      rawObj.d.forEach((item: any) => {
        const debtId = item[0];
        const idx = db.customerDebts!.findIndex(deb => deb.id === debtId);
        const incDebt: CustomerDebtRecord = {
          id: debtId,
          saleId: item[1],
          customerName: item[2],
          debtTypeCUP: item[3] || 'efectivo',
          amountCUP: item[4] || 0,
          amountUSD: item[5] || 0,
          paidCUP: item[6] || 0,
          paidUSD: item[7] || 0,
          status: item[8] || 'pendiente',
          date: item[9],
          timestamp: item[10] || Date.now(),
          updatedAt: item[11] || item[10] || Date.now()
        };

        if (idx === -1) {
          db.customerDebts!.unshift(incDebt);
        } else {
          const existing = db.customerDebts![idx];
          if ((incDebt.updatedAt || 0) >= (existing.updatedAt || 0)) {
            db.customerDebts![idx] = { ...existing, ...incDebt };
          }
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

    if (Array.isArray(payload.customerDebts)) {
      if (!db.customerDebts) db.customerDebts = [];
      payload.customerDebts.forEach(incDebt => {
        const idx = db.customerDebts!.findIndex(deb => deb.id === incDebt.id);
        if (idx === -1) {
          db.customerDebts!.unshift(incDebt);
        } else {
          const existing = db.customerDebts![idx];
          if ((incDebt.updatedAt || 0) >= (existing.updatedAt || 0)) {
            db.customerDebts![idx] = { ...existing, ...incDebt };
          }
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

// ==========================================
// GESTIÓN DE FIADOS Y CUENTAS POR COBRAR A CLIENTES
// ==========================================

export function getCustomerDebts(): CustomerDebtRecord[] {
  const db = getRawDatabase();
  return db.customerDebts || [];
}

export function saveCustomerDebt(debt: CustomerDebtRecord): void {
  const db = getRawDatabase();
  if (!db.customerDebts) db.customerDebts = [];
  const idx = db.customerDebts.findIndex(d => d.id === debt.id);
  if (idx !== -1) {
    db.customerDebts[idx] = { ...debt, updatedAt: Date.now() };
  } else {
    db.customerDebts.unshift({ ...debt, updatedAt: Date.now() });
  }
  saveRawDatabase(db);
}

export function registerCustomerDebtPayment(
  debtId: string,
  payCUP: number,
  payUSD: number,
  method: 'efectivo' | 'transferencia',
  notes?: string
): boolean {
  const db = getRawDatabase();
  if (!db.customerDebts) db.customerDebts = [];
  const debt = db.customerDebts.find(d => d.id === debtId);
  if (!debt) return false;

  const validPayCUP = Math.round(Math.max(0, payCUP) * 100) / 100;
  const validPayUSD = Math.round(Math.max(0, payUSD) * 100) / 100;
  if (validPayCUP === 0 && validPayUSD === 0) return false;

  debt.paidCUP = Math.round(((debt.paidCUP || 0) + validPayCUP) * 100) / 100;
  debt.paidUSD = Math.round(((debt.paidUSD || 0) + validPayUSD) * 100) / 100;
  debt.updatedAt = Date.now();

  const isCUPCovered = debt.paidCUP >= (debt.amountCUP - 0.001);
  const isUSDCovered = debt.paidUSD >= (debt.amountUSD - 0.001);

  if (isCUPCovered && isUSDCovered) {
    debt.status = 'pagado';
  } else {
    debt.status = 'parcial';
  }

  // Actualizar turno activo si existe para que cuadre el dinero físico / digital del turno
  applyDebtPaymentToActiveShift(db, validPayCUP, validPayUSD, method);

  // Registrar transacción de ingreso de la liquidación del fiado
  const now = Date.now();
  const concept = `tienda: abono de fiado de ${debt.customerName} (${method === 'transferencia' ? 'Transferencia' : 'Efectivo'})`;

  if (validPayCUP > 0) {
    if (method === 'efectivo') {
      db.storeFund = Math.round(((db.storeFund || 0) + validPayCUP) * 100) / 100;
    }
    db.transactions.unshift({
      id: `tx-debt-pay-cup-${now}`,
      type: 'ingreso',
      concept: `${concept} (CUP)`,
      category: 'Cobro de Fiados',
      amount: validPayCUP,
      currency: 'CUP',
      date: getLocalISODate(),
      accountSource: 'tienda',
      notes: notes || `Abono de deuda a cuenta de venta #${debt.saleId}`,
      createdAt: now,
      updatedAt: now,
      synced: false
    });
  }

  if (validPayUSD > 0) {
    if (method === 'efectivo') {
      db.storeFundUSD = Math.round(((db.storeFundUSD || 0) + validPayUSD) * 100) / 100;
    }
    db.transactions.unshift({
      id: `tx-debt-pay-usd-${now + 1}`,
      type: 'ingreso',
      concept: `${concept} (USD)`,
      category: 'Cobro de Fiados',
      amount: validPayUSD,
      currency: 'USD',
      date: getLocalISODate(),
      accountSource: 'tienda',
      notes: notes || `Abono de deuda a cuenta de venta #${debt.saleId}`,
      createdAt: now + 1,
      updatedAt: now + 1,
      synced: false
    });
  }

  saveRawDatabase(db);
  return true;
}

export function deleteCustomerDebt(debtId: string): boolean {
  const db = getRawDatabase();
  if (!db.customerDebts) return false;
  const idx = db.customerDebts.findIndex(d => d.id === debtId);
  if (idx === -1) return false;
  db.customerDebts.splice(idx, 1);
  if (!db.deletedDebtIds) db.deletedDebtIds = [];
  if (!db.deletedDebtIds.includes(debtId)) db.deletedDebtIds.push(debtId);
  saveRawDatabase(db);
  return true;
}


