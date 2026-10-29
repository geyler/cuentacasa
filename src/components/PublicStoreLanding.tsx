'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoreProduct, CurrencyMode } from '@/types';
import {
  getStoreProducts,
  getStoreWhatsappNumber,
  formatPhotoUrl,
  DEFAULT_CATEGORY_IMAGE,
  DEFAULT_PRODUCT_IMAGE,
  getCurrencySettings,
  getPrimaryThemeColor,
  getSecondaryThemeColor
} from '@/lib/storage';
import { applyBrandPaletteToDocument } from '@/lib/themePalette';
import { syncPublicCatalog } from '@/lib/sync';
import { formatCurrency, getProductDisplayPrice } from '@/lib/invoice';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CubasoftInfoModal } from '@/components/CubasoftInfoModal';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import {
  STORE_SEO_CONFIG,
  getCategorySeoDescription,
  getProductSeoMeta,
  getCategoryVisualMeta
} from '@/lib/seoHelper';

import {
  PublicStoreHeaderBar,
  CategoryStatItem,
  PublicStoreHeroBanner,
  PublicProductCard,
  PublicStoreFooter,
  PublicAddToCartSheet,
  PublicStoreCartDrawer
} from '@/components/store';

import {
  ShoppingBag,
  MessageCircle,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name';

export const PublicStoreLanding: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('BOTH');
  const [displayCurrency, setDisplayCurrency] = useState<'CUP' | 'USD'>('CUP');
  const [exchangeRateUSD, setExchangeRateUSD] = useState<number>(320);
  const [usdIndexedPricing, setUsdIndexedPricing] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<StoreProduct | null>(null);
  const [isCubasoftModalOpen, setIsCubasoftModalOpen] = useState(false);
  const [helpModalSection, setHelpModalSection] = useState<'como-comprar' | 'envios' | 'pagos' | 'faq' | null>(null);

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

  const { showActionResult } = useActionFeedback();

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

    const syncLocalSettings = () => {
      const settings = getCurrencySettings();
      setCurrencyMode(settings.currencyMode || 'BOTH');
      setDisplayCurrency(settings.currencyMode === 'USD' ? 'USD' : 'CUP');
      setExchangeRateUSD(settings.exchangeRateUSD);
      setUsdIndexedPricing(Boolean(settings.usdIndexedPricing));
      applyBrandPaletteToDocument(getPrimaryThemeColor(), getSecondaryThemeColor());
    };

    const all = getStoreProducts();
    setProducts(filterPublished(all));
    syncLocalSettings();

    syncPublicCatalog(false).then(res => {
      if (res.success) {
        const syncedAll = getStoreProducts();
        setProducts(filterPublished(syncedAll));
        syncLocalSettings();
      }
    }).catch(err => {
      console.warn('Silent cloud sync warning on landing:', err);
    });

    const refreshLanding = () => {
      setProducts(filterPublished(getStoreProducts()));
      syncLocalSettings();
    };

    const handleOnline = () => {
      syncPublicCatalog(false).then(res => {
        if (res.success) {
          refreshLanding();
        }
      }).catch(() => {});
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('cuentacasa-db-changed', refreshLanding);
    window.addEventListener('cuentacasa-currency-mode-changed', refreshLanding);
    window.addEventListener('cuentacasa-theme-color-changed', refreshLanding);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('cuentacasa-db-changed', refreshLanding);
      window.removeEventListener('cuentacasa-currency-mode-changed', refreshLanding);
      window.removeEventListener('cuentacasa-theme-color-changed', refreshLanding);
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

  // Estadísticas dinámicas de categorías ordenadas por cantidad de productos
  const categoryStats: CategoryStatItem[] = useMemo(() => {
    const map = new Map<string, { count: number; thumbnailUrl?: string }>();
    for (const p of products) {
      const catName = (p.category || 'General').trim();
      const existing = map.get(catName);
      if (!existing) {
        map.set(catName, {
          count: 1,
          thumbnailUrl: p.photoUrl ? p.photoUrl : undefined
        });
      } else {
        existing.count += 1;
        if (!existing.thumbnailUrl && p.photoUrl) {
          existing.thumbnailUrl = p.photoUrl;
        }
      }
    }
    return Array.from(map.entries())
      .map(([name, info]) => ({
        name,
        count: info.count,
        thumbnailUrl: info.thumbnailUrl
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Productos filtrados y ordenados
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = products.filter(p => {
      const matchesSearch = !q
        || p.name.toLowerCase().includes(q)
        || (p.category && p.category.toLowerCase().includes(q))
        || (p.barcode && p.barcode.toLowerCase().includes(q));
      const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
      const matchesStock = !onlyInStock || p.isExternal || p.stock > 0;
      return matchesSearch && matchesCat && matchesStock;
    });

    const getNormalizedPrice = (prod: StoreProduct) => {
      return getProductDisplayPrice(
        prod.price,
        prod.currency,
        displayCurrency,
        exchangeRateUSD,
        prod.priceUSD,
        usdIndexedPricing
      ).amount;
    };

    const getRating = (prod: StoreProduct) => {
      return prod.ratingScore || getProductSeoMeta(prod.barcode, prod.price).ratingValue;
    };

    const sorted = [...list];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => getNormalizedPrice(a) - getNormalizedPrice(b));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => getNormalizedPrice(b) - getNormalizedPrice(a));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => getRating(b) - getRating(a));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    return sorted;
  }, [products, searchTerm, selectedCategory, onlyInStock, sortBy, displayCurrency, exchangeRateUSD, usdIndexedPricing]);

  // Productos destacados (Top valorados / en stock)
  const featuredProducts = useMemo(() => {
    return [...products]
      .filter(p => p.isExternal || p.stock > 0)
      .sort((a, b) => {
        const rA = a.ratingScore || getProductSeoMeta(a.barcode, a.price).ratingValue;
        const rB = b.ratingScore || getProductSeoMeta(b.barcode, b.price).ratingValue;
        return rB - rA;
      })
      .slice(0, 5);
  }, [products]);

  const previousUrlRef = useRef<string>('');

  useEffect(() => {
    const handlePopState = () => {
      // Si el usuario navegó con "Atrás" en el navegador/móvil y ya no está en /producto/
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/producto/')) {
        setSelectedProductForModal(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenProductModal = (product: StoreProduct) => {
    setSelectedProductForModal(product);
    if (typeof window !== 'undefined') {
      previousUrlRef.current = window.location.pathname + window.location.search;
      window.history.pushState({ modalProductId: product.id }, '', `/producto/${product.id}`);
    }
  };

  const handleCloseProductModal = () => {
    setSelectedProductForModal(null);
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/producto/')) {
        // Restaurar de forma limpia la URL de la tienda / catálogo
        window.history.replaceState(null, '', previousUrlRef.current || '/');
      }
    }
  };

  const handleSelectProductInModal = (prod: StoreProduct) => {
    setSelectedProductForModal(prod);
    if (typeof window !== 'undefined') {
      window.history.replaceState({ modalProductId: prod.id }, '', `/producto/${prod.id}`);
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
    const disp = getProductDisplayPrice(
      prod.price,
      prod.currency,
      displayCurrency,
      exchangeRateUSD,
      prod.priceUSD,
      usdIndexedPricing
    );
    const subtotal = disp.amount * qty;

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
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => {
    const disp = getProductDisplayPrice(
      item.product.price,
      item.product.currency,
      displayCurrency,
      exchangeRateUSD,
      item.product.priceUSD,
      usdIndexedPricing
    );
    return sum + (disp.amount * item.quantity);
  }, 0);

  const handleSendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const targetPhone = getStoreWhatsappNumber();
    const cartQuery = cart.map(i => `${i.product.barcode}:${i.quantity}`).join(',');
    const cartLink = `${window.location.origin}/app?cart=${encodeURIComponent(cartQuery)}`;

    let text = `🛒 *PEDIDO SAMY STORE*\n----------------------------------\n`;
    cart.forEach((item, index) => {
      const disp = getProductDisplayPrice(
        item.product.price,
        item.product.currency,
        displayCurrency,
        exchangeRateUSD,
        item.product.priceUSD,
        usdIndexedPricing
      );
      text += `${index + 1}. *${item.product.name}*\n   Cant: ${item.quantity}${item.product.unit || 'u'} | Subtotal: $${disp.amount * item.quantity} ${disp.currency}\n`;
    });
    text += `----------------------------------\n💰 *TOTAL A PAGAR: $${totalCartPrice} ${displayCurrency}*\n\n`;
    text += `🔗 *Ver pedido en Samy Store:*\n${cartLink}`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleDirectWhatsAppContact = () => {
    const targetPhone = getStoreWhatsappNumber();
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : '';
    const text = encodeURIComponent('¡Hola Samy Store! Quisiera consultar sobre los productos disponibles y entregas en Las Tunas.');
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handleResetAllFilters = () => {
    setSelectedCategory('todas');
    setSearchTerm('');
    setOnlyInStock(false);
    setSortBy('featured');
  };

  const isHomeBrowseMode = selectedCategory === 'todas' && !searchTerm.trim() && !onlyInStock && sortBy === 'featured';

  // Solo mostrar el selector de moneda cuando existan productos públicos en doble moneda / USD y la tienda esté en modo BOTH
  const hasDualCurrencyProducts = useMemo(() => {
    if (currencyMode !== 'BOTH') return false;
    if (products.length === 0) return false;
    const hasUSDProduct = products.some(
      p => p.currency === 'USD' || (typeof p.priceUSD === 'number' && p.priceUSD > 0)
    );
    return hasUSDProduct || usdIndexedPricing;
  }, [currencyMode, products, usdIndexedPricing]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header Marketplace de 2 Niveles con Menú Móvil Lateral */}
      <PublicStoreHeaderBar
        totalCartCount={totalCartCount}
        totalCartPrice={totalCartPrice}
        cartDisplayCurrency={displayCurrency}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        isUserLoggedIn={isUserLoggedIn}
        onResetFilters={handleResetAllFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={cat => setSelectedCategory(cat)}
        categories={categoryStats}
        onlyInStock={onlyInStock}
        setOnlyInStock={setOnlyInStock}
        displayCurrency={displayCurrency}
        onToggleDisplayCurrency={curr => setDisplayCurrency(curr)}
        showCurrencySelector={hasDualCurrencyProducts}
        exchangeRateUSD={exchangeRateUSD}
        onWhatsAppClick={handleDirectWhatsAppContact}
        onFeaturedClick={() => {
          const featEl = document.getElementById('featured-products-section') || document.getElementById('marketplace-catalog-anchor');
          if (featEl) {
            featEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            handleResetAllFilters();
          }
        }}
        onHowToBuyClick={() => setHelpModalSection('como-comprar')}
      />

      {/* 2. Hero Ampliado y Limpio (Sin producto destacado flotante) */}
      <PublicStoreHeroBanner
        products={products}
        categories={categoryStats}
        displayCurrency={displayCurrency}
        exchangeRateUSD={exchangeRateUSD}
        usdIndexedPricing={usdIndexedPricing}
        onSearchClick={() => {
          const searchEl = document.getElementById('store-desktop-search-input') || document.getElementById('store-hero-search-input');
          if (searchEl) {
            searchEl.focus();
            searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        onFeaturedClick={() => {
          const featEl = document.getElementById('marketplace-catalog-anchor');
          if (featEl) {
            featEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        onSelectCategory={cat => setSelectedCategory(cat)}
        onOpenProduct={handleOpenProductModal}
        onQuickAddToCart={handleOpenAddToCartSheet}
        onWhatsAppClick={handleDirectWhatsAppContact}
      />

      {/* 3. Banner de Instalación PWA */}
      {!isInstalled && (
        <div className="store-container" style={{ marginTop: '14px' }}>
          <PwaInstallBanner
            onInstall={handleInstallPwa}
            onDismiss={() => setIsInstalled(true)}
          />
        </div>
      )}

      {/* 4. Contenido Principal del Marketplace */}
      <main className="store-container" style={{ padding: '22px 16px 120px 16px', flex: 1 }}>
        {/* HUB DE CATEGORÍAS: En Móvil tira horizontal deslizable; en PC cuadrícula */}
        {categoryStats.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                <h3 style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Categorías
                </h3>
              </div>
              {selectedCategory !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('todas')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary, #1A73E8)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={13} /> Ver todas ({products.length})
                </button>
              )}
            </div>

            <div className="marketplace-cat-layout no-scrollbar">
              {/* Tarjeta "Todo el Catálogo" */}
              <div
                className="marketplace-cat-card"
                onClick={() => setSelectedCategory('todas')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '16px',
                  backgroundColor: selectedCategory === 'todas' ? 'var(--brand-primary-light, #EFF6FF)' : '#FFFFFF',
                  border: selectedCategory === 'todas'
                    ? '2px solid var(--brand-primary, #1A73E8)'
                    : '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '11px',
                  backgroundColor: selectedCategory === 'todas'
                    ? 'var(--brand-primary, #1A73E8)'
                    : 'var(--brand-primary-light, #EFF6FF)',
                  color: selectedCategory === 'todas'
                    ? '#FFFFFF'
                    : 'var(--brand-primary, #1A73E8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  🛍️
                </div>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                    Todas
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>
                    {products.length} {products.length === 1 ? 'ítem' : 'ítems'}
                  </span>
                </div>
              </div>

              {/* Tarjetas por Categoría Real */}
              {categoryStats.map(cat => {
                const meta = getCategoryVisualMeta(cat.name);
                const isSelected = selectedCategory === cat.name;
                const thumb = cat.thumbnailUrl ? formatPhotoUrl(cat.thumbnailUrl) : '';

                return (
                  <div
                    key={`cat-hub-${cat.name}`}
                    className="marketplace-cat-card"
                    onClick={() => setSelectedCategory(cat.name)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? 'var(--brand-primary-light, #EFF6FF)' : '#FFFFFF',
                      border: isSelected
                        ? '2px solid var(--brand-primary, #1A73E8)'
                        : '1px solid #E2E8F0',
                      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '11px',
                      backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                      border: '1px solid var(--brand-primary-border, #BFDBFE)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img
                        src={thumb || DEFAULT_CATEGORY_IMAGE}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        fontSize: '0.84rem',
                        fontWeight: 900,
                        color: '#0F172A',
                        margin: 0,
                        lineHeight: 1.2,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {cat.name}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary, #1A73E8)', fontWeight: 800 }}>
                        {cat.count} {cat.count === 1 ? 'ítem' : 'ítems'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECCIÓN DE DESTACADOS (En PC dentro de contenedor estilizado; en Móvil suelta a ancho completo) */}
        {featuredProducts.length > 0 && isHomeBrowseMode && (
          <section
            id="featured-products-section"
            className="marketplace-featured-box"
            style={{ marginBottom: '32px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    Más Vendidos y Destacados
                  </h3>
                  <span className="desktop-only" style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                    Los productos preferidos por nuestros clientes en Las Tunas
                  </span>
                </div>
              </div>

              <span className="desktop-only" style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary-dark, #1E3A8A)',
                border: '1px solid var(--brand-primary-border, #BFDBFE)',
                padding: '4px 12px',
                borderRadius: '9999px'
              }}>
                Selección Destacada
              </span>
            </div>

            <div className="store-product-grid">
              {featuredProducts.map(product => {
                const inCart = cart.find(item => item.product.id === product.id);
                return (
                  <PublicProductCard
                    key={`feat-card-${product.id}`}
                    product={product}
                    cartQuantity={inCart?.quantity || 0}
                    isFeatured={true}
                    displayCurrency={displayCurrency}
                    exchangeRateUSD={exchangeRateUSD}
                    usdIndexedPricing={usdIndexedPricing}
                    showDualCurrency={hasDualCurrencyProducts}
                    onOpenDetail={handleOpenProductModal}
                    onAddToCart={handleOpenAddToCartSheet}
                    onUpdateCartQty={updateQuantity}
                    onSelectCategory={cat => setSelectedCategory(cat)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* VITRINAS POR CATEGORÍA (En PC enmarcadas; en Móvil sueltas para dar máximo espacio a los productos) */}
        {isHomeBrowseMode && categoryStats.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '36px' }}>
            {categoryStats.slice(0, 4).map(cat => {
              const catProducts = products.filter(p => p.category === cat.name).slice(0, 5);
              if (catProducts.length === 0) return null;
              const meta = getCategoryVisualMeta(cat.name);

              return (
                <section
                  key={`shelf-dept-${cat.name}`}
                  className="marketplace-section-box"
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                        border: '1px solid var(--brand-primary-border, #BFDBFE)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        <img
                          src={cat.thumbnailUrl ? formatPhotoUrl(cat.thumbnailUrl) : DEFAULT_CATEGORY_IMAGE}
                          alt={cat.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_CATEGORY_IMAGE; }}
                        />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'capitalize' }}>
                            {cat.name}
                          </h3>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                            color: 'var(--brand-primary-dark, #1E3A8A)',
                            padding: '2px 7px',
                            borderRadius: '9999px'
                          }}>
                            {cat.count}
                          </span>
                        </div>
                        <span className="desktop-only" style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          {getCategorySeoDescription(cat.name)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        const anchor = document.getElementById('marketplace-catalog-anchor');
                        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      style={{
                        backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                        color: 'var(--brand-primary-dark, #1E3A8A)',
                        border: '1px solid var(--brand-primary-border, #BFDBFE)',
                        borderRadius: '9999px',
                        padding: '6px 12px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                    >
                      <span>Ver todos</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="store-product-grid">
                    {catProducts.map(product => {
                      const inCart = cart.find(item => item.product.id === product.id);
                      return (
                        <PublicProductCard
                          key={`shelf-${cat.name}-${product.id}`}
                          product={product}
                          cartQuantity={inCart?.quantity || 0}
                          displayCurrency={displayCurrency}
                          exchangeRateUSD={exchangeRateUSD}
                          usdIndexedPricing={usdIndexedPricing}
                          onOpenDetail={handleOpenProductModal}
                          onAddToCart={handleOpenAddToCartSheet}
                          onUpdateCartQty={updateQuantity}
                          onSelectCategory={c => setSelectedCategory(c)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* EXPLORADOR COMPLETO DEL CATÁLOGO */}
        <div id="marketplace-catalog-anchor" style={{ scrollMarginTop: '120px' }}>
          {/* Banner de Categoría Seleccionada (Solo PC muestra texto largo; Móvil muestra chip limpio) */}
          {selectedCategory !== 'todas' && (
            <div style={{
              marginBottom: '14px',
              padding: '12px 16px',
              borderRadius: '14px',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              color: 'var(--brand-primary-dark, #1E3A8A)',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              border: '1px solid var(--brand-primary-border, #BFDBFE)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                <span className="desktop-only">{getCategorySeoDescription(selectedCategory)}</span>
                <span className="mobile-only" style={{ textTransform: 'capitalize', fontWeight: 800 }}>
                  Filtrando por: {selectedCategory}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('todas')}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--brand-primary, #1A73E8)',
                  border: '1px solid var(--brand-primary-border, #BFDBFE)',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Ver todo ✕
              </button>
            </div>
          )}

          {/* Barra de Herramientas de Ordenamiento y Filtros */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A', margin: 0, textTransform: 'capitalize' }}>
                {selectedCategory === 'todas' ? 'Todos los Productos' : selectedCategory}
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary-dark, #1E3A8A)',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {filteredProducts.length}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Toggle Solo en Stock (En PC visible aquí; en Móvil está en el Menú Lateral ☰) */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className="desktop-flex"
                style={{
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: onlyInStock ? '1.5px solid var(--brand-primary, #1A73E8)' : '1px solid #CBD5E1',
                  backgroundColor: onlyInStock ? 'var(--brand-primary-light, #EFF6FF)' : '#F8FAFC',
                  color: onlyInStock ? 'var(--brand-primary-dark, #1E3A8A)' : '#475569',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={13} />
                <span>Solo disponibles</span>
              </button>

              {/* Selector de Ordenamiento */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={13} color="#64748B" />
                <span className="desktop-only" style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 700 }}>Ordenar:</span>
                <select
                  aria-label="Ordenar productos"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '9999px',
                    padding: '6px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="featured">Relevancia</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="rating">Mejor valorados</option>
                  <option value="name">Nombre (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid de Productos */}
          {filteredProducts.length === 0 ? (
            <div className="md-card" style={{ textAlign: 'center', padding: '48px 20px', maxWidth: '440px', margin: '28px auto', borderRadius: '22px', backgroundColor: '#FFFFFF' }}>
              <ShoppingBag size={44} style={{ color: '#94A3B8', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                No se encontraron productos
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '6px', marginBottom: '16px' }}>
                Prueba con otra categoría o limpia tu búsqueda.
              </p>
              <button
                type="button"
                onClick={handleResetAllFilters}
                style={{
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '10px 20px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={14} />
                <span>Ver Todo el Catálogo</span>
              </button>
            </div>
          ) : (
            <div className="store-product-grid">
              {filteredProducts.map(product => {
                const inCart = cart.find(item => item.product.id === product.id);
                return (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={inCart?.quantity || 0}
                    displayCurrency={displayCurrency}
                    exchangeRateUSD={exchangeRateUSD}
                    usdIndexedPricing={usdIndexedPricing}
                    showDualCurrency={hasDualCurrencyProducts}
                    onOpenDetail={handleOpenProductModal}
                    onAddToCart={handleOpenAddToCartSheet}
                    onUpdateCartQty={updateQuantity}
                    onSelectCategory={cat => setSelectedCategory(cat)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Vista Rápida / Detalle en 2 Columnas */}
        <ProductDetailModal
          product={selectedProductForModal}
          onClose={handleCloseProductModal}
          onAddToCart={handleOpenAddToCartSheet}
          onSelectProduct={handleSelectProductInModal}
          allProducts={products}
          currency={displayCurrency}
          isAdmin={false}
        />
      </main>

      {/* 5. Barra Flotante Inferior de Carrito Activo */}
      {totalCartCount > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          backgroundColor: 'var(--brand-primary-darker, #0B1528)',
          color: '#FFFFFF',
          borderTop: '1px solid rgba(255, 255, 255, 0.14)',
          padding: '12px 16px',
          boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.25)',
          zIndex: 90
        }}>
          <div className="store-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700 }}>
                Carrito ({totalCartCount} {totalCartCount === 1 ? 'ítem' : 'ítems'})
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF' }}>
                {formatCurrency(totalCartPrice, displayCurrency, true)}{' '}
                <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary-accent, #7DD3FC)', fontWeight: 800 }}>{displayCurrency}</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="desktop-flex"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer'
                }}
              >
                Ver Carrito
              </button>

              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                style={{
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={18} />
                <span>Encargar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Sheet de Selección de Cantidad al Agregar */}
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

      {/* 7. Drawer Completo del Carrito */}
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

      {/* 8. Footer Profesional Responsivo (con espacio extra para evitar solapamiento de la barra de carrito con el mismo color del fondo del footer) */}
      <div style={{
        backgroundColor: 'var(--brand-primary-darker, #0B1528)',
        paddingBottom: (totalCartCount > 0 && !isCartOpen) ? '96px' : '0'
      }}>
        <PublicStoreFooter
          categories={categoryStats}
          totalProducts={products.length}
          totalCartCount={totalCartCount}
          exchangeRateUSD={exchangeRateUSD}
          isInstalled={isInstalled}
          onSelectCategory={cat => setSelectedCategory(cat)}
          onResetFilters={handleResetAllFilters}
          onFeaturedClick={() => {
            handleResetAllFilters();
            setTimeout(() => {
              const el = document.getElementById('featured-products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }}
          onInStockClick={() => setOnlyInStock(true)}
          onOpenCart={() => setIsCartOpen(true)}
          onInstallPwa={handleInstallPwa}
          onDirectWhatsApp={handleDirectWhatsAppContact}
          onOpenCubasoftModal={() => setIsCubasoftModalOpen(true)}
          helpModalSection={helpModalSection}
          setHelpModalSection={setHelpModalSection}
        />
      </div>

      {/* 9. Modal Corporativo Cubasoft ERP */}
      <CubasoftInfoModal
        isOpen={isCubasoftModalOpen}
        onClose={() => setIsCubasoftModalOpen(false)}
      />

      {/* 10. Home Page Schema JSON-LD */}
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
            "currenciesAccepted": "CUP, USD",
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
