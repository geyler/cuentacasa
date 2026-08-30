'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSaleItem } from '@/types';
import { getStoreProducts, getCurrencySettings } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { 
  Search, 
  X, 
  Plus, 
  Minus, 
  Check, 
  Package, 
  ShoppingCart,
  Layers
} from 'lucide-react';

interface QuickProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProductsToTicket: (items: StoreSaleItem[]) => void;
  currency?: string;
}

export const QuickProductSearchModal: React.FC<QuickProductSearchModalProps> = ({
  isOpen,
  onClose,
  onAddProductsToTicket,
  currency = '$'
}) => {
  useLockBodyScroll(isOpen);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMap, setSelectedMap] = useState<{ [productId: string]: number }>({});
  const [productsList, setProductsList] = useState<StoreProduct[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProductsList(getStoreProducts());
      setSelectedMap({});
      setSearchQuery('');
      // Auto-focus input immediately so keyboard opens smoothly without extra taps
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { currencyMode } = getCurrencySettings();

  const filteredProducts = productsList.filter(prod => {
    const pCurr = prod.currency || 'CUP';
    if (currencyMode === 'CUP' && pCurr !== 'CUP') return false;
    if (currencyMode === 'USD' && pCurr !== 'USD') return false;

    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    return (
      (prod.name || '').toLowerCase().includes(term) ||
      (prod.category || '').toLowerCase().includes(term) ||
      (prod.barcode || '').toLowerCase().includes(term)
    );
  });

  const handleUpdateQuantity = (prod: StoreProduct, delta: number) => {
    const current = selectedMap[prod.id] || 0;
    const maxStock = prod.stock || 0;
    const nextQty = Math.max(0, current + delta);

    if (nextQty > maxStock) {
      return; // Do not allow exceeding available stock
    }

    setSelectedMap(prev => {
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[prod.id];
      } else {
        copy[prod.id] = nextQty;
      }
      return copy;
    });
  };

  const totalSelectedItemsCount = Object.keys(selectedMap).length;
  const totalSelectedUnits = Object.values(selectedMap).reduce((sum, q) => sum + q, 0);

  const handleConfirmAdd = () => {
    const itemsToAdd: StoreSaleItem[] = [];

    Object.entries(selectedMap).forEach(([prodId, qty]) => {
      const prod = productsList.find(p => p.id === prodId);
      if (prod && qty > 0) {
        itemsToAdd.push({
          productId: prod.id,
          barcode: prod.barcode,
          name: prod.name,
          quantity: qty,
          costPrice: prod.costPrice || Math.round(prod.price * 0.7),
          unitPrice: prod.price,
          subtotal: prod.price * qty,
          currency: prod.currency || 'CUP',
          supplierType: prod.supplierType || 'propia',
          supplierName: prod.supplierName
        });
      }
    });

    if (itemsToAdd.length > 0) {
      onAddProductsToTicket(itemsToAdd);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
      className="no-print"
      onClick={onClose}
    >
      <div
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '560px',
          borderRadius: '28px 28px 0 0',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden'
        }}
      >
        {/* Drag Handle */}
        <div style={{ padding: '12px 0 4px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Modal Header */}
        <div style={{ padding: '0 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Agregar Producto por Nombre</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Búsqueda rápida en inventario activo
              </span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Auto-Focused Search Bar */}
        <div style={{ padding: '0 20px 14px 20px', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--md-sys-color-primary)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escribe el nombre o categoría del producto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-spotlight"
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '14px',
                border: '2px solid var(--md-sys-color-primary)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                fontWeight: 700
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Products List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', opacity: 0.7 }}>
              <Package size={36} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                No se encontraron productos que coincidan con &quot;{searchQuery}&quot;.
              </p>
            </div>
          ) : (
            filteredProducts.map(prod => {
              const currentQty = selectedMap[prod.id] || 0;
              const isSelected = currentQty > 0;

              return (
                <div
                  key={prod.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    border: isSelected ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Thumbnail & Product Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {prod.photoUrl ? (
                        <img src={prod.photoUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={22} color="var(--md-sys-color-primary)" />
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}>
                          #{prod.barcode}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Stock: {prod.stock || 0}u
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Quantity Stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                      {formatCurrency(prod.price, prod.currency || currency, true)}
                    </strong>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {currentQty > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(prod, -1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                      )}

                      {currentQty > 0 && (
                        <span style={{ fontWeight: 900, fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>
                          {currentQty}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(prod, 1)}
                        disabled={(prod.stock || 0) <= currentQty}
                        style={{
                          padding: currentQty === 0 ? '6px 12px' : '0',
                          width: currentQty === 0 ? 'auto' : '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: (prod.stock || 0) <= currentQty ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-primary)',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: (prod.stock || 0) <= currentQty ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={14} />
                        {currentQty === 0 && <span>Agregar</span>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Confirm Action Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={totalSelectedUnits === 0}
            className="md-btn md-btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              fontWeight: 900,
              fontSize: '0.95rem',
              opacity: totalSelectedUnits === 0 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ShoppingCart size={18} />
            <span>
              {totalSelectedUnits === 0
                ? 'Selecciona al menos un producto'
                : `Confirmar y Sumar (${totalSelectedUnits} ${totalSelectedUnits === 1 ? 'unidad' : 'unidades'})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
