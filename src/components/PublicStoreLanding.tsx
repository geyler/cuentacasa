'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreProduct } from '@/types';
import { getStoreProducts } from '@/lib/storage';
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
  Truck
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
    setProducts(all.filter(p => p.published));

    // Check if user is logged into accounting system
    if (typeof window !== 'undefined') {
      const localAuth = localStorage.getItem('cuentacasa_auth');
      const sessionAuth = sessionStorage.getItem('cuentacasa_auth');
      setIsUserLoggedIn(localAuth === 'true' || sessionAuth === 'true');
    }
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: StoreProduct) => {
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

    let text = `🛒 *NUEVO PEDIDO DE COMPRA - TIENDA CASA*\n\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.name}*\n   Cantidad: ${item.quantity}u | Precio: $${item.product.price * item.quantity}\n`;
    });
    text += `\n*TOTAL A PAGAR: $${totalCartPrice}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sandra Shein-Style Store Top Header */}
      <header style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-surface-variant)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        {/* Top Announcement Bar */}
        <div style={{
          background: 'linear-gradient(90deg, var(--md-sys-color-primary) 0%, #00385E 100%)',
          color: '#FFFFFF',
          padding: '7px 16px',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Sparkles size={15} />
          <span>¡Bienvenidos a la Tienda Casa! Envíos directos y pedidos inmediatos por WhatsApp.</span>
        </div>

        {/* Store Header Row */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #004D7A 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 99, 155, 0.3)'
            }}>
              <Store size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.02em' }}>
                Tienda Casa
              </h1>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#00875A" /> Catálogo Oficial Certificado
              </span>
            </div>
          </div>

          {/* Cart Icon & Admin Access Link (ONLY IF LOGGED IN) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              style={{
                position: 'relative',
                padding: '9px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <ShoppingBag size={18} />
              <span>Carrito</span>
              {totalCartCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--md-sys-color-expense)',
                  color: '#FFF',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  marginLeft: '2px'
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* ONLY DISPLAY DASHBOARD ACCESO CONTABLE BUTTON IF LOGGED IN */}
            {isUserLoggedIn && (
              <a
                href="/login"
                style={{
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-primary)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Lock size={15} />
                <span>Dashboard Contable</span>
              </a>
            )}

          </div>
        </div>
      </header>

      {/* Hero Showcase Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #00385E 0%, #001E36 100%)',
        color: '#FFFFFF',
        padding: '36px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#00FF88',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block',
            marginBottom: '12px'
          }}>
            Productos Frescos y Selección de Calidad
          </span>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '12px' }}>
            Explora Nuestro Catálogo de Productos
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.85, lineHeight: '1.5', maxWidth: '540px', margin: '0 auto 20px auto' }}>
            Elige tus productos favoritos y haz tu encargo en un clic directamente por WhatsApp con atención personalizada.
          </p>

          {/* Search bar inside Hero */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar productos en la tienda..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: '#FFFFFF',
                color: '#1A1C1E',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Body Section */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px', flex: 1 }}>
        
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
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.03)'
                    }}>
                      <img 
                        src={product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
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

                  {/* Price & Add Action */}
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

                    {!inCart ? (
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
      {totalCartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderTop: '1px solid var(--md-sys-color-surface-variant)',
          padding: '14px 16px',
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
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                Resumen de Pedido ({totalCartCount} artículos)
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(totalCartPrice, '$', true)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsAppOrder}
              className="md-btn"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '14px 22px',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
              }}
            >
              <MessageCircle size={22} />
              <span>Encargar por WhatsApp</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
