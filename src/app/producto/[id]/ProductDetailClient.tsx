'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, INITIAL_SEED_PRODUCTS, formatPhotoUrl, DEFAULT_PRODUCT_IMAGE, getCurrencySettings } from '@/lib/storage';
import { formatCurrency, getProductDisplayPrice, getCurrencyBadgeStyle } from '@/lib/invoice';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Store, 
  ShoppingBag
} from 'lucide-react';

interface ProductDetailClientProps {
  id: string;
  initialProduct?: StoreProduct;
}

export function ProductDetailClient({ id, initialProduct }: ProductDetailClientProps) {
  const [product, setProduct] = useState<StoreProduct | undefined>(initialProduct);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const clean = decodeURIComponent(id);
    const allLocal = getStoreProducts();
    const found = allLocal.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean)
      || INITIAL_SEED_PRODUCTS.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean);

    if (found) {
      setProduct(found);
    }
  }, [id]);

  if (!mounted && !initialProduct) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--md-sys-color-primary)' }}>
          <ShoppingBag size={40} className="animate-bounce" />
          <p style={{ marginTop: '12px', fontWeight: 700, fontSize: '0.9rem' }}>Cargando detalles del producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '12px 16px' }}>
          <Link href="/" style={{ color: '#EC4899', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={18} /> Volver a Samy Store
          </Link>
        </header>

        <div style={{ maxWidth: '480px', margin: '60px auto', padding: '24px', textAlign: 'center', width: 'calc(100% - 32px)' }} className="md-card">
          <ShoppingBag size={48} style={{ color: '#94A3B8', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>Producto No Disponible</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px', marginBottom: '20px' }}>
            El artículo buscado no se encuentra en el catálogo actual de la tienda.
          </p>
          <Link href="/" className="md-btn md-btn-primary" style={{ padding: '12px 20px', borderRadius: '9999px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} /> Explora la Tienda Samy Store
          </Link>
        </div>
      </div>
    );
  }

  const currencySettings = typeof window !== 'undefined' 
    ? getCurrencySettings() 
    : { currencyMode: 'BOTH' as const, exchangeRateUSD: 675, usdIndexedPricing: false };
    
  const disp = getProductDisplayPrice(
    product.price || 0,
    product.currency || 'CUP',
    currencySettings.currencyMode,
    currencySettings.exchangeRateUSD,
    product.priceUSD,
    currencySettings.usdIndexedPricing
  );
  const badgeStyle = getCurrencyBadgeStyle(disp.currency);

  const cartQuery = `${product.barcode || '0000'}:1`;
  const checkoutLink = `https://cuentacasa.app/app?cart=${encodeURIComponent(cartQuery)}`;
  const productSeoLink = `https://cuentacasa.app/producto/${product.id}`;

  let whatsappMessage = `🛒 *SOLICITUD DE COMPRA - SAMY STORE*\n📍 *Cuba*\n----------------------------------\n`;
  whatsappMessage += `1. *${product.name}* (Cod: #${product.barcode || '0000'})\n`;
  whatsappMessage += `   Cant: 1u | Precio: ${formatCurrency(disp.amount || 0, disp.currency, true)}\n`;
  whatsappMessage += `----------------------------------\n💰 *TOTAL A PAGAR: ${formatCurrency(disp.amount || 0, disp.currency, true)}*\n\n`;
  whatsappMessage += `🔗 *Enlace Directo al Artículo:*\n${productSeoLink}\n\n`;
  whatsappMessage += `🛒 *Abrir Pedido / Cobro Inmediato:*\n${checkoutLink}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  const formattedPhoto = formatPhotoUrl(product.photoUrl);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Bar */}
      <header style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}>
        <div style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#EC4899',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
            <span>Volver a Samy Store</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={18} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#FFFFFF' }}>
              Samy Store
            </span>
          </div>
        </div>
      </header>

      {/* Main Product SEO Page Layout */}
      <main style={{ maxWidth: '768px', width: '100%', margin: '0 auto', padding: '20px 16px 140px 16px', flex: 1 }}>
        
        <div className="md-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
          
          {/* Category Tag & Barcode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              backgroundColor: '#FCE7F3',
              color: '#831843',
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'capitalize'
            }}>
              {product.category || 'General'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, fontFamily: 'monospace' }}>
              Código #{product.barcode || '0000'}
            </span>
          </div>

          {/* Product Image Showcase */}
          <div style={{
            width: '100%',
            height: '320px',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            position: 'relative'
          }}>
            <img 
              src={formattedPhoto} 
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />

            <span style={{
              position: 'absolute',
              bottom: '14px',
              right: '14px',
              backgroundColor: (product.stock || 0) > 0 ? '#00875A' : 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '9999px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {(product.stock || 0) > 0 ? `Stock Disponible (${product.stock}u)` : 'Agotado'}
            </span>
          </div>

          {/* Title & Price */}
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.25', marginBottom: '8px' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(disp.amount || 0, disp.currency, true)}
                {product.unit && product.unit !== 'u' && (
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '4px' }}>
                    / {product.unit}
                  </span>
                )}
              </span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: badgeStyle.backgroundColor,
                color: badgeStyle.color,
                border: badgeStyle.border
              }}>
                {disp.currency === 'USD' ? 'USD' : 'CUP'}
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              padding: '16px',
              borderRadius: '16px'
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                DESCRIPCIÓN DETALLADA DEL PRODUCTO
              </span>
              <p style={{ fontSize: '0.95rem', color: 'var(--md-sys-color-on-surface)', lineHeight: '1.5', margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Direct WhatsApp CTA Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 800,
              textDecoration: 'none',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
            }}
          >
            <MessageCircle size={24} />
            <span>Hacer Pedido Inmediato por WhatsApp</span>
          </a>

          {/* Trust Guarantees Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            borderTop: '1px solid var(--md-sys-color-surface-variant)',
            paddingTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#00875A" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Calidad Garantizada
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#EC4899" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Envío Rápido a Domicilio
              </span>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
