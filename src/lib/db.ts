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

  const createTableQuery = `
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

  try {
    await pool.query(createTableQuery);
    tableEnsured = true;
  } catch (error) {
    console.error('Error ensuring transactions table exists in Hostinger MySQL:', error);
  }
}

export function isMySQLConfigured(): boolean {
  return pool !== null;
}

export default pool;
