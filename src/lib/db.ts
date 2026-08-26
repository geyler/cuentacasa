import mysql from 'mysql2/promise';

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
      category VARCHAR(100) NOT NULL,
      description TEXT NULL,
      stock INT NOT NULL DEFAULT 0,
      photo_url LONGTEXT NULL,
      published TINYINT(1) NOT NULL DEFAULT 1,
      sales_count INT NOT NULL DEFAULT 0,
      supplier_type VARCHAR(50) NULL,
      supplier_name VARCHAR(255) NULL,
      is_external TINYINT(1) NOT NULL DEFAULT 0,
      external_url TEXT NULL,
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
      total_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
      net_profit DECIMAL(12, 2) NOT NULL DEFAULT 0,
      INDEX idx_sales_date (date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const createSuppliersQuery = `
    CREATE TABLE IF NOT EXISTS supplier_accounts (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      pending_payout DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
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
    await pool.query(createAppStateQuery);
    tableEnsured = true;
  } catch (error) {
    console.error('Error ensuring tables exist in Hostinger MySQL:', error);
  }
}

export function isMySQLConfigured(): boolean {
  return pool !== null;
}

export default pool;
