'use client';

import React, { useState } from 'react';
import { FundAccountType } from '@/types';
import { getRawDatabase, getSavingsFund, executeUniversalTransfer } from '@/lib/storage';
import { formatCurrency, calculateFinancialSummary } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { AppInput } from '@/components/common/AppInput';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { ArrowRightLeft, X, PiggyBank, Store, Home } from 'lucide-react';

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
  useLockBodyScroll(isOpen);
  const { showActionResult, showToast, confirmAction } = useActionFeedback();

  const [fromAccount, setFromAccount] = useState<FundAccountType>(defaultFrom);
  const [toAccount, setToAccount] = useState<FundAccountType>(
    defaultTo !== defaultFrom ? defaultTo : (defaultFrom === 'casa' ? 'ahorro' : 'casa')
  );
  const [transferCurrency, setTransferCurrency] = useState<'CUP' | 'USD'>('CUP');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const rawDb = getRawDatabase();
  const isUSD = transferCurrency === 'USD';
  const currencySymbol = isUSD ? 'US$' : '$';
  
  // Real-time available balances
  const casaSummary = calculateFinancialSummary(rawDb.transactions || []);
  const casaBalance = isUSD ? (casaSummary.netBalanceUSD || 0) : casaSummary.netBalance;
  const storeBalance = isUSD ? (rawDb.storeFundUSD || 0) : (rawDb.storeFund || 0);
  const savingsBalance = isUSD ? (rawDb.savingsFundUSD || 0) : getSavingsFund();

  const getAccountBalance = (acc: FundAccountType): number => {
    switch (acc) {
      case 'casa': return casaBalance;
      case 'tienda': return storeBalance;
      case 'ahorro': return savingsBalance;
    }
  };

  const getAccountLabel = (acc: FundAccountType): string => {
    switch (acc) {
      case 'casa': return '🏡 Fondo de la Casa';
      case 'tienda': return '🏬 Fondo del Negocio';
      case 'ahorro': return '🐷 Fondo de Ahorro';
    }
  };

  const availableSourceBalance = getAccountBalance(fromAccount);

  const handleFromChange = (acc: FundAccountType) => {
    setFromAccount(acc);
    if (toAccount === acc) {
      // Pick another default destination
      const remaining: FundAccountType[] = (['casa', 'tienda', 'ahorro'] as FundAccountType[]).filter(a => a !== acc);
      setToAccount(remaining[0]);
    }
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      showToast({ title: 'Monto Inválido', message: 'Ingresa un monto mayor a 0 para transferir.', type: 'warning' });
      return;
    }

    const numAmount = Number(amount);

    if ((fromAccount === 'tienda' || fromAccount === 'ahorro') && numAmount > availableSourceBalance) {
      showToast({
        title: 'Saldo Insuficiente',
        message: `El saldo disponible en ${getAccountLabel(fromAccount)} es ${currencySymbol} ${availableSourceBalance}.`,
        type: 'error'
      });
      return;
    }

    const fromLabel = getAccountLabel(fromAccount);
    const toLabel = getAccountLabel(toAccount);

    confirmAction({
      title: '¿Confirmar Transferencia?',
      message: `Se moverán ${formatCurrency(numAmount, transferCurrency, true)} de ${fromLabel} hacia ${toLabel}. Se registrarán 2 transacciones simultáneas.`,
      variant: 'info',
      confirmText: 'Confirmar y Transferir',
      onConfirm: () => {
        const res = executeUniversalTransfer({
          fromAccount,
          toAccount,
          amount: numAmount,
          currency: transferCurrency,
          notes
        });

        if (res.success) {
          setAmount('');
          setNotes('');
          onSuccess();
          onClose();

          showActionResult({
            title: '¡Transferencia Registrada!',
            message: `Movimiento exitoso de ${currencySymbol} ${numAmount} desde ${fromLabel} a ${toLabel}.`,
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

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.70)',
      backdropFilter: 'blur(8px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} onClick={onClose}>
      
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleExecuteTransfer}
        className="bottom-sheet-modal"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '480px',
          padding: '20px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--md-shadow-elevation-4)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Handle Drag Indicator */}
        <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Transferir entre Cuentas</h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>
        {/* Currency Selector Toggle (CUP vs USD) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Moneda de Transferencia *
          </label>
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
              onClick={() => setTransferCurrency('CUP')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: transferCurrency === 'CUP' ? '1px solid #FBCFE8' : 'none',
                backgroundColor: transferCurrency === 'CUP' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: transferCurrency === 'CUP' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              💵 CUP ($)
            </button>

            <button
              type="button"
              onClick={() => setTransferCurrency('USD')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: transferCurrency === 'USD' ? '1px solid #99F6E4' : 'none',
                backgroundColor: transferCurrency === 'USD' ? '#0F766E' : 'transparent',
                color: transferCurrency === 'USD' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              💲 USD (US$)
            </button>
          </div>
        </div>

        {/* Account Selector Grid: FROM */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            1. Cuenta Origen (Desde donde sale):
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

        {/* Account Selector Grid: TO */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            2. Cuenta Destino (Hacia donde ingresa):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {(['casa', 'tienda', 'ahorro'] as FundAccountType[]).map((acc) => {
              const isDisabled = fromAccount === acc;
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
                    opacity: isDisabled ? 0.4 : 1,
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
            Saldo Disponible en Origen:
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(availableSourceBalance, transferCurrency, true)}
          </span>
        </div>

        {/* Input Amount */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Monto a Transferir ({transferCurrency}):
          </label>
          <input
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            step="any"
            required
            max={fromAccount === 'casa' ? undefined : availableSourceBalance}
            placeholder="Monto..."
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

        {/* Input Notes */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Nota / Concepto opcional:
          </label>
          <AppInput
            type="text"
            placeholder="Ej. Depósito mensual de ahorro..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
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
            style={{ flex: 1, padding: '14px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ArrowRightLeft size={18} />
            <span>Transferir {transferCurrency} {amount ? amount : 0}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
