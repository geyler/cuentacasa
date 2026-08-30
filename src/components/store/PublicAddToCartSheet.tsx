'use client';

import React from 'react';
import { StoreProduct } from '@/types';
import { formatPhotoUrl } from '@/lib/storage';
import { formatCurrency, getCurrencyBadgeStyle } from '@/lib/invoice';
import { ShoppingBag, X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface PublicAddToCartSheetProps {
  productToAddToCart: StoreProduct | null;
  addQty: number;
  setAddQty: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  onConfirmAddToCart: () => void;
  addedSuccessModal: {
    show: boolean;
    productName: string;
    quantity: number;
    totalPrice: number;
  } | null;
  onCloseSuccessModal: () => void;
  onOpenCartFromSuccess: () => void;
  totalCartCount: number;
  totalCartPrice: number;
}

export const PublicAddToCartSheet: React.FC<PublicAddToCartSheetProps> = ({
  productToAddToCart,
  addQty,
  setAddQty,
  onClose,
  onConfirmAddToCart,
  addedSuccessModal,
  onCloseSuccessModal,
  onOpenCartFromSuccess,
  totalCartCount,
  totalCartPrice
}) => {
  useLockBodyScroll(!!productToAddToCart || !!addedSuccessModal?.show);

  return (
    <>
      {/* STEPPER QUANTITY SELECTOR MODAL */}
      {productToAddToCart && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={onClose}
        >
          <div
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderRadius: '28px 28px 0 0',
              padding: '20px 24px 28px 24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}
          >
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                Agregar al Carrito de Compra
              </h3>
              <button
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                flexShrink: 0
              }}>
                <img
                  src={formatPhotoUrl(productToAddToCart.photoUrl) || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`}
                  alt={productToAddToCart.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EC4899', backgroundColor: '#FCE7F3', padding: '2px 6px', borderRadius: '4px' }}>
                  #{productToAddToCart.barcode}
                </span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {productToAddToCart.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(productToAddToCart.price, productToAddToCart.currency || 'CUP', true)} c/u
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: (productToAddToCart.currency === 'USD') ? '#ECFEFF' : '#F1F5F9',
                    color: (productToAddToCart.currency === 'USD') ? '#0F766E' : '#475569',
                    border: (productToAddToCart.currency === 'USD') ? '1px solid #99F6E4' : '1px solid #CBD5E1'
                  }}>
                    {productToAddToCart.currency === 'USD' ? 'USD' : 'CUP'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)'
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                Selecciona la Cantidad
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                  onClick={() => setAddQty(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Minus size={20} />
                </button>

                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', minWidth: '40px', textAlign: 'center' }}>
                  {addQty}
                </span>

                <button
                  onClick={() => setAddQty(prev => prev + 1)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#EC4899',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>Subtotal:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(productToAddToCart.price * addQty, productToAddToCart.currency || 'CUP', true)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: (productToAddToCart.currency === 'USD') ? '#ECFEFF' : '#FCE7F3',
                    color: (productToAddToCart.currency === 'USD') ? '#0F766E' : '#DB2777',
                    border: (productToAddToCart.currency === 'USD') ? '1px solid #99F6E4' : '1px solid #FBCFE8'
                  }}>
                    {productToAddToCart.currency === 'USD' ? 'USD' : 'CUP'}
                  </span>
                </div>
              </div>

              <button
                onClick={onConfirmAddToCart}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#EC4899',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)'
                }}
              >
                <ShoppingBag size={20} />
                <span>Añadir al Carrito de Compra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDED SUCCESS CONFIRMATION MODAL */}
      {addedSuccessModal?.show && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 2700,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={onCloseSuccessModal}
        >
          <div
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderRadius: '28px 28px 0 0',
              padding: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '14px',
              position: 'relative'
            }}
          >
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', marginBottom: '4px' }} />

            <button
              onClick={onCloseSuccessModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'none',
                color: 'var(--md-sys-color-on-surface-variant)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%'
              }}
            >
              <X size={22} />
            </button>

            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#E6F4EA',
              color: '#00875A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '6px',
              boxShadow: '0 4px 14px rgba(0, 135, 90, 0.2)'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                ¡Agregado al Carrito Exitosamente!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', fontWeight: 600 }}>
                Se añadieron {addedSuccessModal.quantity} unidad(es) de <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>"{addedSuccessModal.productName}"</strong> a tu pedido.
              </p>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={onCloseSuccessModal}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#EC4899',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)'
                }}
              >
                <span>Seguir Navegando</span>
              </button>

              <button
                onClick={onOpenCartFromSuccess}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <ShoppingBag size={18} />
                <span>Ver Carrito ({totalCartCount} artículos • ${totalCartPrice} CUP)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
