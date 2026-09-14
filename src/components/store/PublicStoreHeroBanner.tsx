'use client';

import React from 'react';
import { Search, Sparkles, MessageCircle, Truck, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

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
    <section style={{
      width: '100%',
      margin: 0,
      borderRadius: 0,
      background: 'linear-gradient(135deg, #BE185D 0%, #EC4899 45%, #831843 100%)',
      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(253, 224, 71, 0.12) 0%, transparent 40%), linear-gradient(135deg, #BE185D 0%, #EC4899 45%, #831843 100%)',
      color: '#FFFFFF',
      padding: '40px 0 46px 0',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(190, 24, 93, 0.15)'
    }}>
      {/* Decorative Grid Pattern Overlay like Qubazar */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.08,
        backgroundImage: 'linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        pointerEvents: 'none'
      }} />

      {/* Decorative Ambient Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-5%',
        width: '460px',
        height: '460px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div className="store-container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'center'
        }}>
          {/* Left Column: Headline, Subtitle, Badges & Action Buttons */}
          <div>
            {/* Top Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <Zap size={14} color="#FDE047" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                Tu Mercado Digital en Las Tunas, Cuba
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3.1rem)',
              fontWeight: 900,
              lineHeight: '1.14',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
              color: '#FFFFFF'
            }}>
              Compra y Recibe <span style={{ color: '#FDE047', textShadow: '0 2px 14px rgba(0,0,0,0.25)' }}>Fácil</span> en Las Tunas
            </h2>

            <p style={{
              fontSize: 'clamp(0.95rem, 1.2vw, 1.08rem)',
              color: 'rgba(255, 255, 255, 0.94)',
              lineHeight: '1.65',
              marginBottom: '26px',
              fontWeight: 500,
              maxWidth: '560px'
            }}>
              El catálogo online de <strong>Samy Store</strong> con los mejores precios en CUP y USD. Pedidos directos a nuestro WhatsApp, pagos rápidos y entregas a domicilio seguras.
            </p>

            {/* Action Pill Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <button
                onClick={onSearchClick}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#9D174D',
                  padding: '13px 26px',
                  borderRadius: '9999px',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.14)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Search size={18} color="#BE185D" />
                Explorar Catálogo
              </button>

              <button
                onClick={onFeaturedClick}
                style={{
                  backgroundColor: '#FDE047',
                  color: '#1E293B',
                  padding: '13px 24px',
                  borderRadius: '9999px',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(253, 224, 71, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sparkles size={18} color="#1E293B" />
                Más Vendidos
              </button>
            </div>

            {/* Quick Trust Highlights for Desktop & Mobile */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)' }}>
                <Truck size={15} color="#FDE047" />
                <span>Envíos a Domicilio</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)' }}>
                <MessageCircle size={15} color="#34D399" />
                <span>Pedido por WhatsApp</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)' }}>
                <ShieldCheck size={15} color="#60A5FA" />
                <span>Garantía & Confianza</span>
              </div>
            </div>
          </div>

          {/* Right Column: 2x2 Showcase Category Cards (Desktop & Tablet) */}
          <div className="hidden-mobile" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.24)',
            borderRadius: '26px',
            padding: '24px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FDE047' }}>
                Categorías Populares
              </span>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Stock actualizado
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px'
            }}>
              {/* Category 1: Víveres & Alimentos */}
              <div 
                onClick={() => onSelectCategory('Viveres')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  height: '58px',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.9rem',
                  marginBottom: '10px'
                }}>
                  🌾
                </div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Víveres & Alimentos
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>
                    Alta Demanda
                  </span>
                  <ArrowRight size={12} color="#10B981" />
                </div>
                <div style={{ height: '4px', backgroundColor: '#10B981', borderRadius: '9999px', marginTop: '6px' }} />
              </div>

              {/* Category 2: Ropa & Confecciones */}
              <div 
                onClick={() => onSelectCategory('Ropa')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  height: '58px',
                  borderRadius: '12px',
                  backgroundColor: '#FFF0F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.9rem',
                  marginBottom: '10px'
                }}>
                  👗
                </div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Ropa & Calzado
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#EC4899' }}>
                    Novedades
                  </span>
                  <ArrowRight size={12} color="#EC4899" />
                </div>
                <div style={{ height: '4px', backgroundColor: '#EC4899', borderRadius: '9999px', marginTop: '6px' }} />
              </div>

              {/* Category 3: Electrodomésticos */}
              <div 
                onClick={() => onSelectCategory('Electrodomésticos')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  height: '58px',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.9rem',
                  marginBottom: '10px'
                }}>
                  🔌
                </div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Electrodomésticos
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3B82F6' }}>
                    Garantizados
                  </span>
                  <ArrowRight size={12} color="#3B82F6" />
                </div>
                <div style={{ height: '4px', backgroundColor: '#3B82F6', borderRadius: '9999px', marginTop: '6px' }} />
              </div>

              {/* Category 4: Aseo & Hogar */}
              <div 
                onClick={() => onSelectCategory('Aseo')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '14px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  height: '58px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.9rem',
                  marginBottom: '10px'
                }}>
                  ✨
                </div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Aseo & Hogar
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B' }}>
                    Indispensables
                  </span>
                  <ArrowRight size={12} color="#F59E0B" />
                </div>
                <div style={{ height: '4px', backgroundColor: '#F59E0B', borderRadius: '9999px', marginTop: '6px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
