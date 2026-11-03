'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Scan,
  LayoutDashboard,
  ShieldCheck,
  ArrowRightLeft,
  Store,
  Home,
  Clock
} from 'lucide-react';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { getStoreCustomizationSettings, getStoreModulesConfig, StoreModulesConfig } from '@/lib/storage';
import { StoreBrandDisplay } from '@/components/common/StoreBrandDisplay';

interface QuickEntryViewProps {
  onOpenGasto: () => void;
  onOpenIngreso: () => void;
  onOpenDashboard: () => void;
  onOpenStore?: () => void;
  onOpenPublicStore?: () => void;
  onOpenTransfer?: () => void;
  onOpenPOS?: () => void;
  onOpenShiftModal?: () => void;
}

export const QuickEntryView: React.FC<QuickEntryViewProps> = ({
  onOpenGasto,
  onOpenIngreso,
  onOpenDashboard,
  onOpenStore,
  onOpenPublicStore,
  onOpenTransfer,
  onOpenPOS,
  onOpenShiftModal
}) => {
  const { showActionResult } = useActionFeedback();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState<boolean>(false);
  const [storeName, setStoreName] = React.useState<string>(() => {
    return getStoreCustomizationSettings().storeName || 'Cubasoft';
  });

  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => getStoreModulesConfig());

  useEffect(() => {
    const handleCustChange = (e: any) => {
      if (e.detail?.storeName) setStoreName(e.detail.storeName);
      else setStoreName(getStoreCustomizationSettings().storeName || 'Cubasoft');
    };
    const handleModulesChange = (e: any) => {
      setStoreModules(e?.detail || getStoreModulesConfig());
    };
    window.addEventListener('cuentacasa-store-customization-changed', handleCustChange);
    window.addEventListener('cuentacasa-store-modules-changed', handleModulesChange);
    return () => {
      window.removeEventListener('cuentacasa-store-customization-changed', handleCustChange);
      window.removeEventListener('cuentacasa-store-modules-changed', handleModulesChange);
    };
  }, []);

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
      showActionResult({
        title: `📱 Instalar App ${storeName}`,
        message: '1. En Chrome/Android: Toca los 3 puntos del navegador y elige "Añadir a la pantalla de inicio" o "Instalar aplicación".\n2. En iPhone/Safari: Toca el botón Compartir y elige "Añadir a pantalla de inicio".',
        type: 'info'
      });
    }
  };

  return (
    <div style={{
      minHeight: '78vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 12px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '768px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* PWA Install Call-to-Action Banner */}
        {!isInstalled && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            border: '1px solid var(--brand-primary-border, var(--md-sys-color-outline))',
            borderRadius: '18px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: 'var(--md-shadow-elevation-1)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/brand/cubasoft-logo-square.png" alt={storeName} style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--md-sys-color-on-primary-container)', margin: 0 }}>
                  Instalar App {storeName}
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-primary)', margin: '2px 0 0 0', fontWeight: 600 }}>
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

        {/* App Title Header - Solo el icono cuadrado centrado */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0 4px 0' }}>
          <StoreBrandDisplay
            align="center"
            size="xl"
            forceSquareLogo={true}
            logoOnly={true}
            imageMaxHeight={84}
            showSubtitle={false}
          />
        </div>

        {/* Main Action Buttons (Responsive 1-column on mobile, 2x2 grid on PC) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>

          {/* Big Gasto Button (Semantic Expense Red) */}
          <button
            onClick={onOpenGasto}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
              letterSpacing: '0.02em',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowDownRight size={22} />
            <span>REGISTRAR GASTO</span>
          </button>

          {/* Big Ingreso Button (Semantic Income Green) */}
          <button
            onClick={onOpenIngreso}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-income)',
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
              letterSpacing: '0.02em',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowUpRight size={22} />
            <span>REGISTRAR INGRESO</span>
          </button>

          {/* Vender / POS Button */}
          <button
            onClick={onOpenPOS}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
              backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              letterSpacing: '0.02em',
              gridColumn: !storeModules.enableShiftManagement ? '1 / -1' : undefined,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              color: 'var(--brand-primary, #1A73E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Scan size={18} />
            </div>
            <span>ESCANEAR Y VENDER</span>
          </button>

          {/* Turnos & IPV Button (Solo si el módulo está habilitado) */}
          {storeModules.enableShiftManagement && (
            <button
              onClick={() => onOpenShiftModal && onOpenShiftModal()}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                letterSpacing: '0.02em',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={18} />
              </div>
              <span>TURNOS DE CAJA</span>
            </button>
          )}

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
                padding: '14px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Store size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Tienda Pública
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Ver como Cliente
                </span>
              </div>
            </div>

            {/* Card 2: Finanzas del Hogar */}
            <div
              onClick={onOpenDashboard}
              style={{
                padding: '14px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <LayoutDashboard size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Finanzas del Hogar
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Gastos & Cuentas
                </span>
              </div>
            </div>

            {/* Card 3: Gestión del Negocio */}
            <div
              onClick={() => onOpenStore && onOpenStore()}
              style={{
                padding: '14px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Home size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Gestión del Negocio
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Inventario & POS
                </span>
              </div>
            </div>

            {/* Card 4: Transferir Fondos entre Cuentas */}
            <div
              onClick={() => onOpenTransfer && onOpenTransfer()}
              style={{
                padding: '14px 14px',
                borderRadius: '16px',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                color: 'var(--brand-primary, #1A73E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ArrowRightLeft size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.2' }}>
                  Transferir Fondos
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Casa & Negocio
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
