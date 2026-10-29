'use client';

import React from 'react';
import { AppTab, AppUser } from '@/types';
import { 
  Home, 
  LayoutDashboard, 
  Store, 
  Receipt, 
  BarChart3, 
  Plus, 
  Scan, 
  Settings, 
  User, 
  ExternalLink, 
  Moon, 
  Sun,
  CloudUpload,
  Loader2,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenGasto: () => void;
  onOpenIngreso: () => void;
  onOpenPOS: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  currentUser: AppUser | null;
  isSyncing: boolean;
  pendingSyncCount: number;
  onOpenPendingSync: () => void;
  onToggleTheme: () => void;
  currentTheme: 'light' | 'dark';
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenGasto,
  onOpenIngreso,
  onOpenPOS,
  onOpenSettings,
  onOpenProfile,
  currentUser,
  isSyncing,
  pendingSyncCount,
  onOpenPendingSync,
  onToggleTheme,
  currentTheme
}) => {
  const isOwner = !currentUser || currentUser.role === 'propietario';

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'quick', label: 'Inicio', icon: <Home size={18} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'store', label: 'Tienda & POS', icon: <Store size={18} /> },
    { id: 'transactions', label: 'Movimientos', icon: <Receipt size={18} /> },
    { id: 'reports', label: 'Reportes', icon: <BarChart3 size={18} /> },
    { id: 'shifts', label: 'Turnos e IPV', icon: <Clock size={18} /> },
    { id: 'valuation', label: 'Trazabilidad & Tasación', icon: <FileSpreadsheet size={18} /> }
  ];

  return (
    <aside 
      className="desktop-flex no-print admin-sidebar-container"
      style={{
        width: '240px',
        minWidth: '240px',
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRight: '1px solid var(--md-sys-color-outline-variant)',
        flexDirection: 'column',
        zIndex: 90,
        overflowY: 'auto'
      }}
    >
      {/* 1. Quick Action CTAs */}
      {isOwner && (
        <div style={{ padding: '16px 16px 8px 16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenGasto}
            className="md-btn"
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-expense-container, #FEF2F2)',
              color: 'var(--md-sys-color-expense, #DC2626)',
              border: '1px solid var(--md-sys-color-expense, #DC2626)',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <TrendingDown size={14} />
            <span>Gasto</span>
          </button>

          <button
            onClick={onOpenIngreso}
            className="md-btn"
            style={{
              flex: 1,
              padding: '9px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-income-container, #ECFDF5)',
              color: 'var(--md-sys-color-income, #059669)',
              border: '1px solid var(--md-sys-color-income, #059669)',
              fontSize: '0.78rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={14} />
            <span>Ingreso</span>
          </button>
        </div>
      )}

      {/* 3. Navigation Menu List */}
      <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          color: 'var(--md-sys-color-on-surface-variant)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '6px 10px 4px 10px'
        }}>
          Navegación
        </span>

        {navItems.map(item => {
          if (!isOwner && item.id !== 'store') return null;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: isActive ? 'var(--md-sys-color-primary-container)' : 'transparent',
                color: isActive ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ color: isActive ? 'var(--md-sys-color-primary)' : 'currentColor', display: 'flex' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--md-sys-color-primary)'
                }} />
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div style={{ height: '1px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '10px 6px' }} />

        <span style={{
          fontSize: '0.68rem',
          fontWeight: 800,
          color: 'var(--md-sys-color-on-surface-variant)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 10px'
        }}>
          Acciones & Catálogo
        </span>

        {/* Fast POS Scanner Button */}
        <button
          onClick={onOpenPOS}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <Scan size={18} color="var(--brand-secondary, #0D9488)" />
          <span style={{ flex: 1 }}>Escanear / POS</span>
        </button>

        {/* External Link to Public Store */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '14px',
            textDecoration: 'none',
            color: 'var(--md-sys-color-on-surface)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <ExternalLink size={18} color="var(--md-sys-color-on-surface-variant)" />
          <span style={{ flex: 1 }}>Ver Tienda Pública</span>
        </a>

        {/* Sync Status Badge */}
        {pendingSyncCount > 0 && (
          <button
            onClick={onOpenPendingSync}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-warning, #D97706)',
              backgroundColor: 'var(--md-sys-color-warning-container, #FFFBEB)',
              color: 'var(--md-sys-color-on-warning-container, #92400E)',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
            <span>{pendingSyncCount} pendientes de sincronizar</span>
          </button>
        )}
      </nav>

      {/* 4. Footer Section: User Profile + Settings + Theme Toggle */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {/* User Profile Card */}
        <div
          onClick={() => {
            setActiveTab('profile');
            if (onOpenProfile) onOpenProfile();
          }}
          title="Ver mi perfil de usuario"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: activeTab === 'profile' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
            border: activeTab === 'profile' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.85rem'
          }}>
            {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: 'block',
              fontSize: '0.84rem',
              fontWeight: 800,
              color: 'var(--md-sys-color-on-surface)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser?.name || 'Administrador'}
            </span>
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldCheck size={11} color="var(--md-sys-color-primary)" />
              {currentUser?.role || 'propietario'}
            </span>
          </div>
        </div>

        {/* Settings & Theme Row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setActiveTab('settings');
              if (onOpenSettings) onOpenSettings();
            }}
            className="md-btn"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: activeTab === 'settings' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
              border: activeTab === 'settings' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              color: activeTab === 'settings' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Settings size={15} />
            <span>Ajustes</span>
          </button>

          <button
            onClick={onToggleTheme}
            title={currentTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {currentTheme === 'dark' ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
