'use client';

import React, { useState, useEffect } from 'react';
import { FundAccountType, CurrencyType } from '@/types';
import { getRawDatabase, getSavingsFund, getCasaAvailableBalance, executeUniversalTransfer, getCurrencySettings, withdrawSavingsAsExpense, getLoggedInUser } from '@/lib/storage';
import { formatCurrency, calculateFinancialSummary } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { ArrowRightLeft, X, PiggyBank, Store, Home, Coins, LogOut, Wallet, Lock } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultFrom?: FundAccountType;
  defaultTo?: FundAccountType;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFrom = 'casa',
  defaultTo = 'ahorro'
}) => {
  useLockBodyScroll(isOpen, onClose);
  const { showActionResult, showToast, confirmAction } = useActionFeedback();

  const [fromAccount, setFromAccount] = useState<FundAccountType>(defaultFrom);
  const [toAccount, setToAccount] = useState<FundAccountType>(
    defaultTo !== defaultFrom ? defaultTo : (defaultFrom === 'casa' ? 'ahorro' : 'casa')
  );

  // Special mode for Savings: Withdraw as Expense out of system
  const [isSavingsExpenseMode, setIsSavingsExpenseMode] = useState<boolean>(false);

  // Transfer Mode: Standard (same currency) vs Cross-Currency Conversion (USD <-> CUP)
  const [isCrossCurrencyMode, setIsCrossCurrencyMode] = useState<boolean>(false);
  const [sameCurrency, setSameCurrency] = useState<CurrencyType>('CUP');
  
  // Cross-Currency Direction
  const [conversionDirection, setConversionDirection] = useState<'USD_TO_CUP' | 'CUP_TO_USD'>('USD_TO_CUP');
  const [exchangeRate, setExchangeRate] = useState<number>(320);

  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cSettings = getCurrencySettings();
      setExchangeRate(cSettings.exchangeRateUSD || 320);
      if (cSettings.currencyMode === 'CUP') {
        setIsCrossCurrencyMode(false);
        setSameCurrency('CUP');
      } else if (cSettings.currencyMode === 'USD') {
        setIsCrossCurrencyMode(false);
        setSameCurrency('USD');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rawDb = getRawDatabase();

  // Effective Source & Target Currency
  const activeSourceCurrency: CurrencyType = isCrossCurrencyMode
    ? (conversionDirection === 'USD_TO_CUP' ? 'USD' : 'CUP')
    : sameCurrency;

  const activeTargetCurrency: CurrencyType = isCrossCurrencyMode
    ? (conversionDirection === 'USD_TO_CUP' ? 'CUP' : 'USD')
    : sameCurrency;

  // Balance calculation for source currency
  const getAccountBalanceInCurrency = (acc: FundAccountType, curr: CurrencyType): number => {
    if (curr === 'USD') {
      switch (acc) {
        case 'casa': return getCasaAvailableBalance('USD');
        case 'tienda': return rawDb.storeFundUSD || 0;
        case 'ahorro': return rawDb.savingsFundUSD || 0;
      }
    } else {
      switch (acc) {
        case 'casa': return getCasaAvailableBalance('CUP');
        case 'tienda': return rawDb.storeFund || 0;
        case 'ahorro': return getSavingsFund();
      }
    }
  };

  const getAccountLabel = (acc: FundAccountType): string => {
    switch (acc) {
      case 'casa': return '🏡 Fondo de la Casa';
      case 'tienda': return '🏬 Fondo del Negocio';
      case 'ahorro': return '🐷 Fondo de Ahorro';
    }
  };

  const availableSourceBalance = getAccountBalanceInCurrency(fromAccount, activeSourceCurrency);
  const srcSymbol = activeSourceCurrency === 'USD' ? 'US$' : '$';
  const tgtSymbol = activeTargetCurrency === 'USD' ? 'US$' : '$';

  // Live conversion calculation
  const numAmount = Number(amount) || 0;
  let calculatedTargetAmount = 0;
  if (isCrossCurrencyMode && numAmount > 0 && exchangeRate > 0) {
    if (conversionDirection === 'USD_TO_CUP') {
      calculatedTargetAmount = Math.round(numAmount * exchangeRate * 100) / 100;
    } else {
      calculatedTargetAmount = Math.round((numAmount / exchangeRate) * 100) / 100;
    }
  } else {
    calculatedTargetAmount = numAmount;
  }

  const handleFromChange = (acc: FundAccountType) => {
    setFromAccount(acc);
    setIsSavingsExpenseMode(false);
    if (acc === 'tienda' || acc === 'ahorro') {
      setToAccount('casa');
    } else if (toAccount === 'casa') {
      setToAccount('ahorro');
    }
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      showToast({ title: 'Monto Inválido', message: 'Ingresa un monto mayor a 0 para transferir.', type: 'warning' });
      return;
    }

    if ((fromAccount === 'tienda' || fromAccount === 'ahorro') && numAmount > availableSourceBalance) {
      showToast({
        title: 'Saldo Insuficiente',
        message: `El saldo disponible en ${getAccountLabel(fromAccount)} (${activeSourceCurrency}) es ${srcSymbol} ${availableSourceBalance}.`,
        type: 'error'
      });
      return;
    }

    // Handle Savings Expense Withdrawal
    if (fromAccount === 'ahorro' && isSavingsExpenseMode) {
      confirmAction({
        title: '¿Confirmar Retiro como Gasto?',
        message: `Se debitarán ${srcSymbol}${numAmount} ${activeSourceCurrency} del Fondo de Ahorro y se registrarán como Gasto (sacándolos del sistema contable).`,
        variant: 'warning',
        confirmText: 'Registrar Gasto de Ahorro',
        onConfirm: () => {
          const res = withdrawSavingsAsExpense(numAmount, notes || 'Gasto del Fondo de Ahorro', activeSourceCurrency, notes);
          if (res.success) {
            setAmount('');
            setNotes('');
            onSuccess();
            onClose();
            showActionResult({
              title: '¡Gasto de Ahorro Registrado!',
              message: `Se retiraron ${srcSymbol}${numAmount} del Fondo de Ahorro como gasto del sistema.`,
              type: 'success'
            });
          } else {
            showToast({
              title: 'Error al Retirar',
              message: res.error || 'No se pudo registrar el gasto de ahorro.',
              type: 'error'
            });
          }
        }
      });
      return;
    }

    const fromLabel = getAccountLabel(fromAccount);
    const toLabel = getAccountLabel(toAccount);

    const titleText = isCrossCurrencyMode ? '¿Confirmar Conversión de Divisa?' : '¿Confirmar Transferencia?';
    const detailMsg = isCrossCurrencyMode
      ? `Se debitarán ${srcSymbol}${numAmount} ${activeSourceCurrency} de ${fromLabel} y se acreditarán ${tgtSymbol}${calculatedTargetAmount} ${activeTargetCurrency} en ${toLabel} (Tasa: 1 USD = ${exchangeRate} CUP).`
      : `Se moverán ${formatCurrency(numAmount, activeSourceCurrency, true)} de ${fromLabel} hacia ${toLabel}.`;

    confirmAction({
      title: titleText,
      message: detailMsg,
      variant: 'info',
      confirmText: isCrossCurrencyMode ? 'Convertir y Transferir' : 'Confirmar y Transferir',
      onConfirm: () => {
        const res = executeUniversalTransfer({
          fromAccount,
          toAccount,
          amount: numAmount,
          currency: activeSourceCurrency,
          targetCurrency: activeTargetCurrency,
          exchangeRate: exchangeRate,
          targetAmount: calculatedTargetAmount,
          notes
        });

        if (res.success) {
          setAmount('');
          setNotes('');
          onSuccess();
          onClose();

          showActionResult({
            title: isCrossCurrencyMode ? '¡Conversión Exitosa!' : '¡Transferencia Registrada!',
            message: isCrossCurrencyMode
              ? `Convertidos ${srcSymbol}${numAmount} ${activeSourceCurrency} ➔ ${tgtSymbol}${calculatedTargetAmount} ${activeTargetCurrency} desde ${fromLabel} hacia ${toLabel}.`
              : `Movimiento exitoso de ${srcSymbol}${numAmount} desde ${fromLabel} a ${toLabel}.`,
            type: 'success'
          });
        } else {
          showToast({
            title: 'Error al Transferir',
            message: res.error || 'No se pudo completar la transferencia.',
            type: 'error'
          });
        }
      }
    });
  };

  const currentUser = getLoggedInUser();
  const isOwner = currentUser?.role === 'propietario';

  const casaBalCUP = getCasaAvailableBalance('CUP');
  const casaBalUSD = getCasaAvailableBalance('USD');
  const storeBalCUP = rawDb.storeFund || 0;
  const storeBalUSD = rawDb.storeFundUSD || 0;
  const savingsBalCUP = getSavingsFund();
  const savingsBalUSD = rawDb.savingsFundUSD || 0;

  return (
    <div
      className="no-print"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 2200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        maxWidth: '768px',
        margin: '0 auto'
      }}
      onClick={onClose}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={isOwner ? handleExecuteTransfer : (e) => { e.preventDefault(); onClose(); }}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          width: '100%',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Grab Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Header Bar */}
        <div style={{
          padding: '12px 20px 14px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
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
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                {isCrossCurrencyMode ? 'Conversión de Divisas (USD ↔ CUP)' : (isOwner ? 'Cuentas y Transferencias' : 'Saldos de Cuenta')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                {isOwner ? 'Intercambio de fondos y control financiero' : 'Consulta de saldo de operaciones'}
              </span>
            </div>
          </div>
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
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Top Balances Cards (3 for owner, 1 for admin) */}
        {isOwner ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {/* 1. Casa */}
            <div style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>🏡 Casa</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap' }}>
                ${casaBalCUP.toLocaleString('es-ES')}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>
                US$ {casaBalUSD.toLocaleString('es-ES')}
              </span>
            </div>

            {/* 2. Negocio */}
            <div style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065F46' }}>🏬 Negocio</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#047857', whiteSpace: 'nowrap' }}>
                ${storeBalCUP.toLocaleString('es-ES')}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0F766E', whiteSpace: 'nowrap' }}>
                US$ {storeBalUSD.toLocaleString('es-ES')}
              </span>
            </div>

            {/* 3. Ahorro */}
            <div style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5B21B6' }}>🐷 Ahorro</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#6D28D9', whiteSpace: 'nowrap' }}>
                ${savingsBalCUP.toLocaleString('es-ES')}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED', whiteSpace: 'nowrap' }}>
                US$ {savingsBalUSD.toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#065F46' }}>🏬 Saldo Disponible del Negocio</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#A7F3D0', color: '#064E3B', fontWeight: 800 }}>
                Administración
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'baseline', marginTop: '2px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, display: 'block' }}>Moneda Nacional:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857' }}>
                  ${storeBalCUP.toLocaleString('es-ES')} CUP
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#0F766E', fontWeight: 700, display: 'block' }}>Divisa:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F766E' }}>
                  US$ {storeBalUSD.toLocaleString('es-ES')} USD
                </span>
              </div>
            </div>
          </div>
        )}

        {!isOwner ? (
          <div style={{
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '8px'
          }}>
            <Lock size={18} color="var(--md-sys-color-on-surface-variant)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4 }}>
              Las transferencias entre cuentas y el acceso a las cuentas de Casa y Ahorro están restringidas exclusivamente al <strong>Propietario</strong> del sistema.
            </span>
          </div>
        ) : (
          <>

        {/* Mode Selector: Misma Moneda vs Conversión USD ↔ CUP */}
        {(() => {
          const { currencyMode } = getCurrencySettings();
          if (currencyMode !== 'BOTH') return null;

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              padding: '4px',
              borderRadius: '14px'
            }}>
              <button
                type="button"
                onClick={() => setIsCrossCurrencyMode(false)}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: !isCrossCurrencyMode ? '2px solid var(--md-sys-color-primary)' : 'none',
                  backgroundColor: !isCrossCurrencyMode ? 'var(--md-sys-color-surface)' : 'transparent',
                  color: !isCrossCurrencyMode ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ↔️ Misma Moneda
              </button>

              <button
                type="button"
                onClick={() => setIsCrossCurrencyMode(true)}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: isCrossCurrencyMode ? '2px solid #7C3AED' : 'none',
                  backgroundColor: isCrossCurrencyMode ? '#F5F3FF' : 'transparent',
                  color: isCrossCurrencyMode ? '#6D28D9' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Coins size={14} />
                <span>USD ↔ CUP</span>
              </button>
            </div>
          );
        })()}

        {/* Standard Currency Selector (if Misma Moneda) */}
        {!isCrossCurrencyMode && getCurrencySettings().currencyMode === 'BOTH' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Moneda de la Operación *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => setSameCurrency('CUP')}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: sameCurrency === 'CUP' ? '2px solid #059669' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: sameCurrency === 'CUP' ? '#ECFDF5' : 'var(--md-sys-color-surface)',
                  color: sameCurrency === 'CUP' ? '#047857' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                💵 CUP ($)
              </button>

              <button
                type="button"
                onClick={() => setSameCurrency('USD')}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  border: sameCurrency === 'USD' ? '2px solid #0F766E' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: sameCurrency === 'USD' ? '#CCFBF1' : 'var(--md-sys-color-surface)',
                  color: sameCurrency === 'USD' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                💲 USD (US$)
              </button>
            </div>
          </div>
        ) : null}

        {isCrossCurrencyMode && (
          /* Cross-Currency Direction Selector & Exchange Rate */
          <div style={{
            padding: '12px',
            borderRadius: '14px',
            backgroundColor: '#F5F3FF',
            border: '1.5px solid #DDD6FE',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6D28D9' }}>
                Dirección de Conversión:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6D28D9' }}>Tasa: 1 USD =</span>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  style={{
                    width: '65px',
                    padding: '4px 6px',
                    borderRadius: '8px',
                    border: '1.5px solid #7C3AED',
                    backgroundColor: '#FFF',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                  value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value === '' ? '' as any : parseFloat(e.target.value))}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6D28D9' }}>CUP</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setConversionDirection('USD_TO_CUP')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: conversionDirection === 'USD_TO_CUP' ? '2px solid #2563EB' : '1px solid #C7D2FE',
                  backgroundColor: conversionDirection === 'USD_TO_CUP' ? '#EFF6FF' : '#FFF',
                  color: conversionDirection === 'USD_TO_CUP' ? '#1E40AF' : '#4B5563',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                💲 USD ➔ 💵 CUP
              </button>

              <button
                type="button"
                onClick={() => setConversionDirection('CUP_TO_USD')}
                style={{
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: conversionDirection === 'CUP_TO_USD' ? '2px solid #059669' : '1px solid #A7F3D0',
                  backgroundColor: conversionDirection === 'CUP_TO_USD' ? '#ECFDF5' : '#FFF',
                  color: conversionDirection === 'CUP_TO_USD' ? '#065F46' : '#4B5563',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                💵 CUP ➔ 💲 USD
              </button>
            </div>
          </div>
        )}

        {/* Account Selector Grid: FROM */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            1. Cuenta Origen (Sale {activeSourceCurrency}):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {(['casa', 'tienda', 'ahorro'] as FundAccountType[]).map((acc) => {
              const isSelected = fromAccount === acc;
              return (
                <button
                  key={`from-${acc}`}
                  type="button"
                  onClick={() => handleFromChange(acc)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {acc === 'casa' && <Home size={16} />}
                  {acc === 'tienda' && <Store size={16} />}
                  {acc === 'ahorro' && <PiggyBank size={16} />}
                  <span>{getAccountLabel(acc).replace(/^[^\s]+\s*/, '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Selector Grid: TO / DESTINATION */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>
              2. Destino de los Fondos:
            </label>
            {fromAccount === 'ahorro' && (
              <button
                type="button"
                onClick={() => setIsSavingsExpenseMode(!isSavingsExpenseMode)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: isSavingsExpenseMode ? '1.5px solid #EF4444' : '1px solid #FCA5A5',
                  backgroundColor: isSavingsExpenseMode ? '#FEE2E2' : '#FFF5F5',
                  color: isSavingsExpenseMode ? '#991B1B' : '#B91C1C',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LogOut size={13} />
                <span>{isSavingsExpenseMode ? '✓ Sacar como Gasto' : 'Sacar como Gasto'}</span>
              </button>
            )}
          </div>

          {!isSavingsExpenseMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(['casa', 'tienda', 'ahorro'] as FundAccountType[]).map((acc) => {
                const isSameAccount = !isCrossCurrencyMode && fromAccount === acc;
                const isForbiddenCross = (fromAccount === 'tienda' && acc === 'ahorro') || (fromAccount === 'ahorro' && acc === 'tienda');
                const isDisabled = isSameAccount || isForbiddenCross;
                const isSelected = toAccount === acc;

                return (
                  <button
                    key={`to-${acc}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setToAccount(acc)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                      color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.35 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {acc === 'casa' && <Home size={16} />}
                    {acc === 'tienda' && <Store size={16} />}
                    {acc === 'ahorro' && <PiggyBank size={16} />}
                    <span>{getAccountLabel(acc).replace(/^[^\s]+\s*/, '')}</span>
                    {isForbiddenCross && (
                      <span style={{ fontSize: '0.6rem', color: '#991B1B', fontWeight: 800 }}>Pasa por Casa</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <LogOut size={20} color="#DC2626" />
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991B1B', display: 'block' }}>
                  Retiro del Sistema (Gasto de Ahorros)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#B91C1C' }}>
                  El dinero saldrá del Fondo de Ahorro y no ingresará a ninguna otra cuenta. Se registrará como gasto definitivo.
                </span>
              </div>
            </div>
          )}

          {/* Rule Clarification Banner */}
          {fromAccount === 'tienda' && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              💡 Las ganancias del negocio se acumulan en la Tienda. Para usarlas en Casa, realiza una transferencia directa.
            </div>
          )}
          {fromAccount === 'ahorro' && !isSavingsExpenseMode && (
            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
              💡 El Fondo de Ahorro solo se transfiere de ida y vuelta con la Casa.
            </div>
          )}
        </div>

        {/* Balance Display Banner */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
            Saldo Disponible en Origen ({activeSourceCurrency}):
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(availableSourceBalance, activeSourceCurrency, true)}
          </span>
        </div>

        {/* Input Amount & Live Calculation Box */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Monto a Debitar ({activeSourceCurrency}):
          </label>
          <input
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            step="any"
            required
            max={fromAccount === 'casa' ? undefined : availableSourceBalance}
            placeholder={`Monto en ${activeSourceCurrency}...`}
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="app-input-numeric"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              fontSize: '1.2rem',
              fontWeight: 800,
              textAlign: 'center'
            }}
          />
        </div>

        {/* Live Calculation Preview when converting */}
        {isCrossCurrencyMode && numAmount > 0 && !isSavingsExpenseMode && (
          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'block' }}>
              Monto Calculado que Ingresará en {getAccountLabel(toAccount)}:
            </span>
            <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#15803D', display: 'block', marginTop: '2px' }}>
              {formatCurrency(calculatedTargetAmount, activeTargetCurrency, true)}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 600 }}>
              Conversión: {srcSymbol}{numAmount} {activeSourceCurrency} @ (1 USD = {exchangeRate} CUP)
            </span>
          </div>
        )}

        {/* Input Notes */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Nota / Concepto opcional:
          </label>
          <AppInput
            type="text"
            placeholder={isSavingsExpenseMode ? "Ej. Compra de electrodoméstico..." : isCrossCurrencyMode ? "Ej. Cambio de divisas de caja..." : "Ej. Depósito mensual de ahorro..."}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        </>
        )}

        </div>

        {/* Submit Actions Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          display: 'flex',
          gap: '12px'
        }}>
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="md-btn md-btn-secondary"
                style={{ flex: 1, padding: '14px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={`md-btn ${isSavingsExpenseMode ? 'md-btn-expense' : 'md-btn-primary'}`}
                style={{ flex: 1, padding: '14px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSavingsExpenseMode ? <LogOut size={18} /> : <ArrowRightLeft size={18} />}
                <span>
                  {isSavingsExpenseMode 
                    ? 'Registrar Gasto de Ahorro' 
                    : (isCrossCurrencyMode ? 'Convertir y Enviar' : `Transferir ${activeSourceCurrency}`)}
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.9rem', fontWeight: 800 }}
            >
              Cerrar Vista
            </button>
          )}
        </div>

      </form>

    </div>
  );
};
