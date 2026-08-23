import { NextRequest, NextResponse } from 'next/server';
import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount } from '@/types';
import pool, { ensureTableExists, isMySQLConfigured } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { RowDataPacket } from 'mysql2';

// Storage file fallback for local development when MySQL env vars are absent
const STORAGE_FILE = path.join(process.cwd(), '.next', 'cuentacasa_cloud_db.json');

interface FileCloudData {
  transactions: Transaction[];
  storeProducts: StoreProduct[];
  storeSales: StoreSaleRecord[];
  supplierAccounts: SupplierAccount[];
  storeFund: number;
  savingsFund: number;
  settings: any;
}

function loadFileData(): FileCloudData {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return {
          transactions: parsed,
          storeProducts: [],
          storeSales: [],
          supplierAccounts: [],
          storeFund: 0,
          savingsFund: 0,
          settings: {}
        };
      }
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts : [],
        storeSales: Array.isArray(parsed.storeSales) ? parsed.storeSales : [],
        supplierAccounts: Array.isArray(parsed.supplierAccounts) ? parsed.supplierAccounts : [],
        storeFund: Number(parsed.storeFund || 0),
        savingsFund: Number(parsed.savingsFund || 0),
        settings: parsed.settings || {}
      };
    }
  } catch (e) {
    // Fallback to empty store
  }
  return {
    transactions: [],
    storeProducts: [],
    storeSales: [],
    supplierAccounts: [],
    storeFund: 0,
    savingsFund: 0,
    settings: {}
  };
}

function saveFileData(cloudData: FileCloudData) {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(cloudData, null, 2), 'utf-8');
  } catch (e) {
    // Ignored in read-only serverless filesystems
  }
}

// MySQL Transactions Helpers
async function getMySQLTransactions(): Promise<{ transactions: Transaction[]; deletedSet: Set<string> }> {
  if (!pool) return { transactions: [], deletedSet: new Set() };
  await ensureTableExists();

  const [deletedRows] = await pool.query<RowDataPacket[]>('SELECT id FROM deleted_transactions');
  const deletedSet = new Set<string>(deletedRows.map(r => r.id));

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');
  
  const transactions = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      type: r.type,
      concept: r.concept,
      category: r.category,
      amount: Number(r.amount),
      date: r.date,
      notes: r.notes || undefined,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      synced: true
    }));

  return { transactions, deletedSet };
}

async function deleteMySQLTransactions(deletedIds: string[]) {
  if (!pool || deletedIds.length === 0) return;
  await ensureTableExists();

  await pool.query('DELETE FROM transactions WHERE id IN (?)', [deletedIds]);
  const values = deletedIds.map(id => [id, Date.now()]);
  await pool.query('INSERT IGNORE INTO deleted_transactions (id, deleted_at) VALUES ?', [values]);
}

async function saveMySQLTransactions(transactions: Transaction[]) {
  if (!pool || transactions.length === 0) return;
  await ensureTableExists();

  const query = `
    INSERT INTO transactions (id, type, concept, category, amount, date, notes, created_at, updated_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      type = VALUES(type),
      concept = VALUES(concept),
      category = VALUES(category),
      amount = VALUES(amount),
      date = VALUES(date),
      notes = VALUES(notes),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at)
  `;

  const values = transactions.map(t => [
    t.id,
    t.type,
    t.concept,
    t.category,
    t.amount,
    t.date,
    t.notes || null,
    t.createdAt || Date.now(),
    t.updatedAt || Date.now()
  ]);

  await pool.query(query, [values]);
}

// MySQL Products Helpers
async function getMySQLProducts(): Promise<{ products: StoreProduct[]; deletedSet: Set<string> }> {
  if (!pool) return { products: [], deletedSet: new Set() };
  await ensureTableExists();

  const [deletedRows] = await pool.query<RowDataPacket[]>('SELECT id FROM deleted_store_products');
  const deletedSet = new Set<string>(deletedRows.map(r => r.id));

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM store_products ORDER BY updated_at DESC');

  const products: StoreProduct[] = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      barcode: r.barcode,
      name: r.name,
      costPrice: Number(r.cost_price),
      price: Number(r.price),
      category: r.category,
      description: r.description || undefined,
      stock: Number(r.stock),
      photoUrl: r.photo_url || undefined,
      published: Boolean(r.published),
      salesCount: Number(r.sales_count || 0),
      supplierType: r.supplier_type || 'propia',
      supplierName: r.supplier_name || undefined,
      isExternal: Boolean(r.is_external),
      externalUrl: r.external_url || undefined,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at)
    }));

  return { products, deletedSet };
}

