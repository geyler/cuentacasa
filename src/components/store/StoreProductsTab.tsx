'use client';

import React from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency, getProductDisplayPrice } from '@/lib/invoice';
import { Search, Store, Eye, EyeOff, Edit3, Trash2 } from 'lucide-react';
import { getCurrencySettings } from '@/lib/storage';

interface StoreProductsTabProps {
  products: StoreProduct[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectProduct: (product: StoreProduct) => void;
  onTogglePublish: (product: StoreProduct) => void;
  onEditProduct: (product: StoreProduct) => void;
  onDeleteProduct: (id: string, name: string) => void;
  currency?: string;
  isVendor?: boolean;
}

export const StoreProductsTab: React.FC<StoreProductsTabProps> = ({
  products,
  searchTerm,
  onSearchChange,
  onSelectProduct,
  onTogglePublish,
  onEditProduct,
  onDeleteProduct,
  currency = '$',
  isVendor = false
}) => {
  const { currencyMode, exchangeRateUSD, usdIndexedPricing } = getCurrencySettings();

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(term))
    );
  });

  return (
    <>
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
              onChange={e => onSearchChange(e.target.value)}
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
            target="_self"
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
            <Store size={14} />
          </a>

        </div>
      </div>

      {/* Products List View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredProducts.map(prod => {
          return (
            <div
              key={prod.id}
              className="md-card"
              onClick={() => onSelectProduct(prod)}
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                opacity: prod.published ? 1 : 0.65,
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              {/* Left: Thumbnail & Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                {/* 44x44 Thumbnail */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: 'var(--md-sys-color-surface-container-high)'
                }}>
                  <img 
                    src={prod.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                    alt={prod.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                {/* Info Text */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      padding: '1px 6px',
                      borderRadius: '6px'
                    }}>
                      #{prod.barcode}
                    </span>
                    {prod.isExternal ? (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#059669',
                        backgroundColor: '#D1FAE5',
                        padding: '1px 7px',
                        borderRadius: '5px',
                        border: '1px solid #A7F3D0'
                      }}>
                        {prod.externalUrl?.includes('wa.me') || prod.externalUrl?.includes('whatsapp') ? '💬 WhatsApp Directo' : '🌐 Enlace Externo'}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: prod.stock > 5 ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-expense)',
                        backgroundColor: prod.stock > 5 ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-expense-container)',
                        padding: '1px 6px',
                        borderRadius: '5px'
                      }}>
                        Stock: {prod.stock}{prod.unit && prod.unit !== 'u' ? ` ${prod.unit}` : 'u'}
                      </span>
                    )}
                    {prod.supplierType === 'proveedor' && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        padding: '1px 5px',
                        borderRadius: '5px'
                      }}>
                        {prod.supplierName || 'Proveedor'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 800, 
                    color: 'var(--md-sys-color-on-surface)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {prod.name}
                  </h3>
                </div>
              </div>

              {/* Right: Price & Quick Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    const disp = getProductDisplayPrice(prod.price, prod.currency, currencyMode, exchangeRateUSD, prod.priceUSD, usdIndexedPricing);
                    return (
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                        {formatCurrency(disp.amount, disp.currency, true)}
                        {prod.unit && prod.unit !== 'u' && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '3px' }}>
                            / {prod.unit}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {!isVendor && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                      Costo: ${prod.costPrice || 0}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  {!isVendor && (
                    <button
                      onClick={() => onTogglePublish(prod)}
                      title={prod.published ? 'Publicado en Tienda' : 'Borrador (Oculto)'}
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        backgroundColor: prod.published ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
                        color: prod.published ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {prod.published ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  )}

                  {!isVendor && (
                    <button
                      onClick={() => onEditProduct(prod)}
                      title="Editar producto"
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                  )}

                  {!isVendor && (
                    <button
                      onClick={() => onDeleteProduct(prod.id, prod.name)}
                      title="Eliminar producto"
                      style={{
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'var(--md-sys-color-expense-container)',
                        color: 'var(--md-sys-color-expense)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
};
