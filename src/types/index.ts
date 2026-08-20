export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id: string;
  type: TransactionType;
  concept: string;         // e.g. "Venta Tienda #1024", "Pago por webs"
  category: string;        // e.g. "Tienda", "Trabajo", "Comida"
  amount: number;          // Monto total
  date: string;            // ISO String YYYY-MM-DD
  notes?: string;
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
  synced?: boolean;        // Cloud sync status
}

export interface StoreProduct {
  id: string;
  barcode: string;         // 4-digit numeric code e.g. "0001" to "9999" (Solo interno)
  name: string;
  costPrice: number;       // Precio de costo (lo que costó comprarlo)
  price: number;           // Precio de venta (al público)
  category: string;
  description?: string;
  stock: number;
  photoUrl?: string;       // 400x400 Base64 compressed image
  published: boolean;      // Visible en la tienda pública
  salesCount?: number;     // Total unidades vendidas
  createdAt: number;
  updatedAt: number;
}

export interface StoreSaleItem {
  productId: string;
  barcode: string;
  name: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  subtotal: number;
}

export interface StoreSaleRecord {
  id: string;
  date: string;
  timestamp: number;
  items: StoreSaleItem[];
  totalAmount: number;
  totalCost: number;
  netProfit: number;
}

export type ReportPeriod = 'mensual' | 'quincenal' | 'semanal' | 'personalizado';
export type AppTab = 'quick' | 'dashboard' | 'transactions' | 'reports' | 'store';

export interface ReportFilter {
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  category?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: { [category: string]: number };
}

export interface RawDatabase {
  version: string;
  lastUpdated: string;
  lastSync?: string;
  transactions: Transaction[];
  deletedIds?: string[];
  storeProducts?: StoreProduct[];
  storeSales?: StoreSaleRecord[];
  settings: {
    currency: string;
    appName: string;
    autoSync: boolean;
    syncUrl?: string;
    showBalance?: boolean;
  };
}