async function saveMySQLProducts(products: StoreProduct[]) {
  if (!pool || products.length === 0) return;
  await ensureTableExists();

  const query = `
    INSERT INTO store_products (
      id, barcode, name, cost_price, price, category, description, stock,
      photo_url, published, sales_count, supplier_type, supplier_name,
      is_external, external_url, created_at, updated_at
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      barcode = VALUES(barcode),
      name = VALUES(name),
      cost_price = VALUES(cost_price),
      price = VALUES(price),
      category = VALUES(category),
      description = VALUES(description),
      stock = VALUES(stock),
      photo_url = VALUES(photo_url),
      published = VALUES(published),
      sales_count = VALUES(sales_count),
      supplier_type = VALUES(supplier_type),
      supplier_name = VALUES(supplier_name),
      is_external = VALUES(is_external),
      external_url = VALUES(external_url),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at)
  `;

  const values = products.map(p => [
    p.id,
    p.barcode,
    p.name,
    p.costPrice,
    p.price,
    p.category,
    p.description || null,
    p.stock,
    p.photoUrl || null,
    p.published ? 1 : 0,
    p.salesCount || 0,
    p.supplierType || 'propia',
    p.supplierName || null,
    p.isExternal ? 1 : 0,
    p.externalUrl || null,
    p.createdAt || Date.now(),
    p.updatedAt || Date.now()
  ]);

  await pool.query(query, [values]);
}

async function deleteMySQLProducts(deletedIds: string[]) {
  if (!pool || deletedIds.length === 0) return;
  await ensureTableExists();

  await pool.query('DELETE FROM store_products WHERE id IN (?)', [deletedIds]);
  const values = deletedIds.map(id => [id, Date.now()]);
  await pool.query('INSERT IGNORE INTO deleted_store_products (id, deleted_at) VALUES ?', [values]);
}

// MySQL Sales Helpers
async function getMySQLSales(): Promise<StoreSaleRecord[]> {
  if (!pool) return [];
  await ensureTableExists();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM store_sales ORDER BY timestamp DESC');
  return rows.map(r => ({
    id: r.id,
    date: r.date,
    timestamp: Number(r.timestamp),
    items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
    totalAmount: Number(r.total_amount),
    totalCost: Number(r.total_cost),
    netProfit: Number(r.net_profit)
  }));
}

