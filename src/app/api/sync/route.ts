import { NextRequest, NextResponse } from 'next/server';
import { Transaction, StoreProduct, StoreSaleRecord, SupplierAccount, AppUser, CustomerDebtRecord } from '@/types';
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
  users: AppUser[];
  customerDebts?: CustomerDebtRecord[];
  shifts?: any[];
  storeFund: number;
  storeFundUSD?: number;
  savingsFund: number;
  savingsFundUSD?: number;
  settings: any;
  deletedIds?: string[];
  deletedProductIds?: string[];
  deletedSupplierIds?: string[];
  deletedUserIds?: string[];
  deletedDebtIds?: string[];
  lastResetAt?: number;
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
          users: [],
          customerDebts: [],
          shifts: [],
          storeFund: 0,
          storeFundUSD: 0,
          savingsFund: 0,
          savingsFundUSD: 0,
          settings: {},
          deletedIds: [],
          deletedProductIds: [],
          deletedSupplierIds: [],
          deletedUserIds: [],
          deletedDebtIds: [],
          lastResetAt: 0
        };
      }
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts : [],
        storeSales: Array.isArray(parsed.storeSales) ? parsed.storeSales : [],
        supplierAccounts: Array.isArray(parsed.supplierAccounts) ? parsed.supplierAccounts : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        customerDebts: Array.isArray(parsed.customerDebts) ? parsed.customerDebts : [],
        shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
        storeFund: Number(parsed.storeFund || 0),
        storeFundUSD: Number(parsed.storeFundUSD || 0),
        savingsFund: Number(parsed.savingsFund || 0),
        savingsFundUSD: Number(parsed.savingsFundUSD || 0),
        settings: parsed.settings || {},
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        deletedProductIds: Array.isArray(parsed.deletedProductIds) ? parsed.deletedProductIds : [],
        deletedSupplierIds: Array.isArray(parsed.deletedSupplierIds) ? parsed.deletedSupplierIds : [],
        deletedUserIds: Array.isArray(parsed.deletedUserIds) ? parsed.deletedUserIds : [],
        deletedDebtIds: Array.isArray(parsed.deletedDebtIds) ? parsed.deletedDebtIds : [],
        lastResetAt: Number(parsed.lastResetAt || 0)
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
    users: [],
    customerDebts: [],
    shifts: [],
    storeFund: 0,
    storeFundUSD: 0,
    savingsFund: 0,
    savingsFundUSD: 0,
    settings: {},
    deletedIds: [],
    deletedProductIds: [],
    deletedSupplierIds: [],
    deletedUserIds: [],
    deletedDebtIds: [],
    lastResetAt: 0
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
  
  const transactions: Transaction[] = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      type: r.type,
      concept: r.concept,
      category: r.category,
      amount: Number(r.amount),
      currency: (r.currency as any) || 'CUP',
      accountSource: (r.account_source as any) || 'casa',
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
    INSERT INTO transactions (id, type, concept, category, amount, currency, account_source, date, notes, created_at, updated_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      type = VALUES(type),
      concept = VALUES(concept),
      category = VALUES(category),
      amount = VALUES(amount),
      currency = VALUES(currency),
      account_source = VALUES(account_source),
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
    t.currency || 'CUP',
    t.accountSource || 'casa',
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
    .map(r => {
      let parsedBatches = undefined;
      if (r.batches_json) {
        try { parsedBatches = JSON.parse(r.batches_json); } catch (e) {}
      }
      let parsedSecondaryBarcodes = undefined;
      if (r.secondary_barcodes_json) {
        try { parsedSecondaryBarcodes = JSON.parse(r.secondary_barcodes_json); } catch (e) {}
      }
      return {
        id: r.id,
        barcode: r.barcode,
        name: r.name,
        costPrice: Number(r.cost_price),
        price: Number(r.price),
        priceUSD: r.price_usd !== null && r.price_usd !== undefined ? Number(r.price_usd) : undefined,
        costPriceUSD: r.cost_price_usd !== null && r.cost_price_usd !== undefined ? Number(r.cost_price_usd) : undefined,
        currency: (r.currency as any) || 'CUP',
        unit: r.unit || 'u',
        category: r.category,
        description: r.description || undefined,
        stock: Number(r.stock),
        photoUrl: r.photo_url || undefined,
        published: Boolean(r.published),
        salesCount: Number(r.sales_count || 0),
        supplierType: r.supplier_type || 'propia',
        supplierName: r.supplier_name || undefined,
        isExternal: Boolean(r.is_external),
        externalType: (r.external_type as any) || undefined,
        externalUrl: r.external_url || undefined,
        ratingScore: r.rating_score !== null && r.rating_score !== undefined ? Number(r.rating_score) : undefined,
        ratingCount: r.rating_count !== null && r.rating_count !== undefined ? Number(r.rating_count) : undefined,
        mfgDate: r.mfg_date || undefined,
        expDate: r.exp_date || undefined,
        batches: parsedBatches,
        secondaryBarcodes: parsedSecondaryBarcodes,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at)
      };
    });

  return { products, deletedSet };
}

