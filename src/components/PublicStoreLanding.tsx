'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
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
  Package
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

  useEffect(() => {
    // Load published products from storage
    const all = getStoreProducts();
    setProducts(all.filter(p => p.published));
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

    let text = `🛒 *NUEVO PEDIDO - TIENDA CASA*\n\n`;
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
        boxShadow: 'var(--md-shadow-elevation-1)'
      }}>
        {/* Announcement Bar */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-primary)',
          color: '#FFFFFF',
          padding: '6px 16px',
          textAlign: 'center',
          fontSize: '0.78rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} />
          <span>¡Bienvenidos a la Tienda Casa! Envíos directos y catálogo actualizado.</span>
        </div>

        {/* Store Header Row */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 16px',
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
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Tienda Casa
              </h1>
              <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                Catálogo de Productos
              </span>
            </div>
          </div>

          {/* Cart Icon & Dashboard Admin Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              style={{
                position: 'relative',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShoppingBag size={18} />
              <span>Carrito</span>
              {totalCartCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--md-sys-color-expense)',
                  color: '#FFF',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  marginLeft: '2px'
                }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Admin App Login Link */}
            <a
              href="/login"
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'transparent',
                color: 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 700,
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Lock size={15} />
              <span>Acceso Contable</span>
            </a>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '20px 16px 100px 16px', flex: 1 }}>
        
        {/* Search & Category Filter */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '9999px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: 'var(--md-shadow-elevation-1)'
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('todas')}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: selectedCategory === 'todas' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: selectedCategory === 'todas' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
              }}
            >
              Todas
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                  color: selectedCategory === cat ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Products Showcase Grid */}
        {filteredProducts.length === 0 ? (
          <div className="md-card" style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '400px', margin: '40px auto' }}>
            <ShoppingBag size={40} style={{ color: 'var(--md-sys-color-outline)', marginBottom: '10px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>No se encontraron productos</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
              Intenta buscar con otra categoría o nombre.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="md-card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    {/* Optional Product Image Preview (Base64 400x400) */}
                    {product.photoUrl ? (
                      <div style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '10px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)'
                      }}>
                        <img 
                          src={product.photoUrl} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        marginBottom: '10px'
                      }}>
                        <Package size={32} style={{ opacity: 0.4 }} />
                      </div>
                    )}

                    {/* Category Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {product.category}
                      </span>
                      {product.stock > 0 ? (
                        <span style={{ fontSize: '0.7rem', color: '#00875A', fontWeight: 700 }}>Disponible</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-expense)', fontWeight: 700 }}>Agotado</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                      {product.name}
                    </h3>

                    {product.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.3' }}>
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Add to Cart Button */}
                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--md-sys-color-surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', display: 'block', color: 'var(--md-sys-color-on-surface-variant)' }}>Precio</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                        {formatCurrency(product.price, '$', true)}
                      </span>
                    </div>

                    {!inCart ? (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="md-btn md-btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', opacity: product.stock <= 0 ? 0.5 : 1 }}
                      >
                        <Plus size={16} />
                        <span>Agregar</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-primary)',
                            color: '#FFF',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar (Sandra Shein style) */}
      {totalCartCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderTop: '1px solid var(--md-sys-color-surface-variant)',
          padding: '12px 16px',
          boxShadow: 'var(--md-shadow-elevation-3)',
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
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                Total de Pedido ({totalCartCount} artículos)
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                {formatCurrency(totalCartPrice, '$', true)}
              </span>
            </div>

            <button
              onClick={handleSendWhatsAppOrder}
              className="md-btn"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '12px 20px',
                fontSize: '0.92rem',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
              }}
            >
              <MessageCircle size={20} />
              <span>Encargar por WhatsApp</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
