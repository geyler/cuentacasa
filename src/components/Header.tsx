'use client';

import React from 'react';
import { AppTab } from '@/types';
import { 
  Home, 
  Receipt, 
  FileText, 
  Eye,
  EyeOff,
  Settings,
  LayoutDashboard
} from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  showBalance: boolean;
  toggleShowBalance: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showBalance,
  toggleShowBalance,
  onOpenSettings
}) => {
  return (
    <header style={{
      backgroundColor: 'var(--md-sys-color-surface-container)',
      borderBottom: '1px solid var(--md-sys-color-surface-variant)',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      boxShadow: 'var(--md-shadow-elevation-1)'
    }} className="no-print">
      
      {/* Ultra Compact Single Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px'
      }}>
        
        {/* Brand logo & Title */}
        <button
          onClick={() => setActiveTab('quick')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: 'var(--md-sys-color-primary)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Home size={18} />
          </div>
          <h1 style={{ 
            fontSize: '1.05rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            color: 'var(--md-sys-color-on-surface)'
          }}>
            Cuenta Casa
          </h1>
        </button>

        {/* Compact Center Navigation Tabs */}
        <nav style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setActiveTab('quick')}
            title="Inicio Rápido"
            style={{
              padding: '6px 10px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTab === 'quick' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Home size={15} />
            <span className="hidden-mobile">Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard Contable"
            style={{
              padding: '6px 10px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <LayoutDashboard size={15} />
            <span className="hidden-mobile">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            title="Movimientos"
            style={{
              padding: '6px 10px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTab === 'transactions' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Receipt size={15} />
            <span className="hidden-mobile">Movimientos</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            title="Facturación"
            style={{
              padding: '6px 10px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileText size={15} />
            <span className="hidden-mobile">Factura</span>
          </button>
        </nav>

        {/* Right Side Icons: Eye Privacy Toggle & Settings Gear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          
          {/* Eye Privacy Toggle */}
          <button
            onClick={toggleShowBalance}
            title={showBalance ? 'Ocultar Saldos (Modo Privado)' : 'Mostrar Saldos'}
            style={{
              padding: '6px',
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
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {/* Settings Gear Button */}
          <button
            onClick={onOpenSettings}
            title="Ajustes y Utilidades"
            style={{
              padding: '6px',
              borderRadius: '50%',
              border: 'none',
              background: 'none',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={19} />
          </button>

        </div>
      </div>

    </header>
  );
};
