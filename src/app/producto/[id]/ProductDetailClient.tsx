'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, INITIAL_SEED_PRODUCTS, formatPhotoUrl, DEFAULT_PRODUCT_IMAGE, getCurrencySettings, getStoreWhatsappNumber } from '@/lib/storage';
import { formatCurrency, getProductDisplayPrice, getCurrencyBadgeStyle } from '@/lib/invoice';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Store, 
  ShoppingBag,
  Star,
  Plus,
  Minus,
  CheckCircle,
  Share2,
  Tag,
  MapPin
} from 'lucide-react';
import { getProductSeoMeta } from '@/lib/seoHelper';

interface ProductDetailClientProps {
  id: string;
  initialProduct?: StoreProduct;
}

export function ProductDetailClient({ id, initialProduct }: ProductDetailClientProps) {
  const [product, setProduct] = useState<StoreProduct | undefined>(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState<StoreProduct[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [returnPath, setReturnPath] = useState<string>('/');
  const [returnLabel, setReturnLabel] = useState<string>('Volver a la Tienda');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const clean = decodeURIComponent(id);
    const allLocal = getStoreProducts();
    const found = allLocal.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean)
      || INITIAL_SEED_PRODUCTS.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean);

    if (found) {
      setProduct(found);
      const related = allLocal.filter(p => p.published && p.id !== found.id && p.category === found.category).slice(0, 4);
      setRelatedProducts(related.length > 0 ? related : allLocal.filter(p => p.published && p.id !== found.id).slice(0, 4));
    }

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const fromParam = searchParams.get('from');
      const referrer = document.referrer || '';

      if (fromParam === 'admin' || referrer.includes('/app')) {
        setReturnPath('/app');
        setReturnLabel('Volver a Administración');
      }
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
        <header style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '14px 16px' }}>
          <div className="store-container">
            <Link href={returnPath} style={{ color: '#EC4899', fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={18} /> {returnLabel}
            </Link>
          </div>
        </header>

        <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px', textAlign: 'center', width: 'calc(100% - 32px)' }} className="store-product-card">
          <ShoppingBag size={48} style={{ color: '#94A3B8', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>Producto No Disponible</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '8px', marginBottom: '20px' }}>
            El artículo buscado no se encuentra en el catálogo actual de la tienda.
          </p>
          <Link href="/" className="md-btn md-btn-primary" style={{ padding: '12px 24px', borderRadius: '9999px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} /> Explorar Catálogo de Samy Store
          </Link>
        </div>
      </div>
    );
  }

  const currencySettings = typeof window !== 'undefined' 
    ? getCurrencySettings() 
    : { currencyMode: 'CUP' as const, exchangeRateUSD: 675, usdIndexedPricing: false };
    
  const disp = getProductDisplayPrice(
    product.price || 0,
    product.currency || 'CUP',
    currencySettings.currencyMode,
    currencySettings.exchangeRateUSD,
    product.priceUSD,
    currencySettings.usdIndexedPricing
  );
  const badgeStyle = getCurrencyBadgeStyle(disp.currency);

  const cartQuery = `${product.barcode || '0000'}:${quantity}`;
  const checkoutLink = typeof window !== 'undefined' ? `${window.location.origin}/app?cart=${encodeURIComponent(cartQuery)}` : `https://cuentacasa.app/app?cart=${encodeURIComponent(cartQuery)}`;
  const productSeoLink = typeof window !== 'undefined' ? window.location.href : `https://cuentacasa.app/producto/${product.id}`;

  const targetPhone = getStoreWhatsappNumber();
  const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';

  const subtotalFormatted = formatCurrency(disp.amount * quantity, disp.currency, true);

  let whatsappMessage = `🛒 *PEDIDO SAMY STORE - LAS TUNAS*\n----------------------------------\n`;
  whatsappMessage += `Artículo: *${product.name}* (Cod: #${product.barcode || '0000'})\n`;
  whatsappMessage += `Cantidad: *${quantity}u*\n`;
  whatsappMessage += `Precio unitario: ${formatCurrency(disp.amount, disp.currency, true)}\n`;
  whatsappMessage += `----------------------------------\n`;
  whatsappMessage += `💰 *TOTAL: ${subtotalFormatted}*\n\n`;
  whatsappMessage += `🔗 *Ver Producto:* ${productSeoLink}`;

  const whatsappUrl = cleanPhone 
    ? `https://wa.me/+${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const formattedPhoto = formatPhotoUrl(product.photoUrl);
  const seoMeta = getProductSeoMeta(product.barcode, product.price);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Bar (Full Width & Sticky) */}
      <header style={{
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        borderBottom: '1px solid #F1F5F9',
        padding: '12px 0',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div className="store-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link
            href={returnPath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#BE185D',
              fontWeight: 800,
              fontSize: '0.92rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={20} />
            <span>{returnLabel}</span>
          </Link>

          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '36px', width: 'auto' }} />
            <span className="font-logo-script" style={{ fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>
              Samy Store
            </span>
          </Link>

          <button
            onClick={handleShare}
            title="Copiar enlace del producto"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FCE7F3',
              color: '#BE185D',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {copiedLink ? <CheckCircle size={15} color="#059669" /> : <Share2 size={15} />}
            <span className="desktop-only">{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
          </button>
        </div>
      </header>

      {/* Main Product Container (Full Responsive 2-Column on Desktop) */}
      <main className="store-container" style={{ padding: '32px 16px 80px 16px', flex: 1 }}>
        
        {/* Breadcrumb Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
          <Link href="/" style={{ color: '#BE185D', textDecoration: 'none', fontWeight: 700 }}>Inicio</Link>
          <span>/</span>
          <span style={{ textTransform: 'capitalize' }}>{product.category || 'Catálogo'}</span>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 800 }}>{product.name}</span>
        </nav>

        {/* 2-Column Product Detail Layout on Desktop, 1-Column on Mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'start',
          backgroundColor: '#FFFFFF',
          padding: '32px',
          borderRadius: '26px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
        }}>
          
          {/* Left Column: Product Photography Showcase */}
          <div>
            <div style={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: '22px',
              overflow: 'hidden',
              backgroundColor: '#F8FAFC',
              position: 'relative',
              border: '1px solid #F1F5F9',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
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

              {/* Stock Badge */}
              <span style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: (product.stock || 0) > 0 ? '#059669' : '#E11D48',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 900,
                padding: '4px 14px',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {(product.stock || 0) > 0 ? `Stock Disponible (${product.stock}u)` : 'Agotado'}
              </span>

              {/* Rating Star Badge */}
              <span style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(6px)',
                color: '#FBBF24',
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Star size={13} fill="#FBBF24" /> {seoMeta.ratingValue} • {seoMeta.reviewCount} valoraciones
              </span>
            </div>
          </div>

          {/* Right Column: Information, Pricing, Quantity & Purchase Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Category Pill & Code */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                backgroundColor: '#FCE7F3',
                color: '#831843',
                padding: '5px 14px',
                borderRadius: '9999px',
                textTransform: 'capitalize'
              }}>
                {product.category || 'General'}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 800, fontFamily: 'monospace' }}>
                Código #{product.barcode || '0000'}
              </span>
            </div>

            {/* Product Title */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)', fontWeight: 900, color: '#0F172A', lineHeight: '1.2', margin: 0 }}>
              {product.name}
            </h1>

            {/* Price Showcase with CUP / USD support */}
            <div style={{
              padding: '16px 20px',
              borderRadius: '18px',
              backgroundColor: '#FDF2F8',
              border: '1px solid #FBCFE8',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#9D174D', fontWeight: 800, display: 'block', textTransform: 'uppercase', marginBottom: '2px' }}>
                  Precio Unitario
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669', lineHeight: '1' }}>
                    {formatCurrency(disp.amount || 0, disp.currency, true)}
                  </span>
                  {product.unit && product.unit !== 'u' && (
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B' }}>
                      / {product.unit}
                    </span>
                  )}
                </div>
              </div>

              <span style={{
                fontSize: '0.85rem',
                fontWeight: 900,
                padding: '4px 12px',
                borderRadius: '8px',
                backgroundColor: badgeStyle.backgroundColor,
                color: badgeStyle.color,
                border: badgeStyle.border
              }}>
                Moneda: {disp.currency === 'USD' ? 'USD' : 'CUP'}
              </span>
            </div>

            {/* Description Card */}
            {product.description && (
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid #F1F5F9'
              }}>
                <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 800, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Descripción del Producto
                </span>
                <p style={{ fontSize: '0.94rem', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector & Subtotal Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '16px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                  Cantidad:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontWeight: 900
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, minWidth: '24px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontWeight: 900
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Subtotal</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                  {subtotalFormatted}
                </div>
              </div>
            </div>

            {/* Direct WhatsApp CTA Button (Prominent) */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                width: '100%',
                padding: '16px 24px',
                fontSize: '1.08rem',
                fontWeight: 800,
                textDecoration: 'none',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 24px rgba(37, 211, 102, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageCircle size={24} />
              <span>Hacer Pedido por WhatsApp</span>
            </a>

            {/* Trust Guarantees Bar (Las Tunas, Envíos, Garantía) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              borderTop: '1px solid #F1F5F9',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={18} color="#059669" />
                </div>
                <div>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Envíos en Las Tunas
                  </h5>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Entregas a domicilio rápidas</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} color="#BE185D" />
                </div>
                <div>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Garantía Total
                  </h5>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Calidad comprobada en tienda</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Related Products Section on Desktop */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: '54px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Productos Relacionados
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '2px' }}>
                  Artículos que también te podrían interesar en <strong>{product.category || 'Samy Store'}</strong>
                </p>
              </div>
              <Link href="/" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#BE185D', textDecoration: 'none' }}>
                Ver Catálogo Completo →
              </Link>
            </div>

            <div className="store-product-grid">
              {relatedProducts.map(rel => {
                const relDisp = getProductDisplayPrice(rel.price, rel.currency, currencySettings.currencyMode, currencySettings.exchangeRateUSD, rel.priceUSD, currencySettings.usdIndexedPricing);
                const relImg = formatPhotoUrl(rel.photoUrl);

                return (
                  <Link
                    key={`rel-${rel.id}`}
                    href={`/producto/${rel.id}`}
                    className="store-product-card"
                    style={{ padding: '14px', textDecoration: 'none', position: 'relative' }}
                  >
                    <div>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        backgroundColor: '#F8FAFC'
                      }}>
                        <img 
                          className="store-product-img"
                          src={relImg || DEFAULT_PRODUCT_IMAGE}
                          alt={rel.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <h4 style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: '#0F172A',
                        margin: '0 0 6px 0',
                        lineHeight: '1.25',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {rel.name}
                      </h4>
                    </div>

                    <div style={{
                      paddingTop: '8px',
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                        {formatCurrency(relDisp.amount, relDisp.currency, true)}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#BE185D', backgroundColor: '#FCE7F3', padding: '2px 8px', borderRadius: '6px' }}>
                        {rel.category}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#FFF0F5',
        color: '#831843',
        borderTop: '1px solid #FBCFE8',
        padding: '28px 16px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div className="store-container">
          <p style={{ fontSize: '0.84rem', color: '#9D174D', margin: 0, fontWeight: 600 }}>
            © {new Date().getFullYear()} Samy Store Las Tunas. Tienda Oficial. Desarrollado con tecnología de Cubasoft.
          </p>
        </div>
      </footer>

    </div>
  );
}
