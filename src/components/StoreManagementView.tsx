'use client';

import React, { useState } from 'react';
import { StoreProduct, SupplierType, SupplierAccount } from '@/types';
import { 
  getStoreProducts, 
  saveStoreProduct, 
  deleteStoreProduct,
  getStoreSales,
  getSupplierAccounts,
  paySupplierAccount,
  getRawDatabase,
  compressImageToBase64
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { 
  Store, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Scan, 
  Search, 
  Tag, 
  Package, 
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Users,
  CheckCircle,
  Vault
} from 'lucide-react';

interface StoreManagementViewProps {
  currency?: string;
  onOpenScanner?: () => void;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner
}) => {
  const { showToast, confirmAction } = useActionFeedback();
  const rawDb = getRawDatabase();
  const [products, setProducts] = useState<StoreProduct[]>(() => getStoreProducts());
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>(() => getSupplierAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForDetailModal, setSelectedProductForDetailModal] = useState<StoreProduct | null>(null);
  
  // Modal State for Add / Edit Store Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Form State
  const [barcode, setBarcode] = useState('0005');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('Viveres');
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [published, setPublished] = useState(true);
  const [supplierType, setSupplierType] = useState<SupplierType>('propia');
  const [supplierName, setSupplierName] = useState('Maikel');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Supplier Payout Modal state
  const [payoutSupplier, setPayoutSupplier] = useState<SupplierAccount | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');

  const salesRecords = getStoreSales();

  // Metrics calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostValueInStock = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
  const totalSellingValueInStock = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const potentialProfitInStock = totalSellingValueInStock - totalCostValueInStock;

  const totalHouseProfit = salesRecords.reduce((sum, s) => sum + s.netProfit, 0);
  const totalStoreFund = rawDb.storeFund || 0;
  const totalPendingSupplierDebt = suppliers.reduce((sum, sup) => sum + sup.pendingPayout, 0);

  const refreshData = () => {
    setProducts(getStoreProducts());
    setSuppliers(getSupplierAccounts());
  };

  const handleOpenAdd = () => {
    const nextBarcode = (products.length + 1).toString().padStart(4, '0');
    setEditingProduct(null);
    setBarcode(nextBarcode);
    setName('');
    setCostPrice('');
    setPrice('');
    setCategory('Viveres');
    setStock(10);
    setDescription('');
    setPhotoUrl('');
    setPublished(true);
    setSupplierType('propia');
    setSupplierName('Maikel');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: StoreProduct) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCostPrice(p.costPrice || Math.round(p.price * 0.7));
    setPrice(p.price);
    setCategory(p.category);
    setStock(p.stock);
    setDescription(p.description || '');
    setPhotoUrl(p.photoUrl || '');
    setPublished(p.published);
    setSupplierType(p.supplierType || 'propia');
    setSupplierName(p.supplierName || 'Maikel');
    setIsModalOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedBase64 = await compressImageToBase64(file, 400);
      setPhotoUrl(compressedBase64);
      showToast({ title: 'Fotografía Cargada', message: 'Imagen comprimida y optimizada exitosamente.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Error de Imagen', message: 'No se pudo procesar la fotografía.', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      showToast({ title: 'Campos Requeridos', message: 'Ingresa el nombre del producto y un precio de venta válido.', type: 'warning' });
      return;
    }

    const numericCost = Number(costPrice) > 0 ? Number(costPrice) : Math.round(Number(price) * 0.7);

    saveStoreProduct({
      barcode: barcode.padStart(4, '0'),
      name: name.trim(),
      costPrice: numericCost,
      price: Number(price),
      category: category.trim() || 'General',
      stock: Number(stock) || 0,
      description: description.trim(),
      photoUrl: photoUrl || undefined,
      published,
      salesCount: editingProduct ? editingProduct.salesCount : 0,
      supplierType,
      supplierName: supplierType === 'proveedor' ? supplierName.trim() : undefined
    });

    refreshData();
    setIsModalOpen(false);
    showToast({
      title: editingProduct ? '¡Producto Actualizado!' : '¡Producto Creado!',
      message: `"${name.trim()}" ${editingProduct ? 'ha sido modificado correctamente' : 'se agregó al inventario'}.`,
      type: 'success'
    });
  };

  const handleTogglePublish = (p: StoreProduct) => {
    saveStoreProduct({
      ...p,
      published: !p.published
    });
    refreshData();
    showToast({
      title: 'Estado del Producto',
      message: `"${p.name}" ahora está ${!p.published ? 'Visible en Tienda' : 'en Borrador (Oculto)'}.`,
      type: 'info'
    });
  };

  const handleDelete = (id: string, prodName: string) => {
    confirmAction({
      title: '¿Eliminar Producto?',
      message: `¿Estás seguro de eliminar "${prodName}" del inventario de la tienda?`,
      variant: 'danger',
      confirmText: 'Eliminar Producto',
      onConfirm: () => {
        deleteStoreProduct(id);
        refreshData();
        showToast({
          title: '¡Producto Eliminado!',
          message: `"${prodName}" fue retirado del inventario.`,
          type: 'success'
        });
      }
    });
  };

  const handleOpenPayout = (sup: SupplierAccount) => {
    setPayoutSupplier(sup);
    setPayoutAmount(sup.pendingPayout);
  };

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSupplier || !payoutAmount || Number(payoutAmount) <= 0) return;

    confirmAction({
      title: '¿Confirmar Liquidación a Proveedor?',
      message: `Se registrará la entrega de ${formatCurrency(Number(payoutAmount), currency)} en efectivo a ${payoutSupplier.name}.`,
      variant: 'warning',
      confirmText: 'Confirmar Pago',
      onConfirm: () => {
        const res = paySupplierAccount(payoutSupplier.name, Number(payoutAmount));
        showToast({ title: '¡Liquidación Registrada!', message: res.message, type: 'success' });
        setPayoutSupplier(null);
        refreshData();
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Banner */}
      <div className="md-card" style={{
        background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #00385E 100%)',
        color: '#FFFFFF',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Store size={22} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Inventario y Cuentas de Tienda</h2>
          </div>
          <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            Separación de Fondos: El margen de ganancias se envía a CuentaCasa y el costo permanece en el Fondo Tienda / Proveedores.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '400px' }}>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="md-btn"
              style={{
                flex: '1 1 140px',
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                padding: '10px 16px',
                border: '1px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Scan size={18} />
              <span>Vender con Escáner</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="md-btn"
            style={{
              flex: '1 1 140px',
              backgroundColor: '#FFFFFF',
              color: 'var(--md-sys-color-primary)',
              fontSize: '0.88rem',
              fontWeight: 800,
              padding: '10px 16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            <Plus size={18} />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Dual Funds Accounting Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        
        {/* House Net Profit */}
        <div className="md-card" style={{ padding: '14px 16px', backgroundColor: 'var(--md-sys-color-income-container)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-income-container)', display: 'block' }}>
            Ganancias a CuentaCasa
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
            +{formatCurrency(totalHouseProfit, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', marginTop: '2px' }}>
            Transferido al balance general
          </span>
        </div>

        {/* Store Fund (Caja Chica) */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Fondo Recaudado Tienda
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(totalStoreFund, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            Dinero para reposición propia
          </span>
        </div>

        {/* Supplier Debts */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Por Pagar a Proveedores
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
            {formatCurrency(totalPendingSupplierDebt, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            Maikel, Carlos, etc.
          </span>
        </div>

        {/* Total Stock Capital */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Capital en Almacén
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            {formatCurrency(totalCostValueInStock, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            {totalStockUnits} unidades en existencia
          </span>
        </div>

      </div>

      {/* Supplier Accounts Section (Cuentas por Pagar a Maikel, Carlos, etc.) */}
      {suppliers.length > 0 && (
        <div className="md-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Cuentas de Proveedores (Consignación)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {suppliers.map(sup => (
              <div
                key={sup.id}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{sup.name}</h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                    Pendiente: <strong style={{ color: 'var(--md-sys-color-expense)' }}>${sup.pendingPayout}</strong>
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block' }}>
                    Liquidado: ${sup.totalPaid}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenPayout(sup)}
                  disabled={sup.pendingPayout <= 0}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: sup.pendingPayout <= 0 ? 0.5 : 1 }}
                >
                  Liquidar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar with Input Spotlight */}
      <div className="md-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search 
              size={16} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar por código, producto o proveedor (ej. Maikel)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-spotlight"
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--md-sys-color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            <span>Ver Tienda Pública</span>
            <ExternalLink size={14} />
          </a>

        </div>
      </div>

      {/* Products Grid - 2 columns on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: '12px' }}>
        {filteredProducts.map(prod => {
          const unitProfit = prod.price - (prod.costPrice || 0);

          return (
            <div
              key={prod.id}
              className="md-card"
              onClick={() => setSelectedProductForDetailModal(prod)}
              style={{
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
                opacity: prod.published ? 1 : 0.65,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <div>
                {/* Barcode & Published status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    padding: '2px 6px',
                    borderRadius: '6px'
                  }}>
                    #{prod.barcode}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePublish(prod);
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '2px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: prod.published ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
                      color: prod.published ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {prod.published ? <Eye size={11} /> : <EyeOff size={11} />}
                    <span>{prod.published ? 'Tienda' : 'Borrador'}</span>
                  </button>
                </div>

                {/* Photo Preview (1:1 ratio) */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '6px',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)'
                }}>
                  <img 
                    src={prod.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                    alt={prod.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <h3 style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: 800, 
                  color: 'var(--md-sys-color-on-surface)',
                  lineHeight: '1.25',
                  marginBottom: '2px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {prod.name}
                </h3>
              </div>

              {/* Price & Actions */}
              <div style={{ paddingTop: '6px', borderTop: '1px solid var(--md-sys-color-surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                  {formatCurrency(prod.price, currency, true)}
                </div>

                <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    title="Editar producto"
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(prod.id, prod.name)}
                    title="Eliminar producto"
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Bottom Sheet Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }} onClick={() => setIsModalOpen(false)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveProduct}
            className="md-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px 24px 0 0'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 8px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {editingProduct ? 'Editar Producto de Tienda' : 'Nuevo Producto en Tienda'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Supplier Ownership Option */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Origen de la Mercancía:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSupplierType('propia')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    backgroundColor: supplierType === 'propia' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                    color: supplierType === 'propia' ? '#FFF' : 'var(--md-sys-color-on-surface)'
                  }}
                >
                  Mercancía Propia
                </button>

                <button
                  type="button"
                  onClick={() => setSupplierType('proveedor')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    backgroundColor: supplierType === 'proveedor' ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-surface-container-high)',
                    color: supplierType === 'proveedor' ? '#FFF' : 'var(--md-sys-color-on-surface)'
                  }}
                >
                  De Proveedor / Consignación
                </button>
              </div>
            </div>

            {/* Supplier Name Input */}
            {supplierType === 'proveedor' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Nombre del Proveedor (ej. Maikel, Carlos):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Maikel"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '2px solid var(--md-sys-color-expense)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontWeight: 800
                  }}
                />
              </div>
            )}

            {/* Barcode & Category (Numeric Keyboard for Barcode) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Código de Barras (4 Dígitos):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  value={barcode}
                  onChange={e => setBarcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '1rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Categoría:
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)'
                  }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Nombre del Producto:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pan Dulce Casero 5u"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}
              />
            </div>

            {/* Cost Price vs Selling Price Grid (Numeric Keyboard) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Precio de Costo ({currency}):
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="any"
                  required
                  placeholder="200"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Precio Venta Público ({currency}):
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="any"
                  required
                  placeholder="350"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontWeight: 800,
                    color: 'var(--md-sys-color-income)'
                  }}
                />
              </div>
            </div>

            {/* Stock (Numeric Keyboard) */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Stock Disponible (Unidades):
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={stock}
                onChange={e => setStock(parseInt(e.target.value, 10) || 0)}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Foto del Producto (Max 400x400 Base64):
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label className="md-btn md-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <ImageIcon size={16} />
                  <span>{isUploadingPhoto ? 'Procesando...' : 'Seleccionar Foto'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </label>

                {photoUrl && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Published Toggle Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={published}
                onChange={e => setPublished(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Publicar en la tienda pública (Visible para clientes)</span>
            </label>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                className="md-btn md-btn-primary"
                style={{ flex: 1, padding: '14px' }}
              >
                Guardar Producto
              </button>
            </div>

          </form>

        </div>
      )}

      {/* Supplier Payout Bottom Sheet Modal */}
      {payoutSupplier && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }} onClick={() => setPayoutSupplier(null)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleExecutePayout}
            className="md-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderRadius: '24px 24px 0 0'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 8px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Liquidar Proveedor: {payoutSupplier.name}</h3>
              <button type="button" onClick={() => setPayoutSupplier(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Monto retenido pendiente de entregar: <strong style={{ color: 'var(--md-sys-color-expense)' }}>${payoutSupplier.pendingPayout}</strong>
            </p>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Monto a Entregar ({currency}):
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                required
                max={payoutSupplier.pendingPayout}
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              />
            </div>

            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              Registrar Liquidación Entregada
            </button>

          </form>

        </div>
      )}

      {/* Product Detail Modal for Store Admin */}
      <ProductDetailModal
        product={selectedProductForDetailModal}
        onClose={() => setSelectedProductForDetailModal(null)}
        onEditProduct={(p) => {
          setSelectedProductForDetailModal(null);
          handleOpenEdit(p);
        }}
        onDeleteProduct={(id, name) => {
          setSelectedProductForDetailModal(null);
          handleDelete(id, name);
        }}
        allProducts={products}
        currency={currency}
        isAdmin={true}
      />

    </div>
  );
};
