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
  KeyRound,
  Trash2,
  RotateCcw,
  Zap,
  MessageCircle,
  Save
} from 'lucide-react';

import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { clearAllDatabaseRecords, validateMasterPassword, setMasterPassword, getStoreWhatsappNumber, saveStoreWhatsappNumber } from '@/lib/storage';

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
  const { showToast, confirmAction } = useActionFeedback();
  const [pin, setPin] = useState<string | null>(null);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const [isMasterPassModalOpen, setIsMasterPassModalOpen] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [masterPassError, setMasterPassError] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentPin = localStorage.getItem('cuentacasa_pin');
      setPin(currentPin);
      setIsEditingPin(false);
      setNewPin('');
      setIsMasterPassModalOpen(false);
      setMasterPasswordInput('');
      setMasterPassError('');
      setWhatsappPhone(getStoreWhatsappNumber());
      setIsEditingPhone(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePhone = () => {
    let clean = whatsappPhone.replace(/\D/g, '');
    if (clean.length === 8) {
      clean = '53' + clean;
    }
    saveStoreWhatsappNumber(clean);
    setWhatsappPhone(clean);
    setIsEditingPhone(false);
    showToast({
      title: '¡Teléfono de WhatsApp Guardado!',
      message: `Los pedidos de la tienda pública se enviarán al +${clean || 'WhatsApp por defecto'}.`,
      type: 'success'
    });
  };

  const handleSavePin = () => {
    if (newPin.length === 4) {
      localStorage.setItem('cuentacasa_pin', newPin);
      setPin(newPin);
      setIsEditingPin(false);
      showToast({
        title: '¡PIN Configurado!',
        message: 'PIN rápido de 4 dígitos guardado exitosamente.',
        type: 'success'
      });
    } else {
      showToast({
        title: 'PIN Inválido',
        message: 'El PIN rápido debe constar de exactamente 4 números.',
        type: 'error'
      });
    }
  };

  const handleOpenMasterPassModal = () => {
    setMasterPasswordInput('');
    setMasterPassError('');
    setIsMasterPassModalOpen(true);
  };

  const handleConfirmMasterPassReset = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterPassError('');

    if (!validateMasterPassword(masterPasswordInput)) {
      setMasterPassError('Contraseña Maestra incorrecta.');
      showToast({
        title: 'Acceso Denegado',
        message: 'Contraseña Maestra incorrecta.',
        type: 'error'
      });
      return;
    }

    // Save/update password in DB as requested
    setMasterPassword(masterPasswordInput.trim());

    // Perform database reset
    clearAllDatabaseRecords();
    showToast({
      title: '¡Base de Datos Reiniciada!',
      message: 'Se han eliminado todos los registros y vaciado la caché.',
      type: 'success'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleRemovePin = () => {
    confirmAction({
      title: '¿Desactivar PIN Rápido?',
      message: 'Se eliminará la clave rápida de 4 dígitos. Para ingresar requerirás la contraseña maestra.',
      variant: 'warning',
      confirmText: 'Desactivar PIN',
      onConfirm: () => {
        localStorage.removeItem('cuentacasa_pin');
        setPin(null);
        setIsEditingPin(false);
        showToast({
          title: 'PIN Desactivado',
          message: 'El acceso mediante PIN rápido ha sido desactivado.',
          type: 'info'
        });
      }
    });
  };

  const handleClearCacheAndReload = async () => {
    try {
      // 1. Unregister Service Workers if active
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Delete all CacheStorage caches
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 3. Clear SessionStorage (without touching localStorage DB records)
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }

      showToast({
        title: '¡Caché de Aplicación Borrada!',
        message: 'Caché eliminada con éxito. Recargando con los últimos diseños...',
        type: 'success'
      });

      // Force hard reload by appending timestamp query to bust browser asset cache
      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
        window.location.href = cleanUrl;
      }, 600);
    } catch (err) {
      showToast({
        title: 'Caché Limpiada',
        message: 'Recargando aplicación...',
        type: 'info'
      });
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>
      
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '500px',
          padding: '14px 24px 28px 24px',
          boxShadow: 'var(--md-shadow-elevation-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Material Design Drag Handle */}
        <div style={{
          width: '36px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 4px auto',
          opacity: 0.8
        }} />
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

          {/* Admin WhatsApp Phone Setup */}
          <div style={{
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid #25D366',
            backgroundColor: 'rgba(37, 211, 102, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageCircle size={18} color="#25D366" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                  WhatsApp Recepción de Pedidos
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: whatsappPhone ? '#25D366' : 'var(--md-sys-color-expense)' }}>
                {whatsappPhone ? `+${whatsappPhone}` : 'No Configurado'}
              </span>
            </div>

            {!isEditingPhone ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  Número al que llegarán los encargos realizados desde la tienda pública.
                </span>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem', borderColor: '#25D366', color: '#25D366' }}
                >
                  {whatsappPhone ? 'Editar Número' : 'Configurar Número'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="tel"
                    placeholder="Ej. 5351234567 o 53999999"
                    value={whatsappPhone}
                    onChange={e => setWhatsappPhone(e.target.value)}
                    className="input-spotlight"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #25D366',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.92rem',
                      fontWeight: 700
                    }}
                  />
                  <button
                    onClick={handleSavePhone}
                    className="md-btn"
                    style={{ backgroundColor: '#25D366', color: '#FFF', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 800 }}
                  >
                    <Save size={14} /> Guardar
                  </button>
                  <button
                    onClick={() => setIsEditingPhone(false)}
                    style={{ background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)' }}
                  >
                    Cancelar
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  💡 Para Las Tunas, escribe 8 dígitos (ej: 53999999) y se añadirá el +53 automáticamente.
                </span>
              </div>
            )}
          </div>
          
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

          {/* Clear Application Cache & Reload UI Designs */}
          <button
            onClick={handleClearCacheAndReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1.5px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 99, 155, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RotateCcw size={18} />
              <span>Limpiar Caché (Cargar Nuevos Diseños)</span>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              Recargar ⚡
            </span>
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

          {/* Reset / Purge DB to 0 Button */}
          <button
            onClick={handleOpenMasterPassModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '6px',
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.25)'
            }}
          >
            <Trash2 size={18} />
            <span>Reiniciar Base de Datos a 0 y Limpiar Caché</span>
          </button>

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

      {/* MASTER PASSWORD CONFIRMATION MODAL FOR DB PURGE */}
      {isMasterPassModalOpen && (
        <div 
          onClick={() => setIsMasterPassModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <form 
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            onSubmit={handleConfirmMasterPassReset}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--md-shadow-elevation-4)',
              animation: 'slideUp 0.25s ease-out'
            }}
          >
            {/* Drag handle */}
            <div style={{ width: '36px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={22} color="var(--md-sys-color-expense)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Confirmación de Seguridad</h3>
              </div>
              <button type="button" onClick={() => setIsMasterPassModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Critical Warning Alert Box */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-expense-container)',
              color: 'var(--md-sys-color-on-expense-container)',
              border: '1.5px solid var(--md-sys-color-expense)',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              fontWeight: 700
            }}>
              🚨 <strong>¡ATENCIÓN CRÍTICA!</strong> Esta acción borrará absolutamente <strong>TODOS</strong> los productos del inventario, ventas registradas, transacciones contables y cuentas de proveedores, reiniciando la base de datos a 0 y limpiando la caché.
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                Ingresa Contraseña Maestra:
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Ingresa clave maestra..."
                value={masterPasswordInput}
                onChange={e => setMasterPasswordInput(e.target.value)}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-expense)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                🔒 Se requiere autorización con la Contraseña Maestra para proceder.
              </span>
            </div>

            {masterPassError && (
              <div style={{ color: 'var(--md-sys-color-expense)', fontSize: '0.82rem', fontWeight: 800 }}>
                ❌ {masterPassError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsMasterPassModalOpen(false)}
                className="md-btn md-btn-secondary"
                style={{ flex: 1, padding: '12px', fontSize: '0.88rem' }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="md-btn md-btn-expense"
                style={{ flex: 1, padding: '12px', fontSize: '0.88rem', fontWeight: 800 }}
              >
                Confirmar y Borrar Todo
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
