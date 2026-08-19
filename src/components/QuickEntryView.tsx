'use client';

import React from 'react';
import { ArrowDownRight, ArrowUpRight, LayoutDashboard, ShieldCheck } from 'lucide-react';

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
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* App Title */}
        <div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto'
          }}>
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            Cuenta Casa
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
            Registro Rápido
          </p>
        </div>

        {/* 2 Main Big Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Big Gasto Button */}
          <button
            onClick={onOpenGasto}
            style={{
              width: '100%',
              padding: '18px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '1.15rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--md-shadow-elevation-2)'
            }}
          >
            <ArrowDownRight size={26} />
            <span>REGISTRAR GASTO</span>
          </button>

          {/* Big Ingreso Button */}
          <button
            onClick={onOpenIngreso}
            style={{
              width: '100%',
              padding: '18px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-income)',
              color: '#FFFFFF',
              fontSize: '1.15rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: 'var(--md-shadow-elevation-2)'
            }}
          >
            <ArrowUpRight size={26} />
            <span>REGISTRAR INGRESO</span>
          </button>

        </div>

        {/* Small discrete button below */}
        <div>
          <button
            onClick={onOpenDashboard}
            style={{
              padding: '10px 18px',
              borderRadius: '9999px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LayoutDashboard size={15} color="var(--md-sys-color-primary)" />
            <span>Ver Dashboard / Administración</span>
          </button>
        </div>

      </div>
    </div>
  );
};
