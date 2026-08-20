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
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  showBalance: boolean;
  toggleShowBalance: () => void;
  onOpenSettings: () => void;
  onOpenScanner?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showBalance,
  toggleShowBalance,
  onOpenSettings,
  onOpenScanner,
  isSyncing = false
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px'
      }}>
        
        {/* Brand logo & Title */}
        <button
          onClick={() => setActiveTab('quick')}
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
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 99, 155, 0.25)'
          }}>
            <Home size={20} />
          </div>
          <h1 style={{ 
            fontSize: '1.1rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            color: 'var(--md-sys-color-on-surface)'
          }}>
            Cuenta Casa
          </h1>
        </button>

        {/* Right Actions: Quick Dashboard + Quick Scanner + Eye + Hamburger Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Quick Access 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            title="Ir al Dashboard Contable"
            style={{
              padding: '7px 12px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'dashboard' ? '#FFFFFF' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LayoutDashboard size={16} />
            <span className="hidden-mobile">Dashboard</span>
          </button>

          {/* Quick Access 2: Barcode Scanner */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              title="Escáner de Productos (Venta Instantánea)"
              style={{
                padding: '7px 12px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Scan size={16} />
              <span className="hidden-mobile">Escáner</span>
            </button>
          )}

          {/* Eye Balance Privacy Toggle */}
          <button
            onClick={toggleShowBalance}
            title={showBalance ? 'Ocultar Saldos (Modo Privado)' : 'Mostrar Saldos'}
            style={{
              padding: '8px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: showBalance ? 'transparent' : 'var(--md-sys-color-expense-container)',
              color: showBalance ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-expense)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {showBalance ? <Eye size={19} /> : <EyeOff size={19} />}
          </button>

          {/* Hamburger Drawer Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            title="Abrir Menú Principal"
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800
            }}
          >
            <Menu size={20} />
            <span className="hidden-mobile">Menú</span>
          </button>

        </div>
      </div>

      {/* Hamburger Navigation Drawer Modal (MD3 Side Sheet) */}
      {isDrawerOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 150,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '100%',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              boxShadow: 'var(--md-shadow-elevation-3)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 16px'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Home size={18} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Menú de Opciones</h3>
              </div>

              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Menu Navigation Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              
              <button
                onClick={() => handleNavClick('quick')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: activeTab === 'quick' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Home size={18} />
                  <span>Inicio Rápido</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                onClick={() => handleNavClick('dashboard')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: activeTab === 'dashboard' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard Contable</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                onClick={() => handleNavClick('store')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'store' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: activeTab === 'store' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Store size={18} />
                  <span>Inventario de Tienda</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                onClick={() => handleNavClick('transactions')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: activeTab === 'transactions' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Receipt size={18} />
                  <span>Movimientos</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                onClick={() => handleNavClick('reports')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  color: activeTab === 'reports' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} />
                  <span>Reportes por Fechas</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <div style={{ margin: '8px 0', borderTop: '1px solid var(--md-sys-color-outline-variant)' }} />

              {onOpenScanner && (
                <button
                  onClick={() => { setIsDrawerOpen(false); onOpenScanner(); }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Scan size={18} color="var(--md-sys-color-primary)" />
                    <span>Escáner de Ventas</span>
                  </div>
                  <ChevronRight size={16} opacity={0.6} />
                </button>
              )}

              <button
                onClick={() => { setIsDrawerOpen(false); onOpenSettings(); }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                  <span>Ajustes y Nube</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

            </nav>

            {/* Footer status */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--md-sys-color-outline-variant)', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>
              Cuenta Casa v1.0 • PWA Offline
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
