'use client';

import React from 'react';
import { FinancialSummary } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Store, ArrowRightLeft } from 'lucide-react';

interface StatCardsProps {
  summary: FinancialSummary;
  currency?: string;
  showBalance?: boolean;
  isLoading?: boolean;
  storeFund?: number;
  savingsFund?: number;
  onOpenTransfer?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ 
  summary, 
  currency = '$',
  showBalance = true,
  isLoading = false,
  storeFund = 0,
  savingsFund = 0,
  onOpenTransfer
}) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Primary Balance Cards Grid (2 Columns on Mobile) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        
        {/* Balance Card - Cuenta Casa */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #004B77 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.9 }}>🏡 Saldo Neto Casa</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
            {formatCurrency(summary.netBalance, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Presupuesto Cuenta Casa
          </div>
        </div>

        {/* Total Income Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-income-container)',
          color: 'var(--md-sys-color-on-income-container)',
          borderColor: 'rgba(0, 135, 90, 0.2)',
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
              backgroundColor: 'rgba(0, 135, 90, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={16} color="var(--md-sys-color-income)" />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-income)', wordBreak: 'break-word' }}>
            + {formatCurrency(summary.totalIncome, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Pagos, ventas y salarios
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-expense-container)',
          color: 'var(--md-sys-color-on-expense-container)',
          borderColor: 'rgba(211, 47, 47, 0.2)',
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
              backgroundColor: 'rgba(211, 47, 47, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingDown size={16} color="var(--md-sys-color-expense)" />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', color: 'var(--md-sys-color-expense)', wordBreak: 'break-word' }}>
            - {formatCurrency(summary.totalExpense, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>
            Gastos de hogar y compras
          </div>
        </div>

        {/* Store Fund Card (Fondo Tienda / Almacén) */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.9 }}>🏦 Fondo Tienda</span>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Store size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 2px 0', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
            {formatCurrency(storeFund, currency, showBalance)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>Almacén / Caja</span>
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <ArrowRightLeft size={10} /> Mover
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Savings Fund Row Card (2 Columns or Single Wide) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        
        {/* Savings Fund Card */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '14px 12px',
          gridColumn: 'span 2'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PiggyBank size={16} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, opacity: 0.9 }}>🐷 Fondo de Ahorro Casa</span>
            </div>
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowRightLeft size={12} /> Transferir
              </button>
            )}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, margin: '8px 0 2px 0', letterSpacing: '-0.02em' }}>
            {formatCurrency(savingsFund, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.85, fontWeight: 600 }}>
            Reserva acumulada de ahorros del hogar
          </div>
        </div>

      </div>

    </div>
  );
};
