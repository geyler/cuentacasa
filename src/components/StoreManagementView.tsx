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
  getUserRole
} from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { TransferModal } from '@/components/TransferModal';

import {
  FormBarcodeScannerOverlay,
  ProductFormModal,
  SupplierFormModal,
  SupplierPayoutModal,
  StoreProductsTab,
  StoreSuppliersTab,
  StoreTransfersTab,
  StoreSalesTab,
  StoreSettingsTab
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
  TrendingDown
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

  useEffect(() => {
    setProducts(getStoreProducts());
    setSuppliers(getSupplierAccounts());
  }, []);

  // Compute Store Financial Metrics
  const totalStoreProductsValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalStoreProductsCost = products.reduce((acc, p) => acc + ((p.costPrice || 0) * p.stock), 0);
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

  const totalStoreFund = Math.max(0, (totalAccumulatedSalesRevenue - totalAccumulatedHouseProfits - totalPendingSupplierDebt) + (netInjectedFromCasa - netTransferredToCasa));

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
      paySupplierAccount(payoutSupplier.id, amount, source);
      setSuppliers(getSupplierAccounts());
      syncDatabaseWithCloud();
      showToast({ title: '¡Pago Registrado!', message: `Se liquidaron $${amount} a ${payoutSupplier.name}.`, type: 'success' });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>

      {/* Dynamic Header Metrics Bar */}
      <div className="md-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={24} color="var(--md-sys-color-primary)" />
              <span>Samy Store • Gestión & Inventario</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: 600 }}>
              Control multi-rol, productos en stock, liquidación a proveedores y POS.
            </p>
          </div>
        </div>

        {/* Main Action Buttons Grid (Vender / POS & Publicar) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '16px',
                border: '2px solid var(--md-sys-color-primary)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-primary)',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0, 99, 155, 0.1)'
              }}
            >
              <Scan size={22} color="var(--md-sys-color-primary)" />
              <span>VENDER / POS</span>
            </button>
          )}

          {!isVendor && (
            <button
              onClick={handleOpenAdd}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #DB2777 100%)',
                color: '#FFFFFF',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
              }}
            >
              <Plus size={22} />
              <span>PUBLICAR PRODUCTO</span>
            </button>
          )}
        </div>

        {/* Dashboard Accounting Financial Cards (2 Columns Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {/* Card 1: Fondo Tienda (Clean Emerald) */}
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
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065F46' }}>🏦 Fondo Tienda</span>
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
            <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: '#047857', letterSpacing: '-0.02em' }}>
              {formatCurrency(totalStoreFund, currency, true)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
              Caja disponible en almacén
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
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                {products.length} u
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)' }}>
              {formatCurrency(totalStoreProductsValue, currency, true)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              {!isVendor ? `Costo Stock: ${formatCurrency(totalStoreProductsCost, currency, true)}` : 'Precio público'}
            </div>
          </div>

          {/* Card 3: Ventas Acumuladas */}
          <div className="md-card" style={{
            backgroundColor: 'var(--md-sys-color-income-container)',
            color: 'var(--md-sys-color-on-income-container)',
            borderColor: 'rgba(0, 135, 90, 0.2)',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>🛒 Ventas Acumuladas</span>
              <TrendingUp size={16} color="var(--md-sys-color-income)" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)' }}>
              +{formatCurrency(totalAccumulatedSalesRevenue, currency, true)}
            </div>
            <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
              Ingreso total por ventas POS
            </div>
          </div>

          {/* Card 4: Deuda Proveedores / Ganancias Casa */}
          {!isVendor ? (
            <div className="md-card" style={{
              backgroundColor: 'var(--md-sys-color-expense-container)',
              color: 'var(--md-sys-color-on-expense-container)',
              borderColor: 'rgba(211, 47, 47, 0.2)',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>🤝 Deuda Proveedores</span>
                <TrendingDown size={16} color="var(--md-sys-color-expense)" />
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-expense)' }}>
                {formatCurrency(totalPendingSupplierDebt, currency, true)}
              </div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
                Pendiente por liquidar consignación
              </div>
            </div>
          ) : (
            <div className="md-card" style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>🛍️ Artículos Stock</span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0' }}>
                {products.filter(p => p.stock > 0).length} en stock
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                Disponibles para venta
              </div>
            </div>
          )}
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <button
            onClick={() => setActiveSubTab('products')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeSubTab === 'products' ? 'var(--md-sys-color-primary-container)' : 'transparent',
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
                backgroundColor: activeSubTab === 'suppliers' ? 'var(--md-sys-color-primary-container)' : 'transparent',
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
                backgroundColor: activeSubTab === 'transfer' ? 'var(--md-sys-color-primary-container)' : 'transparent',
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
              backgroundColor: activeSubTab === 'sales' ? 'var(--md-sys-color-primary-container)' : 'transparent',
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
                backgroundColor: activeSubTab === 'settings' ? 'var(--md-sys-color-primary-container)' : 'transparent',
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

    </div>
  );
};
