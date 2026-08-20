import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@/types';
import pool, { ensureTableExists, isMySQLConfigured } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { RowDataPacket } from 'mysql2';

// Storage file fallback for local development when MySQL env vars are absent
const STORAGE_FILE = path.join(process.cwd(), '.next', 'cuentacasa_cloud_db.json');
let inMemoryCloudTransactions: Transaction[] = [];

function loadFileTransactions(): Transaction[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        inMemoryCloudTransactions = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Fallback to in-memory store
  }
  return inMemoryCloudTransactions;
}

function saveFileTransactions(transactions: Transaction[]) {
  inMemoryCloudTransactions = transactions;
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(transactions, null, 2), 'utf-8');
  } catch (e) {
    // Ignored in read-only serverless filesystems
  }
}

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

  // Delete from transactions table
  await pool.query('DELETE FROM transactions WHERE id IN (?)', [deletedIds]);

  // Insert into deleted_transactions table to record deletion
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

export async function GET() {
  try {
    let currentCloud: Transaction[] = [];

    if (isMySQLConfigured()) {
      const result = await getMySQLTransactions();
      currentCloud = result.transactions;
    } else {
      currentCloud = loadFileTransactions();
    }

    return NextResponse.json({
      success: true,
      transactions: currentCloud,
      count: currentCloud.length,
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
      message: 'Error al consultar transacciones del servidor.'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientTransactions: Transaction[] = Array.isArray(body.transactions) ? body.transactions : [];
    const deletedIds: string[] = Array.isArray(body.deletedIds) ? body.deletedIds : [];

    // Process deletion requests first
    if (deletedIds.length > 0) {
      if (isMySQLConfigured()) {
        await deleteMySQLTransactions(deletedIds);
      } else {
        const fileTxs = loadFileTransactions().filter(t => !deletedIds.includes(t.id));
        saveFileTransactions(fileTxs);
      }
    }

    // Load server transactions & deleted set
    let serverTransactions: Transaction[] = [];
    let deletedSet = new Set<string>();

    if (isMySQLConfigured()) {
      const mysqlData = await getMySQLTransactions();
      serverTransactions = mysqlData.transactions;
      deletedSet = mysqlData.deletedSet;
    } else {
      serverTransactions = loadFileTransactions();
    }

    // Map by ID to merge without duplicates
    const mergedMap = new Map<string, Transaction>();

    // Put server transactions first
    for (const tx of serverTransactions) {
      if (tx && tx.id && !deletedSet.has(tx.id)) {
        mergedMap.set(tx.id, tx);
      }
    }

    // Merge client transactions (client updates or adds new items)
    const itemsToSaveToMySQL: Transaction[] = [];

    for (const tx of clientTransactions) {
      if (tx && tx.id && !deletedSet.has(tx.id)) {
        const existing = mergedMap.get(tx.id);
        if (!existing) {
          const syncedTx = { ...tx, synced: true };
          mergedMap.set(tx.id, syncedTx);
          itemsToSaveToMySQL.push(syncedTx);
        } else {
          // Keep item with latest timestamp or client version
          const existingTime = existing.updatedAt || existing.createdAt || 0;
          const clientTime = tx.updatedAt || tx.createdAt || 0;
          if (clientTime >= existingTime) {
            const syncedTx = { ...tx, synced: true };
            mergedMap.set(tx.id, syncedTx);
            itemsToSaveToMySQL.push(syncedTx);
          }
        }
      }
    }

    // Convert map back to array and sort by date descending
    const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Save updated database
    if (isMySQLConfigured()) {
      if (itemsToSaveToMySQL.length > 0) {
        await saveMySQLTransactions(itemsToSaveToMySQL);
      }
    } else {
      saveFileTransactions(mergedList);
    }

    return NextResponse.json({
      success: true,
      transactions: mergedList,
      count: mergedList.length,
      storage: isMySQLConfigured() ? 'Hostinger MySQL' : 'Local File Storage',
      message: `Sincronización exitosa. Total de ${mergedList.length} movimientos unificados.`
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Error in POST /api/sync:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar sincronización en el servidor.'
    }, { status: 500 });
  }
}
