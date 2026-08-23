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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Primary Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        
        {/* Balance Card */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #004B77 100%)',
          color: '#FFFFFF',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>Saldo Neto Casa</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '14px 0 6px 0', letterSpacing: '-0.02em' }}>
            {formatCurrency(summary.netBalance, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            Presupuesto disponible en Cuenta Casa
          </div>
        </div>

        {/* Total Income Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-income-container)',
          color: 'var(--md-sys-color-on-income-container)',
          borderColor: 'rgba(0, 135, 90, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total Ingresos</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 135, 90, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} color="var(--md-sys-color-income)" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '14px 0 6px 0', color: 'var(--md-sys-color-income)' }}>
            + {formatCurrency(summary.totalIncome, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            Pagos por webs, ventas y salarios
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-expense-container)',
          color: 'var(--md-sys-color-on-expense-container)',
          borderColor: 'rgba(211, 47, 47, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Total Gastos</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(211, 47, 47, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingDown size={20} color="var(--md-sys-color-expense)" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '14px 0 6px 0', color: 'var(--md-sys-color-expense)' }}>
            - {formatCurrency(summary.totalExpense, currency, showBalance)}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            Comida, pan, arroz, servicios, etc.
          </div>
        </div>

      </div>

      {/* Secondary Funds Grid: Savings & Store Fund */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        
        {/* Savings Fund Card */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
          color: '#FFFFFF',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>Fondo de Ahorro Casa</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '12px 0 6px 0', letterSpacing: '-0.02em' }}>
            {formatCurrency(savingsFund, currency, showBalance)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>Reserva acumulada</span>
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
        </div>

        {/* Store Fund Card */}
        <div className="md-card" style={{
          background: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
          color: '#FFFFFF',
          border: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.9 }}>Fondo Tienda (Caja)</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '12px 0 6px 0', letterSpacing: '-0.02em' }}>
            {formatCurrency(storeFund, currency, showBalance)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>Efectivo del negocio</span>
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
        </div>

      </div>

    </div>
  );
};
