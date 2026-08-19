'use client';

import React from 'react';
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
  Plus
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'transactions' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'reports') => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSync: () => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  onOpenRawDb,
  onOpenNewTransaction,
  onInstallPwa,
  canInstallPwa
}) => {
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
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* Brand logo & Offline Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #003B63 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            boxShadow: '0 4px 12px rgba(0,99,155,0.3)'
          }}>
            <Home size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                letterSpacing: '-0.02em',
                color: 'var(--md-sys-color-on-surface)'
              }}>
                Cuenta Casa
              </h1>
              {/* Online/Offline Status Pill */}
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: isOnline ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-expense-container)',
                color: isOnline ? 'var(--md-sys-color-on-income-container)' : 'var(--md-sys-color-on-expense-container)'
              }}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'ONLINE' : '100% OFFLINE'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Control Contable PWA • Base de datos cruda local
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Quick Add Buttons */}
          <button 
            onClick={() => onOpenNewTransaction('gasto')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense-container)',
              color: 'var(--md-sys-color-on-expense-container)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Gasto
          </button>

          <button 
            onClick={() => onOpenNewTransaction('ingreso')}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-income-container)',
              color: 'var(--md-sys-color-on-income-container)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Ingreso
          </button>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            title={pendingSyncCount > 0 ? `${pendingSyncCount} cambios pendientes por alinear` : 'Nube Alineada'}
            style={{
              position: 'relative',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>Alinear</span>
            {pendingSyncCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: 'var(--md-sys-color-expense)',
                color: '#FFF',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* Raw DB File Viewer Button */}
          <button
            onClick={onOpenRawDb}
            title="Ver/Editar Archivo de Base de Datos Cruda (JSON)"
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Database size={16} />
            <span>DB Cruda</span>
          </button>

          {/* PWA Install Button if available */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={onInstallPwa}
              title="Instalar WebAPK / PWA en tu dispositivo"
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#1A73E8',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
            >
              <Download size={16} />
              <span>Instalar WebAPK</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Cambiar Tema (Claro / Oscuro)"
            style={{
              padding: '8px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        gap: '8px',
        borderTop: '1px solid var(--md-sys-color-surface-variant)'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'dashboard' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Home size={18} /> Resumen General
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'transactions' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'transactions' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'transactions' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Receipt size={18} /> Movimientos
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid var(--md-sys-color-primary)' : '3px solid transparent',
            color: activeTab === 'reports' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            fontWeight: activeTab === 'reports' ? 700 : 500,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={18} /> Facturación y Reportes
        </button>
      </nav>
    </header>
  );
};
