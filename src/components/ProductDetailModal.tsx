'use client';

import React, { useState } from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { 
  X, 
  Tag, 
  Package, 
  DollarSign, 
  MessageCircle, 
  Truck, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  TrendingUp, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAddToCart?: (p: StoreProduct) => void;
  onEditProduct?: (p: StoreProduct) => void;
  onDeleteProduct?: (id: string, name: string) => void;
  allProducts?: StoreProduct[];
  currency?: string;
  isAdmin?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  onClose,
  onAddToCart,
  onEditProduct,
  onDeleteProduct,
  allProducts = [],
  currency = '$',
  isAdmin = false
}) => {
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(initialProduct);

  // Sync state if initialProduct changes
  React.useEffect(() => {
    setActiveProduct(initialProduct);
  }, [initialProduct]);

  if (!activeProduct) return null;

  const cost = activeProduct.costPrice || Math.round(activeProduct.price * 0.7);
  const profitMargin = activeProduct.price - cost;
  const marginPercentage = Math.round((profitMargin / activeProduct.price) * 100);

  // Related Products in the same category (excluding active product)
  const relatedProducts = allProducts.filter(p => 
    p.category === activeProduct.category && p.id !== activeProduct.id && p.published
  );

  const handleWhatsAppOrder = () => {
    const text = `🛒 *CONSULTA / PEDIDO EN TIENDA CASA*\n\nHola! Me interesa comprar el producto:\n*${activeProduct.name}*\n• Código: #${activeProduct.barcode}\n• Precio: ${formatCurrency(activeProduct.price, currency, true)}\n• Categoría: ${activeProduct.category}\n\n¿Tienen disponibilidad para envío/entrega?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 125,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>

      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'modalPop 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)'
        }}
      >
        {/* MD3 Bottom-Sheet Top Drag Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 8px auto' }} />

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              padding: '3px 10px',
              borderRadius: '9999px'
            }}>
              {activeProduct.category}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              Código #{activeProduct.barcode}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Product HD Image Banner */}
        <div style={{
          width: '100%',
          height: '240px',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
          position: 'relative'
        }}>
          <img 
            src={activeProduct.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
            alt={activeProduct.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          <span style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: activeProduct.stock > 0 ? '#00875A' : 'var(--md-sys-color-expense)',
            color: '#FFFFFF',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            {activeProduct.stock > 0 ? `Stock: ${activeProduct.stock}u` : 'Agotado'}
          </span>
        </div>

        {/* Product Title & Main Info */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px' }}>
            {activeProduct.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
              {formatCurrency(activeProduct.price, currency, true)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              (Precio final entero)
            </span>
          </div>

          {activeProduct.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5', marginTop: '10px' }}>
              {activeProduct.description}
            </p>
          )}
        </div>

        {/* Admin Profit Breakdown (Only if Admin view enabled) */}
        {isAdmin && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '18px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                COSTO COMPRA
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {formatCurrency(cost, currency, true)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                GANANCIA NETA
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00875A' }}>
                +{formatCurrency(profitMargin, currency, true)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                PROVEEDOR
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                {activeProduct.supplierType === 'proveedor' ? activeProduct.supplierName : 'Propia'}
              </span>
            </div>
          </div>
        )}

        {/* WhatsApp & Cart Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleWhatsAppOrder}
            className="md-btn"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
            }}
          >
            <MessageCircle size={22} />
            <span>Consultar / Pedir por WhatsApp</span>
          </button>

          {onAddToCart && activeProduct.stock > 0 && (
            <button
              onClick={() => {
                onAddToCart(activeProduct);
                onClose();
              }}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              <Plus size={18} />
              <span>Agregar al Carrito de Compra</span>
            </button>
          )}

          {isAdmin && (onEditProduct || onDeleteProduct) && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {onEditProduct && (
                <button
                  onClick={() => {
                    onClose();
                    onEditProduct(activeProduct);
                  }}
                  className="md-btn md-btn-secondary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <Edit3 size={16} />
                  <span>Editar</span>
                </button>
              )}

              {onDeleteProduct && (
                <button
                  onClick={() => {
                    onClose();
                    onDeleteProduct(activeProduct.id, activeProduct.name);
                  }}
                  className="md-btn"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'var(--md-sys-color-expense)',
                    color: '#FFF'
                  }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--md-sys-color-surface-variant)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Sparkles size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Productos Relacionados ({relatedProducts.length})
              </h3>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin'
            }}>
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => setActiveProduct(rel)}
                  style={{
                    minWidth: '140px',
                    maxWidth: '140px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '14px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '90px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '6px'
                  }}>
                    <img 
                      src={rel.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                      alt={rel.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rel.name}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-income)', display: 'block' }}>
                    {formatCurrency(rel.price, currency, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
