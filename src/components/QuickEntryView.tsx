'use client';

import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Scan, 
  LayoutDashboard, 
  ShieldCheck, 
  PiggyBank, 
  Store,
  Home
} from 'lucide-react';

interface QuickEntryViewProps {
  onOpenGasto: () => void;
  onOpenIngreso: () => void;
  onOpenDashboard: () => void;
  onOpenStore?: () => void;
  onOpenPublicStore?: () => void;
  onOpenTransfer?: () => void;
  onOpenPOS?: () => void;
}

export const QuickEntryView: React.FC<QuickEntryViewProps> = ({
  onOpenGasto,
  onOpenIngreso,
  onOpenDashboard,
  onOpenStore,
  onOpenPublicStore,
  onOpenTransfer,
  onOpenPOS
}) => {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 12px 60px 12px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* App Title Header */}
        <div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px auto',
            boxShadow: '0 4px 12px rgba(0, 99, 155, 0.2)'
          }}>
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.02em' }}>
            Cuenta Casa
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: 600 }}>
            Registro Rápido Contable & POS
          </p>
        </div>

        {/* 3 Main Action Buttons (Gasto, Ingreso, and Vender in White) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Big Gasto Button (Highlighted Red) */}
          <button
            onClick={onOpenGasto}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontSize: '1.15rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)',
              letterSpacing: '0.02em'
            }}
          >
            <ArrowDownRight size={26} />
            <span>REGISTRAR GASTO</span>
          </button>

          {/* Big Ingreso Button (Highlighted Green) */}
          <button
            onClick={onOpenIngreso}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              fontSize: '1.15rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(5, 150, 105, 0.35)',
              letterSpacing: '0.02em'
            }}
          >
            <ArrowUpRight size={26} />
            <span>REGISTRAR INGRESO</span>
          </button>

          {/* Vender / POS Button (Same size, WHITE background) */}
          <button
            onClick={onOpenPOS}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '20px',
              border: '2px solid var(--md-sys-color-outline-variant)',
              backgroundColor: '#FFFFFF',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '1.1rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
              letterSpacing: '0.01em'
            }}
          >
            <Scan size={24} color="var(--md-sys-color-primary)" />
            <span>VENDER / PUNTO DE VENTA (POS)</span>
          </button>

        </div>

        {/* Direct Access Section - Facebook Menu Style Cards (2x2 Grid) */}
        <div style={{ marginTop: '6px' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            color: 'var(--md-sys-color-on-surface-variant)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.06em',
            display: 'block',
            marginBottom: '10px',
            textAlign: 'left'
          }}>
            Accesos Directos
          </span>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}>
            {/* Card 1: Tienda Pública (Versión cliente que ve todo el mundo) */}
            <div
              onClick={() => {
                if (onOpenPublicStore) {
                  onOpenPublicStore();
                } else if (typeof window !== 'undefined') {
                  window.open('/', '_blank');
                }
              }}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#FCE7F3',
                color: '#EC4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Store size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Tienda Pública
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Ver como Cliente
                </span>
              </div>
            </div>

            {/* Card 2: Dashboard Contable */}
            <div
              onClick={onOpenDashboard}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <LayoutDashboard size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Dashboard Contable
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Finanzas Casa
                </span>
              </div>
            </div>

            {/* Card 3: Dashboard Tienda / Inventario */}
            <div
              onClick={() => onOpenStore && onOpenStore()}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Home size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Dashboard Tienda
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Gestión & Inventario
                </span>
              </div>
            </div>

            {/* Card 4: Cuenta de Ahorros */}
            <div
              onClick={() => onOpenTransfer && onOpenTransfer()}
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F3E8FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <PiggyBank size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Cuenta Ahorro
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Transferencias
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
