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
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      alert('📱 Para instalar la App de Samy Store:\n\n1. En Chrome/Android: Toca los 3 puntos del navegador y elige "Añadir a la pantalla de inicio" o "Instalar aplicación".\n2. En iPhone/Safari: Toca el botón Compartir y elige "Añadir a pantalla de inicio".');
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* PWA Install Call-to-Action Banner */}
        {!isInstalled && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '18px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.12)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1E40AF', margin: 0 }}>
                  Instalar App Samy Store
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#3B82F6', margin: '2px 0 0 0', fontWeight: 600 }}>
                  Acceso directo 100% offline
                </p>
              </div>
            </div>

            <button
              onClick={handleInstallPwa}
              className="md-btn md-btn-primary"
              style={{
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 800,
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Instalar
            </button>
          </div>
        )}
        
        {/* App Title Header */}
        <div>
          <img 
            src="/images/logo-loading.png" 
            alt="Samy Store Logo" 
            style={{ 
              height: '110px', 
              width: 'auto', 
              objectFit: 'contain', 
              margin: '0 auto 4px auto',
              display: 'block'
            }} 
          />
          <h2 className="font-logo-script" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Samy Store
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: 600 }}>
            Administración & POS Tienda
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
                  window.location.href = '/';
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
