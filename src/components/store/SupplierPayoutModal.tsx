'use client';

import React, { useState, useEffect } from 'react';
import { SupplierAccount, CurrencyType } from '@/types';
import { X, DollarSign, Coins } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface SupplierPayoutModalProps {
  supplier: SupplierAccount | null;
  onClose: () => void;
  onExecutePayout: (amount: number, source: 'negocio' | 'casa', currency: CurrencyType) => void;
  currency?: string;
}

export const SupplierPayoutModal: React.FC<SupplierPayoutModalProps> = ({
  supplier,
  onClose,
  onExecutePayout,
  currency = '$'
}) => {
  useLockBodyScroll(!!supplier);
  const [payoutSource, setPayoutSource] = useState<'negocio' | 'casa'>('negocio');
  const [payoutCurrency, setPayoutCurrency] = useState<CurrencyType>('CUP');
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');

  useEffect(() => {
    if (supplier) {
      const hasUSD = (supplier.pendingPayoutUSD || 0) > 0;
      const hasCUP = supplier.pendingPayout > 0;
      if (hasUSD && !hasCUP) {
        setPayoutCurrency('USD');
        setPayoutAmount(supplier.pendingPayoutUSD || 0);
      } else {
        setPayoutCurrency('CUP');
        setPayoutAmount(supplier.pendingPayout);
      }
    }
  }, [supplier]);

  if (!supplier) return null;

  const isUSD = payoutCurrency === 'USD';
  const pendingMax = isUSD ? (supplier.pendingPayoutUSD || 0) : supplier.pendingPayout;

  const handleCurrencyChange = (curr: CurrencyType) => {
    setPayoutCurrency(curr);
    setPayoutAmount(curr === 'USD' ? (supplier.pendingPayoutUSD || 0) : supplier.pendingPayout);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    onExecutePayout(Number(payoutAmount), payoutSource, payoutCurrency);
    onClose();
  };

  return (
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
    }} onClick={onClose}>
      
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bottom-sheet-modal"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '768px',
          padding: '20px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: 'var(--md-shadow-elevation-4)'
        }}
      >
        {/* Drag Indicator */}
        <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Liquidar Proveedor: {supplier.name}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Resumen Deudas Retenidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '12px',
          borderRadius: '12px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>Pendiente CUP ($)</span>
            <strong style={{ fontSize: '1rem', color: 'var(--md-sys-color-expense)' }}>${supplier.pendingPayout.toLocaleString('es-ES')}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>Pendiente USD (US$)</span>
            <strong style={{ fontSize: '1rem', color: '#0F766E' }}>US$${(supplier.pendingPayoutUSD || 0).toLocaleString('es-ES')}</strong>
          </div>
        </div>

        {/* Selector de Moneda a Liquidar */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Moneda a Liquidar:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleCurrencyChange('CUP')}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: payoutCurrency === 'CUP' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: payoutCurrency === 'CUP' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                color: payoutCurrency === 'CUP' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                fontWeight: payoutCurrency === 'CUP' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Coins size={16} /> Liquidar CUP ($)
            </button>

            <button
              type="button"
              onClick={() => handleCurrencyChange('USD')}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: payoutCurrency === 'USD' ? '2px solid #0D9488' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: payoutCurrency === 'USD' ? '#CCFBF1' : 'var(--md-sys-color-surface)',
                color: payoutCurrency === 'USD' ? '#0F766E' : 'var(--md-sys-color-on-surface)',
                fontWeight: payoutCurrency === 'USD' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <DollarSign size={16} /> Liquidar USD (US$)
            </button>
          </div>
        </div>

        {/* Selector de Origen del Dinero */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Origen del Dinero para Liquidar:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPayoutSource('negocio')}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: payoutSource === 'negocio' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: payoutSource === 'negocio' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                color: payoutSource === 'negocio' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                fontWeight: payoutSource === 'negocio' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🏦 Fondo Tienda ({isUSD ? 'USD' : 'CUP'})
            </button>

            <button
              type="button"
              onClick={() => setPayoutSource('casa')}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: payoutSource === 'casa' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: payoutSource === 'casa' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                color: payoutSource === 'casa' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                fontWeight: payoutSource === 'casa' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🏡 Cuenta Casa ({isUSD ? 'USD' : 'CUP'})
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Monto a Entregar ({isUSD ? 'US$' : '$'}):
          </label>
          <input
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            step="any"
            required
            max={pendingMax}
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="app-input-numeric"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              fontWeight: 800,
              fontSize: '1.1rem',
              textAlign: 'center'
            }}
          />
        </div>

        <button
          type="submit"
          className="md-btn md-btn-primary"
          style={{ width: '100%', padding: '14px' }}
        >
          Registrar Liquidación Entregada ({isUSD ? 'USD' : 'CUP'})
        </button>

      </form>

    </div>
  );
};
