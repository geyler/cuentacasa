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
  const rawDb = getRawDatabase();
  const [products, setProducts] = useState<StoreProduct[]>(() => getStoreProducts());
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>(() => getSupplierAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  
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
    } catch (err) {
      alert('Error al procesar la fotografía.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      alert('Ingresa el nombre y un precio de venta válido.');
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
  };

  const handleTogglePublish = (p: StoreProduct) => {
    saveStoreProduct({
      ...p,
      published: !p.published
    });
    refreshData();
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`¿Eliminar "${prodName}" del inventario de la tienda?`)) {
      deleteStoreProduct(id);
      refreshData();
    }
  };

  const handleOpenPayout = (sup: SupplierAccount) => {
    setPayoutSupplier(sup);
    setPayoutAmount(sup.pendingPayout);
  };

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSupplier || !payoutAmount || Number(payoutAmount) <= 0) return;

    const res = paySupplierAccount(payoutSupplier.name, Number(payoutAmount));
    alert(res.message);
    setPayoutSupplier(null);
    refreshData();
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

        <div style={{ display: 'flex', gap: '8px' }}>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="md-btn"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                padding: '8px 14px'
              }}
            >
              <Scan size={16} />
              <span>Vender con Escáner</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="md-btn md-btn-primary"
            style={{
              backgroundColor: '#FFFFFF',
              color: 'var(--md-sys-color-primary)',
              fontSize: '0.85rem',
              padding: '8px 16px'
            }}
          >
            <Plus size={16} />
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

      {/* Search Bar */}
      <div className="md-card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search 
              size={16} 
              style={{
                position: 'absolute',
                left: '10px',
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
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '10px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.85rem'
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

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
        {filteredProducts.map(prod => {
          const unitProfit = prod.price - (prod.costPrice || 0);

          return (
            <div
              key={prod.id}
              className="md-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                opacity: prod.published ? 1 : 0.65
              }}
            >
              <div>
                {/* Barcode & Published toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    #{prod.barcode}
                  </span>

                  <button
                    onClick={() => handleTogglePublish(prod)}
                    style={{
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: prod.published ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
                      color: prod.published ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {prod.published ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{prod.published ? 'En Tienda' : 'Borrador'}</span>
                  </button>
                </div>

                {/* Photo Preview if uploaded */}
                {prod.photoUrl && (
                  <div style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                    <img src={prod.photoUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  {prod.name}
                </h3>

                {/* Ownership / Supplier Tag */}
                <div style={{ marginTop: '4px' }}>
                  {prod.supplierType === 'proveedor' ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-expense)', backgroundColor: 'var(--md-sys-color-expense-container)', padding: '2px 8px', borderRadius: '6px' }}>
                      Consignación: {prod.supplierName || 'Proveedor'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: '2px 8px', borderRadius: '6px' }}>
                      Mercancía Propia
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <Tag size={12} />
                  <span>{prod.category}</span>
                  <span>•</span>
                  <Package size={12} />
                  <span>Stock: {prod.stock} u</span>
                </div>
              </div>

              {/* Price & Cost Breakdown */}
              <div style={{ paddingTop: '10px', borderTop: '1px solid var(--md-sys-color-surface-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                  <span>Costo: ${prod.costPrice || 0}</span>
                  <span style={{ color: '#00875A', fontWeight: 700 }}>Ganancia Casa: +${unitProfit}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(prod.price, currency, true)}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      title="Editar producto"
                      style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(prod.id, prod.name)}
                      title="Eliminar producto"
                      style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setIsModalOpen(false)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveProduct}
            className="md-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {editingProduct ? 'Editar Producto de Tienda' : 'Nuevo Producto en Tienda'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
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
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
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
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.8rem',
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
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '2px solid var(--md-sys-color-expense)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontWeight: 800
                  }}
                />
              </div>
            )}

            {/* Barcode & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Código de Barras (4 Dígitos):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={barcode}
                  onChange={e => setBarcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontFamily: 'monospace',
                    fontWeight: 800
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
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
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
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}
              />
            </div>

            {/* Cost Price vs Selling Price Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Precio de Costo ({currency}):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="200"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
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
                  step="any"
                  required
                  placeholder="350"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontWeight: 800,
                    color: 'var(--md-sys-color-income)'
                  }}
                />
              </div>
            </div>

            {/* Stock */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Stock Disponible (Unidades):
              </label>
              <input
                type="number"
                required
                value={stock}
                onChange={e => setStock(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
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
                <label className="md-btn md-btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
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
                style={{ width: '16px', height: '16px' }}
              />
              <span>Publicar en la tienda pública (Visible para clientes)</span>
            </label>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                className="md-btn md-btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                Guardar Producto
              </button>
            </div>

          </form>

        </div>
      )}

      {/* Supplier Payout Modal */}
      {payoutSupplier && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setPayoutSupplier(null)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleExecutePayout}
            className="md-card"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Liquidar Proveedor: {payoutSupplier.name}</h3>
              <button type="button" onClick={() => setPayoutSupplier(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
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
                step="any"
                required
                max={payoutSupplier.pendingPayout}
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}
              />
            </div>

            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Registrar Liquidación Entregada
            </button>

          </form>

        </div>
      )}

    </div>
  );
};
