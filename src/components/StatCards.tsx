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

  // Función para escalar tipografía de forma inteligente según la cantidad de dígitos (ideal para mipymes con millones)
  const getAmountFontSize = (text: string, isSingle: boolean = false): string => {
    const len = text.length;
    if (isSingle) {
      if (len > 18) return '1.05rem';
      if (len > 14) return '1.20rem';
      if (len > 11) return '1.32rem';
      return '1.45rem';
    }
    // Filas de paridad CUP / USD (ambas monedas activas)
    if (len > 18) return '0.78rem';
    if (len > 15) return '0.86rem';
    if (len > 12) return '0.96rem';
    return '1.10rem';
  };

  // Equal Parity Render Helper (100% full-width on single mode, 50/50 side-by-side grid on BOTH)
  const renderValueBlock = (
    valCUP: number, 
    valUSD: number, 
    colorCUP: string = 'var(--md-sys-color-on-surface, #0F172A)', 
    colorUSD: string = '#0D9488',
    prefix: string = ''
  ) => {
    const cupFormatted = `${prefix}${formatCurrency(valCUP, 'CUP', showBalance)}`;
    const usdFormatted = `${prefix}${formatCurrency(valUSD, 'USD', showBalance)}`;

    if (currencyMode === 'CUP') {
      return (
        <div 
          className="tabular-nums" 
          title={cupFormatted}
          style={{ 
            fontSize: getAmountFontSize(cupFormatted, true), 
            fontWeight: 900, 
            color: colorCUP, 
            letterSpacing: '-0.025em', 
            margin: '6px 0 2px 0', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 0
          }}
        >
          {cupFormatted}
        </div>
      );
    }

    if (currencyMode === 'USD') {
      return (
        <div 
          className="tabular-nums" 
          title={usdFormatted}
          style={{ 
            fontSize: getAmountFontSize(usdFormatted, true), 
            fontWeight: 900, 
            color: colorUSD, 
            letterSpacing: '-0.025em', 
            margin: '6px 0 2px 0', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 0
          }}
        >
          {usdFormatted}
        </div>
      );
    }

    // BOTH Mode: Clean, typographic fintech rows without nested box clutter
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        margin: '6px 0 4px 0',
        minWidth: 0,
        overflow: 'hidden'
      }}>
        {/* CUP Line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '2px 0',
          minWidth: 0
        }}>
          <span style={{
            fontSize: '0.67rem',
            fontWeight: 800,
            color: '#059669',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'inline-block'
            }} />
            CUP
          </span>
          <span 
            className="tabular-nums" 
            title={cupFormatted}
            style={{
              fontSize: getAmountFontSize(cupFormatted, false),
              fontWeight: 900,
              color: colorCUP,
              whiteSpace: 'nowrap',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'right',
              flexShrink: 1
            }}
          >
            {cupFormatted}
          </span>
        </div>

        {/* Ultra-subtle hairline divider */}
        <div style={{
          height: '1px',
          backgroundColor: 'currentColor',
          opacity: 0.09,
          margin: '1px 0'
        }} />

        {/* USD Line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '2px 0',
          minWidth: 0
        }}>
          <span style={{
            fontSize: '0.67rem',
            fontWeight: 800,
            color: '#0284C7',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#0284C7',
              display: 'inline-block'
            }} />
            USD
          </span>
          <span 
            className="tabular-nums" 
            title={usdFormatted}
            style={{
              fontSize: getAmountFontSize(usdFormatted, false),
              fontWeight: 800,
              color: colorUSD,
              whiteSpace: 'nowrap',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'right',
              flexShrink: 1
            }}
          >
            {usdFormatted}
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
        gap: '12px'
      }}>
        {/* Total Income Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Ingresos</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={16} color="#059669" />
            </div>
          </div>
          {renderValueBlock(summary.totalIncome, summary.totalIncomeUSD || 0, '#059669', '#059669', '+ ')}
          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.85, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Pagos, ventas y salarios
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Gastos</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingDown size={16} color="#DC2626" />
            </div>
          </div>
          {renderValueBlock(summary.totalExpense, summary.totalExpenseUSD || 0, '#DC2626', '#DC2626', '- ')}
          <div style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.85, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Gastos de hogar y compras
          </div>
        </div>
      </div>

      {/* Row 2: Saldo Neto Casa & Fondo Tienda Side-by-Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {/* Balance Card - Fondo de la Casa */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🏡 Fondo de la Casa</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={16} color="var(--brand-primary, #1A73E8)" />
            </div>
          </div>
          {renderValueBlock(summary.netBalance, summary.netBalanceUSD || 0, 'var(--md-sys-color-on-surface, #0F172A)', '#0D9488')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Saldo USD' : 'Saldo CUP')}
            </span>
          </div>
        </div>

        {/* Store Fund Card (Fondo del Negocio) */}
        <div className="md-card" style={{
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🏬 Fondo del Negocio</span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: '#F0FDFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Store size={16} color="#0D9488" />
            </div>
          </div>
          {renderValueBlock(storeFund, storeFundUSD, 'var(--md-sys-color-on-surface, #0F172A)', '#0D9488')}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>
              {currencyMode === 'BOTH' ? 'Paridad CUP / USD' : (currencyMode === 'USD' ? 'Fondo USD' : 'Fondo CUP')}
            </span>
            {onOpenTransfer && (
              <button
                type="button"
                onClick={onOpenTransfer}
                style={{
                  backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                  border: '1px solid var(--brand-primary-border, #BFDBFE)',
                  color: 'var(--brand-primary, #1A73E8)',
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  flexShrink: 0
                }}
              >
                <ArrowRightLeft size={10} /> Mover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prominent Quick Transfer Action Banner */}
      {onOpenTransfer && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          border: '1.5px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Transferir Fondos entre Cuentas
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                Mover saldos entre Casa y Negocio / Tienda en CUP o USD
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTransfer}
            className="md-btn md-btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--brand-primary) 30%, transparent)'
            }}
          >
            <ArrowRightLeft size={16} />
            <span>Transferir Dinero</span>
          </button>
        </div>
      )}

    </div>
  );
};
