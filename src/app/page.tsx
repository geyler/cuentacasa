'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionType, RawDatabase } from '@/types';
import { 
  getRawDatabase, 
  saveRawDatabase, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '@/lib/storage';
import { calculateFinancialSummary } from '@/lib/invoice';
import { syncDatabaseWithCloud, getPendingSyncCount } from '@/lib/sync';
import { Header } from '@/components/Header';
import { StatCards } from '@/components/StatCards';
import { TransactionList } from '@/components/TransactionList';
import { ReportView } from '@/components/ReportView';
import { TransactionModal } from '@/components/TransactionModal';
import { RawDbModal } from '@/components/RawDbModal';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Home() {
  const [db, setDb] = useState<RawDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'reports'>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<TransactionType>('gasto');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isRawDbModalOpen, setIsRawDbModalOpen] = useState(false);

  // PWA install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Load Database from LocalStorage
  const loadDatabase = useCallback(() => {
    const rawDb = getRawDatabase();
    setDb(rawDb);
  }, []);

  useEffect(() => {
    loadDatabase();

    // Online/Offline Listeners
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('cuentacasa_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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

  const handleSaveTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTx) {
      updateTransaction({
        ...editingTx,
        ...txData
      });
    } else {
      addTransaction(txData);
    }
    loadDatabase();
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    loadDatabase();
  };

  if (!db) return null;

  const transactions = db.transactions || [];
  const summary = calculateFinancialSummary(transactions);
  const pendingCount = getPendingSyncCount();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        pendingSyncCount={pendingCount}
        onSync={handleSync}
        isSyncing={isSyncing}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenRawDb={() => setIsRawDbModalOpen(true)}
        onOpenNewTransaction={handleOpenAddTx}
        onInstallPwa={handleInstallPwa}
        canInstallPwa={!!deferredPrompt}
      />

      {/* Main Container */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px 100px 20px',
        flex: 1
      }}>

        {/* Tab 1: Resumen General / Dashboard */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Quick Banner & Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  Control de Gastos e Ingresos
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                  Resumen financiero contable de la casa ({transactions.length} registros cargados)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleOpenAddTx('gasto')}
                  className="md-btn md-btn-expense"
                >
                  <ArrowDownRight size={18} /> Gasto de Comida / Casa
                </button>
                <button
                  onClick={() => handleOpenAddTx('ingreso')}
                  className="md-btn md-btn-income"
                >
                  <ArrowUpRight size={18} /> Ingreso (Webs / Ventas)
                </button>
              </div>
            </div>

            {/* Metric Stat Cards */}
            <StatCards summary={summary} currency={db.settings.currency} />

            {/* Recent Transactions Preview */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Movimientos Recientes</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--md-sys-color-primary)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Ver todos los movimientos →
                </button>
              </div>

              <TransactionList
                transactions={transactions.slice(0, 5)}
                onEdit={handleOpenEditTx}
                onDelete={handleDeleteTransaction}
                currency={db.settings.currency}
              />
            </div>

          </div>
        )}

        {/* Tab 2: Movimientos Completo */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Historial de Movimientos</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Registros detallados de entradas y salidas de la casa
                </p>
              </div>

              <button
                onClick={() => handleOpenAddTx('gasto')}
                className="md-btn md-btn-primary"
              >
                <Plus size={18} /> Registrar Nuevo Movimiento
              </button>
            </div>

            <TransactionList
              transactions={transactions}
              onEdit={handleOpenEditTx}
              onDelete={handleDeleteTransaction}
              currency={db.settings.currency}
            />
          </div>
        )}

        {/* Tab 3: Facturación y Reportes */}
        {activeTab === 'reports' && (
          <ReportView
            transactions={transactions}
            currency={db.settings.currency}
          />
        )}

      </main>

      {/* Floating Action Button (FAB) */}
      <button
        className="fab no-print"
        onClick={() => handleOpenAddTx('gasto')}
        title="Registrar nuevo movimiento"
      >
        <Plus size={24} />
        <span>NUEVO GASTO</span>
      </button>

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

      {/* PWA / WebAPK Install Banner */}
      {showPwaBanner && (
        <PwaInstallBanner
          onInstall={handleInstallPwa}
          onDismiss={() => setShowPwaBanner(false)}
        />
      )}

    </div>
  );
}
