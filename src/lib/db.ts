import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { StoreProduct } from '@/types';

// Create a connection pool if MySQL environment variables are provided
const pool = (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE)
  ? mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    })
  : null;

let tableEnsured = false;

export async function ensureTableExists() {
  if (!pool || tableEnsured) return;

  const createTransactionsQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      type ENUM('ingreso', 'gasto') NOT NULL,
      concept VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'CUP',
      account_source VARCHAR(20) NOT NULL DEFAULT 'casa',
      date VARCHAR(20) NOT NULL,
      notes TEXT NULL,
      photo_url LONGTEXT NULL,
      photo_name VARCHAR(255) NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      INDEX idx_date (date),
      INDEX idx_updated_at (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createDeletedQuery = `
    CREATE TABLE IF NOT EXISTS deleted_transactions (
      id VARCHAR(64) PRIMARY KEY,
      deleted_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createProductsQuery = `
    CREATE TABLE IF NOT EXISTS store_products (
      id VARCHAR(64) PRIMARY KEY,
      barcode VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      price_usd DECIMAL(12, 2) NULL,
      cost_price_usd DECIMAL(12, 2) NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'CUP',
      unit VARCHAR(20) NOT NULL DEFAULT 'u',
      category VARCHAR(100) NOT NULL,
      description TEXT NULL,
      stock INT NOT NULL DEFAULT 0,
      photo_url LONGTEXT NULL,
      published TINYINT(1) NOT NULL DEFAULT 1,
      sales_count INT NOT NULL DEFAULT 0,
      supplier_type VARCHAR(50) NULL,
      supplier_name VARCHAR(255) NULL,
      is_external TINYINT(1) NOT NULL DEFAULT 0,
      external_type VARCHAR(30) NULL,
      external_url TEXT NULL,
      rating_score DECIMAL(4, 2) NULL,
      rating_count INT NOT NULL DEFAULT 0,
      mfg_date VARCHAR(20) NULL,
      exp_date VARCHAR(20) NULL,
      batches_json LONGTEXT NULL,
      secondary_barcodes_json TEXT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      INDEX idx_barcode (barcode),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createDeletedProductsQuery = `
    CREATE TABLE IF NOT EXISTS deleted_store_products (
      id VARCHAR(64) PRIMARY KEY,
      deleted_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createSalesQuery = `
    CREATE TABLE IF NOT EXISTS store_sales (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(20) NOT NULL,
      timestamp BIGINT NOT NULL,
      items LONGTEXT NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_amount_cup DECIMAL(12, 2) NULL,
      total_amount_usd DECIMAL(12, 2) NULL,
      total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
      net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'CUP',
      seller_id VARCHAR(100) NULL,
      seller_username VARCHAR(100) NULL,
      seller_name VARCHAR(255) NULL,
      INDEX idx_sales_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createSuppliersQuery = `
    CREATE TABLE IF NOT EXISTS supplier_accounts (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      pending_payout DECIMAL(12, 2) NOT NULL DEFAULT 0,
      pending_payout_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_paid_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      updated_at BIGINT NOT NULL,
      INDEX idx_supplier_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createAppStateQuery = `
    CREATE TABLE IF NOT EXISTS app_state (
      state_key VARCHAR(64) PRIMARY KEY,
      state_value LONGTEXT NOT NULL,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createDeletedSuppliersQuery = `
    CREATE TABLE IF NOT EXISTS deleted_supplier_accounts (
      id VARCHAR(64) PRIMARY KEY,
      deleted_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createUsersQuery = `
    CREATE TABLE IF NOT EXISTS app_users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      whatsapp_number VARCHAR(50) NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createDeletedUsersQuery = `
    CREATE TABLE IF NOT EXISTS deleted_app_users (
      id VARCHAR(64) PRIMARY KEY,
      deleted_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createCustomerDebtsQuery = `
    CREATE TABLE IF NOT EXISTS customer_debts (
      id VARCHAR(64) PRIMARY KEY,
      sale_id VARCHAR(64) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NULL,
      debt_type_cup VARCHAR(20) NOT NULL DEFAULT 'efectivo',
      amount_cup DECIMAL(12, 2) NOT NULL DEFAULT 0,
      amount_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      paid_cup DECIMAL(12, 2) NOT NULL DEFAULT 0,
      paid_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      date VARCHAR(20) NOT NULL,
      timestamp BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      notes TEXT NULL,
      INDEX idx_debts_customer (customer_name),
      INDEX idx_debts_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createDeletedCustomerDebtsQuery = `
    CREATE TABLE IF NOT EXISTS deleted_customer_debts (
      id VARCHAR(64) PRIMARY KEY,
      deleted_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const ensureColumns = async (tableName: string, columns: Array<{ name: string; definition: string }>) => {
    if (!pool) return;
    try {
      const [rows] = await pool.query<mysql.RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\``);
      const existingCols = new Set(rows.map(r => String(r.Field).toLowerCase()));
      for (const col of columns) {
        if (!existingCols.has(col.name.toLowerCase())) {
          await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${col.definition}`);
        }
      }
    } catch (err) {
      console.warn(`Column migration check warning on ${tableName}:`, err);
    }
  };

  try {
    await pool.query(createTransactionsQuery);
    await pool.query(createDeletedQuery);
    await pool.query(createProductsQuery);
    await pool.query(createDeletedProductsQuery);
    await pool.query(createSalesQuery);
    await pool.query(createSuppliersQuery);
    await pool.query(createDeletedSuppliersQuery);
    await pool.query(createUsersQuery);
    await pool.query(createDeletedUsersQuery);
    await pool.query(createCustomerDebtsQuery);
    await pool.query(createDeletedCustomerDebtsQuery);
    await pool.query(createAppStateQuery);

    // Ensure schema migrations for existing Hostinger MySQL tables
    await ensureColumns('transactions', [
      { name: 'currency', definition: "VARCHAR(10) NOT NULL DEFAULT 'CUP'" },
      { name: 'account_source', definition: "VARCHAR(20) NOT NULL DEFAULT 'casa'" }
    ]);
    await ensureColumns('store_products', [
      { name: 'price_usd', definition: 'DECIMAL(12, 2) NULL' },
      { name: 'cost_price_usd', definition: 'DECIMAL(12, 2) NULL' },
      { name: 'currency', definition: "VARCHAR(10) NOT NULL DEFAULT 'CUP'" },
      { name: 'unit', definition: "VARCHAR(20) NOT NULL DEFAULT 'u'" },
      { name: 'external_type', definition: 'VARCHAR(30) NULL' },
      { name: 'rating_score', definition: 'DECIMAL(4, 2) NULL' },
      { name: 'rating_count', definition: 'INT NOT NULL DEFAULT 0' },
      { name: 'mfg_date', definition: 'VARCHAR(20) NULL' },
      { name: 'exp_date', definition: 'VARCHAR(20) NULL' },
      { name: 'batches_json', definition: 'LONGTEXT NULL' },
      { name: 'secondary_barcodes_json', definition: 'TEXT NULL' }
    ]);
    await ensureColumns('store_sales', [
      { name: 'total_amount_cup', definition: 'DECIMAL(12, 2) NULL' },
      { name: 'total_amount_usd', definition: 'DECIMAL(12, 2) NULL' },
      { name: 'currency', definition: "VARCHAR(10) NOT NULL DEFAULT 'CUP'" },
      { name: 'seller_id', definition: 'VARCHAR(100) NULL' },
      { name: 'seller_username', definition: 'VARCHAR(100) NULL' },
      { name: 'seller_name', definition: 'VARCHAR(255) NULL' }
    ]);
    await ensureColumns('supplier_accounts', [
      { name: 'pending_payout_usd', definition: 'DECIMAL(12, 2) NOT NULL DEFAULT 0' },
      { name: 'total_paid_usd', definition: 'DECIMAL(12, 2) NOT NULL DEFAULT 0' }
    ]);

    // Garantizar que exista el usuario admin / 1234 con rol propietario
    const [userRows] = await pool.query<mysql.RowDataPacket[]>('SELECT id FROM app_users WHERE username = ? LIMIT 1', ['admin']);
    if (userRows.length === 0) {
      const now = Date.now();
      await pool.query(
        'INSERT INTO app_users (id, username, password, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['usr-admin', 'admin', '1234', 'Administrador', 'propietario', now, now]
      );
    }

    tableEnsured = true;
  } catch (error) {
    console.error('Error ensuring tables exist in MySQL:', error);
  }
}

export function isMySQLConfigured(): boolean {
  return pool !== null;
}

export async function checkMySQLConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800))
    ]);
    return true;
  } catch (err) {
    return false;
  }
}

export async function getServerProductById(id: string): Promise<StoreProduct | null> {
  try {
    const hasDB = await checkMySQLConnection();
    if (pool && hasDB) {
      await ensureTableExists();
      const [rows] = await pool.query<mysql.RowDataPacket[]>(
        'SELECT * FROM store_products WHERE id = ? OR barcode = ? LIMIT 1',
        [id, id]
      );
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          barcode: r.barcode,
          name: r.name,
          costPrice: Number(r.cost_price || 0),
          price: Number(r.price || 0),
          priceUSD: r.price_usd !== null && r.price_usd !== undefined ? Number(r.price_usd) : undefined,
          currency: (r.currency as any) || 'CUP',
          unit: r.unit || 'u',
          category: r.category,
          description: r.description || undefined,
          stock: Number(r.stock || 0),
          photoUrl: r.photo_url || undefined,
          published: Boolean(r.published),
          salesCount: Number(r.sales_count || 0),
          supplierType: r.supplier_type || 'propia',
          isExternal: Boolean(r.is_external),
          externalType: (r.external_type as any) || undefined,
          externalUrl: r.external_url || undefined,
          ratingScore: r.rating_score !== null && r.rating_score !== undefined ? Number(r.rating_score) : undefined,
          ratingCount: r.rating_count !== null && r.rating_count !== undefined ? Number(r.rating_count) : undefined,
          createdAt: Number(r.created_at || Date.now()),
          updatedAt: Number(r.updated_at || Date.now())
        };
      }
    } else {
      const storageFile = path.join(process.cwd(), '.next', 'cuentacasa_cloud_db.json');
      if (fs.existsSync(storageFile)) {
        const parsed = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
        const products: StoreProduct[] = Array.isArray(parsed?.storeProducts) ? parsed.storeProducts : [];
        const match = products.find(p => p.id === id || p.barcode === id);
        if (match) return match;
      }
    }
  } catch (err) {
    console.warn('Error in getServerProductById:', err);
  }
  return null;
}

export default pool;
