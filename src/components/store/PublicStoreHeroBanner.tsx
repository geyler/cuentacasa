'use client';

import React from 'react';
import { Search, Sparkles } from 'lucide-react';

interface PublicStoreHeroBannerProps {
  onSearchClick: () => void;
  onFeaturedClick: () => void;
  onSelectCategory: (cat: string) => void;
}

export const PublicStoreHeroBanner: React.FC<PublicStoreHeroBannerProps> = ({
  onSearchClick,
  onFeaturedClick,
  onSelectCategory
}) => {
  return (
    <div style={{
      width: '100%',
      margin: 0,
      borderRadius: 0,
      background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 50%, #9D174D 100%)',
      backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(135deg, #EC4899 0%, #C026D3 50%, #831843 100%)',
      backgroundSize: '32px 32px, 32px 32px, 100% 100%',
      color: '#FFFFFF',
      padding: '38px 20px 42px 20px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(236, 72, 153, 0.18)'
    }}>
      {/* Decorative Ambient Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-10%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '32px',
        alignItems: 'center'
      }}>
        {/* Left Column: Heading, Subtitle & Action Buttons */}
        <div>
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            lineHeight: '1.18',
            marginBottom: '14px',
            letterSpacing: '-0.02em',
            color: '#FFFFFF'
          }}>
            Samy Store: Tu Tienda <span style={{ color: '#FFD700', textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>Fácil</span> en Las Tunas
          </h2>

          <p style={{
            fontSize: '0.96rem',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.6',
            marginBottom: '26px',
            fontWeight: 500
          }}>
            Comprar online nunca fue tan sencillo. Insumos, electrodomésticos, ropa y mucho más con entrega rápida y pedido directo por WhatsApp.
          </p>

          {/* Action Pill Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onSearchClick}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#831843',
                padding: '13px 24px',
                borderRadius: '9999px',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={18} color="#EC4899" />
              Explorar Productos
            </button>

            <button
              onClick={onFeaturedClick}
              style={{
                backgroundColor: '#FFD700',
                color: '#0F172A',
                padding: '13px 24px',
                borderRadius: '9999px',
                fontWeight: 900,
                fontSize: '0.92rem',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={18} color="#0F172A" />
              Productos Más Vendidos
            </button>
          </div>
        </div>

        {/* Right Column: 2x2 Showcase Category Cards (HIDDEN ON MOBILE) */}
        <div className="hidden-mobile" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            {/* Category 1: Insumos & Alimentos */}
            <div 
              onClick={() => onSelectCategory('Viveres')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                transform: 'rotate(-2deg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                height: '56px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                marginBottom: '8px'
              }}>
                🌾
              </div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Insumos & Alimentos
              </h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>
                Alta Demanda
              </span>
              <div style={{ height: '4px', backgroundColor: '#10B981', borderRadius: '9999px', marginTop: '6px' }} />
            </div>

            {/* Category 2: Ropa y Accesorios */}
            <div 
              onClick={() => onSelectCategory('Ropa')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                transform: 'rotate(2deg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                height: '56px',
                borderRadius: '10px',
                backgroundColor: '#FFF0F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                marginBottom: '8px'
              }}>
                👗
              </div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Ropa & Accesorios
              </h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EC4899' }}>
                Tendencias
              </span>
              <div style={{ height: '4px', backgroundColor: '#EC4899', borderRadius: '9999px', marginTop: '6px' }} />
            </div>

            {/* Category 3: Electrodomésticos */}
            <div 
              onClick={() => onSelectCategory('Electrodomésticos')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                transform: 'rotate(1deg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                height: '56px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                marginBottom: '8px'
              }}>
                🔌
              </div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Electrodomésticos
              </h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3B82F6' }}>
                Garantizados
              </span>
              <div style={{ height: '4px', backgroundColor: '#3B82F6', borderRadius: '9999px', marginTop: '6px' }} />
            </div>

            {/* Category 4: Variedades & Aseo */}
            <div 
              onClick={() => onSelectCategory('Aseo')}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '12px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                transform: 'rotate(-1deg)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                height: '56px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.7rem',
                marginBottom: '8px'
              }}>
                ✨
              </div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Variedades & Más
              </h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B' }}>
                Catálogo Variado
              </span>
              <div style={{ height: '4px', backgroundColor: '#F59E0B', borderRadius: '9999px', marginTop: '6px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
