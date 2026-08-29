'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/invoice';
import { ArrowRightLeft, PiggyBank } from 'lucide-react';

interface StoreTransfersTabProps {
  currency?: string;
  totalStoreFund: number;
  onOpenUniversalTransfer: () => void;
  onExecuteTransfer: (direction: 'store_to_casa' | 'casa_to_store', amount: number, notes: string) => void;
}

export const StoreTransfersTab: React.FC<StoreTransfersTabProps> = ({
  currency = '$',
  totalStoreFund,
  onOpenUniversalTransfer,
  onExecuteTransfer
}) => {
  const [transferDirection, setTransferDirection] = useState<'store_to_casa' | 'casa_to_store'>('store_to_casa');
  const [transferAmountInput, setTransferAmountInput] = useState<number | ''>('');
  const [transferNotesInput, setTransferNotesInput] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const rawDb = typeof window !== 'undefined' ? (require('@/lib/storage').getRawDatabase()) : null;
  const allTxs = rawDb?.transactions || [];

  // Filter store business transactions (accountSource === 'tienda' or store legacy categories)
  const storeTransactions = allTxs.filter((tx: any) => {
    let isStore = false;
    if (tx.accountSource) {
      isStore = tx.accountSource === 'tienda';
    } else {
      isStore = (tx.category || '').toLowerCase().includes('tienda') || 
                (tx.category || '').toLowerCase().includes('proveedor') ||
                (tx.concept || '').toLowerCase().includes('venta');
    }
    if (!isStore) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (tx.concept || '').toLowerCase().includes(term) ||
           (tx.category || '').toLowerCase().includes(term) ||
           (tx.notes || '').toLowerCase().includes(term);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmountInput || Number(transferAmountInput) <= 0) return;
    onExecuteTransfer(transferDirection, Number(transferAmountInput), transferNotesInput);
    setTransferAmountInput('');
    setTransferNotesInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Transfer Form Card */}
      <div className="md-card" style={{ padding: '20px', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ArrowRightLeft size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Transferencias entre Cuentas</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Transfiere entre el Fondo de la Tienda, Fondo de Ahorro y Cuenta Casa. Cada movimiento registrará automáticamente 2 transacciones.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUniversalTransfer}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.88rem',
            marginBottom: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--md-shadow-elevation-1)'
          }}
        >
          <PiggyBank size={20} />
          <span>Abrir Asistente de Transferencias (Incluye Ahorro)</span>
        </button>

        {/* Direction Selector Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setTransferDirection('store_to_casa')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: transferDirection === 'store_to_casa' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: transferDirection === 'store_to_casa' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
              color: transferDirection === 'store_to_casa' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
              fontWeight: transferDirection === 'store_to_casa' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            🏦 Tienda ➔ 🏡 Casa
          </button>

          <button
            type="button"
            onClick={() => setTransferDirection('casa_to_store')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: transferDirection === 'casa_to_store' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: transferDirection === 'casa_to_store' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
              color: transferDirection === 'casa_to_store' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
              fontWeight: transferDirection === 'casa_to_store' ? 800 : 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            🏡 Casa ➔ 🏦 Tienda
          </button>
        </div>

        <div style={{
          padding: '14px',
          borderRadius: '14px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
              Saldo Disponible en Fondo Tienda:
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
              {formatCurrency(totalStoreFund, currency, true)}
            </span>
          </div>
          {transferDirection === 'store_to_casa' && (
            <button
              type="button"
              onClick={() => setTransferAmountInput(totalStoreFund)}
              className="md-btn md-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Usar Todo
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Monto a Transferir ({currency}):
            </label>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              step="any"
              required
              max={transferDirection === 'store_to_casa' ? totalStoreFund : undefined}
              placeholder="500"
              value={transferAmountInput}
              onChange={e => setTransferAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="input-spotlight"
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

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Nota / Concepto opcional:
            </label>
            <input
              type="text"
              placeholder={transferDirection === 'store_to_casa' ? "Ej. Retiro de utilidad mensual para gastos del hogar" : "Ej. Aporte para compra de inventario"}
              value={transferNotesInput}
              onChange={e => setTransferNotesInput(e.target.value)}
              className="input-spotlight"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={transferDirection === 'store_to_casa' && totalStoreFund <= 0}
            className="md-btn md-btn-primary"
            style={{ padding: '14px', fontSize: '0.95rem', opacity: (transferDirection === 'store_to_casa' && totalStoreFund <= 0) ? 0.5 : 1 }}
          >
            <ArrowRightLeft size={18} />
            <span>
              {transferDirection === 'store_to_casa' ? 'Confirmar Transferencia a Cuenta Casa' : 'Confirmar Inyección a Fondo Tienda'}
            </span>
          </button>
        </form>
      </div>

      {/* Business Ledger Card */}
      <div className="md-card" style={{ padding: '20px', maxWidth: '650px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📑 Movimientos y Registro Financiero del Negocio</span>
            </h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
              Auditoría de ventas, compras de mercancía, liquidaciones a proveedores e inyecciones/retiros.
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' }}>
            {storeTransactions.length} registros
          </span>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar movimiento por concepto o categoría..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="app-input"
          style={{ width: '100%', padding: '10px 12px', fontSize: '0.82rem', borderRadius: '12px' }}
        />

        {storeTransactions.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
            No hay movimientos financieros registrados en el negocio todavía.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
            {storeTransactions.map((tx: any) => {
              const isIncome = tx.type === 'ingreso';
              const sym = tx.currency === 'USD' ? 'US$' : (currency || '$');

              return (
                <div
                  key={tx.id}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{isIncome ? '🟢' : '🔴'} {tx.concept}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>🏷️ {tx.category}</span>
                      <span>📅 {tx.date}</span>
                    </div>
                    {tx.notes && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', marginTop: '2px' }}>
                        💬 {tx.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.95rem', fontWeight: 900, color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)' }}>
                      {isIncome ? '+' : '-'}{sym}{tx.amount}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {tx.currency || 'CUP'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
