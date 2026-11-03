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
  getLocalISODate,
  getStoreModulesConfig,
  StoreModulesConfig
} from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency, getProductDisplayPrice } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { StoreShiftModal } from '@/components/StoreShiftModal';
import dynamic from 'next/dynamic';

const QRSyncModal = dynamic(
  () => import('@/components/QRSyncModal').then(mod => mod.QRSyncModal),
  { ssr: false }
);
import { StoreManagementSkeleton } from '@/components/common/AppSkeleton';
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

  // Navigation Sub-Tabs & Store Modules
  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => getStoreModulesConfig());
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'suppliers' | 'sales' | 'debts'>('products');
  const subTabsNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleModulesChanged = (e: any) => {
      const updated = e?.detail || getStoreModulesConfig();
      setStoreModules(updated);
      if (!updated.enableSuppliers && activeSubTab === 'suppliers') {
        setActiveSubTab('products');
      }
      if (!updated.enableCustomerDebts && activeSubTab === 'debts') {
        setActiveSubTab('products');
      }
    };
    window.addEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
    return () => window.removeEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
  }, [activeSubTab]);

  useEffect(() => {
    const handleRemoteTab = (e: any) => {
      if (e?.detail && ['products', 'suppliers', 'sales', 'debts'].includes(e.detail)) {
        if (e.detail === 'suppliers' && !storeModules.enableSuppliers) return;
        if (e.detail === 'debts' && !storeModules.enableCustomerDebts) return;
        setActiveSubTab(e.detail);
      }
    };
    window.addEventListener('cuentacasa-navigate-store-tab', handleRemoteTab);
    return () => window.removeEventListener('cuentacasa-navigate-store-tab', handleRemoteTab);
  }, [storeModules]);

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
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

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

  // Compute Store Financial Metrics with strict currency separation (never cross or convert blindly)
  const { currencyMode, exchangeRateUSD, usdIndexedPricing, exchangeRateTrend, autoSyncElToque } = getCurrencySettings();

  // Separación contable estricta de inventario: productos CUP en CUP y productos USD en USD
  const inventoryValueCUP = products.reduce((acc, p) => {
    if (p.currency === 'USD') return acc;
    return acc + (p.price * (p.stock || 0));
  }, 0);

  const inventoryValueUSD = products.reduce((acc, p) => {
    if (p.currency === 'USD') return acc + (p.price * (p.stock || 0));
    if (p.priceUSD && p.priceUSD > 0) return acc + (p.priceUSD * (p.stock || 0));
    return acc;
  }, 0);

  const inventoryCostCUP = products.reduce((acc, p) => {
    if (p.currency === 'USD') return acc;
    return acc + ((p.costPrice || 0) * (p.stock || 0));
  }, 0);

  const inventoryCostUSD = products.reduce((acc, p) => {
    if (p.currency === 'USD') return acc + ((p.costPrice || 0) * (p.stock || 0));
    if (p.costPriceUSD && p.costPriceUSD > 0) return acc + (p.costPriceUSD * (p.stock || 0));
    return acc;
  }, 0);

  const totalStoreProductsValue = currencyMode === 'USD' ? inventoryValueUSD : inventoryValueCUP;
  const totalStoreProductsCost = currencyMode === 'USD' ? inventoryCostUSD : inventoryCostCUP;

  const totalPendingSupplierDebt = suppliers.reduce((acc, s) => acc + s.pendingPayout, 0);

  const salesRecords = getStoreSales();
  const rate = exchangeRateUSD || 320;
  const displayCurrency = currencyMode === 'USD' ? 'USD' : 'CUP';

  // Separación estricta de ganancias: las ventas en USD generan ganancias en USD; las ventas en CUP en CUP
  const totalHouseProfitsCUP = salesRecords.reduce((acc, s) => {
    if (s.netProfitCUP !== undefined) return acc + s.netProfitCUP;
    if (s.currency === 'USD') return acc; // No cruzar ganancias USD en CUP
    return acc + Number(s.netProfit || 0);
  }, 0);

  const totalHouseProfitsUSD = salesRecords.reduce((acc, s) => {
    if (s.netProfitUSD !== undefined) return acc + s.netProfitUSD;
    if (s.currency === 'USD') return acc + Number(s.netProfit || 0);
    return acc;
  }, 0);

  const totalAccumulatedHouseProfits = currencyMode === 'USD' ? totalHouseProfitsUSD : totalHouseProfitsCUP;

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

  if (!isClientMounted && products.length === 0) {
    return <StoreManagementSkeleton />;
  }

  // Helper para escalar tipografía de importes en tarjetas métricas (soporte para grandes montos / mipymes)
  const getAmountFontSize = (text: string, isSingle: boolean = false): string => {
    const len = text.length;
    if (isSingle) {
      if (len > 18) return '1.05rem';
      if (len > 14) return '1.20rem';
      if (len > 11) return '1.32rem';
      return '1.45rem';
    }
    if (len > 18) return '0.78rem';
    if (len > 15) return '0.86rem';
    if (len > 12) return '0.96rem';
    return '1.10rem';
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

      {/* 2. MAIN 4 METRICS CARDS (2 arriba, 2 abajo como en Dashboard Contable) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Row 1: Fondo del Negocio & Valor Inventario */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>

        {/* Card 1: Fondo del Negocio */}
        <div 
          className="md-card" 
          onClick={() => isOwner && setIsUniversalTransferModalOpen(true)}
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '16px',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            cursor: isOwner ? 'pointer' : 'default',
            minWidth: 0,
            overflow: 'hidden'
          }}
          title={isOwner ? "Clic para transferir entre cuentas" : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🏬 Fondo del Negocio</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#F0FDFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} color="#0D9488" />
            </div>
          </div>
          {currencyMode === 'CUP' && (
            <div 
              className="tabular-nums" 
              title={formatCurrency(totalStoreFund, 'CUP', true)}
              style={{ 
                fontSize: getAmountFontSize(formatCurrency(totalStoreFund, 'CUP', true), true), 
                fontWeight: 900, 
                color: 'var(--md-sys-color-on-surface, #0F172A)', 
                letterSpacing: '-0.025em', 
                margin: '6px 0 2px 0', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 0
              }}
            >
              {formatCurrency(totalStoreFund, 'CUP', true)}
            </div>
          )}
          {currencyMode === 'USD' && (
            <div 
              className="tabular-nums" 
              title={formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
              style={{ 
                fontSize: getAmountFontSize(formatCurrency(rawDb.storeFundUSD || 0, 'USD', true), true), 
                fontWeight: 900, 
                color: '#0D9488', 
                letterSpacing: '-0.025em', 
                margin: '6px 0 2px 0', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontVariantNumeric: 'tabular-nums',
                minWidth: 0
              }}
            >
              {formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
            </div>
          )}
          {currencyMode === 'BOTH' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              margin: '6px 0 4px 0',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              {/* CUP Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                padding: '2px 0',
                minWidth: 0
              }}>
                <span style={{
                  fontSize: '0.67rem',
                  fontWeight: 800,
                  color: '#059669',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'inline-block'
                  }} />
                  CUP
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(totalStoreFund, 'CUP', true)}
                  style={{
                    fontSize: getAmountFontSize(formatCurrency(totalStoreFund, 'CUP', true), false),
                    fontWeight: 900,
                    color: 'var(--md-sys-color-on-surface)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.15,
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  {formatCurrency(totalStoreFund, 'CUP', true)}
                </span>
              </div>

              {/* Hairline Divider */}
              <div style={{
                height: '1px',
                backgroundColor: 'currentColor',
                opacity: 0.08,
                margin: '1px 0'
              }} />

              {/* USD Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                padding: '2px 0',
                minWidth: 0
              }}>
                <span style={{
                  fontSize: '0.67rem',
                  fontWeight: 800,
                  color: '#0284C7',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#0284C7',
                    display: 'inline-block'
                  }} />
                  USD
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
                  style={{
                    fontSize: getAmountFontSize(formatCurrency(rawDb.storeFundUSD || 0, 'USD', true), false),
                    fontWeight: 800,
                    color: '#0D9488',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.15,
                    letterSpacing: '-0.025em',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  {formatCurrency(rawDb.storeFundUSD || 0, 'USD', true)}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Caja USD' : 'Caja CUP')}
            </span>
          </div>
        </div>

        {/* Card 2: Valor Inventario */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📦 Valor Inventario</span>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 900,
              padding: '3px 8px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              color: 'var(--brand-primary, #1A73E8)',
              border: '1px solid var(--brand-primary-border, #BFDBFE)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0
            }}>
              <span>{products.length} art.</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span style={{ fontWeight: 900 }}>{products.reduce((acc, p) => acc + (p.stock || 0), 0)} u</span>
            </span>
          </div>

          {currencyMode !== 'BOTH' ? (
            <>
              <div 
                className="tabular-nums" 
                title={formatCurrency(totalStoreProductsValue, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
                style={{ 
                  fontSize: getAmountFontSize(formatCurrency(totalStoreProductsValue, currencyMode === 'USD' ? 'USD' : 'CUP', true), true), 
                  fontWeight: 900, 
                  margin: '6px 0 2px 0', 
                  color: currencyMode === 'USD' ? '#0D9488' : 'var(--md-sys-color-on-surface, #0F172A)', 
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0
                }}
              >
                {formatCurrency(totalStoreProductsValue, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {!isVendor ? `Costo Stock: ${formatCurrency(totalStoreProductsCost, currencyMode === 'USD' ? 'USD' : 'CUP', true)}` : 'Precio público'}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 4px 0', minWidth: 0, overflow: 'hidden' }}>
              {/* CUP Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#059669', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  CUP
                </span>
                <div style={{ textAlign: 'right', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                  <span 
                    className="tabular-nums" 
                    title={formatCurrency(inventoryValueCUP, 'CUP', true)}
                    style={{ 
                      fontSize: getAmountFontSize(formatCurrency(inventoryValueCUP, 'CUP', true), false), 
                      fontWeight: 900, 
                      color: 'var(--md-sys-color-on-surface)', 
                      whiteSpace: 'nowrap', 
                      lineHeight: 1.15, 
                      fontVariantNumeric: 'tabular-nums',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {formatCurrency(inventoryValueCUP, 'CUP', true)}
                  </span>
                  {!isVendor && (
                    <div className="tabular-nums" style={{ fontSize: '0.64rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Costo: {formatCurrency(inventoryCostCUP, 'CUP', true)}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: 'currentColor', opacity: 0.08, margin: '1px 0' }} />

              {/* USD Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284C7', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'inline-block' }} />
                  USD
                </span>
                <div style={{ textAlign: 'right', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                  <span 
                    className="tabular-nums" 
                    title={formatCurrency(inventoryValueUSD, 'USD', true)}
                    style={{ 
                      fontSize: getAmountFontSize(formatCurrency(inventoryValueUSD, 'USD', true), false), 
                      fontWeight: 800, 
                      color: '#0D9488', 
                      whiteSpace: 'nowrap', 
                      lineHeight: 1.15, 
                      fontVariantNumeric: 'tabular-nums',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {formatCurrency(inventoryValueUSD, 'USD', true)}
                  </span>
                  {!isVendor && (
                    <div className="tabular-nums" style={{ fontSize: '0.64rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Costo: {formatCurrency(inventoryCostUSD, 'USD', true)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Existencia: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{products.reduce((acc, p) => acc + (p.stock || 0), 0)} u</strong> en {products.length} productos
          </div>
        </div>
        </div>

        {/* Row 2: Ganancias en Tienda & Ventas del Día */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>

        {/* Card 3: Fondo de Ganancias */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📈 Ganancias</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={16} color="#059669" />
            </div>
          </div>

          {currencyMode !== 'BOTH' ? (
            <div 
              className="tabular-nums" 
              title={formatCurrency(totalAccumulatedHouseProfits, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
              style={{ 
                fontSize: getAmountFontSize(formatCurrency(totalAccumulatedHouseProfits, currencyMode === 'USD' ? 'USD' : 'CUP', true), true), 
                fontWeight: 900, 
                margin: '6px 0 2px 0', 
                color: '#059669', 
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0
              }}
            >
              +{formatCurrency(totalAccumulatedHouseProfits, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 4px 0', minWidth: 0, overflow: 'hidden' }}>
              {/* CUP Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#059669', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  CUP
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(totalHouseProfitsCUP, 'CUP', true)}
                  style={{ 
                    fontSize: getAmountFontSize(formatCurrency(totalHouseProfitsCUP, 'CUP', true), false), 
                    fontWeight: 900, 
                    color: '#059669', 
                    whiteSpace: 'nowrap', 
                    lineHeight: 1.15, 
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  +{formatCurrency(totalHouseProfitsCUP, 'CUP', true)}
                </span>
              </div>

              <div style={{ height: '1px', backgroundColor: 'currentColor', opacity: 0.08, margin: '1px 0' }} />

              {/* USD Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284C7', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'inline-block' }} />
                  USD
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(totalHouseProfitsUSD, 'USD', true)}
                  style={{ 
                    fontSize: getAmountFontSize(formatCurrency(totalHouseProfitsUSD, 'USD', true), false), 
                    fontWeight: 800, 
                    color: '#059669', 
                    whiteSpace: 'nowrap', 
                    lineHeight: 1.15, 
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  +{formatCurrency(totalHouseProfitsUSD, 'USD', true)}
                </span>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Ganancias reales (Mover a Casa)
          </div>
        </div>

        {/* Card 4: Ventas del Día / Turno Activo */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🛍️ Ventas de Hoy</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '6px',
              backgroundColor: (storeModules.enableShiftManagement && activeShift) ? '#ECFDF5' : 'var(--md-sys-color-surface-container)',
              color: (storeModules.enableShiftManagement && activeShift) ? '#059669' : 'var(--md-sys-color-on-surface-variant)',
              border: `1px solid ${(storeModules.enableShiftManagement && activeShift) ? '#A7F3D0' : 'var(--md-sys-color-outline-variant)'}`,
              flexShrink: 0
            }}>
              {storeModules.enableShiftManagement 
                ? (activeShift ? `🟢 @${activeShift.sellerUsername}` : (todaySalesRecords.length > 0 ? `${todaySalesRecords.length} ${todaySalesRecords.length === 1 ? 'vta' : 'vtas'}` : 'Sin Turno'))
                : (todaySalesRecords.length > 0 ? `${todaySalesRecords.length} ${todaySalesRecords.length === 1 ? 'vta' : 'vtas'}` : '0 vtas')}
            </span>
          </div>

          {currencyMode !== 'BOTH' ? (
            <div 
              className="tabular-nums" 
              title={formatCurrency(todaySalesDisplay, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
              style={{ 
                fontSize: getAmountFontSize(formatCurrency(todaySalesDisplay, currencyMode === 'USD' ? 'USD' : 'CUP', true), true), 
                fontWeight: 900, 
                margin: '6px 0 2px 0', 
                color: currencyMode === 'USD' ? '#0D9488' : 'var(--md-sys-color-on-surface, #0F172A)', 
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0
              }}
            >
              {formatCurrency(todaySalesDisplay, currencyMode === 'USD' ? 'USD' : 'CUP', true)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 4px 0', minWidth: 0, overflow: 'hidden' }}>
              {/* CUP Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#059669', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  CUP
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(todaySalesCUP, 'CUP', true)}
                  style={{ 
                    fontSize: getAmountFontSize(formatCurrency(todaySalesCUP, 'CUP', true), false), 
                    fontWeight: 900, 
                    color: 'var(--md-sys-color-on-surface, #0F172A)', 
                    whiteSpace: 'nowrap', 
                    lineHeight: 1.15, 
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  {formatCurrency(todaySalesCUP, 'CUP', true)}
                </span>
              </div>

              <div style={{ height: '1px', backgroundColor: 'currentColor', opacity: 0.08, margin: '1px 0' }} />

              {/* USD Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '2px 0', minWidth: 0 }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284C7', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'inline-block' }} />
                  USD
                </span>
                <span 
                  className="tabular-nums" 
                  title={formatCurrency(todaySalesUSD, 'USD', true)}
                  style={{ 
                    fontSize: getAmountFontSize(formatCurrency(todaySalesUSD, 'USD', true), false), 
                    fontWeight: 800, 
                    color: '#0D9488', 
                    whiteSpace: 'nowrap', 
                    lineHeight: 1.15, 
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right',
                    flexShrink: 1
                  }}
                >
                  {formatCurrency(todaySalesUSD, 'USD', true)}
                </span>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {storeModules.enableShiftManagement && activeShift
              ? `Turno de @${activeShift.sellerUsername} (${todaySalesRecords.length} vtas)`
              : (todaySalesRecords.length > 0
                  ? `${todaySalesRecords.length} ${todaySalesRecords.length === 1 ? 'venta registrada' : 'ventas registradas'} hoy`
                  : '0 ventas hoy')}
          </div>
        </div>

        </div>
      </div>

      {/* 3. MAIN ACTION BUTTONS: ESCANEAR Y VENDER, TURNOS DE CAJA & TASACIONES */}
      {onOpenScanner && (
        <button
          onClick={onOpenScanner}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '16px',
            border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            letterSpacing: '0.02em',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
            color: 'var(--brand-primary, #1A73E8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Scan size={18} />
          </div>
          <span>ESCANEAR Y VENDER</span>
        </button>
      )}

      {(storeModules.enableShiftManagement || storeModules.enableFoodTraceability) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (storeModules.enableShiftManagement && storeModules.enableFoodTraceability) ? '1fr 1fr' : '1fr',
          gap: '12px'
        }}>
          {storeModules.enableShiftManagement && (
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
                padding: '14px 12px',
                borderRadius: '16px',
                border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.94rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                letterSpacing: '0.01em',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={18} />
              </div>
              <span>TURNOS DE CAJA</span>
            </button>
          )}

          {storeModules.enableFoodTraceability && (
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
                padding: '14px 12px',
                borderRadius: '16px',
                border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.94rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                letterSpacing: '0.01em',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={18} />
              </div>
              <span>TASACIONES</span>
            </button>
          )}
        </div>
      )}

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

        {!isVendor && storeModules.enableSuppliers && (
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

        {storeModules.enableCustomerDebts && (
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
