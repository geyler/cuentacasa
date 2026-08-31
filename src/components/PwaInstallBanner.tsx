'use client';

import React from 'react';
import { Download, Smartphone, CheckCircle, X } from 'lucide-react';

interface PwaInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onInstall, onDismiss }) => {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('samy_pwa_banner_dismissed') === 'true';
      if (isDismissed) setDismissed(true);
    }
  }, []);

  const isInstalled = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  if (isInstalled || dismissed) return null;

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('samy_pwa_banner_dismissed', 'true');
    }
    setDismissed(true);
    onDismiss();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '440px',
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      padding: '12px 16px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 95,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      border: '1px solid rgba(255, 255, 255, 0.12)'
    }} className="pwa-banner no-print">
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: '#EC4899',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Smartphone size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.86rem', fontWeight: 800, margin: 0 }}>Instalar App Samy Store</h4>
          <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0 0' }}>Funciona 100% offline en tu móvil</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onInstall}
          style={{
            padding: '7px 14px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: '#EC4899',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Download size={14} /> Instalar
        </button>

        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={16} />
        </button>
      </div>

    </div>
  );
};
