'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, RawDatabase, AppTab } from '@/types';
import { 
  getRawDatabase, 
  saveRawDatabase, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '@/lib/storage';
import { calculateFinancialSummary } from '@/lib/invoice';
import { syncDatabaseWithCloud, getPendingSyncCount } from '@/lib/sync';
import { LoginScreen } from '@/components/LoginScreen';
import { QuickEntryView } from '@/components/QuickEntryView';
import { Header } from '@/components/Header';
import { SettingsModal } from '@/components/SettingsModal';
import { StatCards } from '@/components/StatCards';
import { TransactionList } from '@/components/TransactionList';
import { ReportView } from '@/components/ReportView';
import { TransactionModal } from '@/components/TransactionModal';
import { RawDbModal } from '@/components/RawDbModal';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { Plus } from 'lucide-react';

export default function Home() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(false);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);

  // Database & App state
  const [db, setDb] = useState<RawDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('quick');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showBalance, setShowBalance] = useState<boolean>(false);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('gasto');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isRawDbModalOpen, setIsRawDbModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // PWA install states
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
    const autoSync = async () => {
      if (navigator.onLine) {
        try {
          await syncDatabaseWithCloud();
          loadDatabase();
        } catch (e) {
          console.error('AutoSync failed:', e);
        }
      }
    };

    // Auto sync on mount if online
    autoSync();

    // Online/Offline Listeners
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      autoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker for 100% Offline PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('ServiceWorker registrado:', reg.scope))
        .catch(err => console.error('Error registrando ServiceWorker:', err));
    }

    // Capture PWA installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Theme initialization
    const savedTheme = localStorage.getItem('cuentacasa_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [loadDatabase]);

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
  };

  const handlePinUnlockSuccess = () => {
    setIsPinUnlocked(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('cuentacasa_auth');
    sessionStorage.removeItem('cuentacasa_auth');
    localStorage.removeItem('cuentacasa_last_pin_unlock');
    setIsAuthenticated(false);
    setIsPinUnlocked(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('cuentacasa_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncDatabaseWithCloud();
      loadDatabase();
      alert(res.message);
    } catch (e) {
      alert('Error al intentar alinear datos con la nube.');
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
    }
    setDeferredPrompt(null);
  };

  const handleOpenAddTx = (type: TransactionType = 'gasto') => {
    setEditingTx(null);
    setModalTxType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTx) {
      updateTransaction({
        ...editingTx,
        ...txData
      });
    } else {
      addTransaction(txData);
    }
    loadDatabase();

    if (navigator.onLine) {
      await syncDatabaseWithCloud();
      loadDatabase();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    deleteTransaction(id);
    loadDatabase();

    if (navigator.onLine) {
      await syncDatabaseWithCloud();
      loadDatabase();
    }
  };

  if (!authLoaded) return null;

  // Enforce Master Password Login Screen (on initial setup or after Logout)
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        mode="master" 
        onMasterLoginSuccess={handleMasterLoginSuccess} 
        onPinUnlockSuccess={handlePinUnlockSuccess} 
      />
    );
  }

  // Enforce Daily 4-Digit PIN Unlock (once per calendar day if PIN is configured)
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

  if (!db) return null;

  const transactions = db.transactions || [];
  const summary = calculateFinancialSummary(transactions);
  const pendingCount = getPendingSyncCount();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Compact Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showBalance={showBalance}
        toggleShowBalance={toggleShowBalance}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: activeTab === 'quick' ? '8px 16px' : '16px 16px 90px 16px',
        flex: 1
      }}>

        {/* Tab 0: Quick Entry Home (Discrete Launch Screen) */}
        {activeTab === 'quick' && (
          <QuickEntryView
            onOpenGasto={() => handleOpenAddTx('gasto')}
            onOpenIngreso={() => handleOpenAddTx('ingreso')}
            onOpenDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Tab 1: Dashboard Contable */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dashboard Contable</h2>
              <button
                onClick={() => handleOpenAddTx('gasto')}
                className="md-btn md-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Registrar
              </button>
            </div>

            {/* Metric Stat Cards */}
            <StatCards summary={summary} currency={db.settings.currency} showBalance={showBalance} />

            {/* Recent Transactions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Movimientos Recientes</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-primary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Ver todos →
                </button>
              </div>

              <TransactionList
                transactions={transactions.slice(0, 5)}
                onEdit={handleOpenEditTx}
                onDelete={handleDeleteTransaction}
                currency={db.settings.currency}
                showBalance={showBalance}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Movimientos Completo */}
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
            />
          </div>
        )}

        {/* Tab 3: Facturación y Reportes */}
        {activeTab === 'reports' && (
          <ReportView
            transactions={transactions}
            currency={db.settings.currency}
            showBalance={showBalance}
          />
        )}

      </main>

      {/* Floating Action Button (FAB) - ONLY visible on dashboard/transactions/reports tabs */}
      {activeTab !== 'quick' && (
        <button
          className="fab no-print"
          onClick={() => handleOpenAddTx('gasto')}
          title="Registrar gasto"
        >
          <Plus size={22} />
          <span>Gasto</span>
        </button>
      )}

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

    </div>
  );
}
