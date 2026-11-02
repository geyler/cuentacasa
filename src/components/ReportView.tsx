'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, StoreShiftRecord, StoreProduct, StoreSaleRecord } from '@/types';
import { 
  getStoreShifts, 
  getStoreProducts, 
  getStoreSales, 
  getCurrencySettings, 
  getStoreModulesConfig,
  StoreModulesConfig,
  DEFAULT_EXCHANGE_RATE_USD 
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { formatDateTime } from '@/lib/dateUtils';
import { StoreBrandDisplay } from '@/components/common/StoreBrandDisplay';
import { 
  Printer, 
  Calendar, 
  Filter,
  FileSpreadsheet,
  Clock,
  Package,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ReportViewProps {
  transactions?: Transaction[];
  currency?: string;
  showBalance?: boolean;
  onSelectTransaction?: (tx: Transaction) => void;
}

export type IpvPeriod = 'hoy' | 'semana' | 'quincena_1' | 'quincena_2' | 'mes' | 'personalizado';

export const ReportView: React.FC<ReportViewProps> = ({ 
  currency = '$'
}) => {
  const [period, setPeriod] = useState<IpvPeriod>('hoy');
  const [customDate, setCustomDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [shifts, setShifts] = useState<StoreShiftRecord[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [sales, setSales] = useState<StoreSaleRecord[]>([]);
  const [selectedShiftForTicket, setSelectedShiftForTicket] = useState<StoreShiftRecord | null>(null);
  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => getStoreModulesConfig());

  useEffect(() => {
    setShifts(getStoreShifts());
    setProducts(getStoreProducts());
    setSales(getStoreSales());

    const handleModulesChanged = (e: any) => {
      setStoreModules(e?.detail || getStoreModulesConfig());
    };
    window.addEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
    return () => window.removeEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
  }, []);

  // Compute Period Range Boundaries (Timestamps in ms)
  const getPeriodTimeRange = (): { startMs: number; endMs: number; label: string } => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (period === 'hoy') {
      const start = new Date(currentYear, currentMonth, now.getDate(), 0, 0, 0).getTime();
      const end = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: 'Hoy' };
    }

    if (period === 'semana') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const start = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0).getTime();
      const end = now.getTime();
      return { startMs: start, endMs: end, label: 'Últimos 7 días' };
    }

    if (period === 'quincena_1') {
      const start = new Date(currentYear, currentMonth, 1, 0, 0, 0).getTime();
      const end = new Date(currentYear, currentMonth, 15, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: '1ª Quincena (Días 1 al 15)' };
    }

    if (period === 'quincena_2') {
      const start = new Date(currentYear, currentMonth, 16, 0, 0, 0).getTime();
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: '2ª Quincena (Días 16 al Fin)' };
    }

    if (period === 'mes') {
      const start = new Date(currentYear, currentMonth, 1, 0, 0, 0).getTime();
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = new Date(currentYear, currentMonth, lastDayOfMonth, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: `Este Mes (${now.toLocaleString('es-ES', { month: 'long' })})` };
    }

    // Personalizado / Día Específico
    if (customDate) {
      const [y, m, d] = customDate.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0).getTime();
      const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: `Día Específico (${customDate})` };
    }

    if (startDate && endDate) {
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd, 0, 0, 0).getTime();
      const end = new Date(ey, em - 1, ed, 23, 59, 59, 999).getTime();
      return { startMs: start, endMs: end, label: `Del ${startDate} al ${endDate}` };
    }

    // Default Fallback
    const start = new Date(currentYear, currentMonth, now.getDate(), 0, 0, 0).getTime();
    const end = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59, 999).getTime();
    return { startMs: start, endMs: end, label: 'Hoy' };
  };

  const timeRange = getPeriodTimeRange();

  // Filter Sales in Period
  const filteredSales = sales.filter(s => s.timestamp >= timeRange.startMs && s.timestamp <= timeRange.endMs);
  
  // Filter Shifts in Period
  const filteredShifts = shifts.filter(s => s.openedAt >= timeRange.startMs && s.openedAt <= timeRange.endMs);

  const currSettings = typeof window !== 'undefined'
    ? getCurrencySettings()
    : { currencyMode: 'CUP' as const, exchangeRateUSD: DEFAULT_EXCHANGE_RATE_USD, usdIndexedPricing: false };
  const activeRate = currSettings.exchangeRateUSD || DEFAULT_EXCHANGE_RATE_USD;

  // Aggregate Product Sales Data (strictly segregation by currency: what was sold in CUP and what was sold in USD)
  interface ProductAggregation {
    id: string;
    name: string;
    barcode: string;
    stock: number;
    priceCUP: number;
    priceUSD: number;
    baseCurrency: 'CUP' | 'USD';
    unitsSold: number;
    totalAmountCUP: number;
    totalAmountUSD: number;
  }

  const productAggregationMap: Record<string, ProductAggregation> = {};

  // Initialize with all products
  products.forEach(p => {
    const isUSD = p.currency === 'USD';
    const priceCUP = isUSD
      ? (typeof p.price === 'number' && p.price > 0 ? Math.round(p.price * activeRate) : 0)
      : (p.price || 0);
    const priceUSD = isUSD
      ? (p.price || 0)
      : (typeof p.priceUSD === 'number' && p.priceUSD > 0 ? p.priceUSD : Number(((p.price || 0) / activeRate).toFixed(2)));

    productAggregationMap[p.id] = {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      stock: p.stock,
      priceCUP,
      priceUSD,
      baseCurrency: isUSD ? 'USD' : 'CUP',
      unitsSold: 0,
      totalAmountCUP: 0,
      totalAmountUSD: 0
    };
  });

  // Accumulate from sales without artificial exchange-rate cross conversions
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const itemCurr = item.currency || (sale.currency === 'USD' ? 'USD' : 'CUP');
      const isUSD = itemCurr === 'USD';
      const sub = typeof item.subtotal === 'number' ? item.subtotal : (item.unitPrice * item.quantity);

      if (productAggregationMap[item.productId]) {
        productAggregationMap[item.productId].unitsSold += item.quantity;
        if (isUSD) {
          productAggregationMap[item.productId].totalAmountUSD += sub;
        } else {
          productAggregationMap[item.productId].totalAmountCUP += sub;
        }
      } else {
        productAggregationMap[item.productId] = {
          id: item.productId,
          name: item.name,
          barcode: item.barcode,
          stock: 0,
          priceCUP: isUSD ? Math.round(item.unitPrice * activeRate) : item.unitPrice,
          priceUSD: isUSD ? item.unitPrice : Number((item.unitPrice / activeRate).toFixed(2)),
          baseCurrency: isUSD ? 'USD' : 'CUP',
          unitsSold: item.quantity,
          totalAmountCUP: isUSD ? 0 : sub,
          totalAmountUSD: isUSD ? sub : 0
        };
      }
    });
  });

  const ipvRows = Object.values(productAggregationMap);
  const totalUnitsSold = ipvRows.reduce((acc, r) => acc + r.unitsSold, 0);
  const totalPeriodRevenueCUP = ipvRows.reduce((acc, r) => acc + r.totalAmountCUP, 0);
  const totalPeriodRevenueUSD = ipvRows.reduce((acc, r) => acc + r.totalAmountUSD, 0);
  const totalCashDiff = filteredShifts.reduce((acc, s) => acc + (s.cashDifference || 0), 0);
  const totalCashDiffUSD = filteredShifts.reduce((acc, s) => acc + (s.cashDifferenceUSD || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Date & Period Selection Header */}
      <div className="no-print" style={{ padding: '4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileSpreadsheet size={20} color="var(--md-sys-color-primary)" />
              <span>Historial IPV e Informes de Cierre</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              Control de Inventario, Producto y Ventas (IPV) por periodo
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="md-btn md-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 800 }}
          >
            <Printer size={16} />
            <span>Imprimir Reporte IPV</span>
          </button>
        </div>

        {/* Period Chips Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {[
            { id: 'hoy', label: '📅 Hoy' },
            { id: 'semana', label: '📊 Esta Semana' },
            { id: 'quincena_1', label: '🌓 1ª Quincena (1-15)' },
            { id: 'quincena_2', label: '🌕 2ª Quincena (16-Fin)' },
            { id: 'mes', label: '📆 Este Mes' },
            { id: 'personalizado', label: '🔍 Día / Fecha Específica' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setPeriod(item.id as IpvPeriod);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                backgroundColor: period === item.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                color: period === item.id ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Datepicker Controls */}
        {period === 'personalizado' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            padding: '14px',
            borderRadius: '16px',
            marginBottom: '12px',
            border: '1px solid var(--md-sys-color-outline-variant)'
          }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Ver Día Específico:
              </label>
              <input
                type="date"
                value={customDate}
                onChange={e => { setCustomDate(e.target.value); setStartDate(''); setEndDate(''); }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                O Desde Rango:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCustomDate(''); }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, display: 'block', marginBottom: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Hasta Rango:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCustomDate(''); }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards Row for Selected Range */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '10px'
      }}>
        {/* Card 1: Ventas Totales por Moneda */}
        <div style={{
          padding: '16px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>🛍️ Ventas Totales</span>
          {currSettings.currencyMode === 'BOTH' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0 4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  CUP
                </span>
                <span className="tabular-nums" style={{ fontSize: '1.18rem', fontWeight: 900, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                  ${totalPeriodRevenueCUP.toLocaleString()}
                </span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'currentColor', opacity: 0.08 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284C7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7', display: 'inline-block' }} />
                  USD
                </span>
                <span className="tabular-nums" style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0284C7', fontVariantNumeric: 'tabular-nums' }}>
                  US$ {totalPeriodRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '1.45rem', fontWeight: 900, margin: '6px 0 2px 0', color: 'var(--md-sys-color-on-surface)' }}>
              {currSettings.currencyMode === 'USD'
                ? `US$ ${totalPeriodRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${totalPeriodRevenueCUP.toLocaleString()}`}
            </div>
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
            {filteredSales.length} {filteredSales.length === 1 ? 'venta realizada' : 'ventas realizadas'}
          </span>
        </div>

        {/* Card 2: Unidades Vendidas */}
        <div style={{
          padding: '16px 14px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>📦 Unidades Vendidas</span>
          <div style={{ fontSize: '1.55rem', fontWeight: 900, margin: '4px 0 2px 0', color: 'var(--brand-primary, #1A73E8)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span>{totalUnitsSold}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, opacity: 0.85 }}>unidades</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
            en <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{ipvRows.filter(r => r.unitsSold > 0).length}</strong> de {products.length} artículos
          </span>
        </div>

        {/* Card 3: Cierres de Turno (Solo si la gestión de turnos está activa) */}
        {storeModules.enableShiftManagement && (
          <div style={{
            padding: '16px 14px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>📋 Cierres de Turno</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, margin: '6px 0 2px 0', color: 'var(--md-sys-color-on-surface)' }}>
              {filteredShifts.length}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              Arqueos registrados
            </span>
          </div>
        )}

        {/* Card 4: Balance Cuadre (Solo si la gestión de turnos está activa) */}
        {storeModules.enableShiftManagement && (
          <div style={{
            padding: '16px 14px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>⚖️ Balance Cuadre</span>
            {currSettings.currencyMode === 'BOTH' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#15803D' }}>• CUP</span>
                  <span className="tabular-nums" style={{ fontSize: '1.05rem', fontWeight: 900, color: totalCashDiff >= 0 ? '#15803D' : '#991B1B' }}>
                    ${totalCashDiff.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: '1px', backgroundColor: 'currentColor', opacity: 0.08 }} />
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px' }}>
                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284C7' }}>• USD</span>
                  <span className="tabular-nums" style={{ fontSize: '1.02rem', fontWeight: 900, color: totalCashDiffUSD >= 0 ? '#0284C7' : '#991B1B' }}>
                    US$ {totalCashDiffUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: totalCashDiff >= 0 ? '#15803D' : '#991B1B' }}>
                {currSettings.currencyMode === 'USD'
                  ? `US$ ${totalCashDiffUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `$${totalCashDiff.toLocaleString()}`}
              </div>
            )}
            <span style={{ fontSize: '0.66rem', color: (totalCashDiff >= 0 && totalCashDiffUSD >= 0) ? '#15803D' : '#991B1B', fontWeight: 700, marginTop: '4px', display: 'block' }}>
              {totalCashDiff === 0 && totalCashDiffUSD === 0 ? 'Exacto sin faltantes' : (totalCashDiff > 0 || totalCashDiffUSD > 0) ? 'Sobrante en caja' : 'Faltante en caja'}
            </span>
          </div>
        )}

        {/* Card alternativa si NO hay turnos: Cobertura de Productos con Venta */}
        {!storeModules.enableShiftManagement && (
          <div style={{
            padding: '16px 14px',
            borderRadius: '16px',
            backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>📊 Artículos con Movimiento</span>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, margin: '6px 0 2px 0', color: 'var(--md-sys-color-on-surface)' }}>
              {ipvRows.filter(r => r.unitsSold > 0).length} / {products.length}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
              Productos activos con venta
            </span>
          </div>
        )}
      </div>

      {/* Printable IPV Ticket / Full Report Box */}
      <div className="printable-report" style={{
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        padding: '16px',
        borderRadius: '18px',
        border: '1.5px solid #CBD5E1',
        fontFamily: 'monospace, sans-serif',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
      }}>
        {/* Ticket Header */}
        <div style={{ textAlign: 'center', borderBottom: '1.5px dashed #0F172A', paddingBottom: '12px', marginBottom: '12px' }}>
          <StoreBrandDisplay align="center" size="md" textColor="var(--md-sys-color-primary)" style={{ marginBottom: '6px' }} />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '2px 0 0 0', letterSpacing: '0.02em', textTransform: 'uppercase', color: '#0F172A' }}>
            === INFORME CONSOLIDADO IPV ===
          </h2>
          <p style={{ fontSize: '0.72rem', color: '#475569', margin: '4px 0 0 0', fontWeight: 700 }}>
            Rango: {timeRange.label}
          </p>
        </div>

        {/* Tabular Inventory & Sales Breakdown (Scroll Horizontal for Mobile) */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left', fontFamily: 'monospace' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1.5px solid #0F172A' }}>
                <th style={{ padding: '8px 6px', fontWeight: 900 }}>Producto</th>
                <th style={{ padding: '8px 6px', fontWeight: 900 }}>SKU / Código</th>
                <th style={{ padding: '8px 4px', fontWeight: 900, textAlign: 'center' }}>Vendidas</th>
                <th style={{ padding: '8px 4px', fontWeight: 900, textAlign: 'center' }}>Stock Actual</th>
                <th style={{ padding: '8px 6px', fontWeight: 900, textAlign: 'right' }}>Precio</th>
                <th style={{ padding: '8px 6px', fontWeight: 900, textAlign: 'right' }}>Importe Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const isBothMode = currSettings.currencyMode === 'BOTH';

                return (
                  <>
                    {ipvRows.map((r, idx) => {
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px dashed #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '6px 6px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={r.name}>
                            {r.name}
                          </td>
                          <td style={{ padding: '6px 6px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                            #{r.barcode}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            {r.unitsSold > 0 ? (
                              <span style={{
                                fontSize: '0.96rem',
                                fontWeight: 900,
                                color: '#1E1B4B',
                                backgroundColor: '#EEF2FF',
                                padding: '4px 9px',
                                borderRadius: '8px',
                                border: '1.5px solid #C7D2FE',
                                display: 'inline-block'
                              }}>
                                {r.unitsSold} u
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                                0 u
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              color: r.stock <= 2 ? '#B91C1C' : '#1E293B',
                              backgroundColor: r.stock <= 2 ? '#FEE2E2' : '#F1F5F9',
                              padding: '3px 8px',
                              borderRadius: '7px',
                              border: `1px solid ${r.stock <= 2 ? '#FCA5A5' : '#CBD5E1'}`,
                              display: 'inline-block'
                            }}>
                              {r.stock} u
                            </span>
                          </td>
                          <td className="tabular-nums" style={{ padding: '6px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {currSettings.currencyMode === 'USD' ? (
                              <span style={{ color: '#0284C7', fontWeight: 800 }}>
                                US$ {r.priceUSD.toFixed(2)} USD
                              </span>
                            ) : currSettings.currencyMode === 'CUP' ? (
                              <span style={{ color: '#059669', fontWeight: 800 }}>
                                ${r.priceCUP.toLocaleString()} CUP
                              </span>
                            ) : (
                              <>
                                {r.baseCurrency === 'USD' ? (
                                  <>
                                    <span style={{ color: '#0284C7', fontWeight: 800, display: 'block' }}>
                                      US$ {r.priceUSD.toFixed(2)} USD
                                    </span>
                                    <span style={{ fontSize: '0.62rem', color: '#059669', display: 'block' }}>
                                      ${r.priceCUP.toLocaleString()} CUP
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ color: '#059669', fontWeight: 800, display: 'block' }}>
                                      ${r.priceCUP.toLocaleString()} CUP
                                    </span>
                                    {r.priceUSD > 0 && (
                                      <span style={{ fontSize: '0.62rem', color: '#0284C7', display: 'block' }}>
                                        US$ {r.priceUSD.toFixed(2)} USD
                                      </span>
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </td>
                          <td className="tabular-nums" style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                            {currSettings.currencyMode === 'USD' ? (
                              <span style={{ color: r.totalAmountUSD > 0 ? '#0284C7' : '#94A3B8' }}>
                                US$ {r.totalAmountUSD.toFixed(2)} USD
                              </span>
                            ) : currSettings.currencyMode === 'CUP' ? (
                              <span style={{ color: r.totalAmountCUP > 0 ? '#059669' : '#94A3B8' }}>
                                ${r.totalAmountCUP.toLocaleString()} CUP
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'flex-end' }}>
                                <span style={{ color: r.totalAmountCUP > 0 ? '#059669' : '#94A3B8', fontSize: '0.74rem' }}>
                                  ${r.totalAmountCUP.toLocaleString()} CUP
                                </span>
                                <span style={{ color: r.totalAmountUSD > 0 ? '#0284C7' : '#94A3B8', fontSize: '0.68rem', fontWeight: 800 }}>
                                  US$ {r.totalAmountUSD.toFixed(2)} USD
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Totals Row */}
                    <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #0F172A', borderBottom: '2px solid #0F172A', fontWeight: 900 }}>
                      <td colSpan={2} style={{ padding: '10px 6px', fontSize: '0.8rem', color: '#0F172A', fontWeight: 900 }}>
                        TOTALES ACUMULADOS EN PERIODO
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 4px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{
                          fontSize: '0.96rem',
                          fontWeight: 900,
                          color: '#1E1B4B',
                          backgroundColor: '#E0E7FF',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #A5B4FC',
                          display: 'inline-block'
                        }}>
                          {totalUnitsSold} u
                        </span>
                      </td>
                      <td style={{ padding: '8px 4px' }}></td>
                      <td style={{ padding: '8px 6px' }}></td>
                      <td className="tabular-nums" style={{ padding: '8px 6px', textAlign: 'right', fontSize: '0.82rem', color: '#0F172A', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {currSettings.currencyMode === 'USD' ? (
                          <span style={{ color: '#0284C7' }}>
                            US$ {totalPeriodRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        ) : currSettings.currencyMode === 'CUP' ? (
                          <span style={{ color: '#059669' }}>
                            ${totalPeriodRevenueCUP.toLocaleString()} CUP
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                            <span style={{ color: '#059669', fontSize: '0.82rem' }}>
                              ${totalPeriodRevenueCUP.toLocaleString()} CUP
                            </span>
                            <span style={{ color: '#0284C7', fontSize: '0.75rem', fontWeight: 900 }}>
                              US$ {totalPeriodRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Detailed Turno Cierres List inside the Period (Solo si la gestión de turnos está activa) */}
        {storeModules.enableShiftManagement && (
          <div style={{ marginTop: '24px', borderTop: '1.5px dashed #0F172A', paddingTop: '14px' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
              📜 Turnos y Cierres de Caja Registrados en este Periodo ({filteredShifts.length})
            </h3>

            {filteredShifts.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', padding: '10px 0' }}>
                No se registraron cierres de turno en el periodo seleccionado.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredShifts.map(s => (
                  <div 
                    key={s.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--md-sys-color-surface-container)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface)' }}>👤 Vendedor: {s.sellerName} (@{s.sellerUsername})</strong>
                        <div style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.7rem', marginTop: '2px' }}>
                          Abierto: {formatDateTime(s.openedAt)} 
                          {s.closedAt && ` • Cerrado: ${formatDateTime(s.closedAt)}`}
                        </div>
                      </div>

                      <span style={{
                        fontWeight: 900,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: s.status === 'cerrado' ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-income-container)',
                        color: s.status === 'cerrado' ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-income-container)',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', backgroundColor: 'var(--md-sys-color-surface)', padding: '8px', borderRadius: '8px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.68rem', display: 'block' }}>Efectivo Resp.</span>
                        <div style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>${s.expectedCashInRegister} CUP</div>
                        {(currSettings.currencyMode === 'BOTH' || (s.expectedCashInRegisterUSD || 0) > 0) && (
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7' }}>US$ {s.expectedCashInRegisterUSD || 0} USD</div>
                        )}
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.68rem', display: 'block' }}>Efectivo Entregado</span>
                        <div style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>${s.realCashInRegister || 0} CUP</div>
                        {(currSettings.currencyMode === 'BOTH' || (s.realCashInRegisterUSD || 0) > 0) && (
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7' }}>US$ {s.realCashInRegisterUSD || 0} USD</div>
                        )}
                      </div>
                      <div>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.68rem', display: 'block' }}>Diferencia</span>
                        <div style={{ fontWeight: 900, color: (s.cashDifference || 0) >= 0 ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)' }}>
                          ${s.cashDifference || 0} CUP
                        </div>
                        {(currSettings.currencyMode === 'BOTH' || (s.cashDifferenceUSD !== undefined && s.cashDifferenceUSD !== 0)) && (
                          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: (s.cashDifferenceUSD || 0) >= 0 ? '#0284C7' : 'var(--md-sys-color-expense)' }}>
                            US$ {s.cashDifferenceUSD || 0} USD
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
