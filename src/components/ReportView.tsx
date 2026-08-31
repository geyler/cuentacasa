'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, StoreShiftRecord, StoreProduct, StoreSaleRecord } from '@/types';
import { getStoreShifts, getStoreProducts, getStoreSales } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
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

  useEffect(() => {
    setShifts(getStoreShifts());
    setProducts(getStoreProducts());
    setSales(getStoreSales());
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

  // Aggregate Product Sales Data
  const productAggregationMap: Record<string, {
    id: string;
    name: string;
    barcode: string;
    stock: number;
    price: number;
    unitsSold: number;
    totalAmount: number;
  }> = {};

  // Initialize with all products
  products.forEach(p => {
    productAggregationMap[p.id] = {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      stock: p.stock,
      price: p.price,
      unitsSold: 0,
      totalAmount: 0
    };
  });

  // Accumulate from sales
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      if (productAggregationMap[item.productId]) {
        productAggregationMap[item.productId].unitsSold += item.quantity;
        productAggregationMap[item.productId].totalAmount += item.subtotal;
      } else {
        productAggregationMap[item.productId] = {
          id: item.productId,
          name: item.name,
          barcode: item.barcode,
          stock: 0,
          price: item.unitPrice,
          unitsSold: item.quantity,
          totalAmount: item.subtotal
        };
      }
    });
  });

  const ipvRows = Object.values(productAggregationMap);
  const totalUnitsSold = ipvRows.reduce((acc, r) => acc + r.unitsSold, 0);
  const totalPeriodRevenue = ipvRows.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalCashDiff = filteredShifts.reduce((acc, s) => acc + (s.cashDifference || 0), 0);

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px'
      }}>
        <div style={{ padding: '14px 12px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-income-container)', border: '1px solid rgba(0,135,90,0.2)' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-income-container)' }}>🛍️ Ventas Totales</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--md-sys-color-income)' }}>
            {formatCurrency(totalPeriodRevenue, 'CUP', true)}
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-income-container)', opacity: 0.8, fontWeight: 700 }}>
            {filteredSales.length} ventas realizadas
          </span>
        </div>

        <div style={{ padding: '14px 12px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>📦 Unidades Vendidas</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--md-sys-color-primary)' }}>
            {totalUnitsSold} u
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
            en {ipvRows.filter(r => r.unitsSold > 0).length} productos
          </span>
        </div>

        <div style={{ padding: '14px 12px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>📋 Cierres de Turno</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: 'var(--md-sys-color-on-surface)' }}>
            {filteredShifts.length}
          </div>
          <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
            Arqueos registrados
          </span>
        </div>

        <div style={{ padding: '14px 12px', borderRadius: '16px', backgroundColor: totalCashDiff >= 0 ? '#DCFCE7' : '#FEE2E2', border: `1px solid ${totalCashDiff >= 0 ? '#16A34A' : '#DC2626'}` }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: totalCashDiff >= 0 ? '#15803D' : '#991B1B' }}>⚖️ Balance Cuadre</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '4px', color: totalCashDiff >= 0 ? '#15803D' : '#991B1B' }}>
            {formatCurrency(totalCashDiff, 'CUP', true)}
          </div>
          <span style={{ fontSize: '0.66rem', color: totalCashDiff >= 0 ? '#15803D' : '#991B1B', fontWeight: 700 }}>
            {totalCashDiff === 0 ? 'Exacto sin faltantes' : totalCashDiff > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
          </span>
        </div>
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
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#0F172A' }}>
            === INFORME CONSOLIDADO IPV ===
          </h2>
          <p style={{ fontSize: '0.72rem', color: '#475569', margin: '4px 0 0 0', fontWeight: 700 }}>
            SAMY STORE • Rango: {timeRange.label}
          </p>
        </div>

        {/* Tabular Inventory & Sales Breakdown (Scroll Horizontal for Mobile) */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left', fontFamily: 'monospace' }}>
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
              {ipvRows.map((r, idx) => (
                <tr key={r.id} style={{ borderBottom: '1px dashed #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '6px 6px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} title={r.name}>
                    {r.name}
                  </td>
                  <td style={{ padding: '6px 6px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                    #{r.barcode}
                  </td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 900, color: r.unitsSold > 0 ? '#0F172A' : '#94A3B8' }}>
                    {r.unitsSold} u
                  </td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700 }}>
                    {r.stock} u
                  </td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                    ${r.price}
                  </td>
                  <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 900 }}>
                    ${r.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr style={{ backgroundColor: '#F1F5F9', borderTop: '2px solid #0F172A', borderBottom: '2px solid #0F172A', fontWeight: 900 }}>
                <td colSpan={2} style={{ padding: '8px 6px', fontSize: '0.74rem', color: '#0F172A' }}>
                  TOTALES ACUMULADOS EN PERIODO
                </td>
                <td style={{ padding: '8px 4px', textAlign: 'center', fontSize: '0.78rem', color: '#0F172A' }}>
                  {totalUnitsSold}u
                </td>
                <td style={{ padding: '8px 4px' }}></td>
                <td style={{ padding: '8px 6px' }}></td>
                <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '0.82rem', color: '#0F172A' }}>
                  ${totalPeriodRevenue.toLocaleString()} {currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed Turno Cierres List inside the Period */}
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
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.82rem' }}>Vendedor: {s.sellerName} (@{s.sellerUsername})</strong>
                      <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: '2px' }}>
                        Abierto: {new Date(s.openedAt).toLocaleString('es-CU')} 
                        {s.closedAt && ` • Cerrado: ${new Date(s.closedAt).toLocaleString('es-CU')}`}
                      </div>
                    </div>

                    <span style={{
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: s.status === 'cerrado' ? '#E2E8F0' : '#DCFCE7',
                      color: s.status === 'cerrado' ? '#334155' : '#15803D'
                    }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px', backgroundColor: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '0.68rem' }}>Efectivo Resp.</span>
                      <div style={{ fontWeight: 800 }}>${s.expectedCashInRegister}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '0.68rem' }}>Efectivo Entregado</span>
                      <div style={{ fontWeight: 800 }}>${s.realCashInRegister || 0}</div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '0.68rem' }}>Diferencia</span>
                      <div style={{ fontWeight: 900, color: (s.cashDifference || 0) >= 0 ? '#16A34A' : '#DC2626' }}>
                        ${s.cashDifference || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
