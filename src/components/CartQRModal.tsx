'use client';

import React, { useMemo } from 'react';
import { StoreProduct } from '@/types';
import { generateCartQRPayload } from '@/lib/storage';
import { generateQRCodeDataURL } from '@/lib/qrcodeGenerator';
import { formatCurrency } from '@/lib/invoice';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { QrCode, X, ShoppingBag, Sparkles, CheckCircle2 } from 'lucide-react';

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface CartQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalCartPrice: number;
  currency?: string;
}

export const CartQRModal: React.FC<CartQRModalProps> = ({
  isOpen,
  onClose,
  cart,
  totalCartPrice,
  currency = '$'
}) => {
  useLockBodyScroll(isOpen, onClose);

  const qrDataUrl = useMemo(() => {
    if (!isOpen || cart.length === 0) return '';
    const payloadStr = generateCartQRPayload(cart);
    return generateQRCodeDataURL(payloadStr, 260);
  }, [isOpen, cart]);

  if (!isOpen || cart.length === 0) return null;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2700,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        maxWidth: '768px',
        margin: '0 auto'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          width: '100%',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Header Bar */}
        <div style={{
          padding: '12px 20px 14px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>QR para Vendedor</h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Transferencia instantánea de carrito a caja POS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scroll Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* QR Code Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              padding: '16px',
              borderRadius: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
              border: '2px solid var(--md-sys-color-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR del Carrito"
                  style={{ width: '230px', height: '230px', display: 'block' }}
                />
              ) : (
                <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Generando QR...
                </div>
              )}
            </div>

            {/* Cart Summary Banner */}
            <div style={{
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              border: '1px solid var(--md-sys-color-outline)',
              borderRadius: '16px',
              padding: '12px 16px',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>PEDIDO SELECCIONADO</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  {totalItemsCount} {totalItemsCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                {formatCurrency(totalCartPrice, currency, true)}
              </div>
            </div>

            <div style={{
              fontSize: '0.78rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              padding: '10px 14px',
              borderRadius: '12px',
              width: '100%',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={18} color="var(--md-sys-color-primary)" style={{ flexShrink: 0 }} />
              <span>Muestra este código al vendedor para que escanee tu carrito y procese la venta al instante.</span>
            </div>

            <button
              onClick={onClose}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: 800, fontSize: '0.9rem', marginTop: 'auto' }}
            >
              <span>Listo / Cerrar</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
