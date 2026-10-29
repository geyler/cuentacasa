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
  ArrowRightLeft, 
  Palette,
  ExternalLink,
  Smartphone,
  Server,
  AlertTriangle,
  Copy,
  Trash2,
  Sliders,
  Image as ImageIcon,
  Type,
  Globe,
  Upload,
  FileText,
  Zap,
  Info,
  Layers,
  LayoutTemplate
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
  syncElToqueExchangeRate,
  getPrimaryThemeColor,
  getSecondaryThemeColor,
  hasCustomSecondaryThemeColor,
  savePrimaryThemeColor,
  saveSecondaryThemeColor,
  getStoreCustomizationSettings,
  saveStoreCustomizationSettings,
  DEFAULT_STORE_CUSTOMIZATION
} from '@/lib/storage';
import {
  THEME_COLOR_PRESETS,
  SECONDARY_COLOR_PRESETS,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  deriveHarmoniousSecondary,
  generateBrandPalette,
  normalizeHexColor,
  applyBrandPaletteToDocument
} from '@/lib/themePalette';
import { AppUser, CurrencyMode, StoreCustomizationSettings, StoreLogoDisplayMode } from '@/types';
import { UserManagementModal } from '@/components/UserManagementModal';
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
  embedded?: boolean;
}

type SettingsTab = 'general' | 'customizer' | 'appearance' | 'store' | 'security' | 'data';

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
  onOpenRawDb,
  onLogout,
  onInstallPwa,
  canInstallPwa,
  onOpenPendingSync,
  embedded = false
}) => {
  useLockBodyScroll(isOpen && !embedded, onClose);
  const { showToast, confirmAction } = useActionFeedback();

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';
  const isAdminOrOwner = currentUser?.role === 'propietario' || currentUser?.role === 'administrador';

  // Active settings tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

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
  const [manualRateInput, setManualRateInput] = useState<string>('320');
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [isSyncingElToque, setIsSyncingElToque] = useState(false);

  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_SECONDARY_COLOR);
  const [isAutoSecondary, setIsAutoSecondary] = useState<boolean>(true);
  const [customHexInput, setCustomHexInput] = useState<string>('');

  // Store Customization States (WordPress Customizer style)
  const [storeCustomization, setStoreCustomization] = useState<StoreCustomizationSettings>(() => getStoreCustomizationSettings());
  const [logoMode, setLogoMode] = useState<StoreLogoDisplayMode>('both');
  const [logoSquareUrl, setLogoSquareUrl] = useState<string>('');
  const [logoWideUrl, setLogoWideUrl] = useState<string>('');
  const [customStoreName, setCustomStoreName] = useState<string>('Samy Store');
  const [customSeoName, setCustomSeoName] = useState<string>('');
  const [customSeoDesc, setCustomSeoDesc] = useState<string>('');
  const [heroBadgeText, setHeroBadgeText] = useState<string>('');
  const [heroTitle, setHeroTitle] = useState<string>('');
  const [heroSubtitle, setHeroSubtitle] = useState<string>('');
  const [isSavingCustomizer, setIsSavingCustomizer] = useState(false);

  const squareFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const wideFileInputRef = React.useRef<HTMLInputElement | null>(null);

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
      setManualRateInput(String(cSettings.exchangeRateUSD));
      setIsEditingExchangeRate(false);

      const pColor = getPrimaryThemeColor();
      const sColor = getSecondaryThemeColor();
      setPrimaryColor(pColor);
      setSecondaryColor(sColor);
      setCustomHexInput(pColor);
      setIsAutoSecondary(!hasCustomSecondaryThemeColor());

      const cust = getStoreCustomizationSettings();
      setStoreCustomization(cust);
      setLogoMode(cust.logoMode);
      setLogoSquareUrl(cust.logoSquareUrl || '');
      setLogoWideUrl(cust.logoWideUrl || '');
      setCustomStoreName(cust.storeName || 'Samy Store');
      setCustomSeoName(cust.storeSeoName || '');
      setCustomSeoDesc(cust.storeSeoDescription || '');
      setHeroBadgeText(cust.heroBadgeText || '');
      setHeroTitle(cust.heroTitle || '');
      setHeroSubtitle(cust.heroSubtitle || '');
    }
  }, [isOpen]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'square' | 'wide') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast({
        title: 'Imagen muy pesada',
        message: 'Para optimizar la velocidad y el almacenamiento local, se recomienda una imagen menor a 2MB.',
        type: 'warning'
      });
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (mode === 'square') {
        setLogoSquareUrl(dataUrl);
      } else {
        setLogoWideUrl(dataUrl);
      }
      showToast({
        title: 'Imagen cargada en borrador',
        message: 'Logo cargado en la vista previa. Haz clic en "Guardar Personalización" para aplicarlo a la tienda pública.',
        type: 'success'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomizer = () => {
    setIsSavingCustomizer(true);
    try {
      const updated = saveStoreCustomizationSettings({
        logoMode,
        logoSquareUrl: logoSquareUrl.trim(),
        logoWideUrl: logoWideUrl.trim(),
        storeName: customStoreName.trim() || 'Samy Store',
        storeSeoName: customSeoName.trim(),
        storeSeoDescription: customSeoDesc.trim(),
        heroBadgeText: heroBadgeText.trim(),
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim()
      });
      setStoreCustomization(updated);
      showToast({
        title: 'Personalización Guardada',
        message: 'La identidad y portada de la tienda pública se han actualizado exitosamente.',
        type: 'success'
      });
    } catch {
      showToast({
        title: 'Error al Guardar',
        message: 'No se pudo guardar la personalización de la tienda.',
        type: 'error'
      });
    } finally {
      setIsSavingCustomizer(false);
    }
  };

  const handleResetCustomizer = () => {
    confirmAction({
      title: '¿Restaurar valores de fábrica?',
      message: 'Se restablecerán los títulos, descripción y logos de la tienda pública a los valores originales predeterminados.',
      confirmText: 'Sí, Restaurar Todo',
      variant: 'warning',
      onConfirm: () => {
        const reset = saveStoreCustomizationSettings(DEFAULT_STORE_CUSTOMIZATION);
        setStoreCustomization(reset);
        setLogoMode(reset.logoMode);
        setLogoSquareUrl(reset.logoSquareUrl || '');
        setLogoWideUrl(reset.logoWideUrl || '');
        setCustomStoreName(reset.storeName);
        setCustomSeoName(reset.storeSeoName);
        setCustomSeoDesc(reset.storeSeoDescription);
        setHeroBadgeText(reset.heroBadgeText);
        setHeroTitle(reset.heroTitle);
        setHeroSubtitle(reset.heroSubtitle);
        showToast({
          title: 'Valores Restaurados',
          message: 'Se han aplicado los valores predeterminados de fábrica.',
          type: 'success'
        });
      }
    });
  };

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
      USD: 'Al activar el modo "Solo USD (US$)", todos los productos publicados con precios en CUP pasarán automáticamente a Borrador (ocultos de la tienda) y las transacciones/saldos en CUP se ocultarán de todas las vistas. ¿Deseas continuar?',
      CUP: 'Al activar el modo "Solo CUP ($)", todos los productos publicados con precios en USD pasarán automáticamente a Borrador (ocultos de la tienda) y las transacciones/saldos en USD se ocultarán de todas las vistas. ¿Deseas continuar?',
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

  // Save Manual Exchange Rate
  const handleSaveExchangeRate = () => {
    const parsed = parseFloat(manualRateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setExchangeRateUSD(parsed);
      saveCurrencySettings({ exchangeRateUSD: parsed });
      setIsEditingExchangeRate(false);
      showToast({
        title: 'Tipo de Cambio Guardado',
        message: `Tasa de conversión actualizada: 1 USD = ${parsed} CUP.`,
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

  // Sync Rate from elTOQUE
  const handleManualSyncElToque = async () => {
    setIsSyncingElToque(true);
    try {
      const updated = await syncElToqueExchangeRate();
      setExchangeRateUSD(updated.exchangeRateUSD);
      setManualRateInput(String(updated.exchangeRateUSD));
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
  };

  // PIN Management
  const handleSavePin = () => {
    if (newPin.length === 4 && /^\d+$/.test(newPin)) {
      const activeUsername = currentUser?.username || 'geyler';
      setUserPin(activeUsername, newPin);
      setHasPin(true);
      setIsEditingPin(false);
      setNewPin('');
      showToast({
        title: '¡PIN Configurado!',
        message: 'Tu PIN personal de 4 dígitos ha sido guardado exitosamente.',
        type: 'success'
      });
    } else {
      showToast({
        title: 'PIN Inválido',
        message: 'El PIN debe ser de exactamente 4 dígitos numéricos.',
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

  // Theme Color Application
  const handleApplyColors = (primHex: string, secHex?: string, isAutoSec: boolean = false) => {
    const validPrimary = normalizeHexColor(primHex, DEFAULT_PRIMARY_COLOR);
    const validSecondary = isAutoSec ? deriveHarmoniousSecondary(validPrimary) : normalizeHexColor(secHex, DEFAULT_SECONDARY_COLOR);

    setPrimaryColor(validPrimary);
    setSecondaryColor(validSecondary);
    setIsAutoSecondary(isAutoSec);
    setCustomHexInput(validPrimary);

    savePrimaryThemeColor(validPrimary);
    if (isAutoSec) {
      saveSecondaryThemeColor(validSecondary);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cuentacasa_has_custom_secondary');
      }
    } else {
      saveSecondaryThemeColor(validSecondary);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cuentacasa_has_custom_secondary', 'true');
      }
    }

    applyBrandPaletteToDocument(validPrimary, validSecondary);
    window.dispatchEvent(new CustomEvent('cuentacasa-theme-palette-changed', {
      detail: { primary: validPrimary, secondary: validSecondary }
    }));

    showToast({
      title: 'Paleta Aplicada',
      message: `Tema corporativo actualizado con colores primario (${validPrimary}) y secundario (${validSecondary}).`,
      type: 'success'
    });
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

    const pendingCount = getPendingSyncCount();
    if (pendingCount > 0 && typeof window !== 'undefined' && navigator.onLine) {
      showToast({
        title: 'Sincronizando Cambios...',
        message: `Guardando ${pendingCount} operaciones antes del reinicio...`,
        type: 'info'
      });
      await syncDatabaseWithCloud(true);
    }

    const resetTimestamp = Date.now();
    clearAllDatabaseRecords();

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
        ? 'Se han eliminado todos los registros en este dispositivo y en MySQL (conservando usuarios).'
        : 'Se han eliminado los registros locales. Se sincronizará el reinicio con MySQL al reconectar.',
      type: 'success'
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Cache Reload
  const handleClearCacheAndReload = async () => {
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
        message: 'Recargando aplicación con el código más reciente...',
        type: 'success'
      });

      setTimeout(() => {
        const cleanUrl = window.location.origin + window.location.pathname + '?refresh=' + Date.now();
        window.location.href = cleanUrl;
      }, 500);
    } catch (err) {
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  const formattedWhatsapp = formatCubanPhone(whatsappPhone).display;

  // Settings Tabs Configuration
  const SETTINGS_TABS: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: 'General & Divisas', icon: <Coins size={17} /> },
    { id: 'customizer', label: 'Personalizar Tienda', icon: <Sliders size={17} /> },
    { id: 'appearance', label: 'Marca & Apariencia', icon: <Palette size={17} /> },
    { id: 'store', label: 'Tienda & WhatsApp', icon: <MessageCircle size={17} /> },
    { id: 'security', label: 'Seguridad & Acceso', icon: <ShieldCheck size={17} /> },
    { id: 'data', label: 'Base de Datos', icon: <Database size={17} /> },
  ];

  // Core settings content
  const content = (
    <div style={{
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Top Header Card */}
      <div style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRadius: '24px',
        border: '1px solid var(--md-sys-color-outline-variant)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--md-shadow-elevation-1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.28rem', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
                Configuración del Sistema
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 600 }}>
                Samy Store • @{currentUser?.username || 'admin'} ({currentUser?.role || 'propietario'})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: isOnline ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-warning-container)',
              color: isOnline ? 'var(--md-sys-color-on-income-container)' : 'var(--md-sys-color-on-warning-container)',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'Online / MySQL' : 'Modo Offline'}</span>
            </div>

            {!embedded && (
              <button
                type="button"
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
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Navigation Pills (Estándar Internacional SaaS) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {SETTINGS_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '9999px',
                  border: isActive ? '1.5px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: isActive ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: isActive ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: GENERAL & DIVISAS */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Currency Mode Selection */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Coins size={20} color="var(--md-sys-color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Modo de Moneda del Negocio</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: 1.5 }}>
              Define cómo opera la tienda y qué monedas se aceptan y visualizan en el catálogo, movimientos y arqueos.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* CUP */}
              <div 
                onClick={() => handleSelectCurrencyMode('CUP')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: currencyMode === 'CUP' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'CUP' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: currencyMode === 'CUP' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>Solo CUP ($)</span>
                  {currencyMode === 'CUP' && <CheckCircle2 size={18} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Pesos Cubanos moneda exclusiva. Oculta precios y operaciones en USD.</span>
              </div>

              {/* BOTH */}
              <div 
                onClick={() => handleSelectCurrencyMode('BOTH')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: currencyMode === 'BOTH' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'BOTH' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: currencyMode === 'BOTH' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>Ambas Divisas (CUP + USD)</span>
                  {currencyMode === 'BOTH' && <CheckCircle2 size={18} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Recomendado. Admite cobros y productos tanto en CUP como en USD de forma simultánea.</span>
              </div>

              {/* USD */}
              <div 
                onClick={() => handleSelectCurrencyMode('USD')}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: currencyMode === 'USD' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: currencyMode === 'USD' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: currencyMode === 'USD' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem' }}>Solo USD (US$)</span>
                  {currencyMode === 'USD' && <CheckCircle2 size={18} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>Dólares estadounidenses como moneda única del sistema.</span>
              </div>
            </div>
          </div>

          {/* Exchange Rate elTOQUE */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--md-sys-color-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Tasa de Cambio Informal (elTOQUE)</h3>
              </div>

              <button
                type="button"
                onClick={handleManualSyncElToque}
                disabled={isSyncingElToque}
                className="md-btn md-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '12px' }}
              >
                <RefreshCw size={14} className={isSyncingElToque ? 'animate-spin' : ''} />
                <span>{isSyncingElToque ? 'Sincronizando...' : 'Actualizar con elTOQUE'}</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                  Tasa Activa en el Sistema
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--md-sys-color-primary)', marginTop: '2px' }}>
                  1 USD = {exchangeRateUSD} CUP
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={manualRateInput}
                    onChange={e => setManualRateInput(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--md-sys-color-outline)',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                    placeholder="Tasa CUP"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveExchangeRate}
                  className="md-btn md-btn-primary"
                  style={{ padding: '10px 16px', fontSize: '0.84rem', borderRadius: '12px' }}
                >
                  <Save size={16} />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Cifras Toggle */}
          <div className="md-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>Privacidad de Balances y Cifras</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Permite enmascarar u ocultar los saldos totales en pantalla cuando haya clientes cerca.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleShowBalance}
              className="md-btn md-btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem', borderRadius: '12px' }}
            >
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showBalance ? 'Ocultar Cifras (••••)' : 'Mostrar Cifras'}</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB: PERSONALIZADOR DE TIENDA PÚBLICA E IDENTIDAD (Estilo WordPress Customizer) */}
      {activeTab === 'customizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Hidden inputs para subir archivos locales */}
          <input
            ref={squareFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleImageFileChange(e, 'square')}
          />
          <input
            ref={wideFileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleImageFileChange(e, 'wide')}
          />

          {/* Intro Card */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sliders size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
                  Personalizador de Tienda Pública e Identidad
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 500 }}>
                  Personaliza en tiempo real los logotipos, textos, portadas y metadatos SEO de tu tienda online.
                </p>
              </div>
            </div>
          </div>

          {/* VISTA PREVIA EN VIVO (Live Preview estilo WordPress) */}
          <div className="md-card" style={{ padding: '20px', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--md-sys-color-primary)" />
                <span style={{ fontSize: '0.92rem', fontWeight: 900 }}>Vista Previa en Tiempo Real</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)'
              }}>
                Simulación en Vivo
              </span>
            </div>

            {/* Contenedor del Preview Simulado */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--md-sys-color-outline-variant)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}>
              {/* Barra de Cabecera Simulada */}
              <div style={{
                backgroundColor: 'var(--brand-primary-darker, #0B1528)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {logoMode === 'wide_logo' ? (
                    <img
                      src={logoWideUrl || logoSquareUrl || '/images/logo-nav.png'}
                      alt={customStoreName || 'Logo'}
                      style={{ maxHeight: '36px', maxWidth: '210px', objectFit: 'contain' }}
                    />
                  ) : (
                    <>
                      {(logoMode === 'both' || logoMode === 'logo_only') && (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: '#FFFFFF',
                          padding: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          flexShrink: 0
                        }}>
                          <img
                            src={logoSquareUrl || '/images/logo-nav.png'}
                            alt={customStoreName || 'Logo'}
                            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      {(logoMode === 'both' || logoMode === 'text_only') && (
                        <span className="font-logo-script" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                          {customStoreName || 'Samy Store'}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Simulador de Acciones Derecha */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    Carrito (2)
                  </div>
                  <div style={{
                    backgroundColor: 'var(--brand-primary, #1A73E8)',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    Ir al Panel
                  </div>
                </div>
              </div>

              {/* Hero Banner Simulado */}
              <div style={{
                background: 'linear-gradient(135deg, var(--brand-primary-darker, #0B1528) 0%, var(--brand-primary-dark, #1E3A8A) 58%, var(--brand-primary, #1A73E8) 100%)',
                padding: '24px 20px',
                color: '#FFFFFF'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.24)'
                }}>
                  <Zap size={13} style={{ color: 'var(--brand-primary-accent, #7DD3FC)' }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#FFFFFF' }}>
                    {heroBadgeText || 'Tienda Online • Las Tunas, Cuba'}
                  </span>
                </div>

                <h4 style={{
                  fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                  fontWeight: 900,
                  margin: '0 0 10px 0',
                  lineHeight: 1.25,
                  color: '#FFFFFF'
                }}>
                  {heroTitle || 'Todo para tu Hogar, Rápido y sin Complicaciones'}
                </h4>

                <p style={{
                  fontSize: '0.84rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.5,
                  margin: 0,
                  maxWidth: '560px'
                }}>
                  {heroSubtitle || `Explora el catálogo completo de ${customStoreName || 'Samy Store'} organizado por categorías con existencias reales en almacén.`}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: IDENTIDAD DE MARCA Y MODO DEL LOGO */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ImageIcon size={20} color="var(--md-sys-color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>
                1. Identidad de Marca y Modo del Logotipo
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '18px', lineHeight: 1.5 }}>
              Selecciona la combinación visual exacta para la cabecera. Al elegir un logo rectangular largo, el sistema inhabilita de inmediato el logo pequeño y el título.
            </p>

            {/* Selector de 4 Modos de Logotipo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '22px' }}>
              {/* Opción 1: Logo Cuadrado + Título */}
              <div
                onClick={() => setLogoMode('both')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: logoMode === 'both' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: logoMode === 'both' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: logoMode === 'both' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} />
                    <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>Logo Cuadrado + Título</span>
                  </div>
                  {logoMode === 'both' && <CheckCircle2 size={16} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.73rem', opacity: 0.85, lineHeight: 1.35 }}>
                  Muestra el ícono cuadrado seguido del nombre de la tienda (predeterminado).
                </span>
              </div>

              {/* Opción 2: Solo Título */}
              <div
                onClick={() => setLogoMode('text_only')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: logoMode === 'text_only' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: logoMode === 'text_only' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: logoMode === 'text_only' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Type size={16} />
                    <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>Solo Título</span>
                  </div>
                  {logoMode === 'text_only' && <CheckCircle2 size={16} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.73rem', opacity: 0.85, lineHeight: 1.35 }}>
                  Muestra únicamente el nombre del negocio en texto limpio tipográfico.
                </span>
              </div>

              {/* Opción 3: Solo Logo Cuadrado */}
              <div
                onClick={() => setLogoMode('logo_only')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: logoMode === 'logo_only' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: logoMode === 'logo_only' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: logoMode === 'logo_only' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={16} />
                    <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>Solo Logo Cuadrado</span>
                  </div>
                  {logoMode === 'logo_only' && <CheckCircle2 size={16} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.73rem', opacity: 0.85, lineHeight: 1.35 }}>
                  Muestra únicamente el ícono o emblema cuadrado sin texto adicional.
                </span>
              </div>

              {/* Opción 4: Solo Logo Rectangular Largo */}
              <div
                onClick={() => setLogoMode('wide_logo')}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: logoMode === 'wide_logo' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: logoMode === 'wide_logo' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                  color: logoMode === 'wide_logo' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LayoutTemplate size={16} />
                    <span style={{ fontWeight: 900, fontSize: '0.88rem' }}>Logo Rectangular Largo</span>
                  </div>
                  {logoMode === 'wide_logo' && <CheckCircle2 size={16} color="var(--md-sys-color-primary)" />}
                </div>
                <span style={{ fontSize: '0.73rem', opacity: 0.85, lineHeight: 1.35 }}>
                  Banner apaisado horizontal exclusivo. Desactiva e inhabilita el título y el logo chiquito.
                </span>
              </div>
            </div>

            {/* Aviso informativo de exclusividad */}
            {logoMode === 'wide_logo' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                marginBottom: '20px',
                fontSize: '0.78rem',
                color: 'var(--md-sys-color-on-surface)'
              }}>
                <Info size={18} color="var(--md-sys-color-primary)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Modo Exclusivo Activo:</strong> El banner rectangular largo se mostrará como elemento único en la cabecera. Ni el título ni el logo cuadrado pequeño lo acompañarán.
                </span>
              </div>
            )}

            {/* Cuadrícula de Archivos de Logotipo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
              
              {/* Tarjeta Logo Cuadrado */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                opacity: logoMode === 'wide_logo' || logoMode === 'text_only' ? 0.65 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900 }}>Logotipo Cuadrado</span>
                  {(logoMode === 'wide_logo' || logoMode === 'text_only') && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Inactivo en cabecera
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '14px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--md-shadow-elevation-1)',
                    flexShrink: 0
                  }}>
                    <img
                      src={logoSquareUrl || '/images/logo-nav.png'}
                      alt="Logo Cuadrado"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => squareFileInputRef.current?.click()}
                      className="md-btn md-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>Subir Imagen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSquareUrl('/images/logo-nav.png')}
                      className="md-btn"
                      style={{ padding: '6px 12px', fontSize: '0.74rem', borderRadius: '10px', border: '1px solid var(--md-sys-color-outline-variant)', background: 'transparent' }}
                    >
                      Predeterminado
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Ruta o URL del Logo Cuadrado
                  </label>
                  <input
                    type="text"
                    value={logoSquareUrl}
                    onChange={e => setLogoSquareUrl(e.target.value)}
                    placeholder="/images/logo-nav.png"
                    className="md-input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Tarjeta Logo Rectangular Largo */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900 }}>Logotipo Rectangular Largo</span>
                  {logoMode === 'wide_logo' ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
                      Activo Exclusivo
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, opacity: 0.7 }}>Banner</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '120px',
                    height: '54px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--brand-primary-darker, #0B1528)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {logoWideUrl ? (
                      <img
                        src={logoWideUrl}
                        alt="Logo Largo"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700 }}>Sin Banner</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => wideFileInputRef.current?.click()}
                      className="md-btn md-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Upload size={14} />
                      <span>Subir Banner</span>
                    </button>
                    {logoWideUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoWideUrl('')}
                        className="md-btn"
                        style={{ padding: '6px 12px', fontSize: '0.74rem', borderRadius: '10px', border: '1px solid var(--md-sys-color-outline-variant)', background: 'transparent' }}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Ruta o URL del Logo Rectangular
                  </label>
                  <input
                    type="text"
                    value={logoWideUrl}
                    onChange={e => setLogoWideUrl(e.target.value)}
                    placeholder="https://... o sube una imagen"
                    className="md-input"
                    style={{ fontSize: '0.8rem', padding: '8px 12px', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </div>

            {/* Campos de Nombre y SEO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, marginBottom: '6px' }}>
                  Nombre del Sistema y Tienda
                </label>
                <input
                  type="text"
                  value={customStoreName}
                  onChange={e => setCustomStoreName(e.target.value)}
                  placeholder="Samy Store"
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  Identificador principal en cabecera, comprobantes de pago, tickets y exportaciones.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, marginBottom: '6px' }}>
                  Nombre Largo o Título SEO de la Tienda
                </label>
                <input
                  type="text"
                  value={customSeoName}
                  onChange={e => setCustomSeoName(e.target.value)}
                  placeholder="Samy Store - Tienda Online de Productos y Víveres en Las Tunas"
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.86rem' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  Título extendido utilizado para etiquetas OpenGraph de WhatsApp y pestaña del navegador.
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 900 }}>
                    Descripción para Google y Redes Sociales (SEO)
                  </label>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: customSeoDesc.length > 160 ? 'var(--md-sys-color-warning)' : 'var(--md-sys-color-on-surface-variant)' }}>
                    {customSeoDesc.length} caracteres (recomendado: 120-160)
                  </span>
                </div>
                <textarea
                  value={customSeoDesc}
                  onChange={e => setCustomSeoDesc(e.target.value)}
                  rows={3}
                  placeholder="Tienda de víveres, alimentos y artículos esenciales con existencias reales en almacén y entregas rápidas en Las Tunas, Cuba."
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PORTADA Y HERO BANNER */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={20} color="var(--md-sys-color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>
                2. Portada y Hero Banner de la Tienda Pública
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '18px', lineHeight: 1.5 }}>
              Modifica los textos principales del hero superior que ven los visitantes al ingresar a la tienda.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pre-titular / Insignia */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, marginBottom: '6px' }}>
                  Texto de la Insignia Superior (Pre-titular)
                </label>
                <input
                  type="text"
                  value={heroBadgeText}
                  onChange={e => setHeroBadgeText(e.target.value)}
                  placeholder="Tienda Online • Las Tunas, Cuba"
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.86rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', display: 'block' }}>
                  Aparece con el icono de rayo arriba del gran titular de bienvenida.
                </span>
              </div>

              {/* Título Principal */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, marginBottom: '6px' }}>
                  Título Principal del Hero
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  placeholder="Todo para tu Hogar, Rápido y sin Complicaciones"
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              {/* Subtítulo / Descripción del Hero */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, marginBottom: '6px' }}>
                  Descripción y Subtítulo del Catálogo
                </label>
                <textarea
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  rows={3}
                  placeholder={`Explora el catálogo completo de ${customStoreName || 'Samy Store'} organizado por categorías con existencias reales en almacén y pedidos directos por WhatsApp con entrega en toda la ciudad.`}
                  className="md-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* BARRA DE ACCIONES (Guardar & Restaurar) */}
          <div className="md-card" style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'var(--md-sys-color-surface-container)'
          }}>
            <button
              type="button"
              onClick={handleResetCustomizer}
              className="md-btn"
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} />
              <span>Restaurar Fábrica</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCustomizer}
              disabled={isSavingCustomizer}
              className="md-btn md-btn-primary"
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 900,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--md-shadow-elevation-1)'
              }}
            >
              <Save size={18} />
              <span>{isSavingCustomizer ? 'Guardando...' : 'Guardar Personalización'}</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: MARCA & APARIENCIA */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Theme Mode Card */}
          <div className="md-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Tema Visual del Sistema</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Alterna entre modo claro corporativo y modo oscuro de alto contraste.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="md-btn md-btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.88rem', borderRadius: '14px' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>Modo {theme === 'light' ? 'Oscuro' : 'Claro'}</span>
            </button>
          </div>

          {/* Color Presets Grid */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Palette size={20} color="var(--md-sys-color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Paletas Corporativas para tu Tienda</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: 1.5 }}>
              Selecciona una paleta diseñada según los estándares de diseño internacional (incluyendo tonos para boutiques como Samy Store y Shein Glam):
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
              {THEME_COLOR_PRESETS.map(preset => {
                const isSelected = primaryColor.toUpperCase() === preset.hex.toUpperCase();
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyColors(preset.hex, preset.secondaryHex, false)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: preset.hex, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.secondaryHex, border: '1px solid #FFF' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {preset.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="var(--md-sys-color-primary)" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>

            {/* Custom HEX Color Input */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Color Primario Personalizado:</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => handleApplyColors(e.target.value, undefined, true)}
                  style={{ width: '38px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={customHexInput}
                  onChange={e => {
                    setCustomHexInput(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value.trim())) {
                      handleApplyColors(e.target.value.trim(), undefined, true);
                    }
                  }}
                  placeholder="#DB2777"
                  style={{
                    width: '100px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: '1px solid var(--md-sys-color-outline)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.84rem',
                    fontFamily: 'monospace',
                    fontWeight: 800
                  }}
                />
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Se calcula automáticamente el color secundario y los contrastes WCAG AA.
              </span>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: TIENDA & WHATSAPP */}
      {activeTab === 'store' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Store Info & Direct Link */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/images/logo-nav.png" alt="Samy Store" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Samy Store</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    Catálogo y Tienda Digital para Clientes
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.origin + '/';
                    navigator.clipboard.writeText(url);
                    showToast({ title: '¡Enlace Copiado!', message: 'URL pública de tu tienda copiada al portapapeles.', type: 'success' });
                  }}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '9px 14px', fontSize: '0.82rem', borderRadius: '12px' }}
                >
                  <Copy size={16} />
                  <span>Copiar Enlace</span>
                </button>

                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="md-btn md-btn-primary"
                  style={{ padding: '9px 16px', fontSize: '0.82rem', borderRadius: '12px', textDecoration: 'none' }}
                >
                  <ExternalLink size={16} />
                  <span>Ver Tienda</span>
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp Order Receiving Configuration */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageCircle size={20} color="#25D366" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Recepción de Pedidos por WhatsApp</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: 1.5 }}>
              Los clientes que añadan productos al carrito en tu catálogo público enviarán el pedido con el desglose directamente a este número.
            </p>

            <div style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={e => setWhatsappPhone(e.target.value)}
                    placeholder="Ej. +53 52345678"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--md-sys-color-outline)',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.95rem',
                      fontWeight: 800
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSavePhone}
                  className="md-btn md-btn-primary"
                  style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '12px' }}
                >
                  <Save size={16} />
                  <span>Guardar Teléfono</span>
                </button>
              </div>

              {whatsappPhone && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', flexWrap: 'wrap', gap: '8px' }}>
                  <span>Formato reconocido: <strong>{formattedWhatsapp}</strong></span>
                  <a
                    href={`https://wa.me/${whatsappPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#059669', fontWeight: 800, textDecoration: 'none' }}
                  >
                    Probar enlace de chat de WhatsApp →
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: SEGURIDAD & USUARIOS */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* PIN Management Card */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Lock size={20} color="var(--md-sys-color-primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>PIN de Seguridad Personal (4 Dígitos)</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: 1.5 }}>
              Permite desbloqueos rápidos de sesión en el punto de venta y confirma arqueos de caja sin tener que ingresar contraseñas largas.
            </p>

            <div style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Estado del PIN:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 900, color: hasPin ? '#059669' : 'var(--md-sys-color-on-surface-variant)' }}>
                  {hasPin ? '🔐 Activado y Protegido (••••)' : '🔓 Sin PIN configurado'}
                </span>
              </div>

              {!isEditingPin ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setIsEditingPin(true); setNewPin(''); }}
                    className="md-btn md-btn-secondary"
                    style={{ padding: '9px 16px', fontSize: '0.82rem', borderRadius: '12px' }}
                  >
                    <KeyRound size={16} />
                    <span>{hasPin ? 'Cambiar PIN' : 'Configurar PIN'}</span>
                  </button>

                  {hasPin && (
                    <button
                      type="button"
                      onClick={handleRemovePin}
                      style={{
                        padding: '9px 14px',
                        fontSize: '0.82rem',
                        borderRadius: '12px',
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Desactivar PIN
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4 dígitos..."
                    autoFocus
                    style={{
                      width: '120px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--md-sys-color-primary)',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      textAlign: 'center',
                      letterSpacing: '0.2em'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="md-btn md-btn-primary"
                    style={{ padding: '10px 18px', fontSize: '0.82rem', borderRadius: '12px' }}
                  >
                    <Save size={16} />
                    <span>Guardar PIN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditingPin(false); setNewPin(''); }}
                    className="md-btn md-btn-secondary"
                    style={{ padding: '10px 14px', fontSize: '0.82rem', borderRadius: '12px' }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Management Entry Card */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} color="var(--md-sys-color-primary)" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Administración de Usuarios y Permisos</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                    Control de roles (Propietario, Administrador, Vendedor) y acceso al punto de venta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUserManagementOpen(true)}
                className="md-btn md-btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.85rem', borderRadius: '12px' }}
              >
                <Users size={16} />
                <span>Gestionar Usuarios ({usersList.length})</span>
              </button>
            </div>
          </div>

          {/* Logout Action */}
          <div className="md-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>Cerrar Sesión Activa</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Cierra la sesión de @{currentUser?.username || 'usuario'} en este terminal.
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 5: DATOS & ALMACENAMIENTO */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Database Connection Status Card */}
          <div className="md-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={22} color="var(--md-sys-color-primary)" />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Base de Datos Local MySQL</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    Conexión directa a schema <strong>cuentacasa</strong> en 127.0.0.1:3306
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onSync}
                  disabled={isSyncing}
                  className="md-btn md-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '12px' }}
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
                </button>
              </div>
            </div>

            <div style={{
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <span>Operaciones pendientes en cola de sincronización:</span>
              <strong style={{ color: pendingSyncCount > 0 ? 'var(--md-sys-color-warning)' : '#059669', fontSize: '0.9rem' }}>
                {pendingSyncCount} pendientes
              </strong>
            </div>
          </div>

          {/* Cache Maintenance Actions */}
          <div className="md-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px 0' }}>Mantenimiento y Caché</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              
              <button
                type="button"
                onClick={handleClearCacheAndReload}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <RotateCcw size={20} color="var(--md-sys-color-primary)" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Recargar Caché de la Aplicación</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                    Actualiza Service Worker y limpia caché de red sin borrar tus datos.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  confirmAction({
                    title: '¿Reset Total de Caché?',
                    message: 'Esta opción vacía Service Workers y archivos temporales para una instalación limpia.',
                    variant: 'warning',
                    confirmText: 'Realizar Reset Limpio',
                    onConfirm: () => performTotalCacheReset()
                  });
                }}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Sparkles size={20} color="#D97706" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Reset Total de Caché</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                    Recomendado si notas problemas de visualización o caché rebelde.
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Reset / Backup Database */}
          <div className="md-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px 0' }}>Respaldo y Reinicio Seguro</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              
              {onOpenRawDb && (
                <button
                  type="button"
                  onClick={onOpenRawDb}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.84rem', borderRadius: '12px' }}
                >
                  <Download size={16} />
                  <span>Ver / Descargar Base de Datos (JSON)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMasterPasswordInput('');
                  setMasterPassError('');
                  setIsMasterPassModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #FCA5A5',
                  backgroundColor: '#FEF2F2',
                  color: '#DC2626',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                <span>Reiniciar Base de Datos (Conserva Usuarios)</span>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Footer Branding */}
      <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', marginTop: '10px' }}>
        Samy Store ERP v2.0 • Diseñado bajo Estándares Internacionales SaaS
      </div>

      {/* SUB-MODAL 1: USER MANAGEMENT MODAL */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => {
          setIsUserManagementOpen(false);
          setUsersList(getAppUsers());
        }}
      />

      {/* SUB-MODAL 2: MASTER PASSWORD RESET MODAL (CENTERED RESPONSIVE) */}
      {isMasterPassModalOpen && (
        <div 
          className="modal-backdrop-responsive no-print"
          onClick={() => setIsMasterPassModalOpen(false)}
        >
          <div 
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--md-shadow-elevation-3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} color="#DC2626" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>Confirmar Contraseña Maestra</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterPassModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-sys-color-on-surface)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
              Ingresa la contraseña de seguridad del sistema para autorizar el reinicio completo de movimientos y productos (los usuarios creados se conservarán intactos).
            </p>

            <form onSubmit={handleConfirmMasterPassReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="password"
                value={masterPasswordInput}
                onChange={e => { setMasterPasswordInput(e.target.value); setMasterPassError(''); }}
                placeholder="Contraseña Maestra..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: masterPassError ? '2px solid #DC2626' : '1.5px solid var(--md-sys-color-outline)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.95rem',
                  fontWeight: 700
                }}
              />

              {masterPassError && (
                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 800 }}>
                  {masterPassError}
                </span>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsMasterPassModalOpen(false)}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '10px 16px', fontSize: '0.84rem', borderRadius: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar Reinicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // If embedded in PC Dashboard view, return clean inline markup
  if (embedded) {
    return content;
  }

  // If opened as standalone modal, return wrapped with responsive modal backdrop
  return (
    <div 
      className="modal-backdrop-responsive no-print"
      onClick={onClose}
    >
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        {content}
      </div>
    </div>
  );
};
