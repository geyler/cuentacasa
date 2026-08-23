export type TransactionType = 'ingreso' | 'gasto';
export type SupplierType = 'propia' | 'proveedor';
export type FundAccountType = 'casa' | 'tienda' | 'ahorro';

export interface Transaction {
  id: string;
  type: TransactionType;
  concept: string;         // e.g. "tienda: venta de: 7 articulos"
  category: string;        // e.g. "Ganancia Tienda", "Trabajo", "Transferencia"
  amount: number;          // Monto total
  date: string;            // ISO String YYYY-MM-DD
  notes?: string;
  accountSource?: FundAccountType; // Source account identifier ('casa', 'tienda', 'ahorro')
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
  synced?: boolean;        // Cloud sync status
}

export interface SupplierAccount {
  id: string;
  name: string;             // e.g. "Maikel", "Carlos"
  pendingPayout: number;    // Dinero retenido por costo de ventas pendiente de pagar
  totalPaid: number;        // Total histórico liquidado a este proveedor
  updatedAt: number;
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
  supplierType: SupplierType; // 'propia' | 'proveedor'
  supplierName?: string;      // Nombre del proveedor (ej. "Maikel")
  isExternal?: boolean;       // Si es un producto de enlace externo/afiliado
  externalUrl?: string;       // WhatsApp o URL de referido/tienda externa
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
  supplierType: SupplierType;
  supplierName?: string;
}

export interface StoreSaleRecord {
  id: string;
  date: string;
  timestamp: number;
  items: StoreSaleItem[];
  totalAmount: number;     // Total cobrado al cliente
  totalCost: number;       // Total costo de adquisición
  netProfit: number;       // Ganancia neta (que va a CuentaCasa)
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
  supplierAccounts?: SupplierAccount[];
  storeFund?: number;      // Fondo propio acumulado en caja de la tienda
  savingsFund?: number;    // Fondo de Ahorro acumulado de Cuenta Casa
  settings: {
    currency: string;
    appName: string;
    autoSync: boolean;
    syncUrl?: string;
    showBalance?: boolean;
    masterPassword?: string;
    storeWhatsappNumber?: string; // Número de WhatsApp para recibir pedidos del carrito online
  };
}

