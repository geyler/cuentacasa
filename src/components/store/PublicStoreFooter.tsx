'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  MessageCircle,
  Zap,
  Globe,
  Lock,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowUp,
  Clock,
  ShoppingBag,
  Share2,
  Smartphone,
  HelpCircle,
  CreditCard,
  CheckCircle2,
  X,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getCategoryVisualMeta } from '@/lib/seoHelper';
import { getLoggedInUser } from '@/lib/storage';
import { CategoryStatItem } from './PublicStoreHeaderBar';

interface PublicStoreFooterProps {
  categories: CategoryStatItem[];
  totalProducts: number;
  totalCartCount: number;
  exchangeRateUSD: number;
  isInstalled: boolean;
  onSelectCategory: (cat: string) => void;
  onResetFilters: () => void;
  onFeaturedClick: () => void;
  onInStockClick: () => void;
  onOpenCart: () => void;
  onInstallPwa: () => void;
  onDirectWhatsApp: () => void;
  onOpenCubasoftModal: () => void;
  helpModalSection?: 'como-comprar' | 'envios' | 'pagos' | 'faq' | null;
  setHelpModalSection?: (sec: 'como-comprar' | 'envios' | 'pagos' | 'faq' | null) => void;
}

export const PublicStoreFooter: React.FC<PublicStoreFooterProps> = ({
  categories,
  totalProducts,
  totalCartCount,
  exchangeRateUSD,
  isInstalled,
  onSelectCategory,
  onResetFilters,
  onFeaturedClick,
  onInStockClick,
  onOpenCart,
  onInstallPwa,
  onDirectWhatsApp,
  onOpenCubasoftModal,
  helpModalSection: externalHelpSection,
  setHelpModalSection: setExternalHelpSection
}) => {
  const [internalHelpSection, setInternalHelpSection] = useState<'como-comprar' | 'envios' | 'pagos' | 'faq' | null>(null);
  const [copiedStoreUrl, setCopiedStoreUrl] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);
  const isUserLoggedIn = typeof window !== 'undefined' && !!getLoggedInUser();

  const activeHelpSection = externalHelpSection !== undefined ? externalHelpSection : internalHelpSection;
  const setActiveHelpSection = setExternalHelpSection || setInternalHelpSection;

  const toggleAccordion = (id: string) => {
    setOpenMobileAccordion(prev => (prev === id ? null : id));
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('marketplace-catalog-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  };

  const handleShareStore = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.origin;
    const text = '🛍️ Visita Samy Store Las Tunas: Catálogo online con precios en CUP y USD y pedidos directos por WhatsApp.';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Samy Store Las Tunas', text, url });
      } catch {
        // Cancelado
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopiedStoreUrl(true);
      setTimeout(() => setCopiedStoreUrl(false), 3000);
    }
  };

  const paymentMethods = [
    '💵 Efectivo CUP',
    '💲 Efectivo USD',
    '📲 Transfermóvil',
    '💳 EnZona',
    '🤝 Pago en Entrega'
  ];

  return (
    <footer style={{
      backgroundColor: 'var(--brand-primary-darker, #0B1528)',
      color: '#F8FAFC',
      marginTop: 'auto',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* NIVEL 1: Barra Interactiva "Volver arriba" */}
      <button
        type="button"
        onClick={scrollToTop}
        style={{
          width: '100%',
          backgroundColor: 'var(--brand-primary-subtle-dark, #162440)',
          color: '#E2E8F0',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 16px',
          fontSize: '0.82rem',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <ArrowUp size={15} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
        <span>Volver al inicio de la página</span>
      </button>

      {/* NIVEL 2: Garantías de Compra (4 Tarjetas en PC / Píldoras Compactas en Móvil) + Banner de Contacto/App */}
      <div style={{
        backgroundColor: 'var(--brand-primary-darker, #0B1528)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="store-container" style={{ paddingTop: '28px', paddingBottom: '26px' }}>
          {/* Vista PC: 4 Tarjetas Completas de Garantías */}
          <div className="desktop-only" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {[
                {
                  icon: <Truck size={20} />,
                  title: 'Entregas a Domicilio',
                  desc: 'Despacho ágil a tu puerta o recogida directa en tienda sin esperas.'
                },
                {
                  icon: <MessageCircle size={20} />,
                  title: 'Pedido Directo WhatsApp',
                  desc: 'Arma tu carrito en segundos y encarga sin registros ni contraseñas.'
                },
                {
                  icon: <Sparkles size={20} />,
                  title: 'Precios en CUP y USD',
                  desc: `Conversión transparente a tasa actualizada (1 USD = ${exchangeRateUSD} CUP).`
                },
                {
                  icon: <ShieldCheck size={20} />,
                  title: 'Garantía & Stock Real',
                  desc: 'Inventario sincronizado en tiempo real y atención de Lunes a Domingo.'
                }
              ].map(item => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--brand-primary-accent, #7DD3FC)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '3px' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.76rem', color: '#94A3B8', lineHeight: '1.42', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Unificado de Atención y Contacto */}
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary-dark, #1E3A8A) 0%, var(--brand-primary, #1A73E8) 100%)',
            borderRadius: '20px',
            padding: '20px 22px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ maxWidth: '580px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px 0' }}>
                Atención Directa y Pedidos Inmediatos
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                Consulta existencias en almacén o pide tus productos por WhatsApp con entrega en toda la ciudad.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onDirectWhatsApp}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--brand-primary-darker, #0B1528)',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={16} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
                <span>Contactar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NIVEL 3: Navegación Principal (5 Columnas en PC / Acordeones Compactos en Móvil) */}
      <div className="store-container" style={{ paddingTop: '36px', paddingBottom: '28px' }}>
        {/* Identidad de Marca (Visible tanto en PC como en Móvil arriba de los acordeones) */}
        <div className="mobile-only" style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
            </div>
            <span className="font-logo-script" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
              Samy Store
            </span>
          </div>
        </div>

        {/* VISTA MÓVIL (< 768px): Acordeones Colapsables para no alargar el scroll en teléfonos */}
        <div className="mobile-only" style={{ marginBottom: '20px' }}>
          {/* Acordeón 1: Categorías */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('depts')}
              style={{
                width: '100%',
                padding: '13px 4px',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span>Categorías ({categories.length})</span>
              {openMobileAccordion === 'depts' ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openMobileAccordion === 'depts' && (
              <div style={{ padding: '4px 4px 14px 4px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onResetFilters();
                    scrollToCatalog();
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Todo ({totalProducts})
                </button>
                {categories.map(cat => (
                  <button
                    key={`mob-f-cat-${cat.name}`}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      scrollToCatalog();
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#CBD5E1',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Acordeón 2: Centro de Ayuda */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('help')}
              style={{
                width: '100%',
                padding: '13px 4px',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span>Ayuda y Cómo Comprar</span>
              {openMobileAccordion === 'help' ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openMobileAccordion === 'help' && (
              <div style={{ padding: '4px 4px 14px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="button" onClick={() => setActiveHelpSection('como-comprar')} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'left', padding: 0 }}>
                  • ¿Cómo comprar paso a paso?
                </button>
                <button type="button" onClick={() => setActiveHelpSection('envios')} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'left', padding: 0 }}>
                  • Envíos y entregas en Las Tunas
                </button>
                <button type="button" onClick={() => setActiveHelpSection('pagos')} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'left', padding: 0 }}>
                  • Monedas y formas de pago (CUP / USD)
                </button>
                <button type="button" onClick={() => setActiveHelpSection('faq')} style={{ background: 'none', border: 'none', color: '#CBD5E1', fontSize: '0.82rem', textAlign: 'left', padding: 0 }}>
                  • Preguntas frecuentes (FAQ)
                </button>
              </div>
            )}
          </div>

          {/* Acordeón 3: Medios de Pago y Sistema */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('payments')}
              style={{
                width: '100%',
                padding: '13px 4px',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span>Medios de Pago & Tecnología</span>
              {openMobileAccordion === 'payments' ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
            {openMobileAccordion === 'payments' && (
              <div style={{ padding: '4px 4px 14px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {paymentMethods.map(pm => (
                    <span
                      key={pm}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#E2E8F0'
                      }}
                    >
                      {pm}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                  <a
                    href="https://cubasoft.net"
                    target="_blank"
                    rel="follow"
                    style={{
                      color: 'var(--brand-primary-accent, #7DD3FC)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      textDecoration: 'none'
                    }}
                  >
                    Conoce Cubasoft.net →
                  </a>
                  <Link href="/app" style={{ color: '#CBD5E1', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none' }}>
                    {isUserLoggedIn ? 'Ir al Panel' : 'Acceder / Iniciar Sesión'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VISTA ESCRITORIO (>= 768px): Matriz Completa de 5 Columnas */}
        <div className="desktop-only">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: '28px',
            marginBottom: '32px'
          }}>
            {/* COLUMNA 1: Identidad Oficial Samy Store */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                </div>
                <span className="font-logo-script" style={{ fontSize: '1.7rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  Samy Store
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.58', margin: '0 0 14px 0' }}>
                Tu mercado online y tienda física en Las Tunas, Cuba. Artículos seleccionados con stock real y entregas a domicilio.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.76rem', color: '#CBD5E1', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <MapPin size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                  <span>Las Tunas, Cuba</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Clock size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                  <span>Lun – Dom: 8:00 AM – 8:00 PM</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                  <span>{totalProducts} productos activos</span>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: Categorías Dinámicas */}
            <div>
              <h4 style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid var(--brand-primary, #1A73E8)',
                display: 'inline-block',
                paddingBottom: '4px'
              }}>
                Categorías
              </h4>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      scrollToCatalog();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#E2E8F0',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Layers size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                    <span>Todo el Catálogo ({totalProducts})</span>
                  </button>
                </li>

                {categories.slice(0, 6).map(cat => {
                  const meta = getCategoryVisualMeta(cat.name);
                  return (
                    <li key={`footer-cat-${cat.name}`}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.name);
                          scrollToCatalog();
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#94A3B8',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%'
                        }}
                      >
                        <span>{meta.emoji} {cat.name}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#CBD5E1',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          fontWeight: 700
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* COLUMNA 3: Centro de Ayuda */}
            <div>
              <h4 style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid var(--brand-primary, #1A73E8)',
                display: 'inline-block',
                paddingBottom: '4px'
              }}>
                Centro de Ayuda
              </h4>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[
                  { key: 'como-comprar' as const, icon: <HelpCircle size={13} />, label: '¿Cómo comprar paso a paso?' },
                  { key: 'envios' as const, icon: <Truck size={13} />, label: 'Envíos en Las Tunas' },
                  { key: 'pagos' as const, icon: <CreditCard size={13} />, label: 'Monedas y Formas de Pago' },
                  { key: 'faq' as const, icon: <Sparkles size={13} />, label: 'Preguntas Frecuentes (FAQ)' }
                ].map(item => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setActiveHelpSection(item.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#CBD5E1',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ color: 'var(--brand-primary-accent, #7DD3FC)', display: 'flex' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={onDirectWhatsApp}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--brand-primary-accent, #7DD3FC)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>Soporte por WhatsApp</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMNA 4: Mi Compra & Herramientas */}
            <div>
              <h4 style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid var(--brand-primary, #1A73E8)',
                display: 'inline-block',
                paddingBottom: '4px'
              }}>
                Mi Compra & App
              </h4>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <li>
                  <button
                    type="button"
                    onClick={onOpenCart}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShoppingBag size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                    <span>Mi Carrito ({totalCartCount})</span>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onInStockClick();
                      scrollToCatalog();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                    <span>Productos en Stock</span>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={handleShareStore}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#CBD5E1',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Share2 size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                    <span>{copiedStoreUrl ? '¡Enlace Copiado!' : 'Compartir Tienda'}</span>
                  </button>
                </li>

                <li style={{ marginTop: '6px' }}>
                  <Link
                    href="/app"
                    style={{
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      backgroundColor: isUserLoggedIn ? 'var(--brand-primary, #1A73E8)' : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.22)'
                    }}
                  >
                    <span>{isUserLoggedIn ? 'Ir al Panel' : 'Acceder al Sistema'}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMNA 5: Medios de Pago & Tecnología */}
            <div>
              <h4 style={{
                fontSize: '0.82rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid var(--brand-primary, #1A73E8)',
                display: 'inline-block',
                paddingBottom: '4px'
              }}>
                Medios de Pago
              </h4>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {paymentMethods.map(pm => (
                  <span
                    key={pm}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 9px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#E2E8F0'
                    }}
                  >
                    {pm}
                  </span>
                ))}
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600, lineHeight: '1.4', marginBottom: '8px' }}>
                  Impulsado por <a href="https://cubasoft.net" target="_blank" rel="follow" style={{ color: '#FFFFFF', fontWeight: 800, textDecoration: 'none' }}>Cubasoft ERP</a>.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={onOpenCubasoftModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--brand-primary-accent, #7DD3FC)',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Zap size={12} /> Conoce Cubasoft ERP
                  </button>
                  <a
                    href="https://cubasoft.net"
                    target="_blank"
                    rel="follow"
                    style={{
                      color: '#94A3B8',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Globe size={12} /> cubasoft.net
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NIVEL 4: Barra Inferior Legal y Versión */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          fontSize: '0.76rem',
          color: '#94A3B8',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>
              © {new Date().getFullYear()} <strong style={{ color: '#FFFFFF' }}>Samy Store</strong>. Todos los derechos reservados.
            </span>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              v1.7.5
            </span>
          </div>

          <span>
            Las Tunas, Cuba • Tecnología <a href="https://cubasoft.net" target="_blank" rel="follow" style={{ color: '#FFFFFF', fontWeight: 800, textDecoration: 'none' }}>Cubasoft</a>
          </span>
        </div>
      </div>

      {/* Modal Informativo del Centro de Ayuda */}
      {activeHelpSection && (
        <div
          onClick={() => setActiveHelpSection(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 2800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {activeHelpSection === 'como-comprar' && '¿Cómo Comprar en Samy Store?'}
                {activeHelpSection === 'envios' && 'Envíos y Entregas en Las Tunas'}
                {activeHelpSection === 'pagos' && 'Monedas y Métodos de Pago'}
                {activeHelpSection === 'faq' && 'Preguntas Frecuentes'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveHelpSection(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#0F172A'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {activeHelpSection === 'como-comprar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: 'var(--brand-primary-light, #EFF6FF)', border: '1px solid var(--brand-primary-border, #BFDBFE)' }}>
                  <strong style={{ color: 'var(--brand-primary-dark, #1E3A8A)', display: 'block', marginBottom: '2px' }}>Paso 1: Explora las Categorías</strong>
                  Navega por las categorías o usa el buscador superior. Puedes ver precios en CUP o USD.
                </div>
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <strong style={{ color: 'var(--brand-primary-dark, #1E3A8A)', display: 'block', marginBottom: '2px' }}>Paso 2: Agrega a tu Carrito</strong>
                  Toca el botón <strong>+</strong> en cada producto para elegir la cantidad deseada.
                </div>
                <div style={{ padding: '12px 14px', borderRadius: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <strong style={{ color: 'var(--brand-primary-dark, #1E3A8A)', display: 'block', marginBottom: '2px' }}>Paso 3: Envía tu Pedido por WhatsApp</strong>
                  Presiona <strong>&ldquo;Encargar por WhatsApp&rdquo;</strong> para enviar tu orden lista a nuestro equipo.
                </div>
              </div>
            )}

            {activeHelpSection === 'envios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                <p style={{ margin: 0 }}>
                  Realizamos <strong>entregas rápidas en toda la ciudad de Las Tunas</strong> de Lunes a Domingo de 8:00 AM a 8:00 PM.
                </p>
                <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Confirmación inmediata del tiempo de llegada por WhatsApp.</li>
                  <li>Opción de recogida directa en tienda sin esperas.</li>
                  <li>Revisión de tus productos al momento de recibirlos.</li>
                </ul>
              </div>
            )}

            {activeHelpSection === 'pagos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
                <p style={{ margin: 0 }}>
                  Aceptamos múltiples modalidades de pago para tu comodidad:
                </p>
                <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Efectivo en CUP o USD</strong> (o pago combinado).</li>
                  <li><strong>Transfermóvil y EnZona</strong> previa coordinación en el pedido.</li>
                  <li>Conversión automática a tasa vigente (1 USD = {exchangeRateUSD} CUP).</li>
                </ul>
              </div>
            )}

            {activeHelpSection === 'faq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem', color: '#334155', lineHeight: '1.5' }}>
                <div>
                  <strong style={{ color: '#0F172A', display: 'block' }}>¿Los productos publicados están en stock?</strong>
                  Sí, el catálogo se sincroniza en tiempo real con nuestro almacén.
                </div>
                <div>
                  <strong style={{ color: '#0F172A', display: 'block' }}>¿Necesito registrarme para comprar?</strong>
                  No. Agregas tus productos al carrito y envías el pedido por WhatsApp con un clic.
                </div>
              </div>
            )}

            <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveHelpSection(null)}
                style={{
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '9px 20px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
