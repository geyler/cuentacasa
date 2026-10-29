'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  MessageCircle,
  X,
  Layers,
  CheckCircle2,
  HelpCircle,
  Truck,
  Menu,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  LogIn,
  User
} from 'lucide-react';
import { formatCurrency } from '@/lib/invoice';
import { getCategoryVisualMeta } from '@/lib/seoHelper';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { getStoreCustomizationSettings, StoreCustomizationSettings } from '@/lib/storage';

export interface CategoryStatItem {
  name: string;
  count: number;
  thumbnailUrl?: string;
}

interface PublicStoreHeaderBarProps {
  totalCartCount: number;
  totalCartPrice?: number;
  cartDisplayCurrency?: 'CUP' | 'USD';
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isUserLoggedIn: boolean;
  onResetFilters: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  categories?: CategoryStatItem[];
  onlyInStock?: boolean;
  setOnlyInStock?: (val: boolean) => void;
  displayCurrency?: 'CUP' | 'USD';
  onToggleDisplayCurrency?: (curr: 'CUP' | 'USD') => void;
  showCurrencySelector?: boolean;
  exchangeRateUSD?: number;
  onWhatsAppClick?: () => void;
  onFeaturedClick?: () => void;
  onHowToBuyClick?: () => void;
}

export const PublicStoreHeaderBar: React.FC<PublicStoreHeaderBarProps> = ({
  totalCartCount,
  totalCartPrice = 0,
  cartDisplayCurrency = 'CUP',
  isCartOpen,
  setIsCartOpen,
  isUserLoggedIn,
  onResetFilters,
  searchTerm = '',
  setSearchTerm,
  selectedCategory = 'todas',
  onSelectCategory,
  categories = [],
  onlyInStock = false,
  setOnlyInStock,
  displayCurrency = 'CUP',
  onToggleDisplayCurrency,
  showCurrencySelector = false,
  exchangeRateUSD = 320,
  onWhatsAppClick,
  onFeaturedClick,
  onHowToBuyClick
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customization, setCustomization] = useState(() => getStoreCustomizationSettings());

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setCustomization(e.detail);
      } else {
        setCustomization(getStoreCustomizationSettings());
      }
    };
    window.addEventListener('cuentacasa-store-customization-changed', handler);
    return () => window.removeEventListener('cuentacasa-store-customization-changed', handler);
  }, []);

  useLockBodyScroll(isMobileMenuOpen, () => setIsMobileMenuOpen(false));

  return (
    <>
      <header style={{
        backgroundColor: 'var(--brand-primary-darker, #0B1528)',
        color: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.2)'
      }}>
        {/* NIVEL 1: Barra Principal */}
        <div style={{
          backgroundColor: 'var(--brand-primary-darker, #0B1528)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div className="store-container" style={{
            paddingTop: '10px',
            paddingBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Izquierda: Botón Menú Móvil (☰) + Logo + Ubicación (Solo PC) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="mobile-flex"
                  aria-label="Abrir menú de navegación"
                  onClick={() => setIsMobileMenuOpen(true)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0
                  }}
                >
                  <Menu size={20} />
                </button>

                <div
                  onClick={onResetFilters}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
                  {customization.logoMode === 'wide_logo' ? (
                    <img
                      src={customization.logoWideUrl || customization.logoSquareUrl || '/images/logo-nav.png'}
                      alt={customization.storeName}
                      style={{
                        maxHeight: '38px',
                        maxWidth: '220px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <>
                      {(customization.logoMode === 'both' || customization.logoMode === 'logo_only') && (
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: '#FFFFFF',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                          flexShrink: 0
                        }}>
                          <img
                            src={customization.logoSquareUrl || '/images/logo-nav.png'}
                            alt={customization.storeName}
                            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      {(customization.logoMode === 'both' || customization.logoMode === 'text_only') && (
                        <h1 className="font-logo-script" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#FFFFFF', lineHeight: '1', margin: 0 }}>
                          {customization.storeName}
                        </h1>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Centro (Solo PC): Buscador Integrado con Selector de Categoría */}
              {setSearchTerm && (
                <div className="desktop-only" style={{ flex: 1, maxWidth: '640px', margin: '0 12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)'
                  }}>
                    {onSelectCategory && categories.length > 0 && (
                      <select
                        aria-label="Filtrar por categoría"
                        value={selectedCategory}
                        onChange={e => onSelectCategory(e.target.value)}
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          border: 'none',
                          borderRight: '1px solid #E2E8F0',
                          padding: '11px 12px 11px 16px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          outline: 'none',
                          maxWidth: '150px',
                          textTransform: 'capitalize'
                        }}
                      >
                        <option value="todas">Todos ({categories.reduce((acc, c) => acc + c.count, 0)})</option>
                        {categories.map(cat => (
                          <option key={`hdr-sel-${cat.name}`} value={cat.name}>
                            {cat.name} ({cat.count})
                          </option>
                        ))}
                      </select>
                    )}

                    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                      <input
                        id="store-desktop-search-input"
                        type="text"
                        placeholder="Buscar productos, marcas y categorías en Samy Store..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 16px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#0F172A',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          title="Limpiar búsqueda"
                          style={{
                            position: 'absolute',
                            right: '8px',
                            background: '#E2E8F0',
                            border: 'none',
                            color: '#475569',
                            width: '22px',
                            height: '22px',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label="Buscar"
                      style={{
                        backgroundColor: 'var(--brand-primary, #1A73E8)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 900
                      }}
                    >
                      <Search size={19} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}

              {/* Derecha: Moneda CUP/USD (solo si hay productos en doble moneda), WhatsApp (PC), Carrito y Admin (PC) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Selector Moneda CUP / USD */}
                {showCurrencySelector && onToggleDisplayCurrency && (
                  <div
                    title={`Tasa activa: 1 USD = ${exchangeRateUSD} CUP`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '3px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255, 255, 255, 0.16)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleDisplayCurrency('CUP')}
                      style={{
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 9px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        backgroundColor: displayCurrency === 'CUP' ? 'var(--brand-primary, #1A73E8)' : 'transparent',
                        color: '#FFFFFF',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      CUP
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDisplayCurrency('USD')}
                      style={{
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 9px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        backgroundColor: displayCurrency === 'USD' ? 'var(--brand-primary, #1A73E8)' : 'transparent',
                        color: '#FFFFFF',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      USD
                    </button>
                  </div>
                )}

                {/* Contacto Directo WhatsApp (Solo PC) */}
                {onWhatsAppClick && (
                  <button
                    onClick={onWhatsAppClick}
                    className="desktop-flex"
                    title="Atención y pedidos por WhatsApp"
                    style={{
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={15} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                    <span>WhatsApp</span>
                  </button>
                )}

                {/* Botón de Carrito */}
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  title="Ver Carrito de Compras"
                  style={{
                    position: 'relative',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.24)',
                    backgroundColor: totalCartCount > 0
                      ? 'var(--brand-primary, #1A73E8)'
                      : 'rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <ShoppingBag size={18} strokeWidth={2.3} />
                    {totalCartCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-7px',
                        right: '-9px',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--brand-primary-darker, #0B1528)',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 4px',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                      }}>
                        {totalCartCount}
                      </span>
                    )}
                  </div>

                  {totalCartCount > 0 ? (
                    <span className="desktop-only" style={{ fontSize: '0.84rem', fontWeight: 900, marginLeft: '4px' }}>
                      {formatCurrency(totalCartPrice, cartDisplayCurrency, true)}{' '}
                      <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>{cartDisplayCurrency}</span>
                    </span>
                  ) : (
                    <span className="desktop-only" style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                      Carrito
                    </span>
                  )}
                </button>

                {/* Acceso al Sistema ERP / Iniciar Sesión (Sin candado, claro y accesible) */}
                <a
                  href="/app"
                  title={isUserLoggedIn ? 'Ir al Panel Administrativo' : 'Iniciar Sesión / Acceso'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.28)',
                    backgroundColor: isUserLoggedIn ? 'var(--brand-primary, #1A73E8)' : 'rgba(255, 255, 255, 0.14)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    backdropFilter: 'blur(8px)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {isUserLoggedIn ? <LayoutDashboard size={15} /> : <LogIn size={15} />}
                  <span>{isUserLoggedIn ? 'Ir al Panel' : 'Acceder'}</span>
                </a>
              </div>
            </div>

            {/* Buscador Integrado Móvil */}
            {setSearchTerm && (
              <div className="mobile-only" style={{ width: '100%' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)'
                }}>
                  <Search size={17} style={{ marginLeft: '14px', flexShrink: 0, color: 'var(--brand-primary, #1A73E8)' }} />
                  <input
                    id="store-hero-search-input"
                    type="text"
                    placeholder="Buscar en Samy Store..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#0F172A',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        background: '#E2E8F0',
                        border: 'none',
                        color: '#475569',
                        width: '22px',
                        height: '22px',
                        borderRadius: '9999px',
                        marginRight: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NIVEL 2: Sub-barra de Categorías (Fija y Estable, navegación fluida sin saltos ni pestañeos) */}
        <div style={{
          backgroundColor: 'var(--brand-primary-subtle-dark, #162440)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div
            className="store-container no-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              overflowX: 'auto',
              paddingTop: '6px',
              paddingBottom: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onSelectCategory) onSelectCategory('todas');
                  if (setSearchTerm) setSearchTerm('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  border: selectedCategory === 'todas' ? '1px solid var(--brand-primary-accent, #7DD3FC)' : '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: selectedCategory === 'todas' ? 'var(--brand-primary, #1A73E8)' : 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Layers size={13} />
                <span>Todas</span>
              </button>

              {setOnlyInStock && (
                <button
                  type="button"
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className="desktop-flex"
                  style={{
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    borderRadius: '9999px',
                    border: onlyInStock ? '1px solid var(--brand-primary-accent, #7DD3FC)' : '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: onlyInStock ? 'var(--brand-primary, #1A73E8)' : 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>En Stock</span>
                </button>
              )}

              {categories.map(cat => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={`subnav-cat-${cat.name}`}
                    type="button"
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(cat.name);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: isSelected ? '1px solid var(--brand-primary-accent, #7DD3FC)' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSelected ? 'var(--brand-primary, #1A73E8)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 800 : 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      opacity: 0.8,
                      backgroundColor: 'rgba(255,255,255,0.14)',
                      padding: '0 5px',
                      borderRadius: '9999px'
                    }}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Enlaces Rápidos Derecha (Solo PC) */}
            <div className="desktop-flex" style={{ alignItems: 'center', gap: '14px', flexShrink: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#CBD5E1', fontWeight: 700 }}>
                <Truck size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                Envíos a Domicilio
              </span>
              {onHowToBuyClick && (
                <button
                  type="button"
                  onClick={onHowToBuyClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary-accent, #7DD3FC)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <HelpCircle size={13} />
                  <span>¿Cómo comprar?</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MENÚ LATERAL MÓVIL (DRAWER ☰) — Oculta opciones secundarias en pantallas pequeñas */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2700,
            display: 'flex'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '84%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '12px 0 36px rgba(0, 0, 0, 0.28)',
              overflowY: 'auto'
            }}
          >
            {/* Cabecera del Menú Lateral */}
            <div style={{
              backgroundColor: 'var(--brand-primary-darker, #0B1528)',
              color: '#FFFFFF',
              padding: '18px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {customization.logoMode === 'wide_logo' ? (
                  <img
                    src={customization.logoWideUrl || customization.logoSquareUrl || '/images/logo-nav.png'}
                    alt={customization.storeName}
                    style={{ maxHeight: '34px', maxWidth: '180px', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    {(customization.logoMode === 'both' || customization.logoMode === 'logo_only') && (
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <img src={customization.logoSquareUrl || '/images/logo-nav.png'} alt={customization.storeName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                    {(customization.logoMode === 'both' || customization.logoMode === 'text_only') && (
                      <div className="font-logo-script" style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
                        {customization.storeName}
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido del Menú Móvil */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              {/* Filtros Rápidos */}
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  Exploración Rápida
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: selectedCategory === 'todas' ? 'var(--brand-primary-light, #EFF6FF)' : '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                      Todo el Catálogo
                    </span>
                    <ChevronRight size={15} color="#94A3B8" />
                  </button>

                  {onFeaturedClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onFeaturedClick();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                        Productos Destacados
                      </span>
                      <ChevronRight size={15} color="#94A3B8" />
                    </button>
                  )}

                  {setOnlyInStock && (
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyInStock(!onlyInStock);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: onlyInStock ? '1.5px solid var(--brand-primary, #1A73E8)' : '1px solid #E2E8F0',
                        backgroundColor: onlyInStock ? 'var(--brand-primary-light, #EFF6FF)' : '#F8FAFC',
                        color: '#0F172A',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                        Solo Disponibles en Stock
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand-primary, #1A73E8)' }}>
                        {onlyInStock ? 'ACTIVO' : 'FILTRAR'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Categorías del Inventario */}
              {categories.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Categorías ({categories.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {categories.map(cat => {
                      const meta = getCategoryVisualMeta(cat.name);
                      const isSel = selectedCategory === cat.name;
                      return (
                        <button
                          key={`mob-drawer-cat-${cat.name}`}
                          type="button"
                          onClick={() => {
                            if (onSelectCategory) onSelectCategory(cat.name);
                            setIsMobileMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: isSel ? 'var(--brand-primary-light, #EFF6FF)' : 'transparent',
                            color: isSel ? 'var(--brand-primary, #1A73E8)' : '#334155',
                            fontWeight: isSel ? 900 : 700,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                        >
                          <span>{meta.emoji} {cat.name}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            fontWeight: 800
                          }}>
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ayuda y Administración */}
              <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {onHowToBuyClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onHowToBuyClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <HelpCircle size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                    <span>¿Cómo comprar en Samy Store?</span>
                  </button>
                )}

                {onWhatsAppClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onWhatsAppClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--brand-primary-border, #BFDBFE)',
                      backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                      color: 'var(--brand-primary-dark, #1E3A8A)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <MessageCircle size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                    <span>Atención por WhatsApp</span>
                  </button>
                )}

                <a
                  href="/app"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textDecoration: 'none'
                  }}
                >
                  {isUserLoggedIn ? <LayoutDashboard size={16} /> : <LogIn size={16} />}
                  <span>{isUserLoggedIn ? 'Ir al Panel de Administración' : 'Acceder / Iniciar Sesión'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
