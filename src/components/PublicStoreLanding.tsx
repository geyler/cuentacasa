'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { getStoreProducts, getStoreWhatsappNumber, formatPhotoUrl, getCurrencySettings } from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency, getProductDisplayPrice, getCurrencyBadgeStyle } from '@/lib/invoice';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CubasoftInfoModal } from '@/components/CubasoftInfoModal';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { STORE_SEO_CONFIG, getCategorySeoDescription, getProductSeoMeta } from '@/lib/seoHelper';

import { 
  PublicStoreHeaderBar,
  PublicStoreHeroBanner,
  PublicAddToCartSheet,
  PublicStoreCartDrawer
} from '@/components/store';

import { 
  ShoppingBag, 
  Search, 
  Tag, 
  Plus, 
  Lock, 
  MessageCircle, 
  Sparkles, 
  ExternalLink,
  Globe,
  Star,
  Zap,
  Layers
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
  const [isCubasoftModalOpen, setIsCubasoftModalOpen] = useState(false);

  // PWA Install prompt state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Bottom Sheet state for quantity selection & confirmation
  const [productToAddToCart, setProductToAddToCart] = useState<StoreProduct | null>(null);
  const [addQty, setAddQty] = useState<number>(1);
  const [addedSuccessModal, setAddedSuccessModal] = useState<{
    show: boolean;
    productName: string;
    quantity: number;
    totalPrice: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const { showActionResult } = useActionFeedback();

  const handleInstallPwa = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredInstallPrompt(null);
        setIsInstalled(true);
      }
    } else {
      showActionResult({
        title: '📱 Instalar App Samy Store',
        message: '1. En Chrome/Android: Toca los 3 puntos del navegador y elige "Añadir a la pantalla de inicio" o "Instalar aplicación".\n2. En iPhone/Safari: Toca el botón Compartir y elige "Añadir a pantalla de inicio".',
        type: 'info'
      });
    }
  };

  useEffect(() => {
    const filterPublished = (list: StoreProduct[]) => list.filter(p => p.published);

    const all = getStoreProducts();
    setProducts(filterPublished(all));

    syncDatabaseWithCloud(false).then(res => {
      if (res.success) {
        const syncedAll = getStoreProducts();
        setProducts(filterPublished(syncedAll));
      }
    }).catch(err => {
      console.warn('Silent cloud sync warning on landing:', err);
    });

    const refreshLanding = () => {
      setProducts(filterPublished(getStoreProducts()));
    };

    window.addEventListener('cuentacasa-db-changed', refreshLanding);
    window.addEventListener('cuentacasa-currency-mode-changed', refreshLanding);

    return () => {
      window.removeEventListener('cuentacasa-db-changed', refreshLanding);
      window.removeEventListener('cuentacasa-currency-mode-changed', refreshLanding);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localAuth = localStorage.getItem('cuentacasa_auth');
      const sessionAuth = sessionStorage.getItem('cuentacasa_auth');
      setIsUserLoggedIn(localAuth === 'true' || sessionAuth === 'true');

      const params = new URLSearchParams(window.location.search);
      const cartParam = params.get('cart');
      if (cartParam) {
        const loadedCart: CartItem[] = [];
        cartParam.split(',').forEach(entry => {
          const parts = entry.split(':');
          if (parts.length === 2) {
            const barcode = parts[0].padStart(4, '0');
            const qty = parseInt(parts[1], 10) || 1;
            const prod = getStoreProducts().find((p: StoreProduct) => p.barcode === barcode || p.barcode === parts[0]);
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedCategory]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenProductModal = (product: StoreProduct) => {
    setSelectedProductForModal(product);
    if (typeof window !== 'undefined') {
      window.history.pushState({ productId: product.id }, '', `/producto/${product.id}`);
    }
  };

  const handleCloseProductModal = () => {
    setSelectedProductForModal(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
  };

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

    let text = `🛒 *PEDIDO SAMY STORE*\n----------------------------------\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.name}*\n   Cant: ${item.quantity}u | Subtotal: $${item.product.price * item.quantity} CUP\n`;
    });
    text += `----------------------------------\n💰 *TOTAL A PAGAR: $${totalCartPrice} CUP*\n\n`;
    text += `🔗 *Ver pedido en Samy Store:*\n${cartLink}`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/+${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header Bar */}
      <PublicStoreHeaderBar
        totalCartCount={totalCartCount}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        isUserLoggedIn={isUserLoggedIn}
        onResetFilters={() => { setSelectedCategory('todas'); setSearchTerm(''); }}
      />

      {/* 2. Full-Width Hero Section */}
      <PublicStoreHeroBanner
        onSearchClick={() => {
          const searchEl = document.getElementById('store-hero-search-input');
          searchEl?.focus();
          searchEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onFeaturedClick={() => {
          const featEl = document.getElementById('featured-products-section');
          if (featEl) {
            featEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            setSelectedCategory('todas');
            setSearchTerm('');
          }
        }}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* 3. Search Bar */}
      <div style={{ maxWidth: '1024px', width: 'calc(100% - 32px)', margin: '14px auto 0 auto', position: 'relative' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <Search 
            size={22} 
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#EC4899'
            }} 
          />
          <input
            id="store-hero-search-input"
            type="text"
            placeholder="¿Qué estás buscando? Ej. Arroz, Café, Pan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 48px 16px 54px',
              borderRadius: '9999px',
              border: '2px solid #FBCFE8',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              fontSize: '0.98rem',
              fontWeight: 700,
              outline: 'none',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.08)',
              transition: 'all 0.2s ease'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#F1F5F9',
                border: 'none',
                color: '#64748B',
                width: '26px',
                height: '26px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 900
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. PWA Install CTA Banner */}
      {!isInstalled && (
        <PwaInstallBanner 
          onInstall={handleInstallPwa} 
          onDismiss={() => setIsInstalled(true)} 
        />
      )}

      {/* 5. Main Products Content Grid */}
      <main style={{ maxWidth: '1024px', width: '100%', margin: '0 auto', padding: '24px 20px 140px 20px', flex: 1 }}>
        
        {/* Categories Carousel / Cards FIRST */}
        {categories.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} color="#EC4899" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                Categorías de Productos
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px'
            }}>
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

        {/* Featured Products SECOND */}
        {products.length > 0 && selectedCategory === 'todas' && !searchTerm && (
          <div id="featured-products-section" style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Sparkles size={20} color="#EF4444" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                🔥 Productos Destacados & Más Vendidos
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '18px'
            }}>
              {products.slice(0, 4).map(product => {
                const inCart = cart.find(item => item.product.id === product.id);
                const cardSeo = getProductSeoMeta(product.barcode, product.price);
                const formattedImage = formatPhotoUrl(product.photoUrl);

                return (
                  <div
                    key={`feat-${product.id}`}
                    className="md-card"
                    onClick={() => handleOpenProductModal(product)}
                    style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      border: '1px solid #F1F5F9',
                      backgroundColor: '#FFFFFF',
                      position: 'relative',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div>
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
                          src={formattedImage || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />

                        <span style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}>
                          🔥 DESTACADO
                        </span>

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

                    <div style={{
                      paddingTop: '8px',
                      borderTop: '1px solid var(--md-sys-color-surface-variant)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      {(() => {
                        const { currencyMode, exchangeRateUSD, usdIndexedPricing } = getCurrencySettings();
                        const disp = getProductDisplayPrice(product.price, product.currency, currencyMode, exchangeRateUSD, product.priceUSD, usdIndexedPricing);
                        const badgeStyle = getCurrencyBadgeStyle(disp.currency);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                              {formatCurrency(disp.amount, disp.currency, true)}
                            </span>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: badgeStyle.backgroundColor,
                              color: badgeStyle.color,
                              border: badgeStyle.border
                            }}>
                              {disp.currency === 'USD' ? 'USD' : 'CUP'}
                            </span>
                          </div>
                        );
                      })()}

                      {!inCart ? (
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
                            cursor: 'pointer'
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

        {/* Products Grid */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
            {selectedCategory === 'todas' ? 'Todos los Productos' : `Categoría: ${selectedCategory}`} ({filteredProducts.length})
          </h3>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="md-card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '420px', margin: '40px auto', borderRadius: '24px' }}>
            <ShoppingBag size={48} style={{ color: '#94A3B8', marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B' }}>No se encontraron productos</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginTop: '6px' }}>
              Intenta cambiar la categoría o limpiar tu búsqueda.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '18px'
          }}>
            {filteredProducts.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);
              const cardSeo = getProductSeoMeta(product.barcode, product.price);
              const formattedImage = formatPhotoUrl(product.photoUrl);

              return (
                <div
                  key={product.id}
                  className="md-card"
                  onClick={() => handleOpenProductModal(product)}
                  style={{
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div>
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
                        src={formattedImage || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />

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

                  <div style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--md-sys-color-surface-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    {(() => {
                      const { currencyMode, exchangeRateUSD, usdIndexedPricing } = getCurrencySettings();
                      const disp = getProductDisplayPrice(product.price, product.currency, currencyMode, exchangeRateUSD, product.priceUSD, usdIndexedPricing);
                      const badgeStyle = getCurrencyBadgeStyle(disp.currency);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                            {formatCurrency(disp.amount, disp.currency, true)}
                            {product.unit && product.unit !== 'u' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '3px' }}>
                                / {product.unit}
                              </span>
                            )}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: badgeStyle.backgroundColor,
                            color: badgeStyle.color,
                            border: badgeStyle.border
                          }}>
                            {disp.currency === 'USD' ? 'USD' : 'CUP'}
                          </span>
                        </div>
                      );
                    })()}

                    {product.isExternal ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.externalUrl) {
                            window.open(product.externalUrl, '_blank');
                          } else {
                            handleOpenProductModal(product);
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

        <ProductDetailModal
          product={selectedProductForModal}
          onClose={handleCloseProductModal}
          onAddToCart={handleOpenAddToCartSheet}
          allProducts={products}
          currency="$"
          isAdmin={false}
        />

      </main>

      {/* 6. Floating Bottom Cart Bar */}
      {totalCartCount > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          color: '#0F172A',
          borderTop: '1px solid #F1F5F9',
          padding: '12px 18px',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.08)',
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
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                Carrito ({totalCartCount} {totalCartCount === 1 ? 'ítem' : 'ítems'})
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                {formatCurrency(totalCartPrice, '$', true)} <span style={{ fontSize: '0.78rem', color: '#EC4899', fontWeight: 800 }}>CUP</span>
              </span>
            </div>

            <button
              onClick={handleSendWhatsAppOrder}
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '12px 22px',
                fontSize: '0.95rem',
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
      )}

      {/* 7. Add To Cart Quantity Sheet */}
      <PublicAddToCartSheet
        productToAddToCart={productToAddToCart}
        addQty={addQty}
        setAddQty={setAddQty}
        onClose={() => setProductToAddToCart(null)}
        onConfirmAddToCart={handleConfirmAddToCart}
        addedSuccessModal={addedSuccessModal}
        onCloseSuccessModal={() => setAddedSuccessModal(null)}
        onOpenCartFromSuccess={() => {
          setAddedSuccessModal(null);
          setIsCartOpen(true);
        }}
        totalCartCount={totalCartCount}
        totalCartPrice={totalCartPrice}
      />

      {/* 8. Full Cart Drawer Modal */}
      <PublicStoreCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        totalCartCount={totalCartCount}
        totalCartPrice={totalCartPrice}
      />

      {/* 9. Light & Feminine Footer */}
      <footer style={{
        backgroundColor: '#FFF0F5',
        color: '#831843',
        padding: '36px 16px 44px 16px',
        marginTop: 'auto',
        borderTop: '1px solid #FBCFE8',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '28px', width: 'auto' }} />
            <span className="font-logo-script" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#831843' }}>Samy Store Las Tunas</span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#9D174D', maxWidth: '600px', margin: 0, lineHeight: '1.5', fontWeight: 600 }}>
            Tu tienda preferida en Las Tunas. Insumos, electrodomésticos y variadas ofertas con pedido directo por WhatsApp y entregas rápidas. Impulsada por <strong>Cubasoft ERP</strong>.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center', alignItems: 'center', marginTop: '6px' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsCubasoftModalOpen(true);
              }}
              style={{
                color: '#DB2777',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Zap size={14} /> Ver Sistema Cubasoft ERP
            </a>

            <span style={{ color: '#F472B6' }}>•</span>

            <a
              href="https://cubasoft.net"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#BE185D',
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

          {/* Enlace solitario en medio antes del copyright para acceder al login */}
          <div style={{ margin: '12px 0 6px 0', width: '100%', textAlign: 'center' }}>
            <a
              href="/login?force=true"
              style={{
                color: '#BE185D',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 18px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(236, 72, 153, 0.08)',
                border: '1px solid #FBCFE8',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.06)',
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={14} />
              <span>Acceder</span>
            </a>
          </div>

          <span style={{ fontSize: '0.75rem', color: '#9D174D', marginTop: '4px', opacity: 0.8 }}>
            © {new Date().getFullYear()} Samy Store. Todos los derechos reservados.
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
