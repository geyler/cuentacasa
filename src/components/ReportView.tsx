'use client';

import React, { useState } from 'react';
import { Transaction, ReportFilter, ReportPeriod } from '@/types';
import { 
  filterTransactionsByPeriod, 
  calculateFinancialSummary, 
  getPeriodLabel, 
  formatCurrency 
} from '@/lib/invoice';
import { 
  Printer, 
  Calendar, 
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface ReportViewProps {
  transactions: Transaction[];
  currency?: string;
  showBalance?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ 
  transactions, 
  currency = '$',
  showBalance = true 
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('mensual');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');

  const filter: ReportFilter = {
    period,
    startDate: period === 'personalizado' ? startDate : undefined,
    endDate: period === 'personalizado' ? endDate : undefined,
    category: categoryFilter
  };

  const periodTransactions = filterTransactionsByPeriod(transactions, filter);
  const summary = calculateFinancialSummary(periodTransactions);
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Date Range Selector Header */}
      <div className="md-card no-print" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} color="var(--md-sys-color-primary)" />
            <span>Resumen por Fecha</span>
          </h3>

          <button
            onClick={handlePrint}
            className="md-btn md-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Printer size={15} />
            <span>Imprimir Resumen</span>
          </button>
        </div>

        {/* Period Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {[
            { id: 'mensual', label: 'Este Mes' },
            { id: 'quincenal', label: 'Esta Quincena' },
            { id: 'semanal', label: 'Esta Semana' },
            { id: 'personalizado', label: 'Rango de Fechas' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as ReportPeriod)}
              style={{
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: period === item.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: period === item.id ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        {period === 'personalizado' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            backgroundColor: 'var(--md-sys-color-surface)',
            padding: '10px',
            borderRadius: '12px',
            marginBottom: '12px',
            border: '1px solid var(--md-sys-color-outline-variant)'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Desde:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Hasta:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        )}

        {/* Category Filter Dropdown */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--md-sys-color-on-surface-variant)" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              <option value="todas">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Printable / Clean View Box */}
      <div className="printable-report md-card" style={{ padding: '20px' }}>
        
        {/* Title & Subtitle */}
        <div style={{ borderBottom: '1px solid var(--md-sys-color-outline-variant)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            Movimientos ({getPeriodLabel(filter)})
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Total de {periodTransactions.length} registros encontrados en este rango
          </p>
        </div>

        {/* Summary Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-income-container)', color: 'var(--md-sys-color-on-income-container)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Total Ingresos</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: 'var(--md-sys-color-income)' }}>
              + {formatCurrency(summary.totalIncome, currency, showBalance)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-expense-container)', color: 'var(--md-sys-color-on-expense-container)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Total Gastos</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: 'var(--md-sys-color-expense)' }}>
              - {formatCurrency(summary.totalExpense, currency, showBalance)}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface-container-high)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>Saldo del Rango</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: summary.netBalance >= 0 ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)' }}>
              {formatCurrency(summary.netBalance, currency, showBalance)}
            </div>
          </div>
        </div>

        {/* Transaction List for Range */}
        {periodTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.88rem' }}>
            No hay gastos ni ingresos en las fechas seleccionadas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {periodTransactions.map(tx => {
              const isIncome = tx.type === 'ingreso';

              return (
                <div key={tx.id} style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isIncome ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-expense-container)',
                      color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                        {tx.concept}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {tx.date} • {tx.category} {tx.notes && `• ${tx.notes}`}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)'
                  }}>
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency, showBalance)}
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
