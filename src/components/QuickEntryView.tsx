'use client';

import React from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Plus, ShieldCheck } from 'lucide-react';

interface QuickEntryViewProps {
  onOpenGasto: () => void;
  onOpenIngreso: () => void;
  onOpenDashboard: () => void;
}

export const QuickEntryView: React.FC<QuickEntryViewProps> = ({
  onOpenGasto,
  onOpenIngreso,
  onOpenDashboard
}) => {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '460px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* App Title Header (Discrete public mode) */}
        <div>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: 'var(--md-shadow-elevation-1)'
          }}>
            <ShieldCheck size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            Cuenta Casa
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
            Registro rápido de movimientos (Modo Privado Protección)
          </p>
        </div>

        {/* 2 Main Prominent Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Big Gasto Button */}
          <button
            onClick={onOpenGasto}
            style={{
              width: '100%',
              padding: '22px 20px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '1.25rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: 'var(--md-shadow-elevation-2)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowDownRight size={28} />
            <span>REGISTRAR GASTO</span>
          </button>

          {/* Big Ingreso Button */}
          <button
            onClick={onOpenIngreso}
            style={{
              width: '100%',
              padding: '22px 20px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-income)',
              color: '#FFFFFF',
              fontSize: '1.25rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: 'var(--md-shadow-elevation-2)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowUpRight size={28} />
            <span>REGISTRAR INGRESO</span>
          </button>

        </div>

        {/* Discrete Small Button at Bottom */}
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={onOpenDashboard}
            style={{
              padding: '12px 22px',
              borderRadius: '9999px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 size={18} color="var(--md-sys-color-primary)" />
            <span>Ver Dashboard / Administración Contable</span>
          </button>
        </div>

      </div>
    </div>
  );
};