async function saveMySQLSales(sales: StoreSaleRecord[]) {
  if (!pool || sales.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO store_sales (id, date, timestamp, items, total_amount, total_cost, net_profit)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      date = VALUES(date),
      timestamp = VALUES(timestamp),
      items = VALUES(items),
      total_amount = VALUES(total_amount),
      total_cost = VALUES(total_cost),
      net_profit = VALUES(net_profit)
  `;
  const values = sales.map(s => [
    s.id,
    s.date,
    s.timestamp || Date.now(),
    JSON.stringify(s.items || []),
    s.totalAmount,
    s.totalCost,
    s.netProfit
  ]);
  await pool.query(query, [values]);
}

// MySQL Suppliers Helpers
async function getMySQLSuppliers(): Promise<SupplierAccount[]> {
  if (!pool) return [];
  await ensureTableExists();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM supplier_accounts ORDER BY updated_at DESC');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    pendingPayout: Number(r.pending_payout),
    totalPaid: Number(r.total_paid),
    updatedAt: Number(r.updated_at)
  }));
}

async function saveMySQLSuppliers(suppliers: SupplierAccount[]) {
  if (!pool || suppliers.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO supplier_accounts (id, name, pending_payout, total_paid, updated_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      pending_payout = VALUES(pending_payout),
      total_paid = VALUES(total_paid),
      updated_at = VALUES(updated_at)
  `;
  const values = suppliers.map(sup => [
    sup.id,
    sup.name,
    sup.pendingPayout,
    sup.totalPaid,
    sup.updatedAt || Date.now()
  ]);
  await pool.query(query, [values]);
}

// MySQL App State Helpers
async function getMySQLAppState(key: string): Promise<string | null> {
  if (!pool) return null;
  await ensureTableExists();
  const [rows] = await pool.query<RowDataPacket[]>('SELECT state_value FROM app_state WHERE state_key = ?', [key]);
  if (rows.length > 0) return rows[0].state_value;
  return null;
}

async function saveMySQLAppState(key: string, value: string) {
  if (!pool) return;
  await ensureTableExists();
  const query = `
    INSERT INTO app_state (state_key, state_value, updated_at)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      state_value = VALUES(state_value),
      updated_at = VALUES(updated_at)
  `;
  await pool.query(query, [key, value, Date.now()]);
}

export async function GET() {
  try {
    let currentCloudTransactions: Transaction[] = [];
    let currentCloudProducts: StoreProduct[] = [];
    let currentCloudSales: StoreSaleRecord[] = [];
    let currentCloudSuppliers: SupplierAccount[] = [];
    let currentStoreFund = 0;
    let currentSavingsFund = 0;
    let currentSettings: any = {};

    if (isMySQLConfigured()) {
      const txResult = await getMySQLTransactions();
      currentCloudTransactions = txResult.transactions;
      const prodResult = await getMySQLProducts();
      currentCloudProducts = prodResult.products;
      currentCloudSales = await getMySQLSales();
      currentCloudSuppliers = await getMySQLSuppliers();

      const storeFundStr = await getMySQLAppState('storeFund');
      if (storeFundStr !== null) currentStoreFund = Number(storeFundStr);

      const savingsFundStr = await getMySQLAppState('savingsFund');
      if (savingsFundStr !== null) currentSavingsFund = Number(savingsFundStr);

      const settingsStr = await getMySQLAppState('settings');
      if (settingsStr !== null) {
        try { currentSettings = JSON.parse(settingsStr); } catch (e) {}
      }
    } else {
      const fileData = loadFileData();
      currentCloudTransactions = fileData.transactions;
      currentCloudProducts = fileData.storeProducts;
      currentCloudSales = fileData.storeSales;
      currentCloudSuppliers = fileData.supplierAccounts;
      currentStoreFund = fileData.storeFund;
      currentSavingsFund = fileData.savingsFund;
      currentSettings = fileData.settings;
    }

    return NextResponse.json({
      success: true,
      transactions: currentCloudTransactions,
      storeProducts: currentCloudProducts,
      storeSales: currentCloudSales,
      supplierAccounts: currentCloudSuppliers,
      storeFund: currentStoreFund,
      savingsFund: currentSavingsFund,
      settings: currentSettings,
      count: currentCloudTransactions.length,
      productCount: currentCloudProducts.length,
      storage: isMySQLConfigured() ? 'Hostinger MySQL' : 'Local File Storage'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/sync:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al consultar datos del servidor.'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientTransactions: Transaction[] = Array.isArray(body.transactions) ? body.transactions : [];
    const deletedIds: string[] = Array.isArray(body.deletedIds) ? body.deletedIds : [];
    const clientProducts: StoreProduct[] = Array.isArray(body.storeProducts) ? body.storeProducts : [];
    const deletedProductIds: string[] = Array.isArray(body.deletedProductIds) ? body.deletedProductIds : [];
    const clientSales: StoreSaleRecord[] = Array.isArray(body.storeSales) ? body.storeSales : [];
    const clientSuppliers: SupplierAccount[] = Array.isArray(body.supplierAccounts) ? body.supplierAccounts : [];
    const clientStoreFund = body.storeFund !== undefined ? Number(body.storeFund) : undefined;
    const clientSavingsFund = body.savingsFund !== undefined ? Number(body.savingsFund) : undefined;
    const clientSettings = body.settings && typeof body.settings === 'object' ? body.settings : undefined;

    // 1. Process transaction deletions
    if (deletedIds.length > 0) {
      if (isMySQLConfigured()) {
        await deleteMySQLTransactions(deletedIds);
      } else {
        const fileData = loadFileData();
        fileData.transactions = fileData.transactions.filter(t => !deletedIds.includes(t.id));
        saveFileData(fileData);
      }
    }

    // 2. Process product deletions
    if (deletedProductIds.length > 0) {
      if (isMySQLConfigured()) {
        await deleteMySQLProducts(deletedProductIds);
      } else {
        const fileData = loadFileData();
        fileData.storeProducts = fileData.storeProducts.filter(p => !deletedProductIds.includes(p.id));
        saveFileData(fileData);
      }
    }

    // 3. Load & Merge Transactions
    let serverTransactions: Transaction[] = [];
    let deletedSet = new Set<string>();

    if (isMySQLConfigured()) {
      const mysqlData = await getMySQLTransactions();
      serverTransactions = mysqlData.transactions;
      deletedSet = mysqlData.deletedSet;
    } else {
      serverTransactions = loadFileData().transactions;
    }

    const mergedTxMap = new Map<string, Transaction>();
    for (const tx of serverTransactions) {
      if (tx && tx.id && !deletedSet.has(tx.id)) {
        mergedTxMap.set(tx.id, tx);
      }
    }

    const txsToSaveToMySQL: Transaction[] = [];
    for (const tx of clientTransactions) {
      if (tx && tx.id && !deletedSet.has(tx.id)) {
        const existing = mergedTxMap.get(tx.id);
        if (!existing) {
          const syncedTx = { ...tx, synced: true };
          mergedTxMap.set(tx.id, syncedTx);
          txsToSaveToMySQL.push(syncedTx);
        } else {
          const existingTime = existing.updatedAt || existing.createdAt || 0;
          const clientTime = tx.updatedAt || tx.createdAt || 0;
          if (clientTime >= existingTime) {
            const syncedTx = { ...tx, synced: true };
            mergedTxMap.set(tx.id, syncedTx);
            txsToSaveToMySQL.push(syncedTx);
          }
        }
      }
    }

    const mergedTransactions = Array.from(mergedTxMap.values()).sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (isMySQLConfigured() && txsToSaveToMySQL.length > 0) {
      await saveMySQLTransactions(txsToSaveToMySQL);
    }

    // 4. Load & Merge Products
    let serverProducts: StoreProduct[] = [];
    let deletedProductSet = new Set<string>();

    if (isMySQLConfigured()) {
      const mysqlProds = await getMySQLProducts();
      serverProducts = mysqlProds.products;
      deletedProductSet = mysqlProds.deletedSet;
    } else {
      serverProducts = loadFileData().storeProducts;
    }

    const mergedProductMap = new Map<string, StoreProduct>();
    for (const p of serverProducts) {
      if (p && p.id && !deletedProductSet.has(p.id)) {
        mergedProductMap.set(p.id, p);
      }
    }

    const productsToSaveToMySQL: StoreProduct[] = [];
    for (const p of clientProducts) {
      if (p && p.id && !deletedProductSet.has(p.id)) {
        const existing = mergedProductMap.get(p.id) || Array.from(mergedProductMap.values()).find(item => item.barcode === p.barcode);
        if (!existing) {
          mergedProductMap.set(p.id, p);
          productsToSaveToMySQL.push(p);
        } else {
          const existingTime = existing.updatedAt || existing.createdAt || 0;
          const clientTime = p.updatedAt || p.createdAt || 0;
          if (clientTime >= existingTime) {
            mergedProductMap.set(existing.id, { ...p, id: existing.id });
            productsToSaveToMySQL.push({ ...p, id: existing.id });
          }
        }
      }
    }

    const mergedProducts = Array.from(mergedProductMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (isMySQLConfigured() && productsToSaveToMySQL.length > 0) {
      await saveMySQLProducts(productsToSaveToMySQL);
    }

    // 5. Load & Merge Sales
    let serverSales: StoreSaleRecord[] = [];
    if (isMySQLConfigured()) {
      serverSales = await getMySQLSales();
    } else {
      serverSales = loadFileData().storeSales;
    }

    const mergedSalesMap = new Map<string, StoreSaleRecord>();
    for (const s of serverSales) {
      if (s && s.id) mergedSalesMap.set(s.id, s);
    }

    const salesToSaveToMySQL: StoreSaleRecord[] = [];
    for (const s of clientSales) {
      if (s && s.id && !mergedSalesMap.has(s.id)) {
        mergedSalesMap.set(s.id, s);
        salesToSaveToMySQL.push(s);
      }
    }

    const mergedSales = Array.from(mergedSalesMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (isMySQLConfigured() && salesToSaveToMySQL.length > 0) {
      await saveMySQLSales(salesToSaveToMySQL);
    }

    // 6. Load & Merge Supplier Accounts
    let serverSuppliers: SupplierAccount[] = [];
    if (isMySQLConfigured()) {
      serverSuppliers = await getMySQLSuppliers();
    } else {
      serverSuppliers = loadFileData().supplierAccounts;
    }

    const mergedSupplierMap = new Map<string, SupplierAccount>();
    for (const sup of serverSuppliers) {
      if (sup && (sup.id || sup.name)) {
        const key = sup.id || sup.name;
        mergedSupplierMap.set(key, sup);
      }
    }

    const suppliersToSaveToMySQL: SupplierAccount[] = [];
    for (const sup of clientSuppliers) {
      if (sup && (sup.id || sup.name)) {
        const key = sup.id || sup.name;
        const existing = mergedSupplierMap.get(key);
        if (!existing) {
          mergedSupplierMap.set(key, sup);
          suppliersToSaveToMySQL.push(sup);
        } else {
          const existingTime = existing.updatedAt || 0;
          const clientTime = sup.updatedAt || 0;
          if (clientTime >= existingTime) {
            mergedSupplierMap.set(key, sup);
            suppliersToSaveToMySQL.push(sup);
          }
        }
      }
    }

    const mergedSuppliers = Array.from(mergedSupplierMap.values());
    if (isMySQLConfigured() && suppliersToSaveToMySQL.length > 0) {
      await saveMySQLSuppliers(suppliersToSaveToMySQL);
    }

    // 7. Load & Merge Funds & Settings
    let mergedStoreFund = clientStoreFund !== undefined ? clientStoreFund : 0;
    let mergedSavingsFund = clientSavingsFund !== undefined ? clientSavingsFund : 0;
    let mergedSettings: any = clientSettings || {};

    if (isMySQLConfigured()) {
      if (clientStoreFund !== undefined) {
        await saveMySQLAppState('storeFund', String(clientStoreFund));
        mergedStoreFund = clientStoreFund;
      } else {
        const sfStr = await getMySQLAppState('storeFund');
        if (sfStr !== null) mergedStoreFund = Number(sfStr);
      }

      if (clientSavingsFund !== undefined) {
        await saveMySQLAppState('savingsFund', String(clientSavingsFund));
        mergedSavingsFund = clientSavingsFund;
      } else {
        const svStr = await getMySQLAppState('savingsFund');
        if (svStr !== null) mergedSavingsFund = Number(svStr);
      }

      if (clientSettings) {
        const existingSettingsStr = await getMySQLAppState('settings');
        let existingSettings = {};
        if (existingSettingsStr) {
          try { existingSettings = JSON.parse(existingSettingsStr); } catch (e) {}
        }
        mergedSettings = { ...existingSettings, ...clientSettings };
        await saveMySQLAppState('settings', JSON.stringify(mergedSettings));
      } else {
        const stStr = await getMySQLAppState('settings');
        if (stStr !== null) {
          try { mergedSettings = JSON.parse(stStr); } catch (e) {}
        }
      }
    } else {
      const fileData = loadFileData();
      mergedStoreFund = clientStoreFund !== undefined ? clientStoreFund : fileData.storeFund;
      mergedSavingsFund = clientSavingsFund !== undefined ? clientSavingsFund : fileData.savingsFund;
      mergedSettings = clientSettings ? { ...fileData.settings, ...clientSettings } : fileData.settings;

      saveFileData({
        transactions: mergedTransactions,
        storeProducts: mergedProducts,
        storeSales: mergedSales,
        supplierAccounts: mergedSuppliers,
        storeFund: mergedStoreFund,
        savingsFund: mergedSavingsFund,
        settings: mergedSettings
      });
    }

    return NextResponse.json({
      success: true,
      transactions: mergedTransactions,
      storeProducts: mergedProducts,
      storeSales: mergedSales,
      supplierAccounts: mergedSuppliers,
      storeFund: mergedStoreFund,
      savingsFund: mergedSavingsFund,
      settings: mergedSettings,
      count: mergedTransactions.length,
      productCount: mergedProducts.length,
      storage: isMySQLConfigured() ? 'Hostinger MySQL' : 'Local File Storage',
      message: `Sincronización Hostinger exitosa. Todos los datos unificados.`
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar sincronización en Hostinger MySQL.'
    }, { status: 500 });
  }
}
