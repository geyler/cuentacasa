'use client';

import React from 'react';
import { ShoppingBag, Lock, Search, MessageCircle, MapPin, X } from 'lucide-react';
import { formatCurrency } from '@/lib/invoice';

interface PublicStoreHeaderBarProps {
  totalCartCount: number;
  totalCartPrice?: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isUserLoggedIn: boolean;
  onResetFilters: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onWhatsAppClick?: () => void;
}

export const PublicStoreHeaderBar: React.FC<PublicStoreHeaderBarProps> = ({
  totalCartCount,
  totalCartPrice = 0,
  isCartOpen,
  setIsCartOpen,
  isUserLoggedIn,
  onResetFilters,
  searchTerm = '',
  setSearchTerm,
  onWhatsAppClick
}) => {
  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      color: '#1E293B',
      borderBottom: '1px solid #F1F5F9',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
    }}>
      <div className="store-container" style={{
        paddingTop: '10px',
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Left: Logo & Brand Name */}
        <div 
          onClick={onResetFilters}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            src="/images/logo-nav.png" 
            alt="Samy Store" 
            style={{ height: '46px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="font-logo-script" style={{ fontSize: '1.95rem', fontWeight: 900, color: '#0F172A', lineHeight: '1', margin: 0 }}>
                Samy Store
              </h1>
              <span className="desktop-only" style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#BE185D',
                backgroundColor: '#FCE7F3',
                padding: '2px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.02em'
              }}>
                OFICIAL
              </span>
            </div>
            <div className="desktop-flex" style={{ alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={11} color="#94A3B8" />
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                Las Tunas, Cuba • Tienda Online
              </span>
            </div>
          </div>
        </div>

        {/* Center (Desktop Only): Modern Search Bar estilo Qubazar */}
        {setSearchTerm && (
          <div className="desktop-only" style={{ flex: 1, maxWidth: '560px', margin: '0 16px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search 
                size={19} 
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#EC4899'
                }} 
              />
              <input
                type="text"
                placeholder="¿Qué estás buscando? Ej. Arroz, Aceite, Harina, Café..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 46px',
                  borderRadius: '9999px',
                  border: '1.5px solid #FBCFE8',
                  backgroundColor: '#FDF2F8',
                  color: '#0F172A',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  title="Limpiar búsqueda"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#F1F5F9',
                    border: 'none',
                    color: '#64748B',
                    width: '24px',
                    height: '24px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Actions: WhatsApp Contact, Cart Button, Login */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {/* Desktop WhatsApp Direct Contact */}
          {onWhatsAppClick && (
            <button
              onClick={onWhatsAppClick}
              className="desktop-flex"
              title="Contactar o hacer pedidos por WhatsApp"
              style={{
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '9999px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageCircle size={16} color="#059669" />
              <span>WhatsApp Pedidos</span>
            </button>
          )}

          {/* Cart Button with Counter and Subtotal on PC */}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            title="Ver Carrito de Compras"
            style={{
              position: 'relative',
              padding: totalCartCount > 0 ? '8px 16px' : '9px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={20} />
              {totalCartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  backgroundColor: '#FFF100',
                  color: '#0F172A',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
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
              <span className="desktop-only" style={{ fontSize: '0.85rem', fontWeight: 900, marginLeft: '4px' }}>
                {formatCurrency(totalCartPrice, '$', true)} <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>CUP</span>
              </span>
            ) : (
              <span className="desktop-only" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                Carrito
              </span>
            )}
          </button>

          {/* Dashboard Access Link (Only if Logged In) */}
          {isUserLoggedIn && (
            <a
              href="/app"
              title="Ir al Sistema Contable"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Lock size={18} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
