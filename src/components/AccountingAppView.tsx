'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Transaction, 
  RawDatabase, 
  AppTab, 
  TransactionType 
} from '@/types';
import { 
  getRawDatabase, 
  saveRawDatabase, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction,
  getSavingsFund,
  getLoggedInUser,
  setLoggedInUser
} from '@/lib/storage';
import { syncDatabaseWithCloud, getPendingSyncCount } from '@/lib/sync';
import { calculateFinancialSummary, isTransactionEditable } from '@/lib/invoice';

import { Header } from '@/components/Header';
import { StatCards } from '@/components/StatCards';
import { QuickEntryView } from '@/components/QuickEntryView';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { ReportView } from '@/components/ReportView';
import { StoreManagementView } from '@/components/StoreManagementView';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { SettingsModal } from '@/components/SettingsModal';
import { RawDbModal } from '@/components/RawDbModal';
import { LoginScreen } from '@/components/LoginScreen';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { ActionFeedbackProvider, useActionFeedback } from '@/components/ActionFeedbackProvider';

import { Plus, Loader2, Home, Scan, Receipt, Menu, FileText, Store, LayoutDashboard } from 'lucide-react';

function AccountingAppContent() {
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const [db, setDb] = useState<RawDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('quick');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('gasto');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRawDbModalOpen, setIsRawDbModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTxForDetailModal, setSelectedTxForDetailModal] = useState<Transaction | null>(null);
  const [preloadedCartItems, setPreloadedCartItems] = useState<any[]>([]);

  // Loaders and Sync state
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [syncBanner, setSyncBanner] = useState<{
    show: boolean;
    status: 'syncing' | 'success' | 'offline';
    message: string;
  }>({ show: false, status: 'syncing', message: '' });

  // Authentication & Security state
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Load Database from LocalStorage
  const loadDatabase = useCallback(() => {
    const rawDb = getRawDatabase();
    setDb(rawDb);
    if (rawDb.settings.showBalance !== undefined) {
      setShowBalance(rawDb.settings.showBalance);
    }
  }, []);

  useEffect(() => {
    loadDatabase();

    // Check session auth & daily PIN unlock
    const localAuth = localStorage.getItem('cuentacasa_auth');
    const sessionAuth = sessionStorage.getItem('cuentacasa_auth');
    const activeUser = getLoggedInUser();
    const hasMasterAuth = (localAuth === 'true' || sessionAuth === 'true') && activeUser !== null;

    if (hasMasterAuth) {
      setIsAuthenticated(true);
      if (activeUser && activeUser.role !== 'propietario') {
        setActiveTab('store');
      }
      const localPin = localStorage.getItem('cuentacasa_pin');
      const lastUnlock = localStorage.getItem('cuentacasa_last_pin_unlock');
      const today = new Date().toISOString().split('T')[0];

      if (localPin && localPin.length === 4) {
        setIsPinUnlocked(lastUnlock === today);
      } else {
        setIsPinUnlocked(true);
      }
    } else {
      setIsAuthenticated(false);
      setIsPinUnlocked(false);
    }
    setAuthLoaded(true);

    // Check for WhatsApp order deep-link cart in URL query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cartParam = params.get('cart');
      if (cartParam) {
        const rawProds = getRawDatabase().storeProducts || [];
        const itemsToLoad: any[] = [];

        cartParam.split(',').forEach(entry => {
          const parts = entry.split(':');
          if (parts.length === 2) {
            const barcode = parts[0].padStart(4, '0');
            const qty = parseInt(parts[1], 10) || 1;
            const prod = rawProds.find(p => p.barcode === barcode || p.barcode === parts[0]);
            if (prod) {
              const cost = prod.costPrice || Math.round(prod.price * 0.7);
              itemsToLoad.push({
                productId: prod.id,
                barcode: prod.barcode,
                name: prod.name,
                quantity: qty,
                costPrice: cost,
                unitPrice: prod.price,
                subtotal: prod.price * qty,
                supplierType: prod.supplierType || 'propia',
                supplierName: prod.supplierName
              });
            }
          }
        });

        if (itemsToLoad.length > 0) {
          setPreloadedCartItems(itemsToLoad);
          setActiveTab('store');
          setIsScannerOpen(true);
          showToast({
            title: '¡Pedido de WhatsApp Cargado!',
            message: `Se cargaron ${itemsToLoad.length} productos en la pantalla de cobro del POS.`,
            type: 'success'
          });
        }
      }
    }

    // Scroll to top automatically when activeTab changes (preserves scroll when opening/closing modals)
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Background Auto sync function
    const autoSync = async (isBackgroundReconnection: boolean = false) => {
      if (typeof window !== 'undefined' && navigator.onLine) {
        try {
          setIsSyncing(true);
          if (isBackgroundReconnection) {
            setSyncBanner({
              show: true,
              status: 'syncing',
              message: '📶 Conexión restablecida: Sincronizando datos con la nube...'
            });
          }

          const res = await syncDatabaseWithCloud(isBackgroundReconnection);
          loadDatabase();

          if (isBackgroundReconnection && res.success) {
            setSyncBanner({
              show: true,
              status: 'success',
              message: '✅ Conexión restablecida: Datos sincronizados con la nube.'
            });
            setTimeout(() => setSyncBanner(prev => ({ ...prev, show: false })), 4000);
          }
        } catch (e) {
          // Ignore network errors in background auto-sync
        } finally {
          setIsSyncing(false);
        }
      }
    };

    // Auto sync on mount if online
    autoSync(false);

    // Periodic sync every 2 minutes if online
    const syncInterval = setInterval(() => {
      if (navigator.onLine) autoSync(false);
    }, 120 * 1000);

    // Online/Offline Listeners
    setIsOnline(typeof window !== 'undefined' ? navigator.onLine : true);
    const handleOnline = async () => {
      setIsOnline(true);
      await autoSync(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncBanner({
        show: true,
        status: 'offline',
        message: '📶 Modo Offline Activo: Todos los movimientos se guardan localmente.'
      });
      setTimeout(() => setSyncBanner(prev => ({ ...prev, show: false })), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Theme initialization
    const savedTheme = localStorage.getItem('cuentacasa_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Universal Input Spotlight Focus & Enter Key Field Navigation
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        document.body.classList.add('input-spotlight-active');
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        document.body.classList.remove('input-spotlight-active');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLInputElement;
        if (target && ['INPUT', 'SELECT'].includes(target.tagName) && target.type !== 'submit' && target.type !== 'button') {
          const container = target.closest('form') || target.closest('.md-card') || document;
          if (container) {
            const inputs = Array.from(container.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')) as HTMLElement[];
            const index = inputs.indexOf(target);
            if (index >= 0 && index < inputs.length - 1) {
              e.preventDefault();
              inputs[index + 1].focus();
            }
          }
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadDatabase]);

  const handleTabChange = (tab: AppTab) => {
    const activeUser = getLoggedInUser();
    if (activeUser && activeUser.role !== 'propietario' && tab !== 'store') {
      return;
    }
    setIsTabTransitioning(true);
    setActiveTab(tab);
    setTimeout(() => {
      setIsTabTransitioning(false);
    }, 150);
  };

  const handleMasterLoginSuccess = () => {
    localStorage.setItem('cuentacasa_auth', 'true');
    sessionStorage.setItem('cuentacasa_auth', 'true');
    setIsAuthenticated(true);

    const activeUser = getLoggedInUser();
    if (activeUser && activeUser.role !== 'propietario') {
      setActiveTab('store');
    }

    const localPin = localStorage.getItem('cuentacasa_pin');
    const lastUnlock = localStorage.getItem('cuentacasa_last_pin_unlock');
    const today = new Date().toISOString().split('T')[0];

    if (localPin && localPin.length === 4) {
      setIsPinUnlocked(lastUnlock === today);
    } else {
      setIsPinUnlocked(true);
    }
    showToast({ title: '¡Sesión Iniciada!', message: `Bienvenido/a ${activeUser?.name || ''}.`, type: 'success' });
  };

  const handlePinUnlockSuccess = () => {
    setIsPinUnlocked(true);
    showToast({ title: '¡Acceso Concedido!', message: 'PIN del día verificado correctamente.', type: 'success' });
  };

  const handleLogout = () => {
    confirmAction({
      title: '¿Cerrar Sesión en Samy Store?',
      message: 'Se cerrará la sesión actual. Tendrás que ingresar tus credenciales para volver a acceder.',
      variant: 'danger',
      confirmText: 'Cerrar Sesión',
      onConfirm: () => {
        setLoggedInUser(null);
        localStorage.removeItem('cuentacasa_auth');
        sessionStorage.removeItem('cuentacasa_auth');
        localStorage.removeItem('cuentacasa_last_pin_unlock');
        setIsAuthenticated(false);
        setIsPinUnlocked(false);
        showToast({ title: 'Sesión Cerrada', message: 'Has cerrado la sesión de la aplicación.', type: 'info' });
      }
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('cuentacasa_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    showToast({
      title: 'Tema Visual Cambiado',
      message: `Se ha activado el modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'}.`,
      type: 'info'
    });
  };

  const toggleShowBalance = () => {
    const nextVal = !showBalance;
    setShowBalance(nextVal);
    if (db) {
      const updatedDb: RawDatabase = {
        ...db,
        settings: {
          ...db.settings,
          showBalance: nextVal
        }
      };
      saveRawDatabase(updatedDb);
      setDb(updatedDb);
    }
    showToast({
      title: 'Visualización de Saldos',
      message: `Los saldos de la pantalla ahora están ${nextVal ? 'visibles' : 'ocultos (Modo Privacidad)'}.`,
      type: 'info'
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncDatabaseWithCloud(true);
      loadDatabase();
      showToast({
        title: res.success ? '¡Sincronización Exitosa!' : 'Modo 100% Offline',
        message: res.message,
        type: res.success ? 'success' : 'info'
      });
    } catch (e) {
      showToast({
        title: 'Modo Offline Activo',
        message: 'Trabajando localmente. Tus datos permanecen guardados en este dispositivo.',
        type: 'info'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPwaBanner(false);
      showToast({ title: '¡PWA Instalada!', message: 'Cuenta Casa se ha instalado en tu dispositivo.', type: 'success' });
    }
    setDeferredPrompt(null);
  };

  const handleOpenAddTx = (type: TransactionType = 'gasto') => {
    setEditingTx(null);
    setModalTxType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    if (!isTransactionEditable(tx.createdAt)) {
      showToast({
        title: 'Edición Bloqueada',
        message: 'Solo es posible editar o eliminar registros dentro de los primeros 5 minutos de su creación.',
        type: 'warning'
      });
      return;
    }
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTx) {
      if (!isTransactionEditable(editingTx.createdAt)) {
        showToast({
          title: 'Tiempo Expirado',
          message: 'El tiempo límite de 5 minutos para editar este registro ha expirado.',
          type: 'error'
        });
        setIsTxModalOpen(false);
        return;
      }
      updateTransaction({
        ...editingTx,
        ...txData
      });
      showToast({
        title: '¡Transacción Actualizada!',
        message: `Se guardaron los cambios en "${txData.concept}".`,
        type: 'success'
      });
    } else {
      addTransaction(txData);
      showActionResult({
        title: `¡${txData.type === 'ingreso' ? 'Ingreso' : 'Gasto'} Registrado!`,
        message: `"${txData.concept}" por $${txData.amount} guardado en CuentaCasa.`,
        type: 'success',
        actions: [
          { label: `Registrar Otro ${txData.type === 'ingreso' ? 'Ingreso' : 'Gasto'}`, onClick: () => handleOpenAddTx(txData.type), icon: <Plus size={16} /> },
          { label: 'Ver Movimientos', onClick: () => setActiveTab('transactions'), icon: <Receipt size={16} /> }
        ]
      });
    }
    loadDatabase();

    // Non-blocking background sync attempt
    if (navigator.onLine) {
      syncDatabaseWithCloud().then(() => loadDatabase()).catch(() => {});
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const targetTx = db?.transactions.find(t => t.id === id);
    if (targetTx && !isTransactionEditable(targetTx.createdAt)) {
      showToast({
        title: 'Eliminación Bloqueada',
        message: 'Solo es posible eliminar registros dentro de los primeros 5 minutos de su creación.',
        type: 'warning'
      });
      return;
    }

    confirmAction({
      title: '¿Eliminar Movimiento?',
      message: `¿Estás seguro de eliminar "${targetTx?.concept || 'esta transacción'}"?`,
      variant: 'danger',
      confirmText: 'Eliminar Movimiento',
      onConfirm: async () => {
        setDeletingId(id);
        deleteTransaction(id);
        loadDatabase();
        setDeletingId(null);

        showToast({
          title: '¡Movimiento Eliminado!',
          message: 'La transacción fue removida exitosamente.',
          type: 'success'
        });

        // Non-blocking background sync attempt
        if (navigator.onLine) {
          syncDatabaseWithCloud().then(() => loadDatabase()).catch(() => {});
        }
      }
    });
  };

  // Full-page PWA Loader Shell on initial load
  if (!authLoaded || !db) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        padding: '24px'
      }}>
        {/* Glow backdrop effect */}
        <div style={{
          position: 'absolute',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          filter: 'blur(24px)',
          pointerEvents: 'none'
        }} />

        {/* Large Clean Transparent Logo */}
        <img 
          src="/images/logo-loading.png" 
          alt="Samy Store Logo" 
          style={{ 
            height: '140px', 
            width: 'auto', 
            objectFit: 'contain',
            marginBottom: '16px',
            position: 'relative'
          }} 
        />

        {/* Branding & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="font-logo-script" style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#111827',
            marginBottom: '2px',
            lineHeight: 1
          }}>
            Samy Store
          </h1>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--md-sys-color-on-surface-variant)',
            opacity: 0.8
          }}>
            Control Contable & POS Tienda
          </p>
        </div>

        {/* Sleek Spinner & Status */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'var(--md-sys-color-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Iniciando aplicación 100% offline...</span>
        </div>
      </div>
    );
  }

  // Enforce Master Password Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        mode="master" 
        onMasterLoginSuccess={handleMasterLoginSuccess} 
        onPinUnlockSuccess={handlePinUnlockSuccess} 
      />
    );
  }

  // Enforce Daily 4-Digit PIN Unlock
  if (!isPinUnlocked) {
    return (
      <LoginScreen 
        mode="pin" 
        onMasterLoginSuccess={handleMasterLoginSuccess} 
        onPinUnlockSuccess={handlePinUnlockSuccess}
        onLogoutRequested={handleLogout}
      />
    );
  }

  const transactions = db.transactions || [];
  const summary = calculateFinancialSummary(transactions);
  const pendingCount = getPendingSyncCount();

  const isAnyModalOpen = isTxModalOpen || isSettingsOpen || isRawDbModalOpen || isScannerOpen || isTransferModalOpen || !!selectedTxForDetailModal || isNavMenuOpen;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Top Background Sync Progress Banner */}
      {syncBanner.show && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 99999,
          backgroundColor: syncBanner.status === 'success' ? '#00875A' : syncBanner.status === 'offline' ? '#D97706' : '#00639B',
          color: '#FFFFFF',
          padding: '8px 16px',
          fontSize: '0.82rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          {syncBanner.status === 'syncing' && <Loader2 size={16} className="animate-spin" />}
          <span>{syncBanner.message}</span>
        </div>
      )}

      {/* Compact Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        showBalance={showBalance}
        toggleShowBalance={toggleShowBalance}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        isSyncing={isSyncing}
        isMenuOpen={isNavMenuOpen}
        setIsMenuOpen={setIsNavMenuOpen}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1024px',
        width: '100%',
        margin: '0 auto',
        padding: '16px 16px 130px 16px',
        flex: 1
      }}>

        {/* Tab 0: Quick Entry Home */}
        {activeTab === 'quick' && (
          <QuickEntryView
            onOpenGasto={() => handleOpenAddTx('gasto')}
            onOpenIngreso={() => handleOpenAddTx('ingreso')}
            onOpenDashboard={() => handleTabChange('dashboard')}
            onOpenStore={() => handleTabChange('store')}
            onOpenPublicStore={() => { window.location.href = '/'; }}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
            onOpenPOS={() => setIsScannerOpen(true)}
          />
        )}

        {/* Tab 1: Dashboard Contable */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dashboard Contable</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenAddTx('gasto')}
                  className="md-btn md-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Registrar
                </button>
              </div>
            </div>

            {/* Metric Stat Cards */}
            <StatCards 
              summary={summary} 
              currency={db.settings.currency} 
              showBalance={showBalance} 
              isLoading={isTabTransitioning}
              storeFund={db.storeFund || 0}
              savingsFund={db.savingsFund || 0}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
            />

            {/* Recent Transactions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Últimos 10 Movimientos</h3>
                <button
                  onClick={() => handleTabChange('transactions')}
                  style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Ver todos →
                </button>
              </div>

              <TransactionList
                transactions={transactions}
                limit={10}
                onEdit={handleOpenEditTx}
                onDelete={handleDeleteTransaction}
                currency={db.settings.currency}
                showBalance={showBalance}
                isLoading={isTabTransitioning}
                deletingId={deletingId}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Store Inventory Management ("Tienda") */}
        {activeTab === 'store' && (
          <StoreManagementView
            currency={db.settings.currency}
            onOpenScanner={() => setIsScannerOpen(true)}
            userRole={getLoggedInUser()?.role || 'propietario'}
          />
        )}

        {/* Tab 3: Movimientos Completo */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Movimientos</h2>
              <button
                onClick={() => handleOpenAddTx('gasto')}
                className="md-btn md-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Nuevo
              </button>
            </div>

            <TransactionList
              transactions={transactions}
              onEdit={handleOpenEditTx}
              onDelete={handleDeleteTransaction}
              currency={db.settings.currency}
              showBalance={showBalance}
              isLoading={isTabTransitioning}
              deletingId={deletingId}
            />
          </div>
        )}

        {/* Tab 4: Facturación y Reportes */}
        {activeTab === 'reports' && (
          <ReportView
            transactions={transactions}
            currency={db.settings.currency}
            showBalance={showBalance}
            onSelectTransaction={(tx) => setSelectedTxForDetailModal(tx)}
          />
        )}

      </main>

      {/* Mobile-Only Floating Bottom Navigation Bar (Hidden on PC & Hidden when any modal is open) */}
      {!isAnyModalOpen && (
        <div 
          className="no-print hidden-pc"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: '440px',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: '9999px',
            padding: '6px 8px',
            boxShadow: 'var(--md-shadow-elevation-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 90
          }}
        >
          {getLoggedInUser()?.role === 'propietario' && (
            <>
              <button
                onClick={() => handleTabChange('quick')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px 0',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'quick' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: activeTab === 'quick' ? 800 : 600,
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'quick' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Home size={18} />
                </div>
                <span>Inicio</span>
              </button>

              <button
                onClick={() => handleTabChange('dashboard')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px 0',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'dashboard' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: activeTab === 'dashboard' ? 800 : 600,
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'dashboard' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LayoutDashboard size={18} />
                </div>
                <span>Dashboard</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleTabChange('store')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px 0',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'store' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeTab === 'store' ? 800 : 600,
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: activeTab === 'store' ? 'var(--md-sys-color-primary-container)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={18} />
            </div>
            <span>Tienda</span>
          </button>

          {getLoggedInUser()?.role === 'propietario' && (
            <>
              <button
                onClick={() => handleTabChange('transactions')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px 0',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'transactions' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: activeTab === 'transactions' ? 800 : 600,
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'transactions' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Receipt size={18} />
                </div>
                <span>Movimientos</span>
              </button>

              <button
                onClick={() => handleTabChange('reports')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '4px 0',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === 'reports' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: activeTab === 'reports' ? 800 : 600,
                  fontSize: '0.7rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: activeTab === 'reports' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={18} />
                </div>
                <span>Reportes</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Barcode Scanner Modal (0001-9999) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setPreloadedCartItems([]);
        }}
        onSaleCompleted={loadDatabase}
        currency={db.settings.currency}
        initialTicketItems={preloadedCartItems}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isOnline={isOnline}
        pendingSyncCount={pendingCount}
        onSync={handleSync}
        isSyncing={isSyncing}
        theme={theme}
        toggleTheme={toggleTheme}
        showBalance={showBalance}
        toggleShowBalance={toggleShowBalance}
        onOpenRawDb={() => setIsRawDbModalOpen(true)}
        onLogout={handleLogout}
        onInstallPwa={handleInstallPwa}
        canInstallPwa={!!deferredPrompt}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={modalTxType}
        editingTransaction={editingTx}
      />

      {/* Raw JSON DB Modal */}
      <RawDbModal
        isOpen={isRawDbModalOpen}
        onClose={() => setIsRawDbModalOpen(false)}
        onDbUpdated={loadDatabase}
      />

      {/* Discrete PWA Install Banner */}
      {showPwaBanner && activeTab === 'quick' && (
        <PwaInstallBanner
          onInstall={handleInstallPwa}
          onDismiss={() => setShowPwaBanner(false)}
        />
      )}

      {/* Transaction Detail Bottom Sheet Modal */}
      <TransactionDetailModal
        transaction={selectedTxForDetailModal}
        onClose={() => setSelectedTxForDetailModal(null)}
        onEdit={(tx) => {
          setSelectedTxForDetailModal(null);
          handleOpenEditTx(tx);
        }}
        onDelete={(id) => {
          setSelectedTxForDetailModal(null);
          handleDeleteTransaction(id);
        }}
        currency={db.settings.currency}
      />

      {/* Universal Transfer Bottom Sheet Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={loadDatabase}
      />

    </div>
  );
}

export function AccountingAppView() {
  return (
    <ActionFeedbackProvider>
      <AccountingAppContent />
    </ActionFeedbackProvider>
  );
}
