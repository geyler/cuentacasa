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
  deleteTransaction 
} from '@/lib/storage';
import { syncDatabaseWithCloud, getPendingSyncCount } from '@/lib/sync';
import { calculateFinancialSummary, isTransactionEditable } from '@/lib/invoice';

import { Header } from '@/components/Header';
import { StatCards } from '@/components/StatCards';
import { QuickEntryView } from '@/components/QuickEntryView';
import { TransactionList } from '@/components/TransactionList';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import { ReportView } from '@/components/ReportView';
import { StoreManagementView } from '@/components/StoreManagementView';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { SettingsModal } from '@/components/SettingsModal';
import { RawDbModal } from '@/components/RawDbModal';
import { LoginScreen } from '@/components/LoginScreen';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { ActionFeedbackProvider, useActionFeedback } from '@/components/ActionFeedbackProvider';

import { Plus, Loader2, Home, Scan, Receipt } from 'lucide-react';

function AccountingAppContent() {
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const [db, setDb] = useState<RawDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('quick');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('gasto');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRawDbModalOpen, setIsRawDbModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedTxForDetailModal, setSelectedTxForDetailModal] = useState<Transaction | null>(null);

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
    const hasMasterAuth = localAuth === 'true' || sessionAuth === 'true';

    if (hasMasterAuth) {
      setIsAuthenticated(true);
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

    // Auto sync function
    const autoSync = async (isBackgroundReconnection: boolean = false) => {
      if (navigator.onLine) {
        try {
          setIsSyncing(true);
          if (isBackgroundReconnection) {
            setSyncBanner({
              show: true,
              status: 'syncing',
              message: '🔄 Sincronizando en segundo plano con Base de Datos Hostinger...'
            });
          }
          await syncDatabaseWithCloud();
          loadDatabase();
          if (isBackgroundReconnection) {
            setSyncBanner({
              show: true,
              status: 'success',
              message: '✅ Base de Datos Hostinger sincronizada. ¡Todo en caja!'
            });
            setTimeout(() => setSyncBanner(prev => ({ ...prev, show: false })), 3800);
          }
        } catch (e) {
          if (isBackgroundReconnection) {
            setSyncBanner({
              show: true,
              status: 'offline',
              message: '⚠️ Error de conexión a la nube. Operando en modo local.'
            });
            setTimeout(() => setSyncBanner(prev => ({ ...prev, show: false })), 3500);
          }
        } finally {
          setIsSyncing(false);
        }
      }
    };

    // Auto sync on mount if online
    autoSync(false);

    // Online/Offline Listeners
    setIsOnline(navigator.onLine);
    const handleOnline = async () => {
      setIsOnline(true);
      await autoSync(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncBanner({
        show: true,
        status: 'offline',
        message: '📶 Modo 100% Offline activo. Los datos permanecen guardados en tu dispositivo.'
      });
      setTimeout(() => setSyncBanner(prev => ({ ...prev, show: false })), 3800);
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

    const localPin = localStorage.getItem('cuentacasa_pin');
    const lastUnlock = localStorage.getItem('cuentacasa_last_pin_unlock');
    const today = new Date().toISOString().split('T')[0];

    if (localPin && localPin.length === 4) {
      setIsPinUnlocked(lastUnlock === today);
    } else {
      setIsPinUnlocked(true);
    }
    showToast({ title: '¡Sesión Iniciada!', message: 'Bienvenido a Cuenta Casa.', type: 'success' });
  };

  const handlePinUnlockSuccess = () => {
    setIsPinUnlocked(true);
    showToast({ title: '¡Acceso Concedido!', message: 'PIN del día verificado correctamente.', type: 'success' });
  };

  const handleLogout = () => {
    confirmAction({
      title: '¿Cerrar Sesión en Cuenta Casa?',
      message: 'Se cerrará la sesión actual. Tendrás que ingresar tu clave maestra para volver a acceder.',
      variant: 'danger',
      confirmText: 'Cerrar Sesión',
      onConfirm: () => {
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
        title: '¡Sincronización Exitosa!',
        message: res.message,
        type: 'success'
      });
    } catch (e) {
      showToast({
        title: 'Error de Sincronización',
        message: 'No se pudo alinear los datos con la nube. Comprueba tu conexión.',
        type: 'error'
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

    if (navigator.onLine) {
      setIsSyncing(true);
      try {
        await syncDatabaseWithCloud();
        loadDatabase();
      } finally {
        setIsSyncing(false);
      }
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
      message: `¿Estás seguro de eliminar "${targetTx?.concept || 'esta transacción'}"? Esta acción se sincronizará con la nube.`,
      variant: 'danger',
      confirmText: 'Eliminar Movimiento',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          deleteTransaction(id);
          loadDatabase();

          if (navigator.onLine) {
            setIsSyncing(true);
            await syncDatabaseWithCloud();
            loadDatabase();
          }

          showToast({
            title: '¡Movimiento Eliminado!',
            message: 'La transacción fue removida exitosamente.',
            type: 'success'
          });
        } finally {
          setDeletingId(null);
          setIsSyncing(false);
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
        background: 'linear-gradient(135deg, var(--md-sys-color-surface) 0%, var(--md-sys-color-surface-container) 100%)',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        padding: '24px'
      }}>
        {/* Glow backdrop effect */}
        <div style={{
          position: 'absolute',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 99, 155, 0.18) 0%, rgba(0, 99, 155, 0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }} />

        {/* Small Transparent Logo Badge */}
        <div style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'rgba(0, 99, 155, 0.08)',
          border: '1px solid rgba(0, 99, 155, 0.2)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 12px 32px rgba(0, 99, 155, 0.15)'
        }}>
          <img 
            src="/icons/icon-192.svg" 
            alt="Cuenta Casa Logo" 
            style={{ 
              width: '42px', 
              height: '42px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
            }} 
          />
        </div>

        {/* Branding & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '4px'
          }}>
            Cuenta Casa
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
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: activeTab === 'quick' ? '8px 16px' : '16px 16px 90px 16px',
        flex: 1
      }}>

        {/* Tab 0: Quick Entry Home */}
        {activeTab === 'quick' && (
          <QuickEntryView
            onOpenGasto={() => handleOpenAddTx('gasto')}
            onOpenIngreso={() => handleOpenAddTx('ingreso')}
            onOpenDashboard={() => handleTabChange('dashboard')}
          />
        )}

        {/* Tab 1: Dashboard Contable */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dashboard Contable</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="md-btn"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}
                >
                  <Scan size={16} /> Escáner
                </button>

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

      {/* Context-Aware Floating Action Button (FAB) */}
      {activeTab === 'store' ? (
        <button
          className="fab no-print"
          onClick={() => setIsScannerOpen(true)}
          title="Abrir Escáner POS para Vender"
          style={{ backgroundColor: 'var(--md-sys-color-primary)', color: '#FFFFFF' }}
        >
          <Scan size={22} />
          <span>Vender / Escanear</span>
        </button>
      ) : (
        <button
          className="fab no-print"
          onClick={() => handleOpenAddTx('gasto')}
          title="Registrar nuevo movimiento de gasto o ingreso"
        >
          <Plus size={22} />
          <span>Registrar Movimiento</span>
        </button>
      )}

      {/* Barcode Scanner Modal (0001-9999) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSaleCompleted={loadDatabase}
        currency={db.settings.currency}
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
