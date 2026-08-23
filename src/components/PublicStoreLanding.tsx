'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreProduct } from '@/types';
import { getStoreProducts, getStoreWhatsappNumber } from '@/lib/storage';
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
  Check, 
  MessageCircle, 
  Sparkles, 
  Store,
  Package,
  ArrowRight,
  ShieldCheck,
  Truck,
  ExternalLink
} from 'lucide-react';

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

  useEffect(() => {
    // Load published products from storage
    const all = getStoreProducts();
    const publishedList = all.filter(p => p.published);
    setProducts(publishedList);

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

  const addToCart = (product: StoreProduct) => {
    if (product.isExternal) return; // External products bypass cart
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
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
    const posLink = `${window.location.origin}/app?cart=${encodeURIComponent(cartQuery)}`;

    let text = `🛒 *NUEVO PEDIDO DE COMPRA - TIENDA CASA*\n----------------------------------\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.name}* (Cod: #${item.product.barcode})\n   Cantidad: ${item.quantity}u | Subtotal: $${item.product.price * item.quantity}\n`;
    });
    text += `----------------------------------\n*TOTAL A PAGAR: $${totalCartPrice}*\n\n`;
    text += `🔗 *Enlace para POS Admin:* ${posLink}`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/+${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Store Top Header */}
      <header style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-surface-variant)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        {/* Store Header Row */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #004D7A 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(0, 99, 155, 0.3)'
            }}>
              <Store size={22} />
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.02em' }}>
              Tienda
            </h1>
          </div>

          {/* Cart Icon & Admin Access Link (ONLY IF LOGGED IN) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Shopping Cart Button (Icon Only) */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              title="Ver Carrito de Compras"
              style={{
                position: 'relative',
                width: '42px',
                height: '42px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <ShoppingBag size={20} />
              {totalCartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--md-sys-color-expense)',
                  color: '#FFF',
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* ONLY DISPLAY DASHBOARD ICON BUTTON IF LOGGED IN */}
            {isUserLoggedIn && (
              <a
                href="/login"
                title="Ir al Dashboard Contable"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
              >
                <Lock size={19} />
              </a>
            )}

          </div>
        </div>
      </header>

      {/* Premium Multi-Category Hero Showcase Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #002B49 0%, #001529 50%, #003E6B 100%)',
        color: '#FFFFFF',
        padding: '28px 16px 36px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.15)'
      }}>
        {/* Decorative Background Glass Glow Circles */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '10%',
          width: '180px',
          height: '180px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '8%',
          width: '220px',
          height: '220px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(0, 153, 255, 0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          {/* Versatile Store Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#00FF88',
            padding: '5px 16px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <Sparkles size={14} color="#00FF88" />
            <span>TIENDA VARIADA & MULTIRRUBRO</span>
          </div>

          <h2 style={{ 
            fontSize: '2.1rem', 
            fontWeight: 900, 
            lineHeight: '1.2', 
            marginBottom: '10px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E2F1FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Todo lo que Necesitas en un Solo Lugar
          </h2>

          <p style={{ 
            fontSize: '0.92rem', 
            color: 'rgba(255, 255, 255, 0.88)', 
            lineHeight: '1.5', 
            maxWidth: '560px', 
            margin: '0 auto 16px auto',
            fontWeight: 500
          }}>
            Víveres • Panadería • Bebidas • Aseo • Electrónica • Golosinas y Más. Explora el catálogo y encarga directo por WhatsApp.
          </p>

          {/* Quick Advantage Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
              <Truck size={13} color="#00FF88" /> Envíos Directos
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
              <MessageCircle size={13} color="#25D366" /> Atención Inmediata
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
              <ShieldCheck size={13} color="#60A5FA" /> Garantía de Calidad
            </span>
          </div>

          {/* Search bar inside Hero */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-primary)'
              }} 
            />
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy? Ej. Arroz, Café, Pan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px 14px 50px',
                borderRadius: '9999px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                backgroundColor: '#FFFFFF',
                color: '#1A1C1E',
                fontSize: '0.96rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                transition: 'box-shadow 0.2s ease'
              }}
            />
          </div>

        </div>
      </div>

      {/* Main Body Section */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px', flex: 1 }}>
        
        {/* Category Showcase Grid (ERP-Style) */}
        {categories.length > 0 && selectedCategory === 'todas' && !searchTerm && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={16} color="var(--md-sys-color-primary)" />
              <span>Categorías del Catálogo</span>
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '10px'
            }}>
              {categories.map(cat => {
                const catProds = products.filter(p => p.category === cat);
                const samplePhoto = catProds.find(p => p.photoUrl)?.photoUrl;

                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '6px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {samplePhoto ? (
                        <img src={samplePhoto} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Tag size={20} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{cat}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                      {catProds.length} {catProds.length === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter Chips */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('todas')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              backgroundColor: selectedCategory === 'todas' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
              color: selectedCategory === 'todas' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: selectedCategory === 'todas' ? '0 4px 12px rgba(0, 99, 155, 0.3)' : 'none'
            }}
          >
            Todas ({products.length})
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: selectedCategory === cat ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(0, 99, 155, 0.3)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid - 2 columns on mobile */}
        {filteredProducts.length === 0 ? (
          <div className="md-card" style={{ textAlign: 'center', padding: '50px 20px', maxWidth: '420px', margin: '40px auto' }}>
            <ShoppingBag size={44} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No se encontraron productos</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Intenta buscar con otra categoría o término de búsqueda.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '14px'
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="md-card"
                  onClick={() => setSelectedProductForModal(product)}
                  style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Product Image Showcase (1:1 aspect ratio on mobile) */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}>
                      <img 
                        src={product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />

                      {product.isExternal && (
                        <span style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: '#00639B',
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <ExternalLink size={10} /> Externo
                        </span>
                      )}
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

                  {/* Price & Add / External Action */}
                  <div style={{
                    paddingTop: '6px',
                    borderTop: '1px solid var(--md-sys-color-surface-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                      ${Math.round(product.price)}
                    </span>

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
                        className="md-btn"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          fontWeight: 800
                        }}
                      >
                        <ExternalLink size={14} />
                      </button>
                    ) : !inCart ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        disabled={product.stock <= 0}
                        className="md-btn md-btn-primary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          opacity: product.stock <= 0 ? 0.5 : 1
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    ) : (
                      <span style={{
                        backgroundColor: 'var(--md-sys-color-primary-container)',
                        color: 'var(--md-sys-color-on-primary-container)',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
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

        {/* Modal Card with Details, Related Products, and WhatsApp */}
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
          onAddToCart={addToCart}
          allProducts={products}
          currency="$"
          isAdmin={false}
        />

      </main>

      {/* Floating Bottom Cart Bar (Sandra Shein Style) */}
      {totalCartCount > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderTop: '1px solid var(--md-sys-color-surface-variant)',
          padding: '12px 16px',
          boxShadow: '0 -6px 20px rgba(0,0,0,0.12)',
          zIndex: 90
        }}>
          <div style={{
            maxWidth: '1200px',
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
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                🛒 Ver Carrito ({totalCartCount} artículos)
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(totalCartPrice, '$', true)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsCartOpen(true)}
                className="md-btn md-btn-secondary"
                style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 800 }}
              >
                Abrir Carrito
              </button>

              <button
                onClick={handleSendWhatsAppOrder}
                className="md-btn"
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
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

      {/* ERP Bottom Sheet Cart Modal */}
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
              maxWidth: '600px',
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
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Carrito de Compra ERP
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
                          src={item.product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '1px 5px', borderRadius: '4px' }}>
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
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(totalCartPrice, '$', true)}
                  </span>
                </div>

                <button
                  onClick={handleSendWhatsAppOrder}
                  className="md-btn"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 800,
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

    </div>
  );
};
