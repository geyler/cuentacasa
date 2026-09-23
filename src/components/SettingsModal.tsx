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
  DollarSign,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { 
  clearAllDatabaseRecords, 
  getRawDatabase,
  saveRawDatabase,
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
  switchCurrencyMode,
  syncElToqueExchangeRate
} from '@/lib/storage';
import { AppUser, CurrencyMode } from '@/types';
import { UserManagementModal } from '@/components/UserManagementModal';
import { TransferModal } from '@/components/TransferModal';
import { getPendingSyncCount, syncDatabaseWithCloud } from '@/lib/sync';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

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

type ActiveSubModal = 'none' | 'accounts' | 'currencies' | 'exchangeRate' | 'whatsapp' | 'security';

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
  useLockBodyScroll(isOpen, onClose);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  // Sub-modal navigation state
  const [activeSubModal, setActiveSubModal] = useState<ActiveSubModal>('none');
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const [isMasterPassModalOpen, setIsMasterPassModalOpen] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [masterPassError, setMasterPassError] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [usersList, setUsersList] = useState<AppUser[]>([]);

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('BOTH');
  const [exchangeRateUSD, setExchangeRateUSD] = useState<number>(320);
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [isSyncingElToque, setIsSyncingElToque] = useState(false);

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
      setActiveSubModal('none');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Currency Mode Selection
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
        setActiveSubModal('none');
      }
    });
  };

  // Save Manual Exchange Rate
  const handleSaveExchangeRate = () => {
    if (exchangeRateUSD > 0) {
      saveCurrencySettings({ exchangeRateUSD });
      setIsEditingExchangeRate(false);
      showToast({
        title: 'Tipo de Cambio Guardado',
        message: `Tasa de conversión actualizada: 1 USD = ${exchangeRateUSD} CUP.`,
        type: 'success'
      });
      setActiveSubModal('none');
    } else {
      showToast({
        title: 'Tasa Inválida',
        message: 'Ingresa un tipo de cambio mayor a 0.',
        type: 'error'
      });
    }
  };

  if (!isOpen) return null;
  // Sync Rate from elTOQUE
  const handleManualSyncElToque = async () => {
    setIsSyncingElToque(true);
    try {
      const updated = await syncElToqueExchangeRate();
      setExchangeRateUSD(updated.exchangeRateUSD);
      showToast({
        title: 'Tasa Sincronizada con elTOQUE',
        message: `Tasa representativa informal actualizada: 1 USD = ${updated.exchangeRateUSD} CUP`,
        type: 'success'
      });
    } catch (e) {
      showToast({
        title: 'Sincronización Fallida',
        message: 'No se pudo conectar con elTOQUE. Se mantendrá la tasa manual.',
        type: 'warning'
      });
    } finally {
      setIsSyncingElToque(false);
    }
  };

  // WhatsApp Phone Save
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
    setActiveSubModal('none');
  };

  // PIN Management
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

  // Master Password Reset
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

    const resetTimestamp = Date.now();
    clearAllDatabaseRecords(); // Sets pendingReset: true, pendingResetAt: resetTimestamp

    let onlineSuccess = false;
    try {
      if (typeof window !== 'undefined' && navigator.onLine) {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetAll: true, resetAt: resetTimestamp })
        });
        if (res.ok) {
          onlineSuccess = true;
          const current = getRawDatabase();
          current.pendingReset = false;
          current.pendingResetAt = undefined;
          current.lastSync = new Date().toISOString();
          saveRawDatabase(current);
        }
      }
    } catch (err) {}

    showToast({
      title: '¡Base de Datos Reiniciada!',
      message: onlineSuccess
        ? 'Se han eliminado todos los registros en este dispositivo y en la nube (conservando usuarios).'
        : 'Se han eliminado los registros locales. Se sincronizará el reinicio con la nube al reconectar sin perder tus próximos movimientos.',
      type: 'success'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Cache Reload
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

  // Reusable Menu Button Component with Uniform Layout
  const MenuItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge?: string;
    onClick: () => void;
    badgeVariant?: 'neutral' | 'success' | 'warning' | 'info';
  }> = ({ icon, title, subtitle, badge, badgeVariant = 'neutral', onClick }) => {
    let badgeBg = 'var(--md-sys-color-surface-variant)';
    let badgeColor = 'var(--md-sys-color-on-surface-variant)';
    if (badgeVariant === 'success') {
      badgeBg = '#ECFDF5';
      badgeColor = '#065F46';
    } else if (badgeVariant === 'warning') {
      badgeBg = '#FFFBEB';
      badgeColor = '#92400E';
    } else if (badgeVariant === 'info') {
      badgeBg = 'var(--md-sys-color-primary-container)';
      badgeColor = 'var(--md-sys-color-on-primary-container)';
    }

    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '12px 14px',
          borderRadius: '16px',
          border: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {title}
              </span>
              {badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  flexShrink: 0
                }}>
                  {badge}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '0.74rem',
              color: 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 600,
              display: 'block',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {subtitle}
            </span>
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--md-sys-color-outline)', flexShrink: 0, marginLeft: '8px' }} />
      </button>
    );
  };

  return (
    <>
      {/* Main Settings Modal Shell */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--md-sys-color-surface)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto',
        overflow: 'hidden'
      }} className="no-print" onClick={onClose}>
        
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            color: 'var(--md-sys-color-on-surface)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Modal Header Bar */}
          {/* Main Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--md-sys-color-surface-container)'
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
                background: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '50%',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Menu Scroll Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Main Controls List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Group 1: Cuentas y Finanzas */}
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', marginBottom: '2px' }}>
              Cuentas y Finanzas
            </span>

            {/* Configuración de Monedas (CUP / USD / Ambas + Tasa de Cambio) */}
            {/* 1. Cuentas y Fondos */}
            <MenuItem
              icon={<Wallet size={18} />}
              title="Cuentas y Saldos"
              subtitle={isOwner ? "Saldos de Casa, Negocio, Ahorro y transferencias" : "Saldo disponible en el Negocio"}
              badge={isOwner ? "3 Cuentas" : "Negocio"}
              onClick={() => setIsTransferModalOpen(true)}
            />

            {/* 2. Ajustes de Monedas */}
            <MenuItem
              icon={<Coins size={18} />}
              title="Ajustes de Monedas"
              subtitle={`Modo activo: ${currencyMode === 'BOTH' ? 'Ambas (CUP + USD)' : currencyMode === 'CUP' ? 'Solo CUP ($)' : 'Solo USD (US$)'}`}
              badge={currencyMode === 'BOTH' ? 'CUP + USD' : currencyMode}
              badgeVariant={currencyMode === 'CUP' ? 'neutral' : 'info'}
              onClick={() => setActiveSubModal('currencies')}
            />

            {/* 3. Tasa de Cambio */}
            <MenuItem
              icon={<TrendingUp size={18} />}
              title="Tasa de Cambio"
              subtitle={`1 USD = $${exchangeRateUSD} CUP • Mercado informal`}
              badge={`$${exchangeRateUSD}`}
              onClick={() => setActiveSubModal('exchangeRate')}
            />

            {/* Group 2: Operación y Comunicación */}
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px', marginBottom: '2px' }}>
              Operación y Tienda
            </span>

            {/* 4. WhatsApp de Pedidos */}
            <MenuItem
              icon={<MessageCircle size={18} />}
              title="WhatsApp de Pedidos"
              subtitle={whatsappPhone ? `Recepción en: ${formattedWhatsapp}` : 'Sin número configurado'}
              badge={whatsappPhone ? 'Activo' : 'Pendiente'}
              badgeVariant={whatsappPhone ? 'success' : 'warning'}
              onClick={() => setActiveSubModal('whatsapp')}
            />

            {/* 5. Gestión de Usuarios (Propietario Only) */}
            {isOwner && (
              <MenuItem
                icon={<Users size={18} />}
                title="Gestión de Usuarios"
                subtitle={`${usersList.length} usuarios con roles y permisos`}
                badge={`${usersList.length} usuarios`}
                onClick={() => setIsUserManagementOpen(true)}
              />
            )}

            {/* Group 3: Seguridad y Sistema */}
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '10px', marginBottom: '2px' }}>
              Seguridad y Datos
            </span>

            {/* 6. Seguridad y Almacenamiento */}
            <MenuItem
              icon={<ShieldCheck size={18} />}
              title="Seguridad y Datos"
              subtitle="PIN de acceso, gestión de caché y reinicio"
              badge={hasPin ? 'PIN Activo' : undefined}
              badgeVariant={hasPin ? 'success' : 'neutral'}
              onClick={() => setActiveSubModal('security')}
            />

            {/* Direct Settings Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={toggleShowBalance}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                <span>{showBalance ? 'Ocultar Cifras' : 'Mostrar Cifras'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                <span>Modo {theme === 'light' ? 'Oscuro' : 'Claro'}</span>
              </button>
            </div>

            {/* Cloud Sync Status */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isOnline ? <Wifi size={16} color="#059669" /> : <WifiOff size={16} color="#EF4444" />}
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {isOnline ? 'Conectado a la Nube' : 'Modo Offline'}
                </span>
              </div>

              {pendingSyncCount > 0 && onOpenPendingSync ? (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenPendingSync(); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: '#FFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {pendingSyncCount} pendientes ›
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSync}
                  disabled={isSyncing}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Sincronizar</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginTop: '6px'
              }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>

            <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', marginTop: '10px' }}>
              Samy Store v1.8.0 • Cubasoft ERP Systems
            </div>

          </div>

        </div>

      </div>

      {/* SUB-MODAL 1: AJUSTES DE MONEDAS (BOTTOM-SHEET) */}
      {activeSubModal === 'currencies' && (
        <div
          onClick={() => setActiveSubModal('none')}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 2300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: '768px',
            margin: '0 auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Grab Handle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="var(--md-sys-color-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Ajustes de Monedas</h3>
              </div>
              <button
                onClick={() => setActiveSubModal('none')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
              Define cómo opera la tienda y el control contable del sistema. Por defecto opera en <strong>pesos cubanos (CUP)</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Solo CUP (Moneda Base) */}
              <button
                type="button"
                onClick={() => handleSelectCurrencyMode('CUP')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: currencyMode === 'CUP' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'CUP' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                      Solo CUP ($)
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Base
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, marginTop: '3px', display: 'block' }}>
                    Operación exclusiva en pesos cubanos. Oculta saldos y precios en divisas.
                  </span>
                </div>
                {currencyMode === 'CUP' && <CheckCircle2 size={20} color="var(--md-sys-color-primary)" />}
              </button>

              {/* Option 2: Ambas Monedas (CUP + USD) */}
              <button
                type="button"
                onClick={() => handleSelectCurrencyMode('BOTH')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: currencyMode === 'BOTH' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'BOTH' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'block' }}>
                    Ambas Monedas (CUP + USD)
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, marginTop: '3px', display: 'block' }}>
                    Permite transacciones y precios en CUP y USD con tasa referencial (1 USD = ${exchangeRateUSD} CUP).
                  </span>
                </div>
                {currencyMode === 'BOTH' && <CheckCircle2 size={20} color="var(--md-sys-color-primary)" />}
              </button>

              {/* Option 3: Solo USD (US$) */}
              <button
                type="button"
                onClick={() => handleSelectCurrencyMode('USD')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: currencyMode === 'USD' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'USD' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'block' }}>
                    Solo USD (US$)
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, marginTop: '3px', display: 'block' }}>
                    Operación exclusiva en dólares. Oculta saldos en CUP.
                  </span>
                </div>
                {currencyMode === 'USD' && <CheckCircle2 size={20} color="var(--md-sys-color-primary)" />}
              </button>

              {/* Tasa de cambio referencial (visible si activa ambas monedas) */}
              {currencyMode === 'BOTH' && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} color="var(--md-sys-color-primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      1 USD = ${exchangeRateUSD} CUP
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setActiveSubModal('exchangeRate')}
                      className="md-btn md-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.76rem', fontWeight: 800 }}
                    >
                      Ajustar Tasa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: TASA DE CAMBIO (BOTTOM-SHEET) */}
      {activeSubModal === 'exchangeRate' && (
        <div
          onClick={() => setActiveSubModal('none')}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 2300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: '768px',
            margin: '0 auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Grab Handle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="#166534" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Tasa de Cambio Referencial</h3>
              </div>
              <button
                onClick={() => setActiveSubModal('none')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Configuración de WhatsApp de Recepción de Pedidos */}
            <div style={{
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, display: 'block' }}>
                Tasa Actual de Mercado:
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                1 USD = ${exchangeRateUSD} CUP
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Modificar Tasa Manualmente:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={exchangeRateUSD}
                  onChange={e => setExchangeRateUSD(parseFloat(e.target.value) || 0)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--md-sys-color-primary)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveExchangeRate}
                  className="md-btn md-btn-primary"
                  style={{ padding: '12px 18px', fontSize: '0.88rem', fontWeight: 800 }}
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSyncElToque}
              disabled={isSyncingElToque}
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1.5px solid #059669',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} className={isSyncingElToque ? 'animate-spin' : ''} />
              <span>{isSyncingElToque ? 'Consultando elTOQUE...' : 'Sincronizar con elTOQUE Ahora'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: WHATSAPP DE PEDIDOS (BOTTOM-SHEET) */}
      {activeSubModal === 'whatsapp' && (
        <div
          onClick={() => setActiveSubModal('none')}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 2300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: '768px',
            margin: '0 auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Grab Handle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} color="#25D366" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>WhatsApp de Pedidos</h3>
              </div>
              <button
                onClick={() => setActiveSubModal('none')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
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
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
              Los clientes que completen su carrito en la tienda online enviarán el pedido directamente a este número.
            </p>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Número de Teléfono (+53):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Ej. 5351234567 o 53999999"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #25D366',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontSize: '1rem',
                    fontWeight: 800
                  }}
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  className="md-btn"
                  style={{ backgroundColor: '#25D366', color: '#FFF', padding: '12px 18px', fontSize: '0.88rem', fontWeight: 800 }}
                >
                  <Save size={16} /> Guardar
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                💡 Se formatea automáticamente con el prefijo +53 de Cuba.
              </span>
            </div>
            
            {/* PIN Rápido Personal Enmascarado con Asteriscos */}
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: SEGURIDAD Y ALMACENAMIENTO (BOTTOM-SHEET) */}
      {activeSubModal === 'security' && (
        <div
          onClick={() => setActiveSubModal('none')}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 2300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: '768px',
            margin: '0 auto'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '16px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '85dvh',
              overflowY: 'auto'
            }}
          >
            {/* Grab Handle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#DB2777" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Seguridad y Almacenamiento</h3>
              </div>
              <button
                onClick={() => setActiveSubModal('none')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* PIN Personal */}
            <div style={{
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>PIN Personal de 4 Dígitos</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: hasPin ? '#059669' : 'var(--md-sys-color-on-surface-variant)' }}>
                  {hasPin ? '🔐 Activado (••••)' : '🔓 Sin PIN'}
                </span>
              </div>

              {!isEditingPin ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingPin(true)}
                    className="md-btn md-btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                  >
                    <KeyRound size={14} />
                    <span>{hasPin ? 'Cambiar PIN' : 'Configurar PIN'}</span>
                  </button>
                  {hasPin && (
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: 'var(--md-sys-color-expense-container)',
                        color: 'var(--md-sys-color-on-expense-container)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Quitar
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
            {/* Recargar Caché Rápida */}
            <button
              type="button"
              onClick={handleClearCacheAndReload}
              disabled={!isOnline}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: isOnline ? '#3B82F6' : '#94A3B8',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: isOnline ? 'pointer' : 'not-allowed',
                opacity: isOnline ? 1 : 0.6
              }}
              title={!isOnline ? 'Requiere conexión a internet para recargar los scripts del sistema' : 'Recargar los últimos cambios'}
            >
              <RotateCcw size={16} />
              <span>{isOnline ? 'Recargar Caché de la Aplicación' : 'Recargar Caché (Requiere Conexión)'}</span>
            </button>

            {/* Reset Total de Caché */}
            <button
              type="button"
              onClick={() => {
                confirmAction({
                  title: '¿Reset Total de Caché?',
                  message: 'Se borrarán Service Workers, cachés locales y sesiones. La app quedará limpia como recién instalada.',
                  variant: 'danger',
                  confirmText: 'Resetear y Limpiar',
                  onConfirm: () => performTotalCacheReset()
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
              <span>Reset Total de Caché (Instalación Limpia)</span>
            </button>

            {/* Reiniciar BD (Propietario Only) */}
            {isOwner && (
              <button
                type="button"
                onClick={handleOpenMasterPassModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: 'var(--md-sys-color-expense-container)',
                  color: 'var(--md-sys-color-on-expense-container)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Database size={16} />
                <span>Reiniciar Base de Datos (Conserva Usuarios)</span>
              </button>
            )}

          </div>
        </div>
      )}

      </div>
      {/* MODAL DE TRANSFERENCIA ENTRE CUENTAS Y SALDOS */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Modal Dedicada de Gestión de Usuarios */}
      {/* USER MANAGEMENT MODAL */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          setUsersList(getAppUsers());
        }}
      />

      {/* Master Password Modal for Full Database Reset */}
      {/* MASTER PASSWORD RESET MODAL */}
      {isMasterPassModalOpen && (
        <div 
          onClick={() => setIsMasterPassModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 2500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            maxWidth: '768px',
            margin: '0 auto'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
            </div>
            {/* Header Bar */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--md-sys-color-surface-container)'
            }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-expense)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} />
                Confirmar Reinicio Completo
              </h3>
              <button
                type="button"
                onClick={() => setIsMasterPassModalOpen(false)}
                style={{
                  background: 'var(--md-sys-color-surface-container-high)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: '50%',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Scroll Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.4' }}>
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
                    style={{ flex: 1, padding: '12px', fontSize: '0.88rem' }}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="md-btn"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.88rem',
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
        </div>
      )}
    </>
  );
};
