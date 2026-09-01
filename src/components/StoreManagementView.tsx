'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct, SupplierAccount, UserRole } from '@/types';
import {
  getStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
  getStoreSales,
  getSupplierAccounts,
  paySupplierAccount,
  saveSupplierAccount,
  deleteSupplierAccount,
  transferStoreFundToCasa,
  transferCasaToStoreFund,
  getRawDatabase,
  getUserRole,
  getCurrencySettings,
  syncElToqueExchangeRate
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
  StoreTransfersTab,
  StoreSalesTab,
  StoreSettingsTab,
  ValuationBookModal
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
  FileText
} from 'lucide-react';

interface StoreManagementViewProps {
  currency?: string;
  onOpenScanner?: () => void;
  userRole?: UserRole;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner,
  userRole: propUserRole
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
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'suppliers' | 'transfer' | 'sales' | 'settings'>('products');

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

  // Reset scroll to top when changing sub-tabs in store management
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [activeSubTab]);

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

  const totalAccumulatedSalesRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalAccumulatedHouseProfits = salesRecords.reduce((acc, s) => acc + (s.netProfit || 0), 0);

  const houseCapitalTransactions = rawDb.transactions.filter(t => (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('fondo negocio') || (t.concept + ' ' + (t.notes || '')).toLowerCase().includes('tienda'));
  const netTransferredToCasa = houseCapitalTransactions
    .filter(t => t.type === 'ingreso' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);
  const netInjectedFromCasa = houseCapitalTransactions
    .filter(t => t.type === 'gasto' && t.category === 'Tienda')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalStoreFund = Math.max(0, (totalAccumulatedSalesRevenue - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));
  const activeShift = getActiveShift();

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

  const handleSaveProductSubmit = (productPayload: any) => {
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
    } catch (err: any) {
      showToast({ title: 'Error al Guardar', message: err?.message || 'Ocurrió un fallo.', type: 'error' });
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

  const handleExecutePayout = (amount: number, source: 'negocio' | 'casa') => {
    if (!payoutSupplier) return;
    try {
      const res = paySupplierAccount(payoutSupplier.id, amount, source, currency === 'US$' ? 'USD' : 'CUP');
      if (res.success) {
        setSuppliers(getSupplierAccounts());
        syncDatabaseWithCloud();
        showActionResult({
          title: '¡Pago Registrado!',
          message: res.message || `Se liquidaron $${amount} a ${payoutSupplier.name}.`,
          type: 'success'
        });
      } else {
        showToast({ title: 'No se pudo liquidar', message: res.error || 'Ocurrió un error al liquidar el proveedor.', type: 'error' });
      }
    } catch (err: any) {
      showToast({ title: 'Error al Liquidar', message: err.message, type: 'error' });
    }
  };

  // Fund Transfers Execution
  const handleExecuteTransfer = (direction: 'store_to_casa' | 'casa_to_store', amount: number, notes: string) => {
    try {
      if (direction === 'store_to_casa') {
        transferStoreFundToCasa(amount, notes);
        showToast({ title: '¡Transferencia Exitosa!', message: `Se enviaron $${amount} del Fondo Tienda a Cuenta Casa.`, type: 'success' });
      } else {
        transferCasaToStoreFund(amount, notes);
        showToast({ title: '¡Inyección Exitosa!', message: `Se inyectaron $${amount} de Cuenta Casa a Fondo Tienda.`, type: 'success' });
      }
      syncDatabaseWithCloud();
    } catch (err: any) {
      showToast({ title: 'Error en Transferencia', message: err.message, type: 'error' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '32px' }}>

      {/* 1. TOP HEADER SECTION (Title + Publicar Button like Dashboard) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Gestión de Tienda</h2>
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

      {/* 2. MAIN 4 METRICS CARDS GRID (Sits directly on main background) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>

        {/* Card 1: Fondo del Negocio (Clean Emerald) */}
        <div className="md-card" style={{
          backgroundColor: '#ECFDF5',
          color: '#064E3B',
          border: '1px solid #A7F3D0',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065F46' }}>🏬 Fondo del Negocio</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} color="#059669" />
            </div>
          </div>
          {currencyMode === 'CUP' && (
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.02em', margin: '6px 0 2px 0' }}>
              {formatCurrency(totalStoreFund, 'CUP', true)}
            </div>
          )}
          {currencyMode === 'USD' && (
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F766E', letterSpacing: '-0.02em', margin: '6px 0 2px 0' }}>
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
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#047857', textTransform: 'uppercase', flexShrink: 0 }}>CUP</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {formatCurrency(totalStoreFund, 'CUP', true)}
                </span>
              </div>
              <div style={{
                padding: '5px 8px',
                borderRadius: '8px',
                backgroundColor: '#ECFEFF',
                border: '1px solid #99F6E4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#0F766E', textTransform: 'uppercase', flexShrink: 0 }}>USD</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F766E', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
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
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)' }}>
            {formatCurrency(totalStoreProductsValue, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
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
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)' }}>
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
            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', backgroundColor: activeShift ? '#DCFCE7' : 'var(--md-sys-color-surface)', color: activeShift ? '#15803D' : 'var(--md-sys-color-on-surface-variant)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              {activeShift ? `@${activeShift.sellerUsername}` : 'Sin Turno'}
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(activeShift ? (activeShift.totalCashSales + activeShift.totalDigitalSales) : 0, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
            {activeShift ? 'Total acumulado en turno activo' : 'Inicie turno para registrar ventas'}
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
            backgroundColor: '#FFFFFF',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '1.1rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
            letterSpacing: '0.01em'
          }}
        >
          <Scan size={24} color="var(--md-sys-color-primary)" />
          <span>ESCANEAR Y VENDER</span>
        </button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          onClick={() => setIsShiftModalOpen(true)}
          style={{
            width: '100%',
            padding: '14px 10px',
            borderRadius: '18px',
            border: '2px solid var(--md-sys-color-outline-variant)',
            backgroundColor: '#FFFFFF',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Clock size={20} color="#0284C7" />
          <span>TURNOS E IPV</span>
        </button>

        <button
          onClick={() => setIsValuationBookOpen(true)}
          style={{
            width: '100%',
            padding: '14px 10px',
            borderRadius: '18px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: '#FFFFFF',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)'
          }}
        >
          <FileText size={20} color="#D97706" />
          <span>TASACIONES</span>
        </button>
      </div>

      {/* 4. SUB-TAB NAVIGATION BAR */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 0',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <button
          onClick={() => setActiveSubTab('products')}
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
            onClick={() => setActiveSubTab('suppliers')}
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

        {!isVendor && isOwner && (
          <button
            onClick={() => setActiveSubTab('transfer')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSubTab === 'transfer' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
              color: activeSubTab === 'transfer' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeSubTab === 'transfer' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <ArrowRightLeft size={16} />
            <span>Transferir a Casa (${totalStoreFund})</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('sales')}
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

        {!isVendor && (
          <button
            onClick={() => setActiveSubTab('settings')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSubTab === 'settings' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container)',
              color: activeSubTab === 'settings' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeSubTab === 'settings' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <MessageCircle size={16} />
            <span>Ajustes WhatsApp</span>
          </button>
        )}
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

      {/* SUB TAB 3: TRANSFER STORE FUND TO CUENTA CASA */}
      {activeSubTab === 'transfer' && !isVendor && isOwner && (
        <StoreTransfersTab
          currency={currency}
          totalStoreFund={totalStoreFund}
          onOpenUniversalTransfer={() => setIsUniversalTransferModalOpen(true)}
          onExecuteTransfer={handleExecuteTransfer}
        />
      )}

      {/* SUB TAB 4: SALES LOG */}
      {activeSubTab === 'sales' && (
        <StoreSalesTab
          salesRecords={salesRecords}
          currency={currency}
        />
      )}

      {/* SUB TAB 5: WHATSAPP SETTINGS */}
      {activeSubTab === 'settings' && !isVendor && (
        <StoreSettingsTab
          onShowToast={showToast}
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
