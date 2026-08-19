'use client';

import React, { useState } from 'react';
import { AppTab } from '@/types';
import { 
  Home, 
  Receipt, 
  FileText, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sun, 
  Moon, 
  Download,
  Plus,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Smartphone
} from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSync: () => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showBalance: boolean;
  toggleShowBalance: () => void;
  onLogout: () => void;
  onOpenRawDb: () => void;
  onOpenNewTransaction: (type?: 'ingreso' | 'gasto') => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isOnline,
  pendingSyncCount,
  onSync,
  isSyncing,
  theme,
  toggleTheme,
  showBalance,
  toggleShowBalance,
  onLogout,
  onOpenRawDb,
  onOpenNewTransaction,
  onInstallPwa,
  canInstallPwa
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      backgroundColor: 'var(--md-sys-color-surface-container)',
      borderBottom: '1px solid var(--md-sys-color-surface-variant)',
      position: 'sticky',
      top: 0,
      zIndex: 80,
      backdropFilter: 'blur(10px)',
      boxShadow: 'var(--md-shadow-elevation-1)'
    }} className="no-print">
      
      {/* Top Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        
        {/* Brand logo & Offline Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #003B63 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF'
            }}>
              <Home size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                letterSpacing: '-0.02em',
                color: 'var(--md-sys-color-on-surface)'
              }}>
                Cuenta Casa
              </h1>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isOnline ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Quick Actions & Privacy Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Privacy Switch (Mostrar Saldo) */}
          <button
            onClick={toggleShowBalance}
            title={showBalance ? 'Ocultar Saldos (Modo Privado)' : 'Mostrar Saldos'}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: showBalance ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-expense-container)',
              color: showBalance ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-expense-container)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            <span className="hidden-mobile">{showBalance ? 'Saldo Visible' : 'Saldo Oculto'}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={pendingSyncCount > 0 ? `${pendingSyncCount} cambios pendientes` : 'Sincronizado'}
            style={{
              position: 'relative',
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem'
            }}
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            {pendingSyncCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--md-sys-color-expense)',
                color: '#FFF',
                fontSize: '0.6rem',
                fontWeight: 800,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* DB Cruda Modal Button */}
          <button
            onClick={onOpenRawDb}
            title="Ver/Editar JSON Crudo"
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Database size={15} />
            <span className="hidden-mobile">DB</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense-container)',
              color: 'var(--md-sys-color-on-expense-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <LogOut size={16} />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'none',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer'
            }}
            className="mobile-only-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        gap: '4px',
        overflowX: 'auto',
        borderTop: '1px solid var(--md-sys-color-surface-variant)'
      }}>
        <button
          onClick={() => setActiveTab('quick')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'quick' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'quick' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'quick' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Home size={16} /> Inicio Rápido
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'dashboard' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Receipt size={16} /> Dashboard
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'transactions' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'transactions' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'transactions' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Receipt size={16} /> Movimientos
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'reports' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'reports' ? 700 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText size={16} /> Facturación
        </button>
      </nav>

    </header>
  );
};
