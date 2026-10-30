'use client';

import React, { useState } from 'react';
import { AppTab } from '@/types';
import {
  Home,
  Receipt,
  FileText,
  Eye,
  EyeOff,
  Settings,
  LayoutDashboard,
  Loader2,
  Store,
  Scan,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Package,
  Users,
  CreditCard,
  Sparkles,
  Coins,
  Palette,
  Sliders,
  ShieldCheck,
  Wallet,
  MessageCircle,
  TrendingUp,
  User,
  Crown,
  CloudUpload,
  Layers
} from 'lucide-react';

import { getLoggedInUser, getStoreCustomizationSettings, getStoreModulesConfig, StoreModulesConfig } from '@/lib/storage';
import { StoreBrandDisplay } from '@/components/common/StoreBrandDisplay';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  showBalance: boolean;
  toggleShowBalance: () => void;
  onOpenSettings: () => void;
  onOpenProfile?: () => void;
  onOpenScanner?: () => void;
  isSyncing?: boolean;
  pendingSyncCount?: number;
  onOpenPendingSync?: () => void;
  isMenuOpen?: boolean;
  setIsMenuOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showBalance,
  toggleShowBalance,
  onOpenSettings,
  onOpenProfile,
  onOpenScanner,
  isSyncing = false,
  pendingSyncCount = 0,
  onOpenPendingSync,
  isMenuOpen: externalMenuOpen,
  setIsMenuOpen: setExternalMenuOpen
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuOpen = externalMenuOpen !== undefined ? externalMenuOpen : internalMenuOpen;
  const setIsMenuOpen = setExternalMenuOpen || setInternalMenuOpen;

  const [customization, setCustomization] = useState(() => getStoreCustomizationSettings());

  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => getStoreModulesConfig());

  React.useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setCustomization(e.detail);
      } else {
        setCustomization(getStoreCustomizationSettings());
      }
    };
    window.addEventListener('cuentacasa-store-customization-changed', handler);
    return () => window.removeEventListener('cuentacasa-store-customization-changed', handler);
  }, []);

  React.useEffect(() => {
    const handleModules = (e: any) => {
      if (e?.detail) setStoreModules(e.detail);
      else setStoreModules(getStoreModulesConfig());
    };
    window.addEventListener('cuentacasa-store-modules-changed', handleModules);
    return () => window.removeEventListener('cuentacasa-store-modules-changed', handleModules);
  }, []);

  useLockBodyScroll(isMenuOpen, () => setIsMenuOpen(false));

  const currentUser = getLoggedInUser();
  const isOwner = !currentUser || currentUser.role === 'propietario';

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    store: true,
    finance: false,
    settings: false
  });

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleStoreSubTabClick = (subTab: 'products' | 'suppliers' | 'sales' | 'debts') => {
    setActiveTab('store');
    setIsMenuOpen(false);
    window.dispatchEvent(new CustomEvent('cuentacasa-navigate-store-tab', { detail: subTab }));
  };

  const handleSettingsSubViewClick = (subView: string) => {
    setIsMenuOpen(false);
    onOpenSettings();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cuentacasa-open-settings-subview', { detail: subView }));
    }, 60);
  };

  return (
    <header style={{
      backgroundColor: 'var(--md-sys-color-surface-container)',
      borderBottom: '1px solid var(--md-sys-color-surface-variant)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--md-shadow-elevation-1)',
      width: '100%'
    }} className="no-print">

      {/* Clean Full-Width Single Bar (Responsive Mobile & PC) */}
      <div style={{
        width: '100%',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        gap: '12px'
      }}>

        {/* Brand logo & Title */}
        <button
          onClick={() => isOwner && setActiveTab('quick')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: isOwner ? 'pointer' : 'default',
            padding: 0,
            flexShrink: 0
          }}
        >
          <StoreBrandDisplay
            customization={customization}
            align="left"
            size="sm"
            textColor="var(--md-sys-color-on-surface)"
          />
        </button>

        {/* Right Utility Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Pending Sync Actions Pill Badge Trigger */}
          {pendingSyncCount > 0 && onOpenPendingSync && (
            <button
              onClick={onOpenPendingSync}
              title={`Ver listado de ${pendingSyncCount} acciones pendientes por subir`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 900,
                boxShadow: '0 2px 8px rgba(0, 99, 155, 0.3)',
                animation: 'pulse 2s infinite'
              }}
            >
              <CloudUpload size={14} />
              <span>{pendingSyncCount}</span>
            </button>
          )}

          {/* Reportes Header Button (Replaces top settings gear) */}
          {isOwner && (
            <button
              onClick={() => setActiveTab('reports')}
              title="Reportes y Estadísticas"
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                border: activeTab === 'reports' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                color: activeTab === 'reports' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 800
              }}
            >
              <FileText size={16} color={activeTab === 'reports' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'} />
              <span>IPV</span>
            </button>
          )}

          {/* User Profile Avatar Trigger Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              title={`Perfil: ${currentUser?.name || 'Usuario'}`}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1.5px solid var(--md-sys-color-outline)',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8rem',
                flexShrink: 0
              }}
            >
              {currentUser?.role === 'propietario' ? <Crown size={17} /> : (currentUser?.name?.charAt(0).toUpperCase() || <User size={17} />)}
            </button>
          )}

        </div>
      </div>


      {/* Hamburger Navigation MD3 Bottom Sheet Modal (Sliding from bottom) */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderRadius: '28px 28px 0 0',
              boxShadow: 'var(--md-shadow-elevation-3)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 20px 30px 20px',
              overflowY: 'auto'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 16px auto' }} />

            {/* Bottom Sheet Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Home size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Menú de Opciones</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Navegación principal</span>
                </div>
              </div>

              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Menu Options List - WordPress Style Navigation with Expandable Sub-Menus */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* 1. SECCIÓN: INVENTARIO & TIENDA (WordPress style con sub-menú) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  onClick={() => {
                    if (activeTab !== 'store') {
                      setActiveTab('store');
                      setExpandedSections(prev => ({ ...prev, store: true }));
                    } else {
                      setExpandedSections(prev => ({ ...prev, store: !prev.store }));
                    }
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    backgroundColor: activeTab === 'store' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: activeTab === 'store' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Store size={20} color="var(--md-sys-color-primary)" />
                    <span>Inventario & Tienda</span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSections(prev => ({ ...prev, store: !prev.store }));
                    }}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronDown
                      size={18}
                      style={{
                        transform: expandedSections.store ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        opacity: 0.7
                      }}
                    />
                  </div>
                </div>

                {/* Sub-Menú Desplegable WordPress Style para Tienda */}
                {expandedSections.store && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingLeft: '14px',
                    marginLeft: '16px',
                    borderLeft: '2px solid var(--md-sys-color-primary)',
                    marginTop: '2px',
                    marginBottom: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleStoreSubTabClick('products')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={16} color="var(--md-sys-color-primary)" />
                        <span>Catálogo de Productos</span>
                      </div>
                      <ChevronRight size={14} opacity={0.4} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStoreSubTabClick('sales')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Receipt size={16} color="var(--md-sys-color-primary)" />
                        <span>Registro de Ventas</span>
                      </div>
                      <ChevronRight size={14} opacity={0.4} />
                    </button>

                    {isOwner && storeModules.enableSuppliers && (
                      <button
                        type="button"
                        onClick={() => handleStoreSubTabClick('suppliers')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Users size={16} color="var(--md-sys-color-primary)" />
                          <span>Proveedores & Consignación</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>
                    )}

                    {storeModules.enableCustomerDebts && (
                      <button
                        type="button"
                        onClick={() => handleStoreSubTabClick('debts')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CreditCard size={16} color="var(--md-sys-color-primary)" />
                          <span>Fiados & Cobros de Clientes</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 2. SECCIÓN: FINANZAS & CONTABILIDAD (Solo Propietario con sub-menú) */}
              {isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div
                    onClick={() => {
                      if (!['quick', 'dashboard', 'transactions', 'reports'].includes(activeTab)) {
                        setActiveTab('dashboard');
                        setExpandedSections(prev => ({ ...prev, finance: true }));
                      } else {
                        setExpandedSections(prev => ({ ...prev, finance: !prev.finance }));
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      backgroundColor: ['quick', 'dashboard', 'transactions', 'reports'].includes(activeTab) ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: ['quick', 'dashboard', 'transactions', 'reports'].includes(activeTab) ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <LayoutDashboard size={20} color="var(--md-sys-color-primary)" />
                      <span>Finanzas & Contabilidad</span>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSections(prev => ({ ...prev, finance: !prev.finance }));
                      }}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: expandedSections.finance ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                          opacity: 0.7
                        }}
                      />
                    </div>
                  </div>

                  {/* Sub-Menú Desplegable Finanzas */}
                  {expandedSections.finance && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingLeft: '14px',
                      marginLeft: '16px',
                      borderLeft: '2px solid var(--md-sys-color-primary)',
                      marginTop: '2px',
                      marginBottom: '4px'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleNavClick('dashboard')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                          color: activeTab === 'dashboard' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <LayoutDashboard size={16} />
                          <span>Dashboard General</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('quick')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                          color: activeTab === 'quick' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Home size={16} />
                          <span>Inicio Rápido & Arqueo</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('transactions')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                          color: activeTab === 'transactions' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Receipt size={16} />
                          <span>Movimientos y Gastos</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('reports')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                          color: activeTab === 'reports' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} />
                          <span>Historial IPV por Periodos</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSettingsSubViewClick('accounts')}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Wallet size={16} color="#2563EB" />
                          <span>Cuentas & Transferencias</span>
                        </div>
                        <ChevronRight size={14} opacity={0.4} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. ESCÁNER DE CÓDIGOS DE BARRA */}
              {onOpenScanner && (
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); onOpenScanner(); }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Scan size={20} color="var(--md-sys-color-primary)" />
                    <span>Escáner de Ventas</span>
                  </div>
                  <ChevronRight size={18} opacity={0.6} />
                </button>
              )}

              {/* 4. SECCIÓN: AJUSTES DEL SISTEMA (WordPress style con sub-menú) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  onClick={() => {
                    setExpandedSections(prev => ({ ...prev, settings: !prev.settings }));
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Settings size={20} color="var(--md-sys-color-primary)" />
                    <span>Ajustes del Sistema</span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedSections(prev => ({ ...prev, settings: !prev.settings }));
                    }}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronDown
                      size={18}
                      style={{
                        transform: expandedSections.settings ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        opacity: 0.7
                      }}
                    />
                  </div>
                </div>

                {/* Sub-Menú Desplegable Ajustes */}
                {expandedSections.settings && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingLeft: '14px',
                    marginLeft: '16px',
                    borderLeft: '2px solid var(--md-sys-color-primary)',
                    marginTop: '2px',
                    marginBottom: '4px'
                  }}>
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('appearance')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Palette size={16} color="var(--md-sys-color-primary)" />
                            <span>Marca & Colores Corporativos</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('customizer')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Sliders size={16} color="var(--md-sys-color-primary)" />
                            <span>Personalizar Tienda & Logos</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('currency')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Coins size={16} color="var(--md-sys-color-primary)" />
                            <span>Modo Monedas & Indexación USD</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('exchange')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={16} color="var(--md-sys-color-primary)" />
                            <span>Tasa de Cambio elTOQUE</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('users')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={16} color="var(--md-sys-color-primary)" />
                            <span>Gestión de Usuarios & Roles</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('modules')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Layers size={16} color="var(--md-sys-color-primary)" />
                            <span>Módulos y Secciones del Negocio</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSettingsSubViewClick('security')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: 'var(--md-sys-color-surface)',
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={16} color="var(--md-sys-color-primary)" />
                            <span>Seguridad, PIN y Datos</span>
                          </div>
                          <ChevronRight size={14} opacity={0.4} />
                        </button>
                      </>
                    ) : (
                      <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Solo los propietarios tienen acceso a la configuración estética y financiera.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSettingsSubViewClick('whatsapp')}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageCircle size={16} color="#25D366" />
                        <span>WhatsApp de Pedidos</span>
                      </div>
                      <ChevronRight size={14} opacity={0.4} />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setIsMenuOpen(false); onOpenSettings(); }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Settings size={20} />}
                  <span>Ajustes y Nube</span>
                </div>
                <ChevronRight size={18} opacity={0.6} />
              </button>

            </nav>

            {/* Footer status */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--md-sys-color-outline-variant)', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
              Samy Store v1.7.5 • PWA Offline
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
