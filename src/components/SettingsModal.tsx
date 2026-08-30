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
  RotateCcw,
  MessageCircle,
  Save,
  Users,
  Lock,
  CheckCircle2,
  Coins,
  DollarSign
} from 'lucide-react';

import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { 
  clearAllDatabaseRecords, 
  validateMasterPassword, 
  setMasterPassword, 
  getStoreWhatsappNumber, 
  saveStoreWhatsappNumber, 
  getAppUsers, 
  getLoggedInUser,
  getUserPin,
  setUserPin,
  clearUserPin,
  formatCubanPhone,
  performTotalCacheReset,
  getCurrencySettings,
  saveCurrencySettings,
  switchCurrencyMode
} from '@/lib/storage';
import { AppUser, CurrencyMode } from '@/types';
import { UserManagementModal } from '@/components/UserManagementModal';
import { getPendingSyncCount, syncDatabaseWithCloud } from '@/lib/sync';

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
  onOpenPendingSync?: () => void;
}

import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

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
  canInstallPwa,
  onOpenPendingSync
}) => {
  useLockBodyScroll(isOpen);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  const [hasPin, setHasPin] = useState<boolean>(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const [isMasterPassModalOpen, setIsMasterPassModalOpen] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [masterPassError, setMasterPassError] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('BOTH');
  const [exchangeRateUSD, setExchangeRateUSD] = useState<number>(320);
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const activeUsername = currentUser?.username || 'geyler';
      const userPin = getUserPin(activeUsername);
      setHasPin(!!userPin);
      setIsEditingPin(false);
      setNewPin('');
      setIsMasterPassModalOpen(false);
      setMasterPasswordInput('');
      setMasterPassError('');
      setWhatsappPhone(getStoreWhatsappNumber());
      setIsEditingPhone(false);
      setUsersList(getAppUsers());

      const cSettings = getCurrencySettings();
      setCurrencyMode(cSettings.currencyMode);
      setExchangeRateUSD(cSettings.exchangeRateUSD);
      setIsEditingExchangeRate(false);
    }
  }, [isOpen]);

  const handleSelectCurrencyMode = (mode: CurrencyMode) => {
    if (!isOwner) {
      showToast({
        title: 'Acceso Restringido',
        message: 'Solo los propietarios tienen autorización para cambiar la moneda de operación del negocio.',
        type: 'warning'
      });
      return;
    }

    if (mode === currencyMode) return;

    const labels: Record<CurrencyMode, string> = {
      CUP: 'Solo CUP ($)',
      USD: 'Solo USD (US$)',
      BOTH: 'Ambas Monedas (CUP + USD)'
    };

    const confirmMessages: Record<CurrencyMode, string> = {
      USD: 'Al activar el modo "Solo USD (US$)", todos los productos publicados con precios en CUP pasarán automáticamente a Borrador (ocultos de la tienda) y las transacciones/saldos en CUP se ocultarán de todas las vistas y formularios. ¿Deseas continuar?',
      CUP: 'Al activar el modo "Solo CUP ($)", todos los productos publicados con precios en USD pasarán automáticamente a Borrador (ocultos de la tienda) y las transacciones/saldos en USD se ocultarán de todas las vistas y formularios. ¿Deseas continuar?',
      BOTH: 'Al activar "Ambas Monedas (CUP + USD)", se mostrarán y permitirán transacciones en ambas divisas de forma simultánea. ¿Deseas continuar?'
    };

    confirmAction({
      title: `¿Cambiar Modo a ${labels[mode]}?`,
      message: confirmMessages[mode],
      variant: 'warning',
      confirmText: 'Sí, Cambiar Configuración',
      onConfirm: () => {
        setCurrencyMode(mode);
        switchCurrencyMode(mode);
        showToast({
          title: 'Modo de Moneda Actualizado',
          message: `Configuración cambiada exitosamente a: ${labels[mode]}.`,
          type: 'success'
        });
      }
    });
  };

  const handleSaveExchangeRate = () => {
    if (exchangeRateUSD > 0) {
      saveCurrencySettings({ exchangeRateUSD });
      setIsEditingExchangeRate(false);
      showToast({
        title: 'Tipo de Cambio Guardado',
        message: `Tasa de conversión actualizada: 1 USD = ${exchangeRateUSD} CUP.`,
        type: 'success'
      });
    } else {
      showToast({
        title: 'Tasa Inválida',
        message: 'Ingresa un tipo de cambio mayor a 0.',
        type: 'error'
      });
    }
  };

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
      message: `Los pedidos de la tienda pública se enviarán a: ${formatCubanPhone(clean).display}.`,
      type: 'success'
    });
  };

  const handleSavePin = () => {
    if (newPin.length === 4) {
      const activeUsername = currentUser?.username || 'geyler';
      setUserPin(activeUsername, newPin);
      setHasPin(true);
      setIsEditingPin(false);
      setNewPin('');
      showToast({
        title: '¡PIN Configurado!',
        message: 'Tu PIN de 4 dígitos ha sido guardado de forma segura.',
        type: 'success'
      });
    } else {
      showToast({
        title: 'PIN Inválido',
        message: 'El PIN debe ser exactamente de 4 dígitos numéricos.',
        type: 'error'
      });
    }
  };

  const handleRemovePin = () => {
    confirmAction({
      title: '¿Desactivar PIN Personal?',
      message: 'Se eliminará tu clave de 4 dígitos. Requerirás tu usuario y contraseña para ingresar.',
      variant: 'warning',
      confirmText: 'Desactivar PIN',
      onConfirm: () => {
        const activeUsername = currentUser?.username || 'geyler';
        clearUserPin(activeUsername);
        setHasPin(false);
        setIsEditingPin(false);
        showToast({
          title: 'PIN Desactivado',
          message: 'Tu acceso rápido mediante PIN ha sido desactivado.',
          type: 'info'
        });
      }
    });
  };

  const handleOpenMasterPassModal = () => {
    setMasterPasswordInput('');
    setMasterPassError('');
    setIsMasterPassModalOpen(true);
  };

  const handleConfirmMasterPassReset = async (e: React.FormEvent) => {
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

    setMasterPassword(masterPasswordInput.trim());

    // Sync any pending changes before wiping local cache if online
    const pendingCount = getPendingSyncCount();
    if (pendingCount > 0 && typeof window !== 'undefined' && navigator.onLine) {
      showToast({
        title: 'Sincronizando Cambios Pendientes...',
        message: `Guardando ${pendingCount} operaciones en la nube antes del reinicio...`,
        type: 'info'
      });
      await syncDatabaseWithCloud(true);
    }

    clearAllDatabaseRecords();

    try {
      if (typeof window !== 'undefined' && navigator.onLine) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetAll: true })
        });
      }
    } catch (err) {}

    showToast({
      title: '¡Base de Datos Reiniciada!',
      message: 'Se han eliminado todos los registros locales conservando tus usuarios.',
      type: 'success'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleClearCacheAndReload = async () => {
    if (!isOnline) {
      showToast({
        title: 'Sin Conexión a Internet',
        message: 'Requiere conexión activa a internet para recargar el sistema y descargar datos actualizados.',
        type: 'error'
      });
      return;
    }

    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }

      showToast({
        title: '¡Caché Limpiada!',
        message: 'Recargando aplicación con los últimos datos y código actualizado...',
        type: 'success'
      });

      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
        window.location.href = cleanUrl;
      }, 600);
    } catch (err) {
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  const formattedWhatsapp = formatCubanPhone(whatsappPhone).display;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
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
          {/* Handle Drag */}
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: 'var(--md-sys-color-outline-variant)',
            margin: '0 auto 4px auto'
          }} />

          {/* Modal Title Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                  Ajustes del Sistema
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                  Samy Store • @{currentUser?.username || 'geyler'} ({currentUser?.role || 'admin'})
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%'
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Main Controls List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Configuración de Monedas (CUP / USD / Ambas + Tasa de Cambio) */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1.5px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} color="var(--md-sys-color-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface)' }}>
                    Monedas del Sistema
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                  {currencyMode === 'BOTH' ? 'CUP + USD' : currencyMode === 'CUP' ? 'Solo CUP' : 'Solo USD'}
                </span>
              </div>

              {/* Toggles for Currency Mode */}
              {isOwner ? (
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Selecciona la moneda principal de operación:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleSelectCurrencyMode('CUP')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: currencyMode === 'CUP' ? '2px solid #059669' : '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: currencyMode === 'CUP' ? '#ECFDF5' : 'var(--md-sys-color-surface)',
                        color: currencyMode === 'CUP' ? '#047857' : 'var(--md-sys-color-on-surface)',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Solo CUP ($)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCurrencyMode('USD')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: currencyMode === 'USD' ? '2px solid #2563EB' : '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: currencyMode === 'USD' ? '#EFF6FF' : 'var(--md-sys-color-surface)',
                        color: currencyMode === 'USD' ? '#1D4ED8' : 'var(--md-sys-color-on-surface)',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Solo USD (US$)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCurrencyMode('BOTH')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: currencyMode === 'BOTH' ? '2px solid #7C3AED' : '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: currencyMode === 'BOTH' ? '#F5F3FF' : 'var(--md-sys-color-surface)',
                        color: currencyMode === 'BOTH' ? '#6D28D9' : 'var(--md-sys-color-on-surface)',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Ambas (CUP+USD)
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Lock size={14} color="var(--md-sys-color-on-surface-variant)" />
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    La configuración del modo de moneda es gestionada únicamente por el Propietario.
                  </span>
                </div>
              )}

              {/* Exchange Rate Setting */}
              <div style={{
                paddingTop: '10px',
                borderTop: '1px dashed var(--md-sys-color-outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'block' }}>
                    Tipo de Cambio Referencial
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    1 USD = ${exchangeRateUSD} CUP
                  </span>
                </div>

                {isOwner && (!isEditingExchangeRate ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingExchangeRate(true)}
                    className="md-btn md-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800 }}
                  >
                    Cambiar Tasa
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>1 USD =</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        style={{
                          width: '75px',
                          padding: '6px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--md-sys-color-primary)',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          textAlign: 'center'
                        }}
                        value={exchangeRateUSD}
                        onChange={e => setExchangeRateUSD(e.target.value === '' ? '' as any : parseFloat(e.target.value))}
                      />
                      <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>CUP</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveExchangeRate}
                      className="md-btn md-btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.76rem', fontWeight: 800 }}
                    >
                      <Save size={12} /> Guardar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración de WhatsApp de Recepción de Pedidos */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              border: '1.5px solid #25D366',
              backgroundColor: 'rgba(37, 211, 102, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={18} color="#25D366" />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface)' }}>
                    WhatsApp Pedidos
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: whatsappPhone ? '#25D366' : 'var(--md-sys-color-expense)' }}>
                  {whatsappPhone ? formattedWhatsapp : 'No Configurado'}
                </span>
              </div>

              {!isEditingPhone ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ flex: '1 1 180px', fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    Número donde se reciben los carritos de compra.
                  </span>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="md-btn md-btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem', borderColor: '#25D366', color: '#25D366', flexShrink: 0 }}
                  >
                    {whatsappPhone ? 'Editar Número' : 'Configurar'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      placeholder="Ej. 5351234567 o 53999999"
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value.replace(/\D/g, ''))}
                      className="input-spotlight"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1.5px solid #25D366',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.88rem',
                        fontWeight: 700
                      }}
                    />
                    <button
                      onClick={handleSavePhone}
                      className="md-btn"
                      style={{ backgroundColor: '#25D366', color: '#FFF', padding: '8px 12px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}
                    >
                      <Save size={14} /> Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      style={{ background: 'none', border: 'none', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0, padding: '4px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    💡 Se formateará automáticamente con +53.
                  </span>
                </div>
              )}
            </div>
            
            {/* PIN Rápido Personal Enmascarado con Asteriscos */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <Hash size={18} color="var(--md-sys-color-primary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>PIN Personal (4 Dígitos)</span>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: hasPin ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)', flexShrink: 0 }}>
                  {hasPin ? '🔐 PIN Activado (••••)' : '🔓 Sin PIN'}
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
                    <span>{hasPin ? 'Cambiar PIN' : 'Configurar PIN'}</span>
                  </button>
                  {hasPin && (
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
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      maxLength={4}
                      placeholder="••••"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline)',
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.95rem',
                        letterSpacing: '0.2rem',
                        textAlign: 'center'
                      }}
                    />
                    <button
                      onClick={handleSavePin}
                      className="md-btn md-btn-primary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', flexShrink: 0 }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingPin(false)}
                      style={{ background: 'none', border: 'none', fontSize: '0.78rem', cursor: 'pointer', color: 'var(--md-sys-color-on-surface-variant)', flexShrink: 0, padding: '4px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Dedicada de Gestión de Usuarios para Propietarios/Admins */}
            {isOwner && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} color="var(--md-sys-color-primary)" />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', display: 'block' }}>
                      Gestión de Usuarios
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                      {usersList.length} usuarios registrados
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsUserManagementOpen(true)}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 800 }}
                >
                  Abrir Lista
                </button>
              </div>
            )}

            {/* Ocultar / Mostrar Saldos */}
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
                {showBalance ? <EyeOff size={18} color="var(--md-sys-color-primary)" /> : <Eye size={18} color="var(--md-sys-color-primary)" />}
                <span>{showBalance ? 'Ocultar Cifras Financieras' : 'Mostrar Cifras Financieras'}</span>
              </div>
              <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                {showBalance ? 'Visibles' : 'Ocultos'}
              </span>
            </button>

            {/* Tema Visual */}
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
                {theme === 'light' ? <Moon size={18} color="var(--md-sys-color-primary)" /> : <Sun size={18} color="var(--md-sys-color-primary)" />}
                <span>Tema de la Aplicación</span>
              </div>
              <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', opacity: 0.8 }}>
                Modo {theme === 'light' ? 'Claro' : 'Oscuro'}
              </span>
            </button>

            {/* Estado de Conexión y Nube */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isOnline ? <Wifi size={18} color="#059669" /> : <WifiOff size={18} color="#EF4444" />}
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    Estado de Red: {isOnline ? 'Conectado a Internet' : 'Sin Conexión'}
                  </span>
                </div>
                {pendingSyncCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenPendingSync) onOpenPendingSync();
                    }}
                    style={{
                      fontSize: '0.72rem',
                      backgroundColor: 'var(--md-sys-color-primary)',
                      color: '#FFF',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>⚡ {pendingSyncCount} pendientes</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {pendingSyncCount > 0 && onOpenPendingSync && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPendingSync();
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    border: '1.5px solid var(--md-sys-color-primary)',
                    backgroundColor: 'var(--md-sys-color-primary-container)',
                    color: 'var(--md-sys-color-on-primary-container)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Ver Listado de Pendientes ({pendingSyncCount})</span>
                </button>
              )}

              <button
                onClick={onSync}
                disabled={isSyncing}
                className="md-btn md-btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 800 }}
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Subiendo Pendientes...' : 'Subir Pendientes / Sincronizar'}</span>
              </button>
            </div>

            {/* Reset Total de Caché (Limpieza Absoluta e Instalación Limpia) */}
            <button
              onClick={async () => {
                confirmAction({
                  title: '⚡ ¿Reset Total de Caché e Instalación Limpia?',
                  message: 'Se borrarán absolutamente TODOS los datos locales, IndexedDB, Service Workers, cachés y cookies. La app quedará limpia como recién instalada y requerirá iniciar sesión.',
                  variant: 'danger',
                  confirmText: 'Resetear Todo y Limpiar App',
                  onConfirm: async () => {
                    await performTotalCacheReset();
                  }
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
              }}
              title="Borra absolutamente todos los datos, bases de datos locales, cachés de service worker y cookies para dejar la app como recién instalada."
            >
              <RotateCcw size={18} />
              <span>Reset Total de Caché (Instalación Limpia)</span>
            </button>

            {/* Recargar Caché y Datos Nuevos (Solo con Conexión Requerida) */}
            <button
              onClick={handleClearCacheAndReload}
              disabled={!isOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: isOnline ? '#3B82F6' : '#94A3B8',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: isOnline ? 'pointer' : 'not-allowed',
                opacity: isOnline ? 1 : 0.6,
                boxShadow: isOnline ? '0 4px 14px rgba(59, 130, 246, 0.25)' : 'none'
              }}
              title={!isOnline ? 'Requiere conexión a internet para recargar los scripts del sistema' : 'Recargar los últimos cambios'}
            >
              <RotateCcw size={18} />
              <span>{isOnline ? 'Recargar Caché Rápida' : 'Recargar Caché (Requiere Conexión)'}</span>
            </button>

            {/* Reiniciar Base de Datos (Conserva Usuarios y Roles) */}
            {isOwner && (
              <button
                onClick={handleOpenMasterPassModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: 'var(--md-sys-color-expense-container)',
                  color: 'var(--md-sys-color-on-expense-container)',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Database size={18} />
                <span>Reiniciar Base de Datos (Mantiene Usuarios)</span>
              </button>
            )}

            {/* Cerrar Sesión */}
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>

          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', marginTop: '6px' }}>
            Samy Store v1.3.0 • Cubasoft ERP Systems
          </div>

        </div>

      </div>

      {/* Modal Dedicada de Gestión de Usuarios */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          setUsersList(getAppUsers());
        }}
      />

      {/* Master Password Modal for Full Database Reset */}
      {isMasterPassModalOpen && (
        <div 
          onClick={() => setIsMasterPassModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              borderRadius: '28px 28px 0 0',
              padding: '24px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: 'var(--md-shadow-elevation-4)',
              borderTop: '3px solid var(--md-sys-color-expense)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Handle visual */}
            <div style={{
              width: '36px',
              height: '4px',
              backgroundColor: 'var(--md-sys-color-outline-variant)',
              borderRadius: '9999px',
              margin: '0 auto 16px auto'
            }} />

            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-expense)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} />
              Confirmar Reinicio Completo
            </h3>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: '1.4' }}>
              Se borrarán todos los productos, ventas, movimientos y proveedores de la tienda y la casa. <strong>Se conservarán tus usuarios y roles activos.</strong>
            </p>

            <form onSubmit={handleConfirmMasterPassReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                placeholder="Contraseña del Propietario"
                value={masterPasswordInput}
                onChange={e => setMasterPasswordInput(e.target.value)}
                required
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--md-sys-color-outline)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              />

              {masterPassError && (
                <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-expense)', fontWeight: 800 }}>
                  ❌ {masterPassError}
                </span>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsMasterPassModalOpen(false)}
                  className="md-btn md-btn-secondary"
                  style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="md-btn"
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--md-sys-color-expense)',
                    color: '#FFF',
                    fontWeight: 800
                  }}
                >
                  Confirmar Borrado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
