import { Transaction, StoreProduct, StoreSaleRecord, RawDatabase } from '@/types';

const STORAGE_KEY = 'cuentacasa_raw_db_v1';

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
    published: true,
    salesCount: 12,
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
    published: true,
    salesCount: 30,
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
    published: true,
    salesCount: 8,
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
    published: true,
    salesCount: 15,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const INITIAL_DB: RawDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    currency: '$',
    appName: 'Cuenta Casa',
    autoSync: true
  },
  transactions: [],
  storeProducts: INITIAL_SEED_PRODUCTS,
  storeSales: [],
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
      storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts : INITIAL_SEED_PRODUCTS,
      storeSales: Array.isArray(parsed.storeSales) ? parsed.storeSales : [],
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
  const cleanBarcode = barcode.padStart(4, '0');
  return products.find(p => p.barcode === cleanBarcode || p.barcode === barcode);
}

export function saveStoreProduct(product: Omit<StoreProduct, 'id' | 'createdAt' | 'updatedAt'>): StoreProduct {
  const db = getRawDatabase();
  if (!db.storeProducts) db.storeProducts = [];
  
  const cleanBarcode = product.barcode.padStart(4, '0');
  const existingIndex = db.storeProducts.findIndex(p => p.barcode === cleanBarcode);

  const newProduct: StoreProduct = {
    ...product,
    barcode: cleanBarcode,
    id: existingIndex !== -1 ? db.storeProducts[existingIndex].id : `sp-${Date.now()}`,
    createdAt: existingIndex !== -1 ? db.storeProducts[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now()
  };

  if (existingIndex !== -1) {
    db.storeProducts[existingIndex] = newProduct;
  } else {
    db.storeProducts.unshift(newProduct);
  }

  saveRawDatabase(db);
  return newProduct;
}

export function deleteStoreProduct(id: string): void {
  const db = getRawDatabase();
  if (db.storeProducts) {
    db.storeProducts = db.storeProducts.filter(p => p.id !== id);
    saveRawDatabase(db);
  }
}

// --- Store Sales & Accounting Helpers ---

export function getStoreSales(): StoreSaleRecord[] {
  const db = getRawDatabase();
  return db.storeSales || [];
}

export function registerStoreSale(saleData: Omit<StoreSaleRecord, 'id' | 'timestamp'>): StoreSaleRecord {
  const db = getRawDatabase();
  if (!db.storeSales) db.storeSales = [];
  if (!db.storeProducts) db.storeProducts = [];

  const saleRecord: StoreSaleRecord = {
    ...saleData,
    id: `sale-${Date.now()}`,
    timestamp: Date.now()
  };

  db.storeSales.unshift(saleRecord);

  // Update stock & salesCount for each product sold
  saleData.items.forEach(item => {
    const prod = db.storeProducts!.find(p => p.id === item.productId || p.barcode === item.barcode);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      prod.salesCount = (prod.salesCount || 0) + item.quantity;
      prod.updatedAt = Date.now();
    }
  });

  // Automatically register transaction in main accounting DB (Category: 'Tienda')
  const conceptSummary = saleData.items.length === 1 
    ? `Venta Tienda: ${saleData.items[0].name} (x${saleData.items[0].quantity})`
    : `Venta Tienda (${saleData.items.reduce((s, i) => s + i.quantity, 0)} items)`;

  const newTx: Transaction = {
    id: `tx-sale-${Date.now()}`,
    type: 'ingreso',
    concept: conceptSummary,
    category: 'Tienda',
    amount: saleData.totalAmount,
    date: saleData.date,
    notes: `Ganancia neta: $${saleData.netProfit}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: false
  };

  db.transactions.unshift(newTx);

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
