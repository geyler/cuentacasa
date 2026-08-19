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
  Filter
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Period Filter Selector Card */}
      <div className="md-card no-print">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--md-sys-color-primary)" />
          <span>Generar Factura / Estado Contable</span>
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'mensual', label: 'Mensual' },
            { id: 'quincenal', label: 'Quincenal' },
            { id: 'semanal', label: 'Semanal' },
            { id: 'personalizado', label: 'Rango Personalizado' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as ReportPeriod)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.85rem',
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

        {/* Custom Date Range Inputs */}
        {period === 'personalizado' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--md-sys-color-surface)',
            padding: '12px',
            borderRadius: '14px',
            marginBottom: '16px',
            border: '1px solid var(--md-sys-color-outline-variant)'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Desde Fecha:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Hasta Fecha:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>
          </div>
        )}

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <option value="todas">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="md-btn md-btn-primary"
          >
            <Printer size={18} />
            <span>Imprimir / Exportar Factura PDF</span>
          </button>
        </div>

      </div>

      {/* Printable Invoice Container */}
      <div className="printable-report md-card" style={{
        backgroundColor: '#FFFFFF',
        color: '#111827',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        boxShadow: 'var(--md-shadow-elevation-2)'
      }}>
        
        {/* Invoice Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #E5E7EB',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00639B' }}>
              CUENTA CASA - ESTADO DE CUENTA Y FACTURA
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '2px', fontWeight: 600 }}>
              {getPeriodLabel(filter)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>Emisión:</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827' }}>
              {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: '#E6F4EA',
              color: '#00875A',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              DOCUMENTO CONTABLE VERIFICADO
            </span>
          </div>
        </div>

        {/* Invoice Metric Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 700 }}>Total Ingresos (+)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00875A', marginTop: '4px' }}>
              {formatCurrency(summary.totalIncome, currency, showBalance)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 700 }}>Total Gastos (-)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D32F2F', marginTop: '4px' }}>
              {formatCurrency(summary.totalExpense, currency, showBalance)}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: summary.netBalance >= 0 ? '#E6F4EA' : '#FCE8E6', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 700 }}>Saldo Neto Periodo</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: summary.netBalance >= 0 ? '#00875A' : '#D32F2F', marginTop: '4px' }}>
              {formatCurrency(summary.netBalance, currency, showBalance)}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
          Desglose Detallado de Entradas y Salidas ({periodTransactions.length} partidas)
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', textAlign: 'left', fontSize: '0.8rem', color: '#374151' }}>
              <th style={{ padding: '10px 8px' }}>Fecha</th>
              <th style={{ padding: '10px 8px' }}>Tipo</th>
              <th style={{ padding: '10px 8px' }}>Concepto</th>
              <th style={{ padding: '10px 8px' }}>Categoría</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {periodTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                  Sin registros para este periodo.
                </td>
              </tr>
            ) : (
              periodTransactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: '#4B5563' }}>{tx.date}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: tx.type === 'ingreso' ? '#E6F4EA' : '#FCE8E6',
                      color: tx.type === 'ingreso' ? '#00875A' : '#D32F2F'
                    }}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#111827' }}>
                    {tx.concept}
                    {tx.notes && <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 400 }}>{tx.notes}</div>}
                  </td>
                  <td style={{ padding: '8px', color: '#4B5563' }}>{tx.category}</td>
                  <td style={{
                    padding: '8px',
                    textAlign: 'right',
                    fontWeight: 800,
                    color: tx.type === 'ingreso' ? '#00875A' : '#D32F2F'
                  }}>
                    {tx.type === 'ingreso' ? '+' : '-'} {formatCurrency(tx.amount, currency, showBalance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Attached Photos Overview */}
        {periodTransactions.some(t => t.photoUrl) && (
          <div style={{ marginTop: '16px', borderTop: '2px solid #E5E7EB', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: '#111827' }}>
              Galería de Comprobantes y Fotos Adjuntas
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {periodTransactions.filter(t => t.photoUrl).map(tx => (
                <div key={tx.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', padding: '4px', backgroundColor: '#F9FAFB' }}>
                  <img src={tx.photoUrl} alt={tx.concept} style={{ width: '100%', height: '75px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, marginTop: '2px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tx.concept}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#6B7280' }}>
                    {formatCurrency(tx.amount, currency, showBalance)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice Footer */}
        <div style={{
          marginTop: '24px',
          borderTop: '1px solid #E5E7EB',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#6B7280'
        }}>
          <div>Cuenta Casa • Sistema de Control Contable Residencial PWA</div>
          <div>Generado automáticamente offline</div>
        </div>

      </div>

    </div>
  );
};
