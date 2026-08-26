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
  externalType?: 'link' | 'whatsapp'; // 'link' | 'whatsapp'
  externalUrl?: string;       // WhatsApp o URL de referido/tienda externa
  ratingScore?: number;       // Promedio de estrellas (1.0 a 5.0)
  ratingCount?: number;       // Cantidad de votos recibidos
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
  sellerId?: string;
  sellerUsername?: string;
}

export type ReportPeriod = 'hoy' | '7dias' | '15dias' | '28dias' | '90dias' | 'personalizado';
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

export type UserRole = 'propietario' | 'administrador' | 'vendedor';

export interface AppUser {
  id: string;
  username: string;        // Nombre de usuario único e.g. "geyler"
  password: string;        // Contraseña e.g. "Del1Al9#"
  name: string;            // Nombre a mostrar e.g. "Geyler"
  role: UserRole;          // 'propietario' | 'administrador' | 'vendedor'
  whatsappNumber?: string; // Número de WhatsApp propio del usuario (ej: 5351234567)
  createdAt: number;
  updatedAt: number;
}

export interface ShiftInventorySnapshot {
  productId: string;
  productName: string;
  initialStock: number;       // Cantidad al iniciar el turno
  addedStock: number;         // Reposiciones entregadas durante el turno
  soldByShiftUser: number;    // Vendido por el dependiente asignado
  soldByOthers: number;       // Vendido por Admin/Propietario durante el turno
  expectedFinalStock: number; // Inicial + Añadido - Vendidos
  realFinalStock?: number;    // Conteo físico ingresado en el cierre
  difference?: number;        // Discrepancia (+ / -)
}

export type ShiftStatus = 'apertura_pendiente' | 'activo' | 'cierre_pendiente' | 'cerrado';

export interface StoreShiftRecord {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  openedByUserId: string;     // Admin/Propietario que abrió el turno
  openedByName: string;
  openedAt: number;
  closedAt?: number;
  closedByUserId?: string;    // Admin/Propietario que participó en el cierre
  closedByName?: string;
  
  // Fondo de Caja y Finanzas
  initialCashFund: number;    // Dinero para vueltos entregado al inicio
  totalCashSales: number;     // Ventas registradas en efectivo
  totalDigitalSales: number;  // Ventas por transferencia/Zelle/QvaPay
  expectedCashInRegister: number; // Fondo Inicial + Ventas Efectivo
  realCashInRegister?: number;   // Dinero físico entregado por el dependiente
  cashDifference?: number;       // Faltante o Sobrante

  // Control de Inventario
  inventorySnapshots: ShiftInventorySnapshot[];
  
  // Estado y Confirmación Bilateral
  status: ShiftStatus;
  sellerAcceptedOpening: boolean;
  sellerAcceptedClosing?: boolean;
  notes?: string;
}

export interface RawDatabase {
  version: string;
  lastUpdated: string;
  lastSync?: string;
  transactions: Transaction[];
  deletedIds?: string[];
  deletedProductIds?: string[];
  deletedSupplierIds?: string[];
  deletedUserIds?: string[];
  deletedShiftIds?: string[];
  storeProducts?: StoreProduct[];
  storeSales?: StoreSaleRecord[];
  supplierAccounts?: SupplierAccount[];
  users?: AppUser[];
  shifts?: StoreShiftRecord[];
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
    activeWhatsappUserId?: string; // ID del usuario cuyo WhatsApp está seleccionado activamente para recibir carritos
  };
}


