'use client';

import React from 'react';
import { Download, Smartphone, CheckCircle, X } from 'lucide-react';

interface PwaInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '480px',
      backgroundColor: 'var(--md-sys-color-primary-container)',
      color: 'var(--md-sys-color-on-primary-container)',
      padding: '14px 18px',
      borderRadius: '20px',
      boxShadow: 'var(--md-shadow-elevation-3)',
      zIndex: 95,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      border: '1px solid var(--md-sys-color-primary)'
    }} className="pwa-banner no-print">
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          backgroundColor: 'var(--md-sys-color-primary)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Smartphone size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Instalar WebAPK "Cuenta Casa"</h4>
          <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Uso 100% offline directo en tu móvil</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onInstall}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Download size={14} /> Instalar
        </button>

        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--md-sys-color-on-primary-container)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

    </div>
  );
};
