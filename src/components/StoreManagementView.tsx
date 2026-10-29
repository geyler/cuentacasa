'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, SupplierAccount, UserRole, CurrencyType } from '@/types';
import {
  getStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
  getStoreSales,
  getSupplierAccounts,
  paySupplierAccount,
  saveSupplierAccount,
  deleteSupplierAccount,
  getRawDatabase,
  getUserRole,
  getCurrencySettings,
  syncElToqueExchangeRate,
  getLocalISODate
} from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency, getProductDisplayPrice } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { StoreShiftModal } from '@/components/StoreShiftModal';
import { QRSyncModal } from '@/components/QRSyncModal';
import { getActiveShift } from '@/lib/storage';

import {
  FormBarcodeScannerOverlay,
  ProductFormModal,
  SupplierFormModal,
  SupplierPayoutModal,
  StoreProductsTab,
  StoreSuppliersTab,
  StoreSalesTab,
  ValuationBookModal,
  StoreDebtsTab
} from '@/components/store';

import {
  Store,
  Plus,
  Package,
  Users,
  ArrowRightLeft,
  Receipt,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Scan,
  Wallet,
  TrendingDown,
  Clock,
  QrCode,
  FileText,
  CreditCard
} from 'lucide-react';

interface StoreManagementViewProps {
  currency?: string;
  onOpenScanner?: () => void;
  userRole?: UserRole;
  onNavigateTab?: (tab: 'quick' | 'dashboard' | 'store' | 'transactions' | 'reports' | 'shifts' | 'valuation' | 'settings' | 'profile') => void;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner,
  userRole: propUserRole,
  onNavigateTab
}) => {
  const effectiveRole = propUserRole || getUserRole();
  const isOwner = effectiveRole === 'propietario';
  const isAdmin = effectiveRole === 'administrador';
  const isVendor = effectiveRole === 'vendedor';

  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const rawDb = getRawDatabase();

  const [products, setProducts] = useState<StoreProduct[]>(() => getStoreProducts());
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>(() => getSupplierAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForDetailModal, setSelectedProductForDetailModal] = useState<StoreProduct | null>(null);

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'suppliers' | 'sales' | 'debts'>('products');
  const subTabsNavRef = useRef<HTMLDivElement>(null);

  const handleSubTabSelect = (tab: 'products' | 'suppliers' | 'sales' | 'debts') => {
    setActiveSubTab(tab);
    if (subTabsNavRef.current) {
      const rect = subTabsNavRef.current.getBoundingClientRect();
      const topOffset = 75; // margen para dejar fija la barra debajo del header
      if (rect.top < topOffset || rect.top > window.innerHeight * 0.45) {
        const targetY = window.scrollY + rect.top - topOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUniversalTransferModalOpen, setIsUniversalTransferModalOpen] = useState(false);
  const [isScanningForFormBarcode, setIsScanningForFormBarcode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [scannedBarcodeForModal, setScannedBarcodeForModal] = useState<string | null>(null);

  // Supplier Add / Payout Modals State
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [payoutSupplier, setPayoutSupplier] = useState<SupplierAccount | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isQRSyncModalOpen, setIsQRSyncModalOpen] = useState(false);
  const [isValuationBookOpen, setIsValuationBookOpen] = useState(false);

  useEffect(() => {
    const refreshData = () => {
      setProducts(getStoreProducts());
      setSuppliers(getSupplierAccounts());
    };
    refreshData();

    // Trigger elTOQUE rate sync if enabled
    syncElToqueExchangeRate().then(() => {
      refreshData();
    });

    window.addEventListener('cuentacasa-db-changed', refreshData);
    window.addEventListener('cuentacasa-currency-mode-changed', refreshData);
    window.addEventListener('cuentacasa-currency-settings-changed', refreshData);
    return () => {
      window.removeEventListener('cuentacasa-db-changed', refreshData);
      window.removeEventListener('cuentacasa-currency-mode-changed', refreshData);
      window.removeEventListener('cuentacasa-currency-settings-changed', refreshData);
    };
  }, []);

  // Compute Store Financial Metrics with dynamic currency mode conversion
  const { currencyMode, exchangeRateUSD, usdIndexedPricing, exchangeRateTrend, autoSyncElToque } = getCurrencySettings();

  const totalStoreProductsValue = products.reduce((acc, p) => {
    const disp = getProductDisplayPrice(p.price * p.stock, p.currency, currencyMode, exchangeRateUSD, p.priceUSD ? p.priceUSD * p.stock : undefined, usdIndexedPricing);
    return acc + disp.amount;
  }, 0);

  const totalStoreProductsCost = products.reduce((acc, p) => {
    const costVal = (p.costPrice || 0) * p.stock;
    const costUSD = p.costPriceUSD ? p.costPriceUSD * p.stock : undefined;
    const disp = getProductDisplayPrice(costVal, p.currency, currencyMode, exchangeRateUSD, costUSD, usdIndexedPricing);
    return acc + disp.amount;
  }, 0);

  const totalPendingSupplierDebt = suppliers.reduce((acc, s) => acc + s.pendingPayout, 0);

  const salesRecords = getStoreSales();
  const rate = exchangeRateUSD || 320;
  const displayCurrency = currencyMode === 'USD' ? 'USD' : 'CUP';

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => {
    const saleCurr = s.currency || 'CUP';
    const amt = Number(s.totalAmount || 0);
    if (displayCurrency === 'USD') {
      return acc + (saleCurr === 'USD' ? amt : amt / rate);
    }
    return acc + (saleCurr === 'USD' ? amt * rate : amt);
  }, 0);

  const totalAccumulatedHouseProfits = salesRecords.reduce((acc, s) => {
    const saleCurr = s.currency || 'CUP';
    const profit = Number(s.netProfit || 0);
    if (displayCurrency === 'USD') {
      return acc + (saleCurr === 'USD' ? profit : profit / rate);
    }
    return acc + (saleCurr === 'USD' ? profit * rate : profit);
  }, 0);

  const houseCapitalTransactions = rawDb.transactions.filter(t => (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('fondo negocio') || (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('tienda'));
  const netTransferredToCasa = houseCapitalTransactions
    .filter(t => t.type === 'ingreso' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);
  const netInjectedFromCasa = houseCapitalTransactions
    .filter(t => t.type === 'gasto' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalStoreFund = rawDb.storeFund !== undefined ? Number(rawDb.storeFund) : 0;
  const totalStoreFundUSD = rawDb.storeFundUSD !== undefined ? Number(rawDb.storeFundUSD) : 0;

  // Cálculo robusto de ventas del día actual (independiente de si hay turno abierto o no)
  const todayStr = getLocalISODate();
  const todaySalesRecords = salesRecords.filter(s => {
    const sDate = s.date || (s.timestamp ? new Date(s.timestamp).toISOString().split('T')[0] : '');
    return sDate === todayStr;
  });

  const todaySalesCUP = todaySalesRecords.reduce((sum, s) => {
    if (s.currency === 'MIXED') return sum + (s.totalAmountCUP || 0);
    return sum + (s.currency === 'USD' ? 0 : (s.totalAmount || 0));
  }, 0);

  const todaySalesUSD = todaySalesRecords.reduce((sum, s) => {
    if (s.currency === 'MIXED') return sum + (s.totalAmountUSD || 0);
    return sum + (s.currency === 'USD' ? (s.totalAmount || 0) : 0);
  }, 0);

  const todayTotalConverted = displayCurrency === 'USD'
    ? todaySalesUSD + (todaySalesCUP / rate)
    : todaySalesCUP + (todaySalesUSD * rate);

  const activeShift = getActiveShift();
  const activeShiftSalesConverted = activeShift
    ? (() => {
        const cupSales = (activeShift.totalCashSales || 0) + (activeShift.totalDigitalSales || 0);
        const usdSales = (activeShift.totalCashSalesUSD || 0) + (activeShift.totalDigitalSalesUSD || 0);
        return displayCurrency === 'USD'
          ? usdSales + (cupSales / rate)
          : cupSales + (usdSales * rate);
      })()
    : 0;

  const todaySalesDisplay = activeShift ? (activeShiftSalesConverted || todayTotalConverted) : todayTotalConverted;

  // Category List
  const existingCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  if (existingCategories.length === 0) existingCategories.push('Varios', 'Alimentos', 'Hogar', 'Electrónica');

  // Product Actions
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setScannedBarcodeForModal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    setScannedBarcodeForModal(null);
    setIsModalOpen(true);
  };

  const handleSaveProductSubmit = (productPayload: any): boolean => {
    try {
      const savedProd = saveStoreProduct({
        id: editingProduct ? editingProduct.id : undefined,
        ...productPayload
      });

      setProducts(getStoreProducts());
      setSuppliers(getSupplierAccounts());
      syncDatabaseWithCloud();

      showActionResult({
        title: editingProduct ? '¡Producto Actualizado!' : '¡Producto Guardado!',
        message: `${savedProd.name} se ha guardado en el inventario. SKU: #${savedProd.barcode} - Precio: $${savedProd.price}`,
        type: 'success'
      });
      return true;
    } catch (err: any) {
      showToast({ title: 'Error al Guardar', message: err?.message || 'Ocurrió un fallo.', type: 'error' });
      return false;
    }
  };

  const handleTogglePublish = (product: StoreProduct) => {
    try {
      const updated = saveStoreProduct({
        ...product,
        published: !product.published
      });
      setProducts(getStoreProducts());
      showToast({
        title: updated.published ? 'Producto Publicado' : 'Producto en Borrador',
        message: updated.published ? `${updated.name} ahora es visible.` : `${updated.name} se ha ocultado.`,
        type: 'info'
      });
    } catch (e: any) {
      showToast({ title: 'Error', message: e.message, type: 'error' });
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    confirmAction({
      title: '¿Eliminar Producto?',
      message: `¿Seguro que deseas eliminar "${name}" del inventario?`,
      variant: 'danger',
      confirmText: 'Eliminar',
      onConfirm: () => {
        deleteStoreProduct(id);
        setProducts(getStoreProducts());
        syncDatabaseWithCloud();
        showToast({ title: 'Producto Eliminado', message: `"${name}" fue removido.`, type: 'info' });
      }
    });
  };

  // Supplier Actions
  const handleCreateSupplier = (supplierName: string) => {
    try {
      const newSup = saveSupplierAccount(supplierName);
      setSuppliers(getSupplierAccounts());
      syncDatabaseWithCloud();
      showToast({ title: 'Proveedor Registrado', message: `Se registró a ${newSup.name}.`, type: 'success' });
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteSupplier = (supplier: SupplierAccount) => {
    confirmAction({
      title: '¿Eliminar Registro de Proveedor?',
      message: `¿Seguro que deseas eliminar a "${supplier.name}"?`,
      variant: 'danger',
      confirmText: 'Eliminar',
      onConfirm: () => {
        try {
          deleteSupplierAccount(supplier.id);
          setSuppliers(getSupplierAccounts());
          syncDatabaseWithCloud();
          showToast({ title: 'Proveedor Eliminado', message: `El proveedor "${supplier.name}" fue eliminado.`, type: 'info' });
        } catch (err: any) {
          showToast({ title: 'No se puede eliminar', message: err.message, type: 'error' });
        }
      }
    });
  };

  const handleExecutePayout = (amount: number, source: 'negocio' | 'casa', payoutCurrency: CurrencyType = 'CUP') => {
    if (!payoutSupplier) return;
    try {
      const res = paySupplierAccount(payoutSupplier.id, amount, source, payoutCurrency);
      if (res.success) {
        setSuppliers(getSupplierAccounts());
        syncDatabaseWithCloud();
        showActionResult({
          title: '¡Pago Registrado!',
          message: res.message || `Se liquidaron ${payoutCurrency === 'USD' ? 'US$' : '$'}${amount} a ${payoutSupplier.name}.`,
          type: 'success'
        });
      } else {
        showToast({ title: 'No se pudo liquidar', message: res.error || 'Ocurrió un error al liquidar el proveedor.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ title: 'Error al Liquidar', message: err.message, type: 'error' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '32px' }}>

      {/* 1. TOP HEADER SECTION (Title + QR Sync + Publicar Button) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', gap: '8px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Gestión de Tienda</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsQRSyncModalOpen(true)}
            title="Sincronizar Offline por Código QR"
            style={{
              padding: '8px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 800
            }}
          >
            <QrCode size={16} color="var(--md-sys-color-primary)" />
            <span>QR Sync</span>
          </button>
          {!isVendor && (
            <button
              onClick={handleOpenAdd}
              className="md-btn md-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Publicar
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 4 METRICS CARDS GRID (Responsive 2 cols on mobile, 4 cols on PC) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '10px' }}>

        {/* Card 1: Fondo del Negocio (Secondary Brand Palette) */}
        <div 
          className="md-card" 
          onClick={() => isOwner && setIsUniversalTransferModalOpen(true)}
          style={{
            backgroundColor: 'var(--md-sys-color-secondary-container, var(--brand-secondary-light))',
            color: 'var(--md-sys-color-on-secondary-container, var(--brand-on-secondary-container))',
            border: '1px solid var(--brand-secondary-border, #99F6E4)',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: isOwner ? 'pointer' : 'default'
          }}
          title={isOwner ? "Clic para transferir entre cuentas" : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-secondary-container, var(--brand-on-secondary-container))' }}>🏬 Fondo del Negocio</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 16%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} color="var(--md-sys-color-secondary, var(--brand-secondary))" />
            </div>
          </div>
          {currencyMode === 'CUP' && (
            <div className="tabular-nums" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--md-sys-color-on-secondary-container, var(--brand-secondary-dark))', letterSpacing: '-0.02em', margin: '6px 0 2px 0', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalStoreFund, 'CUP', true)}
            </div>
          )}
          {currencyMode === 'USD' && (
            <div className="tabular-nums" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--md-sys-color-on-secondary-container, var(--brand-secondary-dark))', letterSpacing: '-0.02em', margin: '6px 0 2px 0', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
            </div>
          )}
          {currencyMode === 'BOTH' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              margin: '6px 0 4px 0'
            }}>
              <div style={{
                padding: '5px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--brand-primary-dark, #1E3A8A)', textTransform: 'uppercase', flexShrink: 0 }}>CUP</span>
                <span className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--brand-primary-dark, #1E3A8A)', whiteSpace: 'nowrap', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(totalStoreFund, 'CUP', true)}
                </span>
              </div>
              <div style={{
                padding: '5px 8px',
                borderRadius: '8px',
                backgroundColor: 'var(--brand-secondary-light, #F0FDFA)',
                border: '1px solid var(--brand-secondary-border, #99F6E4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--brand-secondary-dark, #115E59)', textTransform: 'uppercase', flexShrink: 0 }}>USD</span>
                <span className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--brand-secondary-dark, #115E59)', whiteSpace: 'nowrap', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-secondary-container, var(--brand-on-secondary-container))', fontWeight: 700 }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Caja USD' : 'Caja CUP')}
            </span>
          </div>
        </div>

        {/* Card 2: Valor Inventario */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>📦 Valor Inventario</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              {products.length} art. ({products.reduce((acc, p) => acc + (p.stock || 0), 0)} u)
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(totalStoreProductsValue, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
          </div>
          <div className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {!isVendor ? `Costo Stock: ${formatCurrency(totalStoreProductsCost, currencyMode === 'USD' ? 'USD' : 'CUP', true)}` : 'Precio público'}
          </div>
        </div>

        {/* Card 3: Fondo de Ganancias */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-income-container)',
          color: 'var(--md-sys-color-on-income-container)',
          border: '1px solid rgba(0, 135, 90, 0.2)',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>📈 Ganancias en Tienda</span>
            <TrendingUp size={16} color="var(--md-sys-color-income)" />
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)', fontVariantNumeric: 'tabular-nums' }}>
            +{formatCurrency(totalAccumulatedHouseProfits, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
          </div>
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Retenidas en Tienda (Mover con Transferencia)
          </div>
        </div>

        {/* Card 4: Ventas del Día / Turno Activo */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>🛍️ Ventas del Día</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              backgroundColor: activeShift ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeShift ? 'var(--md-sys-color-on-income-container)' : 'var(--md-sys-color-on-surface-variant)',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              {activeShift ? `🟢 @${activeShift.sellerUsername}` : (todaySalesRecords.length > 0 ? `${todaySalesRecords.length} ${todaySalesRecords.length === 1 ? 'venta' : 'ventas'}` : 'Sin Turno')}
            </span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(todaySalesDisplay, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
            {activeShift
              ? `Turno de @${activeShift.sellerUsername} (${todaySalesRecords.length} ventas hoy)`
              : (todaySalesRecords.length > 0
                  ? `${todaySalesRecords.length} ${todaySalesRecords.length === 1 ? 'venta registrada' : 'ventas registradas'} hoy`
                  : '0 ventas registradas hoy')}
          </div>
        </div>

      </div>

      {/* 3. MAIN ACTION BUTTONS: ESCANEAR Y VENDER & TURNOS E IPV */}
      {onOpenScanner && (
        <button
          onClick={onOpenScanner}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '20px',
            border: '2px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '1.1rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: 'var(--md-shadow-elevation-1)',
            letterSpacing: '0.01em'
          }}
        >
          <Scan size={24} color="var(--md-sys-color-primary)" />
          <span>ESCANEAR Y VENDER</span>
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768 && onNavigateTab) {
              onNavigateTab('shifts');
            } else {
              setIsShiftModalOpen(true);
            }
          }}
          style={{
            width: '100%',
            padding: '14px 10px',
            borderRadius: '18px',
            border: '2px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--md-shadow-elevation-1)'
          }}
        >
          <Clock size={20} color="var(--md-sys-color-secondary, var(--brand-secondary))" />
          <span>TURNOS E IPV</span>
        </button>

        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768 && onNavigateTab) {
              onNavigateTab('valuation');
            } else {
              setIsValuationBookOpen(true);
            }
          }}
          style={{
            width: '100%',
            padding: '14px 10px',
            borderRadius: '18px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--md-shadow-elevation-1)'
          }}
        >
          <FileText size={20} color="var(--md-sys-color-primary)" />
          <span>TASACIONES</span>
        </button>
      </div>

      {/* 4. SUB-TAB NAVIGATION BAR */}
      <div 
        ref={subTabsNavRef}
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '6px 0',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)'
        }}
      >
        <button
          onClick={() => handleSubTabSelect('products')}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: activeSubTab === 'products' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
            color: activeSubTab === 'products' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeSubTab === 'products' ? 800 : 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={16} />
          <span>Productos ({products.length})</span>
        </button>

        {!isVendor && (
          <button
            onClick={() => handleSubTabSelect('suppliers')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSubTab === 'suppliers' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
              color: activeSubTab === 'suppliers' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeSubTab === 'suppliers' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        )}

        <button
          onClick={() => handleSubTabSelect('sales')}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: activeSubTab === 'sales' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
            color: activeSubTab === 'sales' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeSubTab === 'sales' ? 800 : 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Receipt size={16} />
          <span>Ventas ({salesRecords.length})</span>
        </button>

        <button
          onClick={() => handleSubTabSelect('debts')}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: activeSubTab === 'debts' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
            color: activeSubTab === 'debts' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeSubTab === 'debts' ? 800 : 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <CreditCard size={16} />
          <span>Fiados & Cobros</span>
        </button>
      </div>

      {/* SUB TAB 1: PRODUCTS INVENTORY */}
      {activeSubTab === 'products' && (
        <StoreProductsTab
          products={products}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectProduct={(p) => setSelectedProductForDetailModal(p)}
          onTogglePublish={handleTogglePublish}
          onEditProduct={handleOpenEdit}
          onDeleteProduct={handleDeleteProduct}
          currency={currency}
          isVendor={isVendor}
        />
      )}

      {/* SUB TAB 2: SUPPLIERS FINANCIAL MANAGEMENT */}
      {activeSubTab === 'suppliers' && !isVendor && (
        <StoreSuppliersTab
          suppliers={suppliers}
          products={products}
          currency={currency}
          onOpenAddSupplierModal={() => setIsAddSupplierModalOpen(true)}
          onOpenPayoutModal={(s) => setPayoutSupplier(s)}
          onDeleteSupplier={handleDeleteSupplier}
        />
      )}

      {/* SUB TAB 3: SALES LOG */}
      {activeSubTab === 'sales' && (
        <StoreSalesTab
          salesRecords={salesRecords}
          currency={currency}
        />
      )}

      {/* SUB TAB 4: FIADOS & CUENTAS POR COBRAR DE CLIENTES */}
      {activeSubTab === 'debts' && (
        <StoreDebtsTab
          onRefresh={() => {
            setProducts(getStoreProducts());
            setSuppliers(getSupplierAccounts());
          }}
        />
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      <ProductFormModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        suppliers={suppliers}
        existingCategories={existingCategories}
        onClose={() => setIsModalOpen(false)}
        onSaveProduct={handleSaveProductSubmit}
        onScanBarcodeClick={() => setIsScanningForFormBarcode(true)}
        currency={currency}
        scannedBarcode={scannedBarcodeForModal}
      />

      {/* MODAL 2: ADD NEW SUPPLIER */}
      <SupplierFormModal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        onSubmit={handleCreateSupplier}
      />

      {/* MODAL 3: SUPPLIER PAYOUT */}
      <SupplierPayoutModal
        supplier={payoutSupplier}
        onClose={() => setPayoutSupplier(null)}
        onExecutePayout={handleExecutePayout}
        currency={currency}
      />

      {/* MODAL 4: PRODUCT DETAIL DISPLAY */}
      <ProductDetailModal
        product={selectedProductForDetailModal}
        onClose={() => setSelectedProductForDetailModal(null)}
        onEditProduct={(p) => {
          setSelectedProductForDetailModal(null);
          handleOpenEdit(p);
        }}
        onDeleteProduct={(id: string, name?: string) => {
          setSelectedProductForDetailModal(null);
          handleDeleteProduct(id, name || '');
        }}
        allProducts={products}
        currency={currency}
        isAdmin={!isVendor}
      />

      {/* MODAL 5: UNIVERSAL FUNDS TRANSFER */}
      <TransferModal
        isOpen={isUniversalTransferModalOpen}
        onClose={() => setIsUniversalTransferModalOpen(false)}
        onSuccess={() => {
          setProducts(getStoreProducts());
          setSuppliers(getSupplierAccounts());
        }}
      />

      {/* CAMERA BARCODE OVERLAY FOR PRODUCT FORM */}
      {isScanningForFormBarcode && (
        <FormBarcodeScannerOverlay
          onScan={(scannedCode) => {
            setScannedBarcodeForModal(scannedCode);
            setIsScanningForFormBarcode(false);
            showToast({
              title: '¡Código Escaneado!',
              message: `Asignado código de barras #${scannedCode} al producto.`,
              type: 'success'
            });
          }}
          onClose={() => setIsScanningForFormBarcode(false)}
        />
      )}

      {/* MODAL 6: STORE SHIFT & CASH REGISTER AUDIT */}
      <StoreShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setProducts(getStoreProducts());
        }}
        currency={currency}
      />

      {/* MODAL 7: OFFLINE QR SYNC & ADDITIVE MERGE */}
      <QRSyncModal
        isOpen={isQRSyncModalOpen}
        onClose={() => setIsQRSyncModalOpen(false)}
        onSyncComplete={() => {
          setProducts(getStoreProducts());
          setSuppliers(getSupplierAccounts());
        }}
      />

      {/* MODAL 8: LIBRO DE TASACIONES & INSPECCIÓN SANITARIA */}
      <ValuationBookModal
        isOpen={isValuationBookOpen}
        onClose={() => setIsValuationBookOpen(false)}
        onEditProduct={(product) => {
          setIsValuationBookOpen(false);
          handleOpenEdit(product);
        }}
      />

    </div>
  );
};
