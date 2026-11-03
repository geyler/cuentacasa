'use client';

import React, { useState, useEffect } from 'react';
import { FundAccountType, CurrencyType } from '@/types';
import { getRawDatabase, getCasaAvailableBalance, executeUniversalTransfer, getCurrencySettings, getLoggedInUser } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { ArrowRightLeft, X, Store, Home, Coins, Lock } from 'lucide-react';

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
  defaultFrom = 'tienda',
  defaultTo = 'casa'
}) => {
  useLockBodyScroll(isOpen, onClose);
  const { showActionResult, showToast, confirmAction } = useActionFeedback();

  // Mode: 'transfer' (same currency between accounts) vs 'convert' (USD <-> CUP exchange)
  const [activeTab, setActiveTab] = useState<'transfer' | 'convert'>('transfer');

  // Transfer Mode States
  const [fromAccount, setFromAccount] = useState<FundAccountType>(defaultFrom);
  const [toAccount, setToAccount] = useState<FundAccountType>(
    defaultTo !== defaultFrom ? defaultTo : (defaultFrom === 'casa' ? 'tienda' : 'casa')
  );
  const [sameCurrency, setSameCurrency] = useState<CurrencyType>('CUP');

  // Convert Mode States
  const [convertFromAccount, setConvertFromAccount] = useState<FundAccountType>('casa');
  const [convertToAccountMode, setConvertToAccountMode] = useState<'same' | 'other'>('same');
  const [conversionDirection, setConversionDirection] = useState<'USD_TO_CUP' | 'CUP_TO_USD'>('USD_TO_CUP');
  const [exchangeRate, setExchangeRate] = useState<number>(320);

  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const cSettings = getCurrencySettings();
      setExchangeRate(cSettings.exchangeRateUSD || 320);
      if (cSettings.currencyMode === 'CUP') {
        setActiveTab('transfer');
        setSameCurrency('CUP');
      } else if (cSettings.currencyMode === 'USD') {
        setActiveTab('transfer');
        setSameCurrency('USD');
      }
      setAmount('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rawDb = getRawDatabase();
  const isCrossCurrencyMode = activeTab === 'convert';

  // Effective Source & Target Currency
  const activeSourceCurrency: CurrencyType = isCrossCurrencyMode
    ? (conversionDirection === 'USD_TO_CUP' ? 'USD' : 'CUP')
    : sameCurrency;

  const activeTargetCurrency: CurrencyType = isCrossCurrencyMode
    ? (conversionDirection === 'USD_TO_CUP' ? 'CUP' : 'USD')
    : sameCurrency;

  const effectiveFromAccount: FundAccountType = isCrossCurrencyMode ? convertFromAccount : fromAccount;
  const effectiveToAccount: FundAccountType = isCrossCurrencyMode
    ? (convertToAccountMode === 'same' ? convertFromAccount : (convertFromAccount === 'casa' ? 'tienda' : 'casa'))
    : toAccount;

  // Balance calculation for source currency
  const getAccountBalanceInCurrency = (acc: FundAccountType, curr: CurrencyType): number => {
    if (curr === 'USD') {
      switch (acc) {
        case 'casa': return getCasaAvailableBalance('USD');
        case 'tienda': return rawDb.storeFundUSD || 0;
      }
    } else {
      switch (acc) {
        case 'casa': return getCasaAvailableBalance('CUP');
        case 'tienda': return rawDb.storeFund || 0;
      }
    }
  };

  const getAccountLabel = (acc: FundAccountType): string => {
    switch (acc) {
      case 'casa': return '🏡 Fondo Casa';
      case 'tienda': return '🏬 Fondo Negocio';
    }
  };

  const availableSourceBalance = getAccountBalanceInCurrency(effectiveFromAccount, activeSourceCurrency);
  const availableTargetBalance = getAccountBalanceInCurrency(effectiveToAccount, activeTargetCurrency);
  const srcSymbol = activeSourceCurrency === 'USD' ? 'US$' : '$';
  const tgtSymbol = activeTargetCurrency === 'USD' ? 'US$' : '$';

  // Live conversion calculation
  const numAmount = Number(amount) || 0;
  let calculatedTargetAmount = 0;
  if (isCrossCurrencyMode && numAmount > 0 && exchangeRate > 0) {
    if (conversionDirection === 'USD_TO_CUP') {
      calculatedTargetAmount = Math.round(numAmount * exchangeRate);
    } else {
      calculatedTargetAmount = Math.round((numAmount / exchangeRate) * 100) / 100;
    }
  } else {
    calculatedTargetAmount = numAmount;
  }

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      showToast({ title: 'Monto Inválido', message: 'Ingresa un monto mayor a 0 para transferir.', type: 'warning' });
      return;
    }

    if (numAmount > availableSourceBalance) {
      showToast({
        title: 'Saldo Insuficiente',
        message: `El saldo disponible en ${getAccountLabel(effectiveFromAccount)} (${activeSourceCurrency}) es ${srcSymbol} ${availableSourceBalance}.`,
        type: 'error'
      });
      return;
    }

    const fromLabel = getAccountLabel(effectiveFromAccount);
    const toLabel = getAccountLabel(effectiveToAccount);

    const titleText = isCrossCurrencyMode ? '¿Confirmar Conversión de Divisa?' : '¿Confirmar Transferencia?';
    const detailMsg = isCrossCurrencyMode
      ? `Se debitarán ${srcSymbol} ${numAmount} ${activeSourceCurrency} de ${fromLabel} y se acreditarán ${tgtSymbol} ${calculatedTargetAmount} ${activeTargetCurrency} en ${toLabel} (Tasa: 1 USD = ${exchangeRate} CUP).`
      : `Se moverán ${formatCurrency(numAmount, activeSourceCurrency, true)} desde ${fromLabel} hacia ${toLabel}.`;

    confirmAction({
      title: titleText,
      message: detailMsg,
      variant: 'info',
      confirmText: isCrossCurrencyMode ? 'Confirmar Conversión' : 'Confirmar Transferencia',
      onConfirm: () => {
        const res = executeUniversalTransfer({
          fromAccount: effectiveFromAccount,
          toAccount: effectiveToAccount,
          amount: numAmount,
          currency: activeSourceCurrency,
          targetCurrency: activeTargetCurrency,
          exchangeRate: exchangeRate,
          targetAmount: calculatedTargetAmount,
          notes: notes.trim() || (isCrossCurrencyMode ? `Conversión de divisas ${activeSourceCurrency} ➔ ${activeTargetCurrency}` : undefined)
        });

        if (res.success) {
          setAmount('');
          setNotes('');
          onSuccess();
          onClose();

          showActionResult({
            title: isCrossCurrencyMode ? '¡Conversión Exitosa!' : '¡Transferencia Registrada!',
            message: isCrossCurrencyMode
              ? `Convertidos ${srcSymbol} ${numAmount} ${activeSourceCurrency} ➔ ${tgtSymbol} ${calculatedTargetAmount} ${activeTargetCurrency} en ${toLabel}.`
              : `Movimiento exitoso de ${formatCurrency(numAmount, activeSourceCurrency, true)} hacia ${toLabel}.`,
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

  return (
    <div
      className="modal-backdrop-responsive no-print"
      style={{
        zIndex: 2200
      }}
      onClick={onClose}
    >
      <form
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        onSubmit={isOwner ? handleExecuteTransfer : (e) => { e.preventDefault(); onClose(); }}
        style={{
          backgroundColor: '#FFFFFF',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Grab Handle (Only visible on Mobile) */}
        <div className="mobile-only" style={{ justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)' }} />
        </div>

        {/* Header Bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: isCrossCurrencyMode ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--brand-primary-light, #EFF6FF)',
              color: isCrossCurrencyMode ? '#0D9488' : 'var(--brand-primary, #1A73E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCrossCurrencyMode ? <Coins size={20} /> : <ArrowRightLeft size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                {isCrossCurrencyMode ? 'Cambiar Divisa (CUP ⇄ USD)' : (isOwner ? 'Mover Fondos entre Cuentas' : 'Saldos de Cuenta')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                {isOwner ? 'Gestión clara de divisas y fondos sin cruzar cuentas' : 'Consulta de saldo de operaciones'}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#FFFFFF' }}>

        {/* Top Balances Cards (Casa & Negocio) */}
        {isOwner ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            {/* 1. Casa */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>🏡 Fondo Casa</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap' }}>
                $ {casaBalCUP.toLocaleString('es-ES')}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0D9488', whiteSpace: 'nowrap' }}>
                US$ {casaBalUSD.toFixed(2)}
              </span>
            </div>

            {/* 2. Negocio */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px'
            }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>🏬 Fondo Negocio</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap' }}>
                $ {storeBalCUP.toLocaleString('es-ES')}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0D9488', whiteSpace: 'nowrap' }}>
                US$ {storeBalUSD.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>🏬 Saldo Disponible del Negocio</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--brand-primary-light)', color: 'var(--brand-primary)', fontWeight: 800 }}>
                Administración
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'baseline', marginTop: '2px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>Moneda Nacional:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                  $ {storeBalCUP.toLocaleString('es-ES')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#0D9488', fontWeight: 700, display: 'block' }}>Divisa USD:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0D9488' }}>
                  US$ {storeBalUSD.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isOwner ? (
          <div style={{
            padding: '16px',
            borderRadius: '14px',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '8px'
          }}>
            <Lock size={18} color="var(--md-sys-color-on-surface-variant)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.4 }}>
              Las transferencias entre cuentas y el acceso a los fondos están restringidas exclusivamente al <strong>Propietario</strong> del sistema.
            </span>
          </div>
        ) : (
          <>
          {/* Top Segmented Mode Tabs: Mover entre Cuentas vs Cambiar Divisa */}
          {(() => {
            const { currencyMode } = getCurrencySettings();
            const allowConvert = currencyMode === 'BOTH';

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: allowConvert ? '1fr 1fr' : '1fr',
                gap: '6px',
                backgroundColor: 'var(--md-sys-color-surface-container-high, #E2E8F0)',
                padding: '4px',
                borderRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: activeTab === 'transfer' ? '2px solid var(--brand-primary, #1A73E8)' : 'none',
                    backgroundColor: activeTab === 'transfer' ? 'var(--md-sys-color-surface-container, #FFFFFF)' : 'transparent',
                    color: activeTab === 'transfer' ? 'var(--brand-primary, #1A73E8)' : 'var(--md-sys-color-on-surface-variant)',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: activeTab === 'transfer' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <ArrowRightLeft size={16} />
                  <span>Mover Fondos</span>
                </button>

                {allowConvert && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('convert')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: activeTab === 'convert' ? '2px solid #0D9488' : 'none',
                      backgroundColor: activeTab === 'convert' ? 'var(--md-sys-color-surface-container, #FFFFFF)' : 'transparent',
                      color: activeTab === 'convert' ? '#0F766E' : 'var(--md-sys-color-on-surface-variant)',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: activeTab === 'convert' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    <Coins size={16} color="#0D9488" />
                    <span>Cambiar Divisa</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* TAB 1: MOVER FONDOS (Misma moneda entre cuentas) */}
          {activeTab === 'transfer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Moneda selector */}
              {getCurrencySettings().currencyMode === 'BOTH' && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                    Moneda a Transferir:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSameCurrency('CUP')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: sameCurrency === 'CUP' ? '2px solid var(--md-sys-color-on-surface, #0F172A)' : '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: sameCurrency === 'CUP' ? 'var(--md-sys-color-surface-container, #FFFFFF)' : 'transparent',
                        color: 'var(--md-sys-color-on-surface, #0F172A)',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>💵 Pesos Cubanos (CUP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSameCurrency('USD')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: sameCurrency === 'USD' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: sameCurrency === 'USD' ? 'var(--brand-secondary-light, #F0FDFA)' : 'transparent',
                        color: sameCurrency === 'USD' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>💲 Dólares (USD)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dirección de Transferencia: De ➔ Hacia con botón flip */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  Dirección del Movimiento:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                  {/* De Origen */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                    border: '1.5px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--md-sys-color-expense, #DC2626)', textTransform: 'uppercase' }}>
                      Sale de (Origen)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {fromAccount === 'casa' ? <Home size={16} /> : <Store size={16} />}
                      <strong style={{ fontSize: '0.88rem' }}>{fromAccount === 'casa' ? 'Fondo Casa' : 'Fondo Negocio'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                      Disp: {sameCurrency === 'USD' ? `US$ ${getAccountBalanceInCurrency(fromAccount, 'USD').toFixed(2)}` : `$ ${getAccountBalanceInCurrency(fromAccount, 'CUP').toLocaleString('es-ES')}`}
                    </span>
                  </div>

                  {/* Flip Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextFrom = fromAccount === 'casa' ? 'tienda' : 'casa';
                      setFromAccount(nextFrom);
                      setToAccount(nextFrom === 'casa' ? 'tienda' : 'casa');
                    }}
                    title="Invertir dirección"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                      color: 'var(--brand-primary, #1A73E8)',
                      border: '1.5px solid var(--brand-primary-border, #CBD5E1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowRightLeft size={16} />
                  </button>

                  {/* Hacia Destino */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                    border: '1.5px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--md-sys-color-income, #059669)', textTransform: 'uppercase' }}>
                      Entra a (Destino)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {toAccount === 'casa' ? <Home size={16} /> : <Store size={16} />}
                      <strong style={{ fontSize: '0.88rem' }}>{toAccount === 'casa' ? 'Fondo Casa' : 'Fondo Negocio'}</strong>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                      Saldo: {sameCurrency === 'USD' ? `US$ ${getAccountBalanceInCurrency(toAccount, 'USD').toFixed(2)}` : `$ ${getAccountBalanceInCurrency(toAccount, 'CUP').toLocaleString('es-ES')}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMBIAR DIVISA (Conversión USD ⇄ CUP) */}
          {activeTab === 'convert' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Tipo de Operación: Vender USD vs Comprar USD */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  ¿Qué operación deseas realizar?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setConversionDirection('USD_TO_CUP')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '12px',
                      border: conversionDirection === 'USD_TO_CUP' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: conversionDirection === 'USD_TO_CUP' ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--md-sys-color-surface-container, #FFFFFF)',
                      color: conversionDirection === 'USD_TO_CUP' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>💲 Vender USD por CUP</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>Entregas USD ➔ Recibes CUP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConversionDirection('CUP_TO_USD')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '12px',
                      border: conversionDirection === 'CUP_TO_USD' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: conversionDirection === 'CUP_TO_USD' ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--md-sys-color-surface-container, #FFFFFF)',
                      color: conversionDirection === 'CUP_TO_USD' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>💵 Comprar USD con CUP</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>Entregas CUP ➔ Recibes USD</span>
                  </button>
                </div>
              </div>

              {/* 2. ¿De qué cuenta salen los fondos? */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  ¿De qué fondo sale el dinero a cambiar?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(['casa', 'tienda'] as const).map(acc => {
                    const bal = getAccountBalanceInCurrency(acc, activeSourceCurrency);
                    const isSel = convertFromAccount === acc;
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setConvertFromAccount(acc)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSel ? '2px solid var(--brand-primary, #1A73E8)' : '1px solid var(--md-sys-color-outline-variant)',
                          backgroundColor: isSel ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface-container, #FFFFFF)',
                          color: 'var(--md-sys-color-on-surface)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem', display: 'block' }}>
                          {acc === 'casa' ? '🏡 Fondo Casa' : '🏬 Fondo Negocio'}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Disp: {activeSourceCurrency === 'USD' ? `US$ ${bal.toFixed(2)}` : `$ ${bal.toLocaleString('es-ES')}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. ¿A dónde van los fondos convertidos? */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                  ¿A dónde entra el dinero convertido?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setConvertToAccountMode('same')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: convertToAccountMode === 'same' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: convertToAccountMode === 'same' ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--md-sys-color-surface-container, #FFFFFF)',
                      color: convertToAccountMode === 'same' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <strong style={{ fontSize: '0.84rem', display: 'block' }}>
                      {convertFromAccount === 'casa' ? '🏡 Mantener en Casa' : '🏬 Mantener en Negocio'}
                    </strong>
                    <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>Solo cambiar moneda en este fondo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConvertToAccountMode('other')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: convertToAccountMode === 'other' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: convertToAccountMode === 'other' ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--md-sys-color-surface-container, #FFFFFF)',
                      color: convertToAccountMode === 'other' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <strong style={{ fontSize: '0.84rem', display: 'block' }}>
                      {convertFromAccount === 'casa' ? '🏬 Enviar a Negocio' : '🏡 Enviar a Casa'}
                    </strong>
                    <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>Convertir y enviar a la otra cuenta</span>
                  </button>
                </div>
              </div>

              {/* 4. Tasa de Cambio */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'var(--brand-secondary-light, #F0FDFA)',
                border: '1px solid var(--brand-secondary-border, #99F6E4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F766E', display: 'block' }}>
                    Tasa de Cambio de la Operación
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#115E59' }}>
                    1 USD = {exchangeRate} CUP
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F766E' }}>Tasa:</span>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(e.target.value === '' ? '' as any : parseFloat(e.target.value))}
                    style={{
                      width: '80px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1.5px solid #0D9488',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F766E' }}>CUP</span>
                </div>
              </div>
            </div>
          )}

          {/* Input Monto a Debitar */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              {isCrossCurrencyMode 
                ? `Monto que entregas en ${activeSourceCurrency}:` 
                : `Monto a transferir (${activeSourceCurrency}):`}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              required
              max={availableSourceBalance}
              placeholder={`Ej. ${activeSourceCurrency === 'USD' ? '50.00' : '5000'}`}
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: isCrossCurrencyMode ? '2px solid #0D9488' : '2px solid var(--brand-primary, #1A73E8)',
                backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                fontSize: '1.25rem',
                fontWeight: 900,
                textAlign: 'center'
              }}
            />

            {/* Quick chips & Todo el Saldo */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {(activeSourceCurrency === 'USD' ? [10, 20, 50, 100] : [500, 1000, 2000, 5000]).map((chipVal) => (
                <button
                  key={chipVal}
                  type="button"
                  onClick={() => setAmount(chipVal)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {activeSourceCurrency === 'USD' ? `US$ ${chipVal}` : `$ ${chipVal.toLocaleString('es-ES')}`}
                </button>
              ))}

              {availableSourceBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(availableSourceBalance)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #0D9488',
                    backgroundColor: 'var(--brand-secondary-light, #F0FDFA)',
                    color: '#0F766E',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Todo el Saldo ({srcSymbol} {activeSourceCurrency === 'USD' ? availableSourceBalance.toFixed(2) : availableSourceBalance.toLocaleString('es-ES')})
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta de Cálculo Instantáneo para Conversión */}
          {isCrossCurrencyMode && numAmount > 0 && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              backgroundColor: '#F0FDFA',
              border: '1.5px solid #99F6E4',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>
                Resultado de la Conversión
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#115E59', display: 'block' }}>Entregas ({getAccountLabel(effectiveFromAccount)}):</span>
                  <strong style={{ fontSize: '1.1rem', color: '#0F766E' }}>
                    {srcSymbol} {activeSourceCurrency === 'USD' ? numAmount.toFixed(2) : numAmount.toLocaleString('es-ES')} {activeSourceCurrency}
                  </strong>
                </div>
                <ArrowRightLeft size={18} color="#0D9488" />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: '#115E59', display: 'block' }}>Recibes ({getAccountLabel(effectiveToAccount)}):</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--md-sys-color-income, #059669)' }}>
                    {tgtSymbol} {activeTargetCurrency === 'USD' ? calculatedTargetAmount.toFixed(2) : calculatedTargetAmount.toLocaleString('es-ES')} {activeTargetCurrency}
                  </strong>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#115E59', textAlign: 'center' }}>
                Tasa aplicada: 1 USD = {exchangeRate} CUP
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
              placeholder={isCrossCurrencyMode ? "Ej. Cambio de billetes de caja..." : "Ej. Transferencia para mercadería..."}
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
          backgroundColor: '#FFFFFF',
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
                className="md-btn md-btn-primary"
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: isCrossCurrencyMode ? '#0D9488' : undefined,
                  border: isCrossCurrencyMode ? 'none' : undefined
                }}
              >
                <ArrowRightLeft size={18} />
                <span>
                  {isCrossCurrencyMode ? 'Confirmar Conversión' : `Transferir ${activeSourceCurrency}`}
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
