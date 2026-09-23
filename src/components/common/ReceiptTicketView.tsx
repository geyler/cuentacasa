'use client';

import React from 'react';
import { Receipt, Coins, DollarSign, ShoppingBag, Handshake, CheckCircle2 } from 'lucide-react';

interface ReceiptTicketViewProps {
  note?: string;
  ticketId?: string;
  totalCUP?: number;
  totalUSD?: number;
  currency?: string;
  seller?: string;
  timestamp?: number;
  compact?: boolean;
}

export const ReceiptTicketView: React.FC<ReceiptTicketViewProps> = ({
  note = '',
  ticketId: propTicketId,
  totalCUP: propTotalCUP,
  totalUSD: propTotalUSD,
  currency: propCurrency,
  seller: propSeller,
  timestamp,
  compact = false
}) => {
  if (!note && !propTotalCUP && !propTotalUSD) return null;

  const isPurchase = note.includes('[TICKET_DE_COMPRA]');
  const isPayout = note.includes('[TICKET_DE_LIQUIDACION]');
  const isSale = note.includes('[TICKET_DE_VENTA') || (!isPurchase && !isPayout);

  // Extraer el Ticket ID
  let ticketId = propTicketId;
  if (!ticketId && note) {
    const idMatch = note.match(/#(\d+)/) || note.match(/Comprobante(?: de Venta)? #(\d+)/);
    if (idMatch) ticketId = idMatch[1];
  }

  // Extraer items del texto de la nota
  const items: { name: string; qty: string; unitPrice?: string; subtotal?: string }[] = [];
  let extractedTotal = '';
  let extractedMoneda = propCurrency || '';
  let extractedVendedor = propSeller || '';
  let extractedProveedor = '';

  if (note) {
    // Dividir líneas por punto '•' o saltos de línea
    const lines = note.split(/(?:•|\n)/).map(l => l.trim()).filter(Boolean);

    lines.forEach(line => {
      // Buscar información de vendedor / total / proveedor / moneda
      if (line.includes('Total:') || line.includes('Total Liquidado:') || line.includes('Moneda:') || line.includes('Vendedor:') || line.includes('Proveedor:')) {
        const totalMatch = line.match(/(?:Total|Total Liquidado):\s*\$?([A-Za-z\$]*\s*[\d\.,]+)/i);
        if (totalMatch) extractedTotal = totalMatch[1].replace(/^[^\d]+/, '');

        const monedaMatch = line.match(/Moneda:\s*([A-Z]+)/i);
        if (monedaMatch) extractedMoneda = monedaMatch[1];

        const vendedorMatch = line.match(/Vendedor:\s*([^\s\|]+)/i);
        if (vendedorMatch) extractedVendedor = vendedorMatch[1];

        const proveedorMatch = line.match(/Proveedor:\s*([^\|]+)/i);
        if (proveedorMatch) extractedProveedor = proveedorMatch[1].trim();
        return;
      }

      // Buscar patrones de items: "4x Galletas de sal ($1000 c/u = $4000)"
      const itemMatch = line.match(/(\d+x|\d+\s*u)?\s*([^(]+)(?:\(([^)]+)\))?/);
      if (itemMatch && itemMatch[2] && !line.startsWith('[TICKET') && !line.startsWith('-')) {
        const qty = itemMatch[1] ? itemMatch[1].trim() : '1x';
        const name = itemMatch[2].trim();
        const details = itemMatch[3] ? itemMatch[3].trim() : '';

        items.push({
          name,
          qty,
          subtotal: details
        });
      }
    });
  }

  const titleText = isPurchase 
    ? 'COMPROBANTE DE COMPRA DE MERCANCÍA' 
    : isPayout 
      ? 'COMPROBANTE DE LIQUIDACIÓN A PROVEEDOR' 
      : 'TICKET DE TIENDA SAMY STORE';

  const subtitleText = isPurchase
    ? `Entrada de Mercancía ${ticketId ? `#${ticketId}` : ''}`
    : isPayout
      ? `Liquidación de Cuenta ${ticketId ? `#${ticketId}` : ''}`
      : `Comprobante de Venta ${ticketId ? `#${ticketId}` : ''}`;

  const headerBgColor = isPurchase ? '#EFF6FF' : isPayout ? '#F0FDF4' : 'var(--md-sys-color-primary-container)';
  const headerIconColor = isPurchase ? '#2563EB' : isPayout ? '#16A34A' : 'var(--md-sys-color-primary)';

  return (
    <div
      style={{
        backgroundColor: '#FAFDFB',
        color: '#0F172A',
        borderRadius: '16px',
        border: '2px dashed #CBD5E1',
        padding: compact ? '12px' : '16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        width: '100%',
        margin: '6px 0'
      }}
    >
      {/* Header del Ticket */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          backgroundColor: headerBgColor,
          color: headerIconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isPurchase ? <ShoppingBag size={18} /> : isPayout ? <CheckCircle2 size={18} /> : <Receipt size={18} />}
        </div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '0.03em' }}>
          {titleText}
        </h4>
        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
          {subtitleText} {timestamp ? `• ${new Date(timestamp).toLocaleDateString('es-ES')}` : ''}
        </span>
      </div>

      {/* Línea Divisoria */}
      <div style={{ borderTop: '1px dotted #94A3B8', margin: '2px 0' }} />

      {/* Lista de Artículos */}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ fontWeight: 700, color: '#1E293B', flex: 1 }}>
                • <strong>{it.qty}</strong> {it.name}
              </div>
              {it.subtotal && (
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600, flexShrink: 0 }}>
                  ({it.subtotal})
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
          {note.replace(/\[TICKET_[^\]]+\]/g, '').trim()}
        </p>
      )}

      {/* Línea Divisoria */}
      <div style={{ borderTop: '1px dotted #94A3B8', margin: '2px 0' }} />

      {/* Pie del Ticket: Totales, Proveedor o Vendedor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
        <div>
          <span>{isPayout ? 'Total Liquidado: ' : isPurchase ? 'Inversión Total: ' : 'Total: '}</span>
          <strong style={{ color: isPurchase ? '#2563EB' : '#059669', fontSize: '0.92rem' }}>
            {propTotalCUP ? `$${propTotalCUP.toLocaleString('es-ES')} CUP` : ''}
            {propTotalUSD ? ` ${propTotalCUP ? '|' : ''} US$${propTotalUSD.toLocaleString('es-ES')} USD` : ''}
            {!propTotalCUP && !propTotalUSD && (extractedTotal ? `$${extractedTotal}` : '')}
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#64748B' }}>
          {extractedMoneda && (
            <span style={{ backgroundColor: '#E2E8F0', padding: '1px 6px', borderRadius: '6px', fontSize: '0.7rem' }}>
              {extractedMoneda}
            </span>
          )}
          {extractedProveedor ? (
            <span>Proveedor: <strong>{extractedProveedor}</strong></span>
          ) : extractedVendedor ? (
            <span>Vendedor: <strong>{extractedVendedor}</strong></span>
          ) : null}
        </div>
      </div>

    </div>
  );
};
