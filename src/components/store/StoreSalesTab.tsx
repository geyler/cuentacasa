'use client';

import React from 'react';
import { formatCurrency } from '@/lib/invoice';
import { Receipt } from 'lucide-react';

interface StoreSalesTabProps {
  salesRecords: any[];
  currency?: string;
}

export const StoreSalesTab: React.FC<StoreSalesTabProps> = ({
  salesRecords,
  currency = '$'
}) => {
  return (
    <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Receipt size={20} color="var(--md-sys-color-primary)" />
        <span>Historial de Ventas y Recibos</span>
      </h3>

      {salesRecords.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '20px' }}>
          Aún no hay ventas registradas. Escanea productos en el POS para realizar tu primera venta.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {salesRecords.map(sale => (
            <div
              key={sale.id}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface-container)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                  Ticket #{sale.id.slice(-6)} • {sale.date}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                  {formatCurrency(sale.totalAmount, currency, true)}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '6px' }}>
                {sale.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                paddingTop: '6px',
                borderTop: '1px dashed var(--md-sys-color-outline-variant)'
              }}>
                <span>Ganancia a Casa: <strong style={{ color: 'var(--md-sys-color-income)' }}>${sale.netProfit}</strong></span>
                <span>Costo Retenido (Negocio/Proveedores): <strong>${sale.totalCost}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
