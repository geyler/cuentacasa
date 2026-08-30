'use client';

import React, { useState } from 'react';
import { StoreProduct } from '@/types';
import { formatPhotoUrl, getStoreWhatsappNumber, getCurrencySettings } from '@/lib/storage';
import { formatCurrency, calculateMultiCurrencyTotals } from '@/lib/invoice';
import { ShoppingBag, Trash2, Minus, Plus, MessageCircle, QrCode } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { CartQRModal } from '@/components/CartQRModal';

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface PublicStoreCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  totalCartCount: number;
  totalCartPrice: number;
}

export const PublicStoreCartDrawer: React.FC<PublicStoreCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  setCart,
  updateQuantity,
  removeFromCart,
  totalCartCount,
  totalCartPrice
}) => {
  useLockBodyScroll(isOpen);
  const [isCartQROpen, setIsCartQROpen] = useState(false);

  if (!isOpen) return null;

  const { exchangeRateUSD } = getCurrencySettings();
  const multiTotals = calculateMultiCurrencyTotals(
    cart.map(i => ({ quantity: i.quantity, price: i.product.price, currency: i.product.currency })),
    exchangeRateUSD
  );

  const handleSendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const targetPhone = getStoreWhatsappNumber();
    const cartQuery = cart.map(i => `${i.product.barcode}:${i.quantity}`).join(',');
    const cartLink = `${window.location.origin}/app?cart=${encodeURIComponent(cartQuery)}`;

    let text = `🛒 *PEDIDO SAMY STORE*\n----------------------------------\n`;
    cart.forEach((item, index) => {
      const itemCurr = item.product.currency || 'CUP';
      const formattedSubtotal = formatCurrency(item.product.price * item.quantity, itemCurr, true);
      text += `${index + 1}. *${item.product.name}*\n   Cant: ${item.quantity}u | Subtotal: ${formattedSubtotal}\n`;
    });
    text += `----------------------------------\n`;
    if (multiTotals.isMixed) {
      text += `💰 *TOTAL EN CUENTAS SEPARADAS:*\n• $${multiTotals.totalCUP.toLocaleString('es-ES')} CUP\n• $${multiTotals.totalUSD.toLocaleString('es-ES')} USD\n(Equivalente Total: $${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP @ Tasa ${exchangeRateUSD})\n\n`;
    } else {
      const singleTotalStr = multiTotals.hasUSD ? formatCurrency(multiTotals.totalUSD, 'USD', true) : formatCurrency(multiTotals.totalCUP, 'CUP', true);
      text += `💰 *TOTAL A PAGAR: ${singleTotalStr}*\n\n`;
    }
    text += `🔗 *Ver pedido en Samy Store:*\n${cartLink}`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/+${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 2600,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }}
        onClick={onClose}
      >
        <div
          className="bottom-sheet-modal full-height-sheet"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '550px',
            height: '100dvh',
            maxHeight: '100dvh',
            backgroundColor: 'var(--md-sys-color-surface)',
            borderRadius: '0px',
            padding: '20px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}
        >
          {/* Top Drag Handle */}
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#FCE7F3',
                color: '#EC4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  Carrito de Compra Samy Store
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {totalCartCount} {totalCartCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--md-sys-color-expense)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={16} /> Vaciar
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>Tu carrito está vacío</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Selecciona productos de la tienda para realizar tu encargo por WhatsApp o compartir al vendedor.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto' }}>
              {cart.map(item => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}
                >
                  {/* Thumbnail & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      flexShrink: 0
                    }}>
                      <img
                        src={formatPhotoUrl(item.product.photoUrl) || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#FCE7F3', color: '#EC4899', padding: '1px 5px', borderRadius: '4px' }}>
                          #{item.product.barcode}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                          {formatCurrency(item.product.price, item.product.currency || 'CUP', true)} c/u
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.name}
                      </h4>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      border: '1px solid var(--md-sys-color-outline-variant)'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: 'var(--md-sys-color-on-surface)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: 'var(--md-sys-color-on-surface)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-income)', minWidth: '60px', textAlign: 'right' }}>
                      {formatCurrency(item.product.price * item.quantity, item.product.currency || 'CUP', true)}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      style={{ border: 'none', background: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Summary & Actions */}
          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {multiTotals.isMixed ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800 }}>
                    Total en Cuentas Separadas:
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                      ${multiTotals.totalCUP.toLocaleString('es-ES')} CUP + ${multiTotals.totalUSD.toLocaleString('es-ES')} USD
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Equivalente Total: ${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP (Tasa 1 USD = ${exchangeRateUSD} CUP)
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Total a Pagar:
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                    {multiTotals.hasUSD ? formatCurrency(multiTotals.totalUSD, 'USD', true) : formatCurrency(multiTotals.totalCUP, 'CUP', true)}
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <button
                  onClick={handleSendWhatsAppOrder}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => setIsCartQROpen(true)}
                  style={{
                    backgroundColor: '#EC4899',
                    color: '#FFFFFF',
                    padding: '12px 14px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  <QrCode size={18} />
                  <span>⚡ QR Vendedor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart QR Code Modal */}
      <CartQRModal
        isOpen={isCartQROpen}
        onClose={() => setIsCartQROpen(false)}
        cart={cart}
        totalCartPrice={multiTotals.equivalentCUP}
        currency={multiTotals.hasUSD ? 'USD' : 'CUP'}
      />
    </>
  );
};
