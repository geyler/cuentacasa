'use client';

import React from 'react';
import { FinancialSummary } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, PieChart } from 'lucide-react';

interface StatCardsProps {
  summary: FinancialSummary;
  currency?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({ summary, currency = '$' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Primary Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '14px 0 6px 0', letterSpacing: '-0.02em' }}>
            {formatCurrency(summary.netBalance, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            Total acumulado de entradas - salidas
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
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '14px 0 6px 0', color: 'var(--md-sys-color-income)' }}>
            + {formatCurrency(summary.totalIncome, currency)}
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
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '14px 0 6px 0', color: 'var(--md-sys-color-expense)' }}>
            - {formatCurrency(summary.totalExpense, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            Comida, pan, arroz, servicios, etc.
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="md-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)' }}>
              % Tasa de Ahorro
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PiggyBank size={20} color="var(--md-sys-color-primary)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '14px 0 6px 0', color: 'var(--md-sys-color-on-surface)' }}>
            {summary.savingsRate}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            {summary.savingsRate >= 0 ? 'Retenido como fondo de casa' : 'Deficit contable acumulado'}
          </div>
        </div>

      </div>

      {/* Expense Category Breakdown Chart */}
      <div className="md-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <PieChart size={22} color="var(--md-sys-color-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
            Distribución de Gastos por Categoría
          </h3>
        </div>

        {Object.keys(summary.categoryBreakdown).length === 0 ? (
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.9rem' }}>
            No hay gastos registrados en el periodo seleccionado.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(summary.categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => {
                const percentage = summary.totalExpense > 0 
                  ? Math.round((amount / summary.totalExpense) * 100) 
                  : 0;

                return (
                  <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--md-sys-color-on-surface)' }}>{category}</span>
                      <span style={{ color: 'var(--md-sys-color-expense)' }}>
                        {formatCurrency(amount, currency)} ({percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: 'var(--md-sys-color-expense)',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }} />
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