async function saveMySQLProducts(products: StoreProduct[]) {
  if (!pool || products.length === 0) return;
  await ensureTableExists();

  const query = `
    INSERT INTO store_products (
      id, barcode, name, cost_price, price, price_usd, cost_price_usd, currency, unit,
      category, description, stock, photo_url, published, sales_count,
      supplier_type, supplier_name, is_external, external_type, external_url,
      rating_score, rating_count, mfg_date, exp_date, batches_json, secondary_barcodes_json,
      created_at, updated_at
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      barcode = VALUES(barcode),
      name = VALUES(name),
      cost_price = VALUES(cost_price),
      price = VALUES(price),
      price_usd = VALUES(price_usd),
      cost_price_usd = VALUES(cost_price_usd),
      currency = VALUES(currency),
      unit = VALUES(unit),
      category = VALUES(category),
      description = VALUES(description),
      stock = VALUES(stock),
      photo_url = VALUES(photo_url),
      published = VALUES(published),
      sales_count = VALUES(sales_count),
      supplier_type = VALUES(supplier_type),
      supplier_name = VALUES(supplier_name),
      is_external = VALUES(is_external),
      external_type = VALUES(external_type),
      external_url = VALUES(external_url),
      rating_score = VALUES(rating_score),
      rating_count = VALUES(rating_count),
      mfg_date = VALUES(mfg_date),
      exp_date = VALUES(exp_date),
      batches_json = VALUES(batches_json),
      secondary_barcodes_json = VALUES(secondary_barcodes_json),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at)
  `;

  const values = products.map(p => [
    p.id,
    p.barcode,
    p.name,
    p.costPrice || 0,
    p.price || 0,
    p.priceUSD !== undefined ? p.priceUSD : null,
    p.costPriceUSD !== undefined ? p.costPriceUSD : null,
    p.currency || 'CUP',
    p.unit || 'u',
    p.category,
    p.description || null,
    p.stock || 0,
    p.photoUrl || null,
    p.published ? 1 : 0,
    p.salesCount || 0,
    p.supplierType || 'propia',
    p.supplierName || null,
    p.isExternal ? 1 : 0,
    p.externalType || null,
    p.externalUrl || null,
    p.ratingScore !== undefined ? p.ratingScore : null,
    p.ratingCount || 0,
    p.mfgDate || null,
    p.expDate || null,
    p.batches ? JSON.stringify(p.batches) : null,
    p.secondaryBarcodes ? JSON.stringify(p.secondaryBarcodes) : null,
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
    totalAmountCUP: r.total_amount_cup !== null && r.total_amount_cup !== undefined ? Number(r.total_amount_cup) : undefined,
    totalAmountUSD: r.total_amount_usd !== null && r.total_amount_usd !== undefined ? Number(r.total_amount_usd) : undefined,
    totalCost: Number(r.total_cost),
    netProfit: Number(r.net_profit),
    currency: (r.currency as any) || 'CUP',
    sellerId: r.seller_id || undefined,
    sellerUsername: r.seller_username || undefined,
    sellerName: r.seller_name || undefined
  }));
}

async function saveMySQLSales(sales: StoreSaleRecord[]) {
  if (!pool || sales.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO store_sales (
      id, date, timestamp, items, total_amount, total_amount_cup, total_amount_usd,
      total_cost, net_profit, currency, seller_id, seller_username, seller_name
    )
    VALUES ?
    ON DUPLICATE KEY UPDATE
      date = VALUES(date),
      timestamp = VALUES(timestamp),
      items = VALUES(items),
      total_amount = VALUES(total_amount),
      total_amount_cup = VALUES(total_amount_cup),
      total_amount_usd = VALUES(total_amount_usd),
      total_cost = VALUES(total_cost),
      net_profit = VALUES(net_profit),
      currency = VALUES(currency),
      seller_id = VALUES(seller_id),
      seller_username = VALUES(seller_username),
      seller_name = VALUES(seller_name)
  `;
  const values = sales.map(s => [
    s.id,
    s.date,
    s.timestamp || Date.now(),
    JSON.stringify(s.items || []),
    s.totalAmount || 0,
    s.totalAmountCUP !== undefined ? s.totalAmountCUP : null,
    s.totalAmountUSD !== undefined ? s.totalAmountUSD : null,
    s.totalCost || 0,
    s.netProfit || 0,
    s.currency || 'CUP',
    s.sellerId || null,
    s.sellerUsername || null,
    s.sellerName || null
  ]);
  await pool.query(query, [values]);
}

// MySQL Suppliers Helpers
async function getMySQLSuppliers(): Promise<{ suppliers: SupplierAccount[]; deletedSet: Set<string> }> {
  if (!pool) return { suppliers: [], deletedSet: new Set() };
  await ensureTableExists();

  const [deletedRows] = await pool.query<RowDataPacket[]>('SELECT id FROM deleted_supplier_accounts');
  const deletedSet = new Set<string>(deletedRows.map(r => r.id));

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM supplier_accounts ORDER BY updated_at DESC');
  
  const suppliers: SupplierAccount[] = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      name: r.name,
      pendingPayout: Number(r.pending_payout),
      pendingPayoutUSD: Number(r.pending_payout_usd || 0),
      totalPaid: Number(r.total_paid),
      totalPaidUSD: Number(r.total_paid_usd || 0),
      updatedAt: Number(r.updated_at)
    }));

  return { suppliers, deletedSet };
}

async function saveMySQLSuppliers(suppliers: SupplierAccount[]) {
  if (!pool || suppliers.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO supplier_accounts (id, name, pending_payout, pending_payout_usd, total_paid, total_paid_usd, updated_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      pending_payout = VALUES(pending_payout),
      pending_payout_usd = VALUES(pending_payout_usd),
      total_paid = VALUES(total_paid),
      total_paid_usd = VALUES(total_paid_usd),
      updated_at = VALUES(updated_at)
  `;
  const values = suppliers.map(sup => [
    sup.id,
    sup.name,
    sup.pendingPayout || 0,
    sup.pendingPayoutUSD || 0,
    sup.totalPaid || 0,
    sup.totalPaidUSD || 0,
    sup.updatedAt || Date.now()
  ]);
  await pool.query(query, [values]);
}

async function deleteMySQLSuppliers(deletedIds: string[]) {
  if (!pool || deletedIds.length === 0) return;
  await ensureTableExists();

  await pool.query('DELETE FROM supplier_accounts WHERE id IN (?)', [deletedIds]);
  const values = deletedIds.map(id => [id, Date.now()]);
  await pool.query('INSERT IGNORE INTO deleted_supplier_accounts (id, deleted_at) VALUES ?', [values]);
}

// MySQL App Users Helpers
async function getMySQLUsers(): Promise<{ users: AppUser[]; deletedSet: Set<string> }> {
  if (!pool) return { users: [], deletedSet: new Set() };
  await ensureTableExists();

  const [deletedRows] = await pool.query<RowDataPacket[]>('SELECT id FROM deleted_app_users');
  const deletedSet = new Set<string>(deletedRows.map(r => r.id));

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM app_users ORDER BY created_at ASC');
  const users: AppUser[] = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      username: r.username,
      password: r.password,
      name: r.name,
      role: r.role as any,
      whatsappNumber: r.whatsapp_number || undefined,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at)
    }));

  if (!users.some(u => u.username.trim().toLowerCase() === 'admin')) {
    const adminUser: AppUser = {
      id: 'usr-admin',
      username: 'admin',
      password: '1234',
      name: 'Administrador',
      role: 'propietario',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveMySQLUsers([adminUser]);
    users.unshift(adminUser);
  }

  return { users, deletedSet };
}

