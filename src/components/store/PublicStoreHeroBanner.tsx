'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageCircle,
  Truck,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { StoreProduct } from '@/types';
import { CategoryStatItem } from './PublicStoreHeaderBar';
import { getStoreCustomizationSettings, StoreCustomizationSettings } from '@/lib/storage';
import { StoreBrandDisplay } from '@/components/common/StoreBrandDisplay';

interface PublicStoreHeroBannerProps {
  products?: StoreProduct[];
  categories?: CategoryStatItem[];
  displayCurrency?: 'CUP' | 'USD';
  exchangeRateUSD?: number;
  usdIndexedPricing?: boolean;
  onSearchClick: () => void;
  onFeaturedClick: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenProduct?: (product: StoreProduct) => void;
  onQuickAddToCart?: (product: StoreProduct) => void;
  onWhatsAppClick?: () => void;
}

export const PublicStoreHeroBanner: React.FC<PublicStoreHeroBannerProps> = ({
  products = [],
  onSearchClick,
  onFeaturedClick,
  onWhatsAppClick
}) => {
  const [customization, setCustomization] = useState<StoreCustomizationSettings>(() => getStoreCustomizationSettings());

  useEffect(() => {
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
  return (
    <section style={{
      width: '100%',
      margin: 0,
      background: 'linear-gradient(135deg, var(--brand-primary-darker, #0B1528) 0%, var(--brand-primary-dark, #1E3A8A) 58%, var(--brand-primary, #1A73E8) 100%)',
      color: '#FFFFFF',
      padding: '36px 0 42px 0',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)'
    }}>
      {/* Iluminación ambiental suave basada en el color principal */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.06,
        backgroundImage: 'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        top: '-25%',
        right: '-5%',
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div className="store-container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '36px',
          alignItems: 'center'
        }} className="hero-grid-desktop">
          {/* Columna Izquierda: Información Principal y CTAs */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: '780px'
          }}>
            {/* Insignia Superior en Tono Armónico */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(10px)',
            padding: '6px 14px',
            borderRadius: '9999px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.24)'
          }}>
            <Zap size={14} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
              {customization.heroBadgeText || 'Tienda Online • Las Tunas, Cuba'}
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 900,
            lineHeight: '1.12',
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            color: '#FFFFFF'
          }}>
            {customization.heroTitle || 'Todo para tu Hogar, Rápido y sin Complicaciones'}
          </h2>

          <p style={{
            fontSize: 'clamp(0.95rem, 1.25vw, 1.1rem)',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.62',
            marginBottom: '26px',
            fontWeight: 500,
            maxWidth: '660px'
          }}>
            {customization.heroSubtitle || `Explora el catálogo completo de ${customization.storeName || 'Samy Store'} organizado por categorías con existencias reales en almacén y pedidos directos por WhatsApp con entrega en toda la ciudad.`}
          </p>

          {/* Botones Principales Unificados en la Paleta del Sistema */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '26px' }}>
            <button
              type="button"
              onClick={onFeaturedClick}
              style={{
                backgroundColor: '#FFFFFF',
                color: 'var(--brand-primary-dark, #1E3A8A)',
                padding: '13px 26px',
                borderRadius: '9999px',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 22px rgba(0, 0, 0, 0.18)',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={17} style={{ color: 'var(--brand-primary, #1A73E8)' }} />
              <span>Explorar Catálogo</span>
            </button>

            <button
              type="button"
              onClick={onSearchClick}
              className="desktop-flex"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                color: '#FFFFFF',
                padding: '13px 22px',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.9rem',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                cursor: 'pointer',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Search size={16} />
              <span>Buscar Producto</span>
            </button>

            {onWhatsAppClick && (
              <button
                type="button"
                onClick={onWhatsAppClick}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  color: '#FFFFFF',
                  padding: '13px 22px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <MessageCircle size={16} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                <span>Pedir por WhatsApp</span>
              </button>
            )}
          </div>

          {/* Indicadores de Confianza y Resumen del Catálogo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.18)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.94)'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
              <span>{products.length} Productos Disponibles</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={15} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
              <span>Envíos a Domicilio</span>
            </span>
            <span className="desktop-flex" style={{ alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
              <span>Compra Garantizada</span>
            </span>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Visual de Prestigio Samy Store (Equilibra el Hero en PC) */}
        <div className="desktop-only" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.28)',
            borderRadius: '28px',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
          }}>
            <StoreBrandDisplay
              customization={customization}
              align="center"
              size="lg"
              textColor="#FFFFFF"
              showSubtitle={true}
              subtitleText="Boutique & Punto de Venta"
              subtitleColor="rgba(255, 255, 255, 0.9)"
              style={{ marginBottom: '18px' }}
            />

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🛍️</div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#FFFFFF' }}>Catálogo Digital Activo</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Existencias actualizadas al momento</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>💬</div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#FFFFFF' }}>Pedidos Inmediatos WhatsApp</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Sin registros ni contraseñas</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🛵</div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#FFFFFF' }}>Envíos a Domicilio</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Entrega segura hasta tu puerta</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </section>
  );
};
