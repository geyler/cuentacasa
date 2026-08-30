'use client';

import React from 'react';
import { FinancialSummary } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Store, ArrowRightLeft } from 'lucide-react';
import { getCurrencySettings } from '@/lib/storage';

interface StatCardsProps {
  summary: FinancialSummary;
  currency?: string;
  showBalance?: boolean;
  isLoading?: boolean;
  storeFund?: number;
  storeFundUSD?: number;
  savingsFund?: number;
  savingsFundUSD?: number;
  onOpenTransfer?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ 
  summary, 
  currency = '$',
  showBalance = true,
  isLoading = false,
  storeFund = 0,
  storeFundUSD = 0,
  savingsFund = 0,
  savingsFundUSD = 0,
  onOpenTransfer
}) => {
  const { currencyMode } = getCurrencySettings();

  if (isLoading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="md-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="skeleton" style={{ width: '100px', height: '14px' }} />
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            </div>
            <div className="skeleton" style={{ width: '140px', height: '28px', margin: '6px 0' }} />
            <div className="skeleton" style={{ width: '160px', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Equal Parity Render Helper (100% full-width on single mode, 50/50 side-by-side grid on BOTH)
  const renderValueBlock = (
    valCUP: number, 
    valUSD: number, 
    colorCUP: string = 'var(--md-sys-color-income)', 
    colorUSD: string = '#0F766E',
    prefix: string = ''
  ) => {
    if (currencyMode === 'CUP') {
      return (
        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: colorCUP, letterSpacing: '-0.02em', margin: '6px 0 2px 0', wordBreak: 'break-word' }}>
          {prefix}{formatCurrency(valCUP, 'CUP', showBalance)}
        </div>
      );
    }

    if (currencyMode === 'USD') {
      return (
        <div style={{ fontSize: '1.45rem', fontWeight: 900, color: colorUSD, letterSpacing: '-0.02em', margin: '6px 0 2px 0', wordBreak: 'break-word' }}>
          {prefix}{formatCurrency(valUSD, 'USD', showBalance)}
        </div>
      );
    }

    // BOTH Mode: Clean stacked horizontal rows with full width to prevent number line breaks on mobile
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        margin: '6px 0 4px 0'
      }}>
        <div style={{
          padding: '5px 8px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: colorCUP, textTransform: 'uppercase', flexShrink: 0 }}>CUP</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: colorCUP, whiteSpace: 'nowrap', lineHeight: 1 }}>
            {prefix}{formatCurrency(valCUP, 'CUP', showBalance)}
          </span>
        </div>

        <div style={{
          padding: '5px 8px',
          borderRadius: '8px',
          backgroundColor: '#ECFEFF',
          border: '1px solid #99F6E4',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, color: colorUSD, textTransform: 'uppercase', flexShrink: 0 }}>USD</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: colorUSD, whiteSpace: 'nowrap', lineHeight: 1 }}>
            {prefix}{formatCurrency(valUSD, 'USD', showBalance)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Row 1: Total Ingresos & Total Gastos Side-by-Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        {/* Total Income Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-income-container)',
          color: 'var(--md-sys-color-on-income-container)',
          border: '1px solid #A7F3D0',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Total Ingresos</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={16} color="var(--md-sys-color-income)" />
            </div>
          </div>
          {renderValueBlock(summary.totalIncome, summary.totalIncomeUSD || 0, 'var(--md-sys-color-income)', '#0F766E', '+ ')}
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Pagos, ventas y salarios
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-expense-container)',
          color: 'var(--md-sys-color-on-expense-container)',
          border: '1px solid #FECDD3',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Total Gastos</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(225, 29, 72, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingDown size={16} color="var(--md-sys-color-expense)" />
            </div>
          </div>
          {renderValueBlock(summary.totalExpense, summary.totalExpenseUSD || 0, 'var(--md-sys-color-expense)', '#991B1B', '- ')}
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Gastos de hogar y compras
          </div>
        </div>
      </div>

      {/* Row 2: Saldo Neto Casa & Fondo Tienda Side-by-Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        {/* Balance Card - Fondo de la Casa */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
          border: '1px solid #FBCFE8',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9D174D' }}>🏡 Fondo de la Casa</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(236, 72, 153, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} color="#DB2777" />
            </div>
          </div>
          {renderValueBlock(summary.netBalance, summary.netBalanceUSD || 0, '#831843', '#0F766E')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#BE185D', fontWeight: 700 }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Saldo USD' : 'Saldo CUP')}
            </span>
          </div>
        </div>

        {/* Store Fund Card (Fondo del Negocio) */}
        <div className="md-card" style={{
          backgroundColor: '#ECFDF5',
          color: '#064E3B',
          border: '1px solid #A7F3D0',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065F46' }}>🏬 Fondo del Negocio</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(5, 150, 105, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Store size={16} color="#059669" />
            </div>
          </div>
          {renderValueBlock(storeFund, storeFundUSD, '#047857', '#0F766E')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#065F46', fontWeight: 700 }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Fondo USD' : 'Fondo CUP')}
            </span>
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{
                  backgroundColor: '#D1FAE5',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <ArrowRightLeft size={10} /> Mover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Savings Fund at Bottom */}
      <div className="md-card" style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        border: '1px solid var(--md-sys-color-outline-variant)',
        padding: '10px 14px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <PiggyBank size={18} color="var(--md-sys-color-primary)" />
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
              🐷 Fondo de la Casa (Ahorro)
            </div>
            {renderValueBlock(savingsFund, savingsFundUSD, 'var(--md-sys-color-on-surface)', '#0F766E')}
          </div>
        </div>

        {onOpenTransfer && (
          <button
            type="button"
            onClick={onOpenTransfer}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <ArrowRightLeft size={12} /> Transferir
          </button>
        )}
      </div>

    </div>
  );
};
