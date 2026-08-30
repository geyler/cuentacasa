'use client';

import React from 'react';
import { ShoppingBag, Lock } from 'lucide-react';

interface PublicStoreHeaderBarProps {
  totalCartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isUserLoggedIn: boolean;
  onResetFilters: () => void;
}

export const PublicStoreHeaderBar: React.FC<PublicStoreHeaderBarProps> = ({
  totalCartCount,
  isCartOpen,
  setIsCartOpen,
  isUserLoggedIn,
  onResetFilters
}) => {
  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      color: '#1E293B',
      borderBottom: '1px solid #F1F5F9',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Logo & Brand Name */}
        <div 
          onClick={onResetFilters}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <img 
            src="/images/logo-nav.png" 
            alt="Samy Store" 
            style={{ height: '48px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} 
          />
          <div>
            <h1 className="font-logo-script" style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', lineHeight: '1' }}>
              Samy Store
            </h1>
          </div>
        </div>

        {/* Right Action Icons: Cart & Dashboard Lock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            title="Ver Carrito de Compras"
            style={{
              position: 'relative',
              width: '42px',
              height: '42px',
              borderRadius: '9999px',
              border: 'none',
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingBag size={20} />

            {totalCartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#FFF100',
                color: '#0F172A',
                width: '22px',
                height: '22px',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}>
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Dashboard Access Link (Only if Logged In) */}
          {isUserLoggedIn && (
            <a
              href="/login"
              title="Ir al Dashboard Contable"
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
