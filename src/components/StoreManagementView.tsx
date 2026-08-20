'use client';

import React, { useState } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, saveStoreProduct, deleteStoreProduct } from '@/lib/storage';
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
  Check, 
  X,
  ExternalLink
} from 'lucide-react';

interface StoreManagementViewProps {
  currency?: string;
  onOpenScanner?: () => void;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner
}) => {
  const [products, setProducts] = useState<StoreProduct[]>(() => getStoreProducts());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State for Add / Edit Store Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Form State
  const [barcode, setBarcode] = useState('0005');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('Viveres');
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);

  const refreshList = () => {
    setProducts(getStoreProducts());
  };

  const handleOpenAdd = () => {
    const nextBarcode = (products.length + 1).toString().padStart(4, '0');
    setEditingProduct(null);
    setBarcode(nextBarcode);
    setName('');
    setPrice('');
    setCategory('Viveres');
    setStock(10);
    setDescription('');
    setPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: StoreProduct) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setPrice(p.price);
    setCategory(p.category);
    setStock(p.stock);
    setDescription(p.description || '');
    setPublished(p.published);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      alert('Ingresa el nombre y un precio válido.');
      return;
    }

    saveStoreProduct({
      barcode: barcode.padStart(4, '0'),
      name: name.trim(),
      price: Number(price),
      category: category.trim() || 'General',
      stock: Number(stock) || 0,
      description: description.trim(),
      published
    });

    refreshList();
    setIsModalOpen(false);
  };

  const handleTogglePublish = (p: StoreProduct) => {
    saveStoreProduct({
      ...p,
      published: !p.published
    });
    refreshList();
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`¿Eliminar "${prodName}" del inventario de la tienda?`)) {
      deleteStoreProduct(id);
      refreshList();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Gestión de Inventario de Tienda</h2>
          </div>
          <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            Publica productos físicos con código de barras de 4 dígitos (0001-9999) en tu tienda web pública.
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
              <span>Escáner de Barras</span>
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
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
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
              placeholder="Buscar por código 0001, nombre o categoría..."
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

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Total: {products.length} productos ({products.filter(p => p.published).length} visibles en tienda)
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

      {/* Products Grid / Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
        {filteredProducts.map(prod => (
          <div
            key={prod.id}
            className="md-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px',
              opacity: prod.published ? 1 : 0.65,
              borderColor: prod.published ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-outline)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
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
                  title={prod.published ? 'Ocultar de la tienda' : 'Publicar en la tienda'}
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
                  <span>{prod.published ? 'Publicado' : 'Borrador'}</span>
                </button>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {prod.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <Tag size={12} />
                <span>{prod.category}</span>
                <span>•</span>
                <Package size={12} />
                <span>Stock: {prod.stock} u</span>
              </div>

              {prod.description && (
                <p style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '6px' }}>
                  {prod.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--md-sys-color-surface-variant)' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(prod.price, currency, true)}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleOpenEdit(prod)}
                  title="Editar producto"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--md-sys-color-on-surface-variant)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Edit3 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(prod.id, prod.name)}
                  title="Eliminar producto"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--md-sys-color-expense)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

          </div>
        ))}
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
              maxWidth: '460px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
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

            {/* Price & Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Precio ({currency}):
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
                    fontWeight: 800
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Stock Disponible:
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
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Descripción Breve:
              </label>
              <textarea
                rows={2}
                placeholder="Detalles, frescura o especificaciones del producto..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontSize: '0.85rem'
                }}
              />
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

    </div>
  );
};
