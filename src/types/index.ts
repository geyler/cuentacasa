export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id: string;
  type: TransactionType;
  concept: string;         // e.g. "Pago por webs", "Pan", "Arroz", "Azúcar"
  category: string;        // e.g. "Trabajo", "Comida", "Servicios"
  amount: number;          // Monto
  date: string;            // ISO String YYYY-MM-DD
  notes?: string;
  photoUrl?: string;       // Base64 Data URI or Blob URL
  photoName?: string;
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
  synced?: boolean;        // Cloud sync status
}

export type ReportPeriod = 'mensual' | 'quincenal' | 'semanal' | 'personalizado';
export type AppTab = 'quick' | 'dashboard' | 'transactions' | 'reports';

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
  settings: {
    currency: string;
    appName: string;
    autoSync: boolean;
    syncUrl?: string;
    showBalance?: boolean;
  };
}
