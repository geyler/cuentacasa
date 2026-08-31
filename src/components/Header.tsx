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
  User,
  Crown,
  CloudUpload
} from 'lucide-react';

import { getLoggedInUser } from '@/lib/storage';

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

  const currentUser = getLoggedInUser();
  const isOwner = !currentUser || currentUser.role === 'propietario';

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header style={{
      backgroundColor: 'var(--md-sys-color-surface-container)',
      borderBottom: '1px solid var(--md-sys-color-surface-variant)',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      boxShadow: 'var(--md-shadow-elevation-1)'
    }} className="no-print">
      
      {/* Clean Single Bar */}
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px'
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
            cursor: 'pointer',
            padding: 0
          }}
        >
          <img 
            src="/images/logo-nav.png" 
            alt="Samy Store" 
            style={{ 
              height: '46px', 
              width: 'auto', 
              objectFit: 'contain', 
              flexShrink: 0 
            }} 
          />
          <h1 className="font-logo-script" style={{ 
            fontSize: '1.75rem', 
            fontWeight: 900, 
            letterSpacing: '-0.01em',
            color: 'var(--md-sys-color-on-surface)',
            lineHeight: 1
          }}>
            Samy Store
          </h1>
        </button>

        {/* Navigation Tabs (PC Only - Hidden on Mobile) */}
        <nav className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab('quick')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: activeTab === 'quick' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Home size={16} />
                <span>Inicio</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: activeTab === 'dashboard' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('store')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'store' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'store' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Store size={16} />
            <span>Tienda</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setActiveTab('transactions')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: activeTab === 'transactions' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Receipt size={16} />
                <span>Movimientos</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary)' : 'transparent',
                  color: activeTab === 'reports' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileText size={16} />
                <span>Historial IPV</span>
              </button>
            </>
          )}
        </nav>

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
              <span>Historial IPV</span>
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
                border: currentUser?.role === 'propietario' ? '1.5px solid #EC4899' : '1.5px solid var(--md-sys-color-primary)',
                backgroundColor: currentUser?.role === 'propietario' ? '#FCE7F3' : 'var(--md-sys-color-primary-container)',
                color: currentUser?.role === 'propietario' ? '#BE185D' : 'var(--md-sys-color-on-primary-container)',
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
              maxWidth: '500px',
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

            {/* Menu Options List */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {isOwner && (
                <>
                  <button
                    onClick={() => handleNavClick('quick')}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: activeTab === 'quick' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Home size={20} />
                      <span>Inicio Rápido</span>
                    </div>
                    <ChevronRight size={18} opacity={0.6} />
                  </button>

                  <button
                    onClick={() => handleNavClick('dashboard')}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: activeTab === 'dashboard' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <LayoutDashboard size={20} />
                      <span>Dashboard Contable</span>
                    </div>
                    <ChevronRight size={18} opacity={0.6} />
                  </button>
                </>
              )}

              <button
                onClick={() => handleNavClick('store')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: activeTab === 'store' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: activeTab === 'store' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Store size={20} />
                  <span>Inventario de Tienda</span>
                </div>
                <ChevronRight size={18} opacity={0.6} />
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => handleNavClick('transactions')}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: activeTab === 'transactions' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Receipt size={20} />
                      <span>Movimientos</span>
                    </div>
                    <ChevronRight size={18} opacity={0.6} />
                  </button>

                  <button
                    onClick={() => handleNavClick('reports')}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: activeTab === 'reports' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={20} />
                      <span>Historial IPV por Periodos</span>
                    </div>
                    <ChevronRight size={18} opacity={0.6} />
                  </button>
                </>
              )}

              <div style={{ margin: '8px 0', borderTop: '1px solid var(--md-sys-color-outline-variant)' }} />

              {onOpenScanner && (
                <button
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
              Samy Store v1.5.0 • PWA Offline
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
