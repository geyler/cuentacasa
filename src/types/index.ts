export type TransactionType = 'ingreso' | 'gasto';
export type SupplierType = 'propia' | 'proveedor';
export type FundAccountType = 'casa' | 'tienda' | 'ahorro';
export type CurrencyType = 'CUP' | 'USD';
export type CurrencyMode = 'CUP' | 'USD' | 'BOTH';

export interface Transaction {
  id: string;
  type: TransactionType;
  concept: string;         // e.g. "tienda: venta de: 7 articulos"
  category: string;        // e.g. "Ganancia Tienda", "Trabajo", "Transferencia"
  amount: number;          // Monto total
  currency?: CurrencyType; // Moneda: 'CUP' | 'USD'
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
  pendingPayout: number;    // Dinero retenido por costo de ventas pendiente de pagar (CUP)
  pendingPayoutUSD?: number;// Dinero retenido por costo de ventas pendiente de pagar (USD)
  totalPaid: number;        // Total histórico liquidado a este proveedor (CUP)
  totalPaidUSD?: number;    // Total histórico liquidado a este proveedor (USD)
  updatedAt: number;
}

export interface StoreProduct {
  id: string;
  barcode: string;         // 4-digit numeric code e.g. "0001" to "9999" (Solo interno)
  name: string;
  costPrice: number;       // Precio de costo (lo que costó comprarlo)
  price: number;           // Precio de venta (al público)
  priceUSD?: number;       // Precio base en USD (calculado/registrado para indexación opcional)
  costPriceUSD?: number;   // Precio de costo base en USD
  currency?: CurrencyType; // Moneda: 'CUP' | 'USD'
  category: string;
  unit?: string;           // Unidad de medida e.g. "u", "lb", "kg", "bolsa", "saco", "m", "litro", "caja"
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
  currency?: CurrencyType;
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
  currency?: CurrencyType;
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
  totalIncomeUSD?: number;
  totalExpenseUSD?: number;
  netBalanceUSD?: number;
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
  
  // Fondo de Caja y Finanzas (CUP)
  initialCashFund: number;    // Dinero para vueltos entregado al inicio (CUP)
  totalCashSales: number;     // Ventas registradas en efectivo (CUP)
  totalDigitalSales: number;  // Ventas por transferencia/Zelle/QvaPay (CUP)
  expectedCashInRegister: number; // Fondo Inicial + Ventas Efectivo (CUP)
  realCashInRegister?: number;   // Dinero físico entregado por el dependiente (CUP)
  cashDifference?: number;       // Faltante o Sobrante (CUP)

  // Fondo de Caja y Finanzas (USD)
  initialCashFundUSD?: number;    // Dinero para vueltos entregado al inicio (USD)
  totalCashSalesUSD?: number;     // Ventas registradas en efectivo (USD)
  totalDigitalSalesUSD?: number;  // Ventas por transferencia (USD)
  expectedCashInRegisterUSD?: number; // Fondo Inicial + Ventas Efectivo (USD)
  realCashInRegisterUSD?: number;   // Dinero físico entregado por el dependiente (USD)
  cashDifferenceUSD?: number;       // Faltante o Sobrante (USD)

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
  storeFund?: number;      // Fondo propio acumulado en caja de la tienda (CUP)
  storeFundUSD?: number;   // Fondo propio acumulado en caja de la tienda (USD)
  savingsFund?: number;    // Fondo de Ahorro acumulado de Cuenta Casa (CUP)
  savingsFundUSD?: number; // Fondo de Ahorro acumulado de Cuenta Casa (USD)
  settings: {
    currency: string;
    appName: string;
    autoSync: boolean;
    syncUrl?: string;
    showBalance?: boolean;
    masterPassword?: string;
    storeWhatsappNumber?: string; // Número de WhatsApp para recibir pedidos del carrito online
    activeWhatsappUserId?: string; // ID del usuario cuyo WhatsApp está seleccionado activamente para recibir carritos
    currencyMode?: CurrencyMode; // Mode: 'CUP' (Solo CUP), 'USD' (Solo USD), 'BOTH' (CUP + USD)
    exchangeRateUSD?: number;   // Tipo de cambio 1 USD = X CUP (e.g. 675)
    exchangeRateTrend?: 'up' | 'down' | 'stable'; // Tendencia de la tasa de elTOQUE (subiendo/bajando/estable)
    autoSyncElToque?: boolean;  // Sincronizar automáticamente la tasa con elTOQUE si hay conexión
    lastElToqueSync?: number;   // Timestamp de la última actualización exitosa con elTOQUE
    usdIndexedPricing?: boolean; // Indexar inventario a USD y recalcular CUP dinámicamente según la tasa
    updatedAt?: number;         // Timestamp del último cambio de configuración global
  };
}

export interface QRSyncPayload {
  type: 'SAMY_STORE_SYNC_V1';
  version: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: number;
  products?: StoreProduct[];
  sales?: StoreSaleRecord[];
  shifts?: StoreShiftRecord[];
  suppliers?: SupplierAccount[];
  users?: AppUser[];
  transactions?: Transaction[];
  settings?: RawDatabase['settings'];
}