async function saveMySQLUsers(users: AppUser[]) {
  if (!pool || users.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO app_users (id, username, password, name, role, whatsapp_number, created_at, updated_at)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      username = VALUES(username),
      password = VALUES(password),
      name = VALUES(name),
      role = VALUES(role),
      whatsapp_number = VALUES(whatsapp_number),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at)
  `;
  const values = users.map(u => [
    u.id,
    u.username,
    u.password,
    u.name,
    u.role,
    u.whatsappNumber || null,
    u.createdAt || Date.now(),
    u.updatedAt || Date.now()
  ]);
  await pool.query(query, [values]);
}

async function deleteMySQLUsers(deletedIds: string[]) {
  if (!pool || deletedIds.length === 0) return;
  await ensureTableExists();

  await pool.query('DELETE FROM app_users WHERE id IN (?)', [deletedIds]);
  const values = deletedIds.map(id => [id, Date.now()]);
  await pool.query('INSERT IGNORE INTO deleted_app_users (id, deleted_at) VALUES ?', [values]);
}

// MySQL Customer Debts (Fiados) Helpers
async function getMySQLCustomerDebts(): Promise<{ customerDebts: CustomerDebtRecord[]; deletedSet: Set<string> }> {
  if (!pool) return { customerDebts: [], deletedSet: new Set() };
  await ensureTableExists();

  const [deletedRows] = await pool.query<RowDataPacket[]>('SELECT id FROM deleted_customer_debts');
  const deletedSet = new Set<string>(deletedRows.map(r => r.id));

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customer_debts ORDER BY updated_at DESC');
  
  const customerDebts: CustomerDebtRecord[] = rows
    .filter(r => !deletedSet.has(r.id))
    .map(r => ({
      id: r.id,
      saleId: r.sale_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone || undefined,
      debtTypeCUP: (r.debt_type_cup as any) || 'efectivo',
      amountCUP: Number(r.amount_cup || 0),
      amountUSD: Number(r.amount_usd || 0),
      paidCUP: Number(r.paid_cup || 0),
      paidUSD: Number(r.paid_usd || 0),
      status: (r.status as any) || 'pendiente',
      date: r.date,
      timestamp: Number(r.timestamp),
      updatedAt: Number(r.updated_at),
      notes: r.notes || undefined
    }));

  return { customerDebts, deletedSet };
}

async function saveMySQLCustomerDebts(debts: CustomerDebtRecord[]) {
  if (!pool || debts.length === 0) return;
  await ensureTableExists();
  const query = `
    INSERT INTO customer_debts (id, sale_id, customer_name, customer_phone, debt_type_cup, amount_cup, amount_usd, paid_cup, paid_usd, status, date, timestamp, updated_at, notes)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      sale_id = VALUES(sale_id),
      customer_name = VALUES(customer_name),
      customer_phone = VALUES(customer_phone),
      debt_type_cup = VALUES(debt_type_cup),
      amount_cup = VALUES(amount_cup),
      amount_usd = VALUES(amount_usd),
      paid_cup = VALUES(paid_cup),
      paid_usd = VALUES(paid_usd),
      status = VALUES(status),
      date = VALUES(date),
      timestamp = VALUES(timestamp),
      updated_at = VALUES(updated_at),
      notes = VALUES(notes)
  `;
  const values = debts.map(d => [
    d.id,
    d.saleId,
    d.customerName,
    d.customerPhone || null,
    d.debtTypeCUP || 'efectivo',
    d.amountCUP || 0,
    d.amountUSD || 0,
    d.paidCUP || 0,
    d.paidUSD || 0,
    d.status || 'pendiente',
    d.date,
    d.timestamp || Date.now(),
    d.updatedAt || Date.now(),
    d.notes || null
  ]);
  await pool.query(query, [values]);
}

async function deleteMySQLCustomerDebts(deletedIds: string[]) {
  if (!pool || deletedIds.length === 0) return;
  await ensureTableExists();
  await pool.query('DELETE FROM customer_debts WHERE id IN (?)', [deletedIds]);
  const deletedValues = deletedIds.map(id => [id, Date.now()]);
  await pool.query('INSERT IGNORE INTO deleted_customer_debts (id, deleted_at) VALUES ?', [deletedValues]);
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

async function checkMySQLConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
    ]);
    return true;
  } catch (err) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const useMySQL = await checkMySQLConnection();
    const isPublicRequest = req.nextUrl.searchParams.get('public') === '1';

    let currentCloudTransactions: Transaction[] = [];
    let currentCloudProducts: StoreProduct[] = [];
    let currentCloudSales: StoreSaleRecord[] = [];
    let currentCloudSuppliers: SupplierAccount[] = [];
    let currentCloudUsers: AppUser[] = [];
    let currentCloudCustomerDebts: CustomerDebtRecord[] = [];
    let currentCloudShifts: any[] = [];
    let currentStoreFund = 0;
    let currentStoreFundUSD = 0;
    let currentSavingsFund = 0;
    let currentSavingsFundUSD = 0;
    let currentSettings: any = {};
    let deletedIds: string[] = [];
    let deletedProductIds: string[] = [];
    let deletedSupplierIds: string[] = [];
    let deletedUserIds: string[] = [];
    let deletedDebtIds: string[] = [];
    let lastResetAt = 0;

    if (useMySQL) {
      const prodResult = await getMySQLProducts();
      currentCloudProducts = prodResult.products;
      deletedProductIds = Array.from(prodResult.deletedSet);

      const settingsStr = await getMySQLAppState('settings');
      if (settingsStr !== null) {
        try { currentSettings = JSON.parse(settingsStr); } catch (e) {}
      }

      if (!isPublicRequest) {
        const txResult = await getMySQLTransactions();
        currentCloudTransactions = txResult.transactions;
        deletedIds = Array.from(txResult.deletedSet);

        currentCloudSales = await getMySQLSales();

        const supResult = await getMySQLSuppliers();
        currentCloudSuppliers = supResult.suppliers;
        deletedSupplierIds = Array.from(supResult.deletedSet);

        const userResult = await getMySQLUsers();
        currentCloudUsers = userResult.users;
        deletedUserIds = Array.from(userResult.deletedSet);

        const debtResult = await getMySQLCustomerDebts();
        currentCloudCustomerDebts = debtResult.customerDebts;
        deletedDebtIds = Array.from(debtResult.deletedSet);

        const shiftsStr = await getMySQLAppState('shifts');
        if (shiftsStr !== null) {
          try { currentCloudShifts = JSON.parse(shiftsStr); } catch (e) {}
        }

        const storeFundStr = await getMySQLAppState('storeFund');
        if (storeFundStr !== null) currentStoreFund = Number(storeFundStr);

        const storeFundUSDStr = await getMySQLAppState('storeFundUSD');
        if (storeFundUSDStr !== null) currentStoreFundUSD = Number(storeFundUSDStr);

        const savingsFundStr = await getMySQLAppState('savingsFund');
        if (savingsFundStr !== null) currentSavingsFund = Number(savingsFundStr);

        const savingsFundUSDStr = await getMySQLAppState('savingsFundUSD');
        if (savingsFundUSDStr !== null) currentSavingsFundUSD = Number(savingsFundUSDStr);

        const resetStr = await getMySQLAppState('lastResetAt');
        if (resetStr !== null) lastResetAt = Number(resetStr);
      }
    } else {
      const fileData = loadFileData();
      currentCloudProducts = fileData.storeProducts;
      currentSettings = fileData.settings;
      deletedProductIds = fileData.deletedProductIds || [];

      if (!isPublicRequest) {
        currentCloudTransactions = fileData.transactions;
        currentCloudSales = fileData.storeSales;
        currentCloudSuppliers = fileData.supplierAccounts;
        currentCloudUsers = fileData.users;
        currentCloudCustomerDebts = fileData.customerDebts || [];
        currentCloudShifts = fileData.shifts || [];
        currentStoreFund = fileData.storeFund;
        currentStoreFundUSD = fileData.storeFundUSD || 0;
        currentSavingsFund = fileData.savingsFund;
        currentSavingsFundUSD = fileData.savingsFundUSD || 0;
        deletedIds = fileData.deletedIds || [];
        deletedSupplierIds = fileData.deletedSupplierIds || [];
        deletedUserIds = fileData.deletedUserIds || [];
        deletedDebtIds = fileData.deletedDebtIds || [];
        lastResetAt = fileData.lastResetAt || 0;
      }
    }

    if (isPublicRequest) {
      const publicProducts = currentCloudProducts
        .filter(p => p.published !== false)
        .map(p => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          costPrice: 0,
          price: p.price,
          priceUSD: p.priceUSD,
          currency: p.currency || 'CUP',
          unit: p.unit || 'u',
          category: p.category,
          description: p.description,
          stock: p.stock,
          photoUrl: p.photoUrl,
          published: true,
          salesCount: p.salesCount || 0,
          supplierType: 'propia' as const,
          isExternal: p.isExternal,
          externalType: p.externalType,
          externalUrl: p.externalUrl,
          ratingScore: p.ratingScore,
          ratingCount: p.ratingCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));

      const publicSettings = {
        currency: currentSettings?.currency || '$',
        appName: currentSettings?.appName || 'Samy Store',
        storeWhatsappNumber: currentSettings?.storeWhatsappNumber,
        currencyMode: currentSettings?.currencyMode || 'BOTH',
        exchangeRateUSD: currentSettings?.exchangeRateUSD || 320,
        exchangeRateTrend: currentSettings?.exchangeRateTrend || 'stable',
        usdIndexedPricing: currentSettings?.usdIndexedPricing ?? false,
        primaryColor: currentSettings?.primaryColor || '#1A73E8',
        updatedAt: currentSettings?.updatedAt
      };

      return NextResponse.json({
        success: true,
        publicCatalog: true,
        storeProducts: publicProducts,
        deletedProductIds,
        settings: publicSettings,
        productCount: publicProducts.length,
        storage: useMySQL ? 'Hostinger MySQL' : 'Local File Storage'
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    return NextResponse.json({
      success: true,
      transactions: currentCloudTransactions,
      storeProducts: currentCloudProducts,
      storeSales: currentCloudSales,
      shifts: currentCloudShifts,
      supplierAccounts: currentCloudSuppliers,
      users: currentCloudUsers,
      customerDebts: currentCloudCustomerDebts,
      storeFund: currentStoreFund,
      storeFundUSD: currentStoreFundUSD,
      savingsFund: currentSavingsFund,
      savingsFundUSD: currentSavingsFundUSD,
      settings: currentSettings,
      deletedIds,
      deletedProductIds,
      deletedSupplierIds,
      deletedUserIds,
      deletedDebtIds,
      lastResetAt,
      count: currentCloudTransactions.length,
      productCount: currentCloudProducts.length,
      userCount: currentCloudUsers.length,
      storage: useMySQL ? 'Hostinger MySQL' : 'Local File Storage'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.warn('Sync GET fallback to local file due to:', error);
    const fileData = loadFileData();
    return NextResponse.json({
      success: true,
      transactions: fileData.transactions || [],
      storeProducts: fileData.storeProducts || [],
      storeSales: fileData.storeSales || [],
      shifts: fileData.shifts || [],
      supplierAccounts: fileData.supplierAccounts || [],
      users: fileData.users || [],
      customerDebts: fileData.customerDebts || [],
      storeFund: fileData.storeFund || 0,
      storeFundUSD: fileData.storeFundUSD || 0,
      savingsFund: fileData.savingsFund || 0,
      savingsFundUSD: fileData.savingsFundUSD || 0,
      settings: fileData.settings || {},
      deletedIds: fileData.deletedIds || [],
      deletedProductIds: fileData.deletedProductIds || [],
      deletedSupplierIds: fileData.deletedSupplierIds || [],
      deletedUserIds: fileData.deletedUserIds || [],
      deletedDebtIds: fileData.deletedDebtIds || [],
      lastResetAt: fileData.lastResetAt || 0,
      count: (fileData.transactions || []).length,
      productCount: (fileData.storeProducts || []).length,
      userCount: (fileData.users || []).length,
      storage: 'Local File Storage'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const useMySQL = await checkMySQLConnection();
    const body = await req.json();
    const now = Date.now();

    const isResetRequested = !!(body.resetAll || body.pendingReset);
    const resetTimestamp = Number(body.pendingResetAt || body.resetAt || now);

    // 0. Process Full Database Reset if requested (Preserving configured users)
    if (isResetRequested) {
      if (useMySQL && pool) {
        try {
          await pool.query('DELETE FROM transactions');
          await pool.query('DELETE FROM store_products');
          await pool.query('DELETE FROM store_sales');
          await pool.query('DELETE FROM supplier_accounts');
          await pool.query('DELETE FROM app_state');
          await pool.query('DELETE FROM deleted_transactions');
          await pool.query('DELETE FROM deleted_store_products');
          await pool.query('DELETE FROM deleted_supplier_accounts');
          await pool.query('DELETE FROM deleted_app_users');
          await pool.query('DELETE FROM customer_debts');
          await pool.query('DELETE FROM deleted_customer_debts');
          await saveMySQLAppState('lastResetAt', String(resetTimestamp));
        } catch (dbErr) {
          console.warn('MySQL reset error:', dbErr);
        }
      }
      const existingData = loadFileData();
      saveFileData({
        transactions: [],
        storeProducts: [],
        storeSales: [],
        supplierAccounts: [],
        users: existingData.users || [],
        customerDebts: [],
        shifts: [],
        storeFund: 0,
        storeFundUSD: 0,
        savingsFund: 0,
        savingsFundUSD: 0,
        settings: existingData.settings || {},
        deletedIds: [],
        deletedProductIds: [],
        deletedSupplierIds: [],
        deletedUserIds: [],
        deletedDebtIds: [],
        lastResetAt: resetTimestamp
      });

      // If standalone reset without any accompanying payload, return immediately
      if (body.resetAll && (!Array.isArray(body.transactions) || body.transactions.length === 0) && (!Array.isArray(body.storeProducts) || body.storeProducts.length === 0)) {
        return NextResponse.json({
          success: true,
          transactions: [],
          storeProducts: [],
          storeSales: [],
          supplierAccounts: [],
          users: existingData.users || [],
          customerDebts: [],
          storeFund: 0,
          storeFundUSD: 0,
          savingsFund: 0,
          savingsFundUSD: 0,
          settings: {},
          deletedIds: [],
          deletedProductIds: [],
          deletedSupplierIds: [],
          deletedUserIds: [],
          deletedDebtIds: [],
          lastResetAt: resetTimestamp,
          count: 0,
          productCount: 0,
          message: 'Base de datos vaciada y reiniciada a cero en la nube (usuarios conservados).'
        });
      }
    }

    // Check server lastResetAt
    let serverLastResetAt = 0;
    if (useMySQL) {
      const resetStr = await getMySQLAppState('lastResetAt');
      if (resetStr !== null) serverLastResetAt = Number(resetStr);
    } else {
      serverLastResetAt = loadFileData().lastResetAt || 0;
    }
    if (isResetRequested) {
      serverLastResetAt = resetTimestamp;
    }

    const clientLastSync = Number(body.clientLastSync || 0);
    // Only check if client sync predates a prior reset if this request itself is NOT performing the reset
    const wasResetAfterClientSync = !isResetRequested && serverLastResetAt > 0 && clientLastSync < serverLastResetAt;

    // Filter client items:
    // If wasResetAfterClientSync, discard ONLY pre-reset items (createdAt < serverLastResetAt).
    // Any item created AT or AFTER serverLastResetAt is post-reset and MUST BE PRESERVED!
    let clientTransactions: Transaction[] = Array.isArray(body.transactions)
      ? (wasResetAfterClientSync
          ? body.transactions.filter((t: Transaction) => ((t as any).createdAt || t.updatedAt || 0) >= serverLastResetAt)
          : body.transactions)
      : [];

    let clientProducts: StoreProduct[] = Array.isArray(body.storeProducts)
      ? (wasResetAfterClientSync
          ? body.storeProducts.filter((p: StoreProduct) => ((p as any).createdAt || (p as any).updatedAt || 0) >= serverLastResetAt)
          : body.storeProducts)
      : [];

    let clientSales: StoreSaleRecord[] = Array.isArray(body.storeSales)
      ? (wasResetAfterClientSync
          ? body.storeSales.filter((s: StoreSaleRecord) => (s.timestamp || 0) >= serverLastResetAt)
          : body.storeSales)
      : [];

    let clientSuppliers: SupplierAccount[] = Array.isArray(body.supplierAccounts)
      ? (wasResetAfterClientSync
          ? body.supplierAccounts.filter((s: SupplierAccount) => ((s as any).createdAt || (s as any).updatedAt || 0) >= serverLastResetAt)
          : body.supplierAccounts)
      : [];

    let clientCustomerDebts: CustomerDebtRecord[] = Array.isArray(body.customerDebts)
      ? (wasResetAfterClientSync
          ? body.customerDebts.filter((d: CustomerDebtRecord) => ((d as any).timestamp || (d as any).updatedAt || 0) >= serverLastResetAt)
          : body.customerDebts)
      : [];

    const deletedIds: string[] = Array.isArray(body.deletedIds) ? body.deletedIds : [];
    const deletedProductIds: string[] = Array.isArray(body.deletedProductIds) ? body.deletedProductIds : [];
    const deletedSupplierIds: string[] = Array.isArray(body.deletedSupplierIds) ? body.deletedSupplierIds : [];
    const clientUsers: AppUser[] = Array.isArray(body.users) ? body.users : [];
    const deletedUserIds: string[] = Array.isArray(body.deletedUserIds) ? body.deletedUserIds : [];
    const deletedDebtIds: string[] = Array.isArray(body.deletedDebtIds) ? body.deletedDebtIds : [];
    const clientStoreFund = body.storeFund !== undefined ? Number(body.storeFund) : undefined;
    const clientStoreFundUSD = body.storeFundUSD !== undefined ? Number(body.storeFundUSD) : undefined;
    const clientSavingsFund = body.savingsFund !== undefined ? Number(body.savingsFund) : undefined;
    const clientSavingsFundUSD = body.savingsFundUSD !== undefined ? Number(body.savingsFundUSD) : undefined;
    const clientSettings = body.settings && typeof body.settings === 'object' ? body.settings : undefined;

    // 1. Process transaction deletions
    if (deletedIds.length > 0) {
      if (useMySQL) {
        await deleteMySQLTransactions(deletedIds);
      } else {
        const fileData = loadFileData();
        fileData.transactions = fileData.transactions.filter(t => !deletedIds.includes(t.id));
        const set = new Set([...(fileData.deletedIds || []), ...deletedIds]);
        fileData.deletedIds = Array.from(set);
        saveFileData(fileData);
      }
    }

    // 2. Process product deletions
    if (deletedProductIds.length > 0) {
      if (useMySQL) {
        await deleteMySQLProducts(deletedProductIds);
      } else {
        const fileData = loadFileData();
        fileData.storeProducts = fileData.storeProducts.filter(p => !deletedProductIds.includes(p.id));
        const set = new Set([...(fileData.deletedProductIds || []), ...deletedProductIds]);
        fileData.deletedProductIds = Array.from(set);
        saveFileData(fileData);
      }
    }

    // 2b. Process supplier deletions
    if (deletedSupplierIds.length > 0) {
      if (useMySQL) {
        await deleteMySQLSuppliers(deletedSupplierIds);
      } else {
        const fileData = loadFileData();
        fileData.supplierAccounts = fileData.supplierAccounts.filter(s => !deletedSupplierIds.includes(s.id));
        const set = new Set([...(fileData.deletedSupplierIds || []), ...deletedSupplierIds]);
        fileData.deletedSupplierIds = Array.from(set);
        saveFileData(fileData);
      }
    }

    // 2c. Process user deletions
    if (deletedUserIds.length > 0) {
      if (useMySQL) {
        await deleteMySQLUsers(deletedUserIds);
      } else {
        const fileData = loadFileData();
        fileData.users = fileData.users.filter(u => !deletedUserIds.includes(u.id));
        const set = new Set([...(fileData.deletedUserIds || []), ...deletedUserIds]);
        fileData.deletedUserIds = Array.from(set);
        saveFileData(fileData);
      }
    }

    // 2d. Process customer debt deletions
    if (deletedDebtIds.length > 0) {
      if (useMySQL) {
        await deleteMySQLCustomerDebts(deletedDebtIds);
      } else {
        const fileData = loadFileData();
        fileData.customerDebts = (fileData.customerDebts || []).filter(d => !deletedDebtIds.includes(d.id));
        const set = new Set([...(fileData.deletedDebtIds || []), ...deletedDebtIds]);
        fileData.deletedDebtIds = Array.from(set);
        saveFileData(fileData);
      }
    }

    // 3. Load & Merge Transactions
    let serverTransactions: Transaction[] = [];
    let deletedSet = new Set<string>();

    if (useMySQL) {
      const mysqlData = await getMySQLTransactions();
      serverTransactions = mysqlData.transactions;
      deletedSet = mysqlData.deletedSet;
    } else {
      const fileData = loadFileData();
      serverTransactions = fileData.transactions;
      deletedSet = new Set(fileData.deletedIds || []);
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

    if (useMySQL && txsToSaveToMySQL.length > 0) {
      await saveMySQLTransactions(txsToSaveToMySQL);
    }

    // 4. Load & Merge Products
    let serverProducts: StoreProduct[] = [];
    let deletedProductSet = new Set<string>();

    if (useMySQL) {
      const mysqlProds = await getMySQLProducts();
      serverProducts = mysqlProds.products;
      deletedProductSet = mysqlProds.deletedSet;
    } else {
      const fileData = loadFileData();
      serverProducts = fileData.storeProducts;
      deletedProductSet = new Set(fileData.deletedProductIds || []);
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

    if (useMySQL && productsToSaveToMySQL.length > 0) {
      await saveMySQLProducts(productsToSaveToMySQL);
    }

    // 5. Load & Merge Sales
    let serverSales: StoreSaleRecord[] = [];
    if (useMySQL) {
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
    if (useMySQL && salesToSaveToMySQL.length > 0) {
      await saveMySQLSales(salesToSaveToMySQL);
    }

    // 6. Load & Merge Supplier Accounts
    let serverSuppliers: SupplierAccount[] = [];
    let deletedSupplierSet = new Set<string>();
    if (useMySQL) {
      const res = await getMySQLSuppliers();
      serverSuppliers = res.suppliers;
      deletedSupplierSet = res.deletedSet;
    } else {
      const fileData = loadFileData();
      serverSuppliers = fileData.supplierAccounts;
      deletedSupplierSet = new Set(fileData.deletedSupplierIds || []);
    }

    const mergedSupplierMap = new Map<string, SupplierAccount>();
    for (const sup of serverSuppliers) {
      if (sup && (sup.id || sup.name) && (!sup.id || !deletedSupplierSet.has(sup.id))) {
        const key = sup.id || sup.name;
        mergedSupplierMap.set(key, sup);
      }
    }

    const suppliersToSaveToMySQL: SupplierAccount[] = [];
    for (const sup of clientSuppliers) {
      if (sup && (sup.id || sup.name) && (!sup.id || !deletedSupplierSet.has(sup.id))) {
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
    if (useMySQL && suppliersToSaveToMySQL.length > 0) {
      await saveMySQLSuppliers(suppliersToSaveToMySQL);
    }

    // 6b. Load & Merge Users
    let serverUsers: AppUser[] = [];
    let deletedUserSet = new Set<string>();
    if (useMySQL) {
      const res = await getMySQLUsers();
      serverUsers = res.users;
      deletedUserSet = res.deletedSet;
    } else {
      const fileData = loadFileData();
      serverUsers = fileData.users;
      deletedUserSet = new Set(fileData.deletedUserIds || []);
    }

    const mergedUserMap = new Map<string, AppUser>();
    for (const u of serverUsers) {
      if (u && u.id && !deletedUserSet.has(u.id)) {
        mergedUserMap.set(u.id, u);
      }
    }

    const usersToSaveToMySQL: AppUser[] = [];
    for (const u of clientUsers) {
      if (u && u.id && !deletedUserSet.has(u.id)) {
        const existing = mergedUserMap.get(u.id);
        if (!existing) {
          mergedUserMap.set(u.id, u);
          usersToSaveToMySQL.push(u);
        } else {
          const existingTime = existing.updatedAt || 0;
          const clientTime = u.updatedAt || 0;
          if (clientTime >= existingTime) {
            mergedUserMap.set(u.id, u);
            usersToSaveToMySQL.push(u);
          }
        }
      }
    }

    const mergedUsers = Array.from(mergedUserMap.values());
    if (useMySQL && usersToSaveToMySQL.length > 0) {
      await saveMySQLUsers(usersToSaveToMySQL);
    }

    // 6c. Load & Merge Shifts
    let serverShifts: any[] = [];
    if (useMySQL) {
      const shiftsStr = await getMySQLAppState('shifts');
      if (shiftsStr !== null) {
        try { serverShifts = JSON.parse(shiftsStr); } catch (e) {}
      }
    } else {
      serverShifts = loadFileData().shifts || [];
    }

    const mergedShiftsMap = new Map<string, any>();
    for (const sh of serverShifts) {
      if (sh && sh.id) mergedShiftsMap.set(sh.id, sh);
    }

    const clientShifts: any[] = Array.isArray(body.shifts) ? body.shifts : [];
    for (const sh of clientShifts) {
      if (sh && sh.id) {
        const existing = mergedShiftsMap.get(sh.id);
        if (!existing) {
          mergedShiftsMap.set(sh.id, sh);
        } else {
          if (sh.status === 'cerrado' || sh.sellerAcceptedOpening) {
            mergedShiftsMap.set(sh.id, { ...existing, ...sh });
          }
        }
      }
    }

    const mergedShifts = Array.from(mergedShiftsMap.values());
    if (useMySQL) {
      await saveMySQLAppState('shifts', JSON.stringify(mergedShifts));
    }

    // 6d. Load & Merge Customer Debts (Fiados)
    let serverCustomerDebts: CustomerDebtRecord[] = [];
    let deletedDebtSet = new Set<string>();
    if (useMySQL) {
      const res = await getMySQLCustomerDebts();
      serverCustomerDebts = res.customerDebts;
      deletedDebtSet = res.deletedSet;
    } else {
      const fileData = loadFileData();
      serverCustomerDebts = fileData.customerDebts || [];
      deletedDebtSet = new Set(fileData.deletedDebtIds || []);
    }

    const mergedDebtMap = new Map<string, CustomerDebtRecord>();
    for (const d of serverCustomerDebts) {
      if (d && d.id && !deletedDebtSet.has(d.id)) {
        mergedDebtMap.set(d.id, d);
      }
    }

    const debtsToSaveToMySQL: CustomerDebtRecord[] = [];
    for (const d of clientCustomerDebts) {
      if (d && d.id && !deletedDebtSet.has(d.id)) {
        const existing = mergedDebtMap.get(d.id);
        if (!existing) {
          mergedDebtMap.set(d.id, d);
          debtsToSaveToMySQL.push(d);
        } else {
          const existingTime = existing.updatedAt || 0;
          const clientTime = d.updatedAt || 0;
          if (clientTime >= existingTime) {
            mergedDebtMap.set(d.id, d);
            debtsToSaveToMySQL.push(d);
          }
        }
      }
    }

    const mergedCustomerDebts = Array.from(mergedDebtMap.values());
    if (useMySQL && debtsToSaveToMySQL.length > 0) {
      await saveMySQLCustomerDebts(debtsToSaveToMySQL);
    }

    // 7. Load & Merge Funds & Settings (Protected against uninitialized client zero-overwrites)
    const isFreshClientSync = !isResetRequested && clientLastSync === 0 && clientTransactions.length === 0 && clientSales.length === 0;

    let serverStoreFund = 0;
    let serverStoreFundUSD = 0;
    let serverSavingsFund = 0;
    let serverSavingsFundUSD = 0;
    let serverSettings: any = {};

    if (useMySQL) {
      const sfStr = await getMySQLAppState('storeFund');
      if (sfStr !== null) serverStoreFund = Number(sfStr);

      const sfUSDStr = await getMySQLAppState('storeFundUSD');
      if (sfUSDStr !== null) serverStoreFundUSD = Number(sfUSDStr);

      const svStr = await getMySQLAppState('savingsFund');
      if (svStr !== null) serverSavingsFund = Number(svStr);

      const svUSDStr = await getMySQLAppState('savingsFundUSD');
      if (svUSDStr !== null) serverSavingsFundUSD = Number(svUSDStr);

      const stStr = await getMySQLAppState('settings');
      if (stStr !== null) {
        try { serverSettings = JSON.parse(stStr); } catch (e) {}
      }
    } else {
      const fileData = loadFileData();
      serverStoreFund = fileData.storeFund || 0;
      serverStoreFundUSD = fileData.storeFundUSD || 0;
      serverSavingsFund = fileData.savingsFund || 0;
      serverSavingsFundUSD = fileData.savingsFundUSD || 0;
      serverSettings = fileData.settings || {};
    }

    const resolveFundValue = (clientVal: number | undefined, serverVal: number): number => {
      if (clientVal === undefined) return serverVal;
      if (isFreshClientSync && clientVal === 0 && serverVal > 0) return serverVal;
      return clientVal;
    };

    const mergedStoreFund = resolveFundValue(clientStoreFund, serverStoreFund);
    const mergedStoreFundUSD = resolveFundValue(clientStoreFundUSD, serverStoreFundUSD);
    const mergedSavingsFund = resolveFundValue(clientSavingsFund, serverSavingsFund);
    const mergedSavingsFundUSD = resolveFundValue(clientSavingsFundUSD, serverSavingsFundUSD);

    // Only overwrite settings if client settings have a newer or equal updatedAt, or server has none
    let mergedSettings: any = serverSettings;
    if (clientSettings && Object.keys(clientSettings).length > 0) {
      const serverSettingsTime = Number(serverSettings?.updatedAt || 0);
      const clientSettingsTime = Number(clientSettings?.updatedAt || 0);
      if (!isFreshClientSync || serverSettingsTime === 0 || clientSettingsTime >= serverSettingsTime) {
        mergedSettings = { ...serverSettings, ...clientSettings };
      }
    }

    if (useMySQL) {
      await saveMySQLAppState('storeFund', String(mergedStoreFund));
      await saveMySQLAppState('storeFundUSD', String(mergedStoreFundUSD));
      await saveMySQLAppState('savingsFund', String(mergedSavingsFund));
      await saveMySQLAppState('savingsFundUSD', String(mergedSavingsFundUSD));
      await saveMySQLAppState('settings', JSON.stringify(mergedSettings));
    } else {
      saveFileData({
        transactions: mergedTransactions,
        storeProducts: mergedProducts,
        storeSales: mergedSales,
        shifts: mergedShifts,
        supplierAccounts: mergedSuppliers,
        users: mergedUsers,
        customerDebts: mergedCustomerDebts,
        storeFund: mergedStoreFund,
        storeFundUSD: mergedStoreFundUSD,
        savingsFund: mergedSavingsFund,
        savingsFundUSD: mergedSavingsFundUSD,
        settings: mergedSettings,
        deletedIds: Array.from(deletedSet),
        deletedProductIds: Array.from(deletedProductSet),
        deletedSupplierIds: Array.from(deletedSupplierSet),
        deletedUserIds: Array.from(deletedUserSet),
        deletedDebtIds: Array.from(deletedDebtSet),
        lastResetAt: serverLastResetAt
      });
    }

    return NextResponse.json({
      success: true,
      transactions: mergedTransactions,
      storeProducts: mergedProducts,
      storeSales: mergedSales,
      shifts: mergedShifts,
      supplierAccounts: mergedSuppliers,
      users: mergedUsers,
      customerDebts: mergedCustomerDebts,
      storeFund: mergedStoreFund,
      storeFundUSD: mergedStoreFundUSD,
      savingsFund: mergedSavingsFund,
      savingsFundUSD: mergedSavingsFundUSD,
      settings: mergedSettings,
      deletedIds: Array.from(deletedSet),
      deletedProductIds: Array.from(deletedProductSet),
      deletedSupplierIds: Array.from(deletedSupplierSet),
      deletedUserIds: Array.from(deletedUserSet),
      deletedDebtIds: Array.from(deletedDebtSet),
      lastResetAt: serverLastResetAt,
      count: mergedTransactions.length,
      productCount: mergedProducts.length,
      storage: useMySQL ? 'Hostinger MySQL' : 'Local File Storage',
      message: `Sincronización Hostinger exitosa. Todos los datos unificados.`
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.warn('Sync POST fallback to local file due to:', error);
    const fileData = loadFileData();
    return NextResponse.json({
      success: true,
      transactions: fileData.transactions || [],
      storeProducts: fileData.storeProducts || [],
      storeSales: fileData.storeSales || [],
      shifts: fileData.shifts || [],
      supplierAccounts: fileData.supplierAccounts || [],
      users: fileData.users || [],
      customerDebts: fileData.customerDebts || [],
      storeFund: fileData.storeFund || 0,
      storeFundUSD: fileData.storeFundUSD || 0,
      savingsFund: fileData.savingsFund || 0,
      savingsFundUSD: fileData.savingsFundUSD || 0,
      settings: fileData.settings || {},
      deletedIds: fileData.deletedIds || [],
      deletedProductIds: fileData.deletedProductIds || [],
      deletedSupplierIds: fileData.deletedSupplierIds || [],
      deletedUserIds: fileData.deletedUserIds || [],
      deletedDebtIds: fileData.deletedDebtIds || [],
      lastResetAt: fileData.lastResetAt || 0,
      count: (fileData.transactions || []).length,
      productCount: (fileData.storeProducts || []).length,
      userCount: (fileData.users || []).length,
      storage: 'Local File Storage',
      message: 'Sincronizado localmente (offline fallback).'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
}
