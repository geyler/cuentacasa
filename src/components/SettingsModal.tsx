'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Sun, 
  Moon, 
  Download, 
  LogOut, 
  X, 
  Wifi, 
  WifiOff,
  Eye,
  EyeOff,
  Settings,
  Hash,
  KeyRound
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onSync: () => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showBalance: boolean;
  toggleShowBalance: () => void;
  onOpenRawDb?: () => void;
  onLogout: () => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  pendingSyncCount,
  onSync,
  isSyncing,
  theme,
  toggleTheme,
  showBalance,
  toggleShowBalance,
  onLogout,
  onInstallPwa,
  canInstallPwa
}) => {
  const [pin, setPin] = useState<string | null>(null);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentPin = localStorage.getItem('cuentacasa_pin');
      setPin(currentPin);
      setIsEditingPin(false);
      setNewPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePin = () => {
    if (newPin.length === 4) {
      localStorage.setItem('cuentacasa_pin', newPin);
      setPin(newPin);
      setIsEditingPin(false);
      alert('PIN rápido de 4 dígitos guardado exitosamente.');
    } else {
      alert('El PIN debe tener exactamente 4 números.');
    }
  };

  const handleRemovePin = () => {
    localStorage.removeItem('cuentacasa_pin');
    setPin(null);
    setIsEditingPin(false);
    alert('PIN rápido desactivado.');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }} className="no-print" onClick={onClose}>
      
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
          boxShadow: 'var(--md-shadow-elevation-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Ajustes y Utilidades</h3>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Network Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: '14px',
          backgroundColor: isOnline ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-expense-container)',
          color: isOnline ? 'var(--md-sys-color-on-income-container)' : 'var(--md-sys-color-on-expense-container)',
          fontWeight: 700,
          fontSize: '0.88rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span>{isOnline ? 'Conexión Online Activa' : 'Modo 100% Offline'}</span>
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Hostinger BD</span>
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Quick PIN Setup */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Hash size={18} color="var(--md-sys-color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>PIN Rápido (4 Dígitos)</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pin ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)' }}>
                {pin ? `Activo (${pin})` : 'Desactivado'}
              </span>
            </div>

            {!isEditingPin ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsEditingPin(true)}
                  className="md-btn md-btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  <KeyRound size={14} />
                  <span>{pin ? 'Cambiar PIN' : 'Configurar PIN Rápido'}</span>
                </button>
                {pin && (
                  <button
                    onClick={handleRemovePin}
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--md-sys-color-expense-container)',
                      color: 'var(--md-sys-color-on-expense-container)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Quitar PIN
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Ej. 1234"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline)',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '1rem',
                      letterSpacing: '0.2rem',
                      textAlign: 'center'
                    }}
                  />
                  <button
                    onClick={handleSavePin}
                    className="md-btn md-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setIsEditingPin(false)}
                    style={{ background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Privacy Show Balance */}
          <button
            onClick={toggleShowBalance}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              <span>Mostrar Saldos en Pantalla</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: showBalance ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)' }}>
              {showBalance ? 'SI' : 'NO (Oculto)'}
            </span>
          </button>

          {/* Sync Button */}
          <button
            onClick={() => { onSync(); onClose(); }}
            disabled={isSyncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              <span>Alinear / Sincronizar Hostinger BD</span>
            </div>
            {pendingSyncCount > 0 && (
              <span style={{
                backgroundColor: 'var(--md-sys-color-expense)',
                color: '#FFF',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.75rem'
              }}>
                {pendingSyncCount} pendientes
              </span>
            )}
          </button>


          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>Tema Visual</span>
            </div>
            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{theme}</span>
          </button>

          {/* PWA Install Button */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={() => { onInstallPwa(); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <Download size={18} />
              <span>Instalar Aplicación WebAPK</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense-container)',
              color: 'var(--md-sys-color-on-expense-container)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '6px'
            }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>

        </div>

      </div>
    </div>
  );
};
