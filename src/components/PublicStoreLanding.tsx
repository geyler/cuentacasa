'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, getStoreWhatsappNumber } from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency } from '@/lib/invoice';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { 
  ShoppingBag, 
  Search, 
  Tag, 
  Plus, 
  Minus, 
  Trash2, 
  Lock, 
  MessageCircle, 
  Sparkles, 
  Store,
  Truck,
  ExternalLink,
  Globe,
  Star,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Flame,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CubasoftInfoModal } from '@/components/CubasoftInfoModal';
import { STORE_SEO_CONFIG, getCategorySeoDescription, getProductSeoMeta } from '@/lib/seoHelper';

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export const PublicStoreLanding: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<StoreProduct | null>(null);
  const [isCubasoftModalOpen, setIsCubasoftModalOpen] = useState(false);

  // Facebook-Style Bottom Sheet state for quantity selection & confirmation
  const [productToAddToCart, setProductToAddToCart] = useState<StoreProduct | null>(null);
  const [addQty, setAddQty] = useState<number>(1);
  const [addedSuccessModal, setAddedSuccessModal] = useState<{
    show: boolean;
    productName: string;
    quantity: number;
    totalPrice: number;
  } | null>(null);

  useEffect(() => {
    // 1. Initial immediate load from local storage
    const all = getStoreProducts();
    const publishedList = all.filter(p => p.published);
    setProducts(publishedList);

    // 2. Background sync with Cloud to retrieve products created/updated on other devices
    syncDatabaseWithCloud(true).then(res => {
      if (res.success) {
        const syncedAll = getStoreProducts();
        setProducts(syncedAll.filter(p => p.published));
      }
    }).catch(err => {
      console.warn('Silent cloud sync warning on landing:', err);
    });

    // Check if user is logged into accounting system
    if (typeof window !== 'undefined') {
      const localAuth = localStorage.getItem('cuentacasa_auth');
      const sessionAuth = sessionStorage.getItem('cuentacasa_auth');
      setIsUserLoggedIn(localAuth === 'true' || sessionAuth === 'true');

      // Check for shared cart URL parameter ?cart=0001:2,0002:1
      const params = new URLSearchParams(window.location.search);
      const cartParam = params.get('cart');
      if (cartParam) {
        const loadedCart: CartItem[] = [];
        cartParam.split(',').forEach(entry => {
          const parts = entry.split(':');
          if (parts.length === 2) {
            const barcode = parts[0].padStart(4, '0');
            const qty = parseInt(parts[1], 10) || 1;
            const prod = publishedList.find(p => p.barcode === barcode || p.barcode === parts[0]);
            if (prod && !prod.isExternal) {
              loadedCart.push({ product: prod, quantity: qty });
            }
          }
        });
        if (loadedCart.length > 0) {
          setCart(loadedCart);
          setIsCartOpen(true);
        }
      }
    }
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Featured Products (Top 4 by Sales or Random/Recency if no sales exist)
  const getFeaturedProducts = (): StoreProduct[] => {
    const sortedBySales = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    const withSales = sortedBySales.filter(p => (p.salesCount || 0) > 0);
    if (withSales.length >= 4) {
      return withSales.slice(0, 4);
    }
    return [...products].slice(0, 4);
  };

  const featuredProducts = getFeaturedProducts();

  const handleOpenAddToCartSheet = (product: StoreProduct) => {
    if (product.isExternal) return;
    setProductToAddToCart(product);
    setAddQty(1);
  };

  const handleConfirmAddToCart = () => {
    if (!productToAddToCart) return;

    const qty = addQty;
    const prod = productToAddToCart;
    const subtotal = prod.price * qty;

    setCart(prev => {
      const existing = prev.find(item => item.product.id === prod.id);
      if (existing) {
        return prev.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { product: prod, quantity: qty }];
    });

    setProductToAddToCart(null);

    // Trigger Facebook-Style confirmation bottom sheet
    setAddedSuccessModal({
      show: true,
      productName: prod.name,
      quantity: qty,
      totalPrice: subtotal
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const targetPhone = getStoreWhatsappNumber();
    const cartQuery = cart.map(i => `${i.product.barcode}:${i.quantity}`).join(',');
    const cartLink = `${window.location.origin}/app?cart=${encodeURIComponent(cartQuery)}`;

    let text = `🛒 *NUEVO PEDIDO - SAMY STORE*\n📍 *Cuba*\n----------------------------------\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.name}* (Cod: #${item.product.barcode})\n   Cant: ${item.quantity}u | Subtotal: $${item.product.price * item.quantity} CUP\n`;
    });
    text += `----------------------------------\n💰 *TOTAL A PAGAR: $${totalCartPrice} CUP*\n\n`;
    text += `🛒 *Ver / Cargar este Carrito:*\n${cartLink}\n\n`;
    text += `_(Si eres cliente este enlace llena tu carrito. Si eres Administrador abre la pantalla de cobro en POS)_`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/+${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Store Top Header - Mercado Libre Style */}
      <header style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setSelectedCategory('todas'); setSearchTerm(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)'
            }}>
              <Store size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
                Samy Store
              </h1>
              <span style={{ fontSize: '0.68rem', color: '#EC4899', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Catálogo Digital Cuba
              </span>
            </div>
          </div>

          {/* Mercado Libre Header Search Bar (Hidden on ultra small screens, visible on header) */}
          <div style={{ flex: 1, maxWidth: '400px', display: 'flex', position: 'relative' }} className="hidden-mobile">
            <Search 
              size={17} 
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748B'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar en Samy Store..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px 8px 38px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
          </div>

          {/* Right Action Icons: Cart & Dashboard Lock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              title="Ver Carrito de Compras"
              style={{
                position: 'relative',
                height: '40px',
                padding: '0 14px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                background: '#EC4899',
                color: '#FFFFFF',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.35)'
              }}
            >
              <ShoppingBag size={19} />
              {totalCartCount > 0 ? (
                <span style={{ fontSize: '0.85rem' }}>
                  {totalCartCount} ({formatCurrency(totalCartPrice, '$', true)})
                </span>
              ) : (
                <span style={{ fontSize: '0.82rem' }} className="hidden-mobile">Carrito</span>
              )}

              {totalCartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#FFF100',
                  color: '#0F172A',
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Dashboard Access Link (Only if Logged In) */}
            {isUserLoggedIn && (
              <a
                href="/login"
                title="Ir al Dashboard Contable"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
              >
                <Lock size={18} />
              </a>
            )}

          </div>
        </div>
      </header>

      {/* Hero Banner Section - Sandra Shein / Temu Style */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #831843 100%)',
        color: '#FFFFFF',
        padding: '28px 16px 36px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.2)'
      }}>
        {/* Glow circles background */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '15%',
          width: '180px',
          height: '180px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          right: '10%',
          width: '220px',
          height: '220px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(255, 241, 0, 0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1024px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Store Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFF100',
            padding: '5px 16px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '14px'
          }}>
            <Sparkles size={14} color="#FFF100" />
            <span>BIENVENIDO A SAMY STORE</span>
          </div>

          <h2 style={{ 
            fontSize: '2.1rem', 
            fontWeight: 900, 
            lineHeight: '1.2', 
            marginBottom: '10px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FCE7F3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Tu Tienda Online Preferida
          </h2>

          <p style={{ 
            fontSize: '0.92rem', 
            color: 'rgba(255, 255, 255, 0.9)', 
            lineHeight: '1.5', 
            maxWidth: '560px', 
            margin: '0 auto 18px auto',
            fontWeight: 500
          }}>
            Explora nuestro catálogo variado. Agrega tus artículos al carrito con un toque y realiza tu pedido directo por WhatsApp con entrega rápida.
          </p>

          {/* Quick Advantage Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Truck size={14} color="#FFF100" /> Envíos Rápidos
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <MessageCircle size={14} color="#25D366" /> Atención por WhatsApp
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <ShieldCheck size={14} color="#60A5FA" /> Calidad Garantizada
            </span>
          </div>

          {/* Main Hero Search Bar Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#EC4899'
              }} 
            />
            <input
              type="text"
              placeholder="¿Qué deseas comprar hoy? Ej. Arroz, Café..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px 14px 50px',
                borderRadius: '9999px',
                border: '2px solid rgba(236, 72, 153, 0.6)',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.96rem',
                fontWeight: 700,
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            />
          </div>

        </div>
      </div>

      {/* Main Container - Enforcing 5xl (1024px max width) */}
      <main style={{ maxWidth: '1024px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px', flex: 1 }}>
        
        {/* SECTION 1: 4 Featured / Best Selling Products */}
        {featuredProducts.length > 0 && selectedCategory === 'todas' && !searchTerm && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flame size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.1' }}>
                    Destacados & Más Vendidos
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Los artículos preferidos de nuestros clientes
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '14px'
            }}>
              {featuredProducts.map(product => {
                const inCart = cart.find(item => item.product.id === product.id);
                const cardSeo = getProductSeoMeta(product.barcode, product.price);

                return (
                  <div
                    key={`feat-${product.id}`}
                    onClick={() => setSelectedProductForModal(product)}
                    style={{
                      padding: '12px',
                      borderRadius: '20px',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      border: '1px solid #FBCFE8',
                      boxShadow: '0 4px 16px rgba(236, 72, 153, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Photo Container */}
                      <div style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        position: 'relative',
                        marginBottom: '10px'
                      }}>
                        <img
                          src={product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {/* HOT Featured Badge */}
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          <Flame size={11} fill="#FFF" /> DESTACADO
                        </span>

                        {/* Rating Pill */}
                        <span style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#FBBF24',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Star size={10} fill="#FBBF24" /> {cardSeo.ratingValue}
                        </span>
                      </div>

                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: 'var(--md-sys-color-on-surface)',
                        lineHeight: '1.3',
                        marginBottom: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {product.name}
                      </h4>
                    </div>

                    <div style={{
                      paddingTop: '8px',
                      borderTop: '1px solid var(--md-sys-color-surface-variant)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                        ${Math.round(product.price)} <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', fontWeight: 800 }}>CUP</span>
                      </span>

                      {!inCart ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddToCartSheet(product);
                          }}
                          disabled={product.stock <= 0}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            borderRadius: '9999px',
                            backgroundColor: '#EC4899',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)'
                          }}
                        >
                          <Plus size={14} /> + Agregar
                        </button>
                      ) : (
                        <span style={{
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}>
                          {inCart.quantity}u
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Category Button Cards (Facebook Menu Style - Screenshot 3) */}
        {categories.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} color="#EC4899" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                Categorías de Productos
              </h3>
            </div>

            {/* Grid of Facebook Menu Style Rounded Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              {/* "Todas las Categorías" Card */}
              <div
                onClick={() => { setSelectedCategory('todas'); setSearchTerm(''); }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor: selectedCategory === 'todas' ? '#FCE7F3' : 'var(--md-sys-color-surface-container)',
                  border: selectedCategory === 'todas' ? '2px solid #EC4899' : '1px solid var(--md-sys-color-outline-variant)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  backgroundColor: selectedCategory === 'todas' ? '#EC4899' : 'var(--md-sys-color-surface-container-high)',
                  color: selectedCategory === 'todas' ? '#FFFFFF' : '#EC4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Tag size={19} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                    Todas
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    {products.length} prods
                  </span>
                </div>
              </div>

              {/* Dynamic Categories Cards */}
              {categories.map(cat => {
                const catCount = products.filter(p => p.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <div
                    key={`cat-btn-${cat}`}
                    onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? '#FCE7F3' : 'var(--md-sys-color-surface-container)',
                      border: isSelected ? '2px solid #EC4899' : '1px solid var(--md-sys-color-outline-variant)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#EC4899' : 'var(--md-sys-color-surface-container-high)',
                      color: isSelected ? '#FFFFFF' : '#EC4899',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Tag size={19} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                        {catCount} {catCount === 1 ? 'prod' : 'prods'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category SEO Description Banner */}
        {selectedCategory !== 'todas' && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '14px',
            backgroundColor: '#FCE7F3',
            color: '#831843',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #FBCFE8'
          }}>
            <Sparkles size={16} color="#EC4899" />
            <span>{getCategorySeoDescription(selectedCategory)}</span>
          </div>
        )}

        {/* SECTION 3: All Products Feed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
            {selectedCategory === 'todas' ? 'Todos los Productos' : `Categoría: ${selectedCategory}`} ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="md-card" style={{ textAlign: 'center', padding: '50px 20px', maxWidth: '420px', margin: '40px auto' }}>
            <ShoppingBag size={44} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No se encontraron productos</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Intenta cambiar la categoría o limpiar tu búsqueda.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '14px'
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);
              const cardSeo = getProductSeoMeta(product.barcode, product.price);

              return (
                <div
                  key={product.id}
                  className="md-card"
                  onClick={() => setSelectedProductForModal(product)}
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Product Image (1:1 Aspect Ratio) */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      position: 'relative'
                    }}>
                      <img 
                        src={product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />

                      {/* Out of stock overlay */}
                      {!product.isExternal && product.stock <= 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.55)',
                          backdropFilter: 'blur(2px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            backgroundColor: 'var(--md-sys-color-expense)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            transform: 'rotate(-8deg)'
                          }}>
                            AGOTADO
                          </span>
                        </div>
                      )}

                      {/* Rating Stars Overlay Pill */}
                      <span style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        color: '#FBBF24',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Star size={10} fill="#FBBF24" /> {cardSeo.ratingValue}
                      </span>
                    </div>

                    <h3 style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: 800, 
                      color: 'var(--md-sys-color-on-surface)',
                      lineHeight: '1.25',
                      marginBottom: '4px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Action Button */}
                  <div style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--md-sys-color-surface-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                        ${Math.round(product.price)}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#EC4899', backgroundColor: '#FCE7F3', padding: '1px 4px', borderRadius: '4px' }}>
                        CUP
                      </span>
                    </div>

                    {product.isExternal ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.externalUrl) {
                            window.open(product.externalUrl, '_blank');
                          } else {
                            setSelectedProductForModal(product);
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: '#059669',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <ExternalLink size={14} />
                      </button>
                    ) : !inCart ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddToCartSheet(product);
                        }}
                        disabled={product.stock <= 0}
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: '#EC4899',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 800,
                          cursor: 'pointer',
                          opacity: product.stock <= 0 ? 0.5 : 1
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    ) : (
                      <span style={{
                        backgroundColor: '#FCE7F3',
                        color: '#831843',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}>
                        {inCart.quantity}u
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal Card with Product Details */}
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={handleOpenAddToCartSheet}
          allProducts={products}
          currency="$"
          isAdmin={false}
        />

      </main>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 16px',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.3)',
          zIndex: 90
        }}>
          <div style={{
            maxWidth: '1024px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div 
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700, display: 'block' }}>
                🛒 Ver Carrito ({totalCartCount} artículos)
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00FF88' }}>
                {formatCurrency(totalCartPrice, '$', true)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsCartOpen(true)}
                style={{
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer'
                }}
              >
                Abrir Carrito
              </button>

              <button
                onClick={handleSendWhatsAppOrder}
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
                }}
              >
                <MessageCircle size={20} />
                <span>Encargar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FACEBOOK-STYLE BOTTOM SHEET 1: Select Quantity Modal */}
      {productToAddToCart && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setProductToAddToCart(null)}
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
            {/* Drag Handle Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

            {/* Header & Top Close X Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                Agregar al Carrito de Compra
              </h3>
              <button
                onClick={() => setProductToAddToCart(null)}
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

            {/* Product Summary Frame */}
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
                  src={productToAddToCart.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`}
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
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                  ${productToAddToCart.price} CUP c/u
                </span>
              </div>
            </div>

            {/* Stepper Quantity Selector */}
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

            {/* Subtotal & Action Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>Subtotal:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                  ${productToAddToCart.price * addQty} CUP
                </span>
              </div>

              <button
                onClick={handleConfirmAddToCart}
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

      {/* FACEBOOK-STYLE BOTTOM SHEET 2: Added Success Alert */}
      {addedSuccessModal?.show && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 130,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setAddedSuccessModal(null)}
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
            {/* Drag Handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', marginBottom: '4px' }} />

            {/* Top Close X Button */}
            <button
              onClick={() => setAddedSuccessModal(null)}
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

            {/* Checkmark Icon Circle */}
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

            {/* Action Buttons: Seguir Navegando & Ver Carrito */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setAddedSuccessModal(null)}
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
                onClick={() => {
                  setAddedSuccessModal(null);
                  setIsCartOpen(true);
                }}
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

      {/* FULL CART BOTTOM SHEET MODAL */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '550px',
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '24px 24px 0 0',
              padding: '20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '85vh',
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
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Selecciona productos de la tienda para realizar tu encargo por WhatsApp.</p>
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
                          src={item.product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`}
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
                            ${item.product.price} c/u
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
                        ${item.product.price * item.quantity}
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

            {/* Footer Summary & WhatsApp Button */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                    Total a Pagar:
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(totalCartPrice, '$', true)}
                  </span>
                </div>

                <button
                  onClick={handleSendWhatsAppOrder}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '14px',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
                  }}
                >
                  <MessageCircle size={22} />
                  <span>Encargar Pedido por WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer referencing Cubasoft.net */}
      <footer style={{
        backgroundColor: '#0F172A',
        color: '#E2E8F0',
        padding: '32px 16px 40px 16px',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={22} color="#EC4899" />
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' }}>Samy Store Cuba</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#94A3B8', maxWidth: '600px', margin: 0, lineHeight: '1.5' }}>
            La tienda online preferida de catálogo digital. Impulsada por <strong>Cubasoft ERP</strong> con catálogo PWA, pedidos por WhatsApp y punto de venta offline sincronizado.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center', alignItems: 'center', marginTop: '6px' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsCubasoftModalOpen(true);
              }}
              style={{
                color: '#EC4899',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Zap size={14} /> Ver Sistema Cubasoft ERP
            </a>

            <span style={{ color: '#475569' }}>•</span>

            <a
              href="https://cubasoft.net"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Globe size={14} /> Desarrollado por Cubasoft.net
            </a>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px' }}>
            © {new Date().getFullYear()} Samy Store Cuba. Todos los derechos reservados.
          </span>
        </div>
      </footer>

      {/* Cubasoft Info / Sales Modal */}
      <CubasoftInfoModal 
        isOpen={isCubasoftModalOpen} 
        onClose={() => setIsCubasoftModalOpen(false)} 
      />

      {/* Home Page Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "Samy Store",
            "description": "Tienda Online en Cuba. Alimentos, electrodomésticos, tecnología y productos del hogar.",
            "url": typeof window !== 'undefined' ? window.location.origin : 'https://cubasoft.net',
            "telephone": STORE_SEO_CONFIG.contactWhatsapp,
            "priceRange": "$$$",
            "currenciesAccepted": "CUP",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Las Tunas",
              "addressRegion": "Las Tunas",
              "addressCountry": "CU"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "68",
              "bestRating": "5",
              "worstRating": "1"
            }
          })
        }}
      />

    </div>
  );
};
