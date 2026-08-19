'use client';

import React, { useState } from 'react';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  Trash2, 
  Image as ImageIcon,
  Calendar,
  X
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  currency = '$'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  // Filtered transactions
  const filtered = transactions.filter(tx => {
    const matchesSearch = tx.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'todos' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'todas' || tx.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters Header Card */}
      <div className="md-card" style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          
          {/* Search bar */}
          <div style={{
            position: 'relative',
            flex: '1 1 240px'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar concepto (ej. pan, arroz, webs)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['todos', 'ingreso', 'gasto'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: typeFilter === t ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)',
                  color: typeFilter === t ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface-variant)',
                  textTransform: 'capitalize'
                }}
              >
                {t === 'todos' ? 'Todos' : t === 'ingreso' ? '+ Ingresos' : '- Gastos'}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} color="var(--md-sys-color-on-surface-variant)" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="todas">Todas las Categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Transaction Items */}
      {filtered.length === 0 ? (
        <div className="md-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.95rem' }}>
            No se encontraron movimientos registrados con los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(tx => {
            const isIncome = tx.type === 'ingreso';

            return (
              <div
                key={tx.id}
                className="md-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Left Side: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
                  
                  {/* Category Type Icon */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    backgroundColor: isIncome ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-expense-container)',
                    color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isIncome ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                  </div>

                  {/* Concept & Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                        {tx.concept}
                      </h4>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--md-sys-color-surface-container-high)',
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        {tx.category}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.78rem',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginTop: '4px'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {tx.date}
                      </span>
                      {tx.notes && <span>• {tx.notes}</span>}
                    </div>
                  </div>

                </div>

                {/* Right Side: Photo Thumbnail & Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Photo Thumbnail */}
                  {tx.photoUrl && (
                    <button
                      onClick={() => setSelectedPhoto(tx.photoUrl || null)}
                      title="Ver foto del gasto"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        padding: 0,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <img src={tx.photoUrl} alt={tx.concept} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  )}

                  {/* Amount Badge */}
                  <div style={{
                    textAlign: 'right',
                    minWidth: '110px'
                  }}>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)'
                    }}>
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      {tx.synced ? 'Alineado' : 'Pendiente sync'}
                    </span>
                  </div>

                  {/* Edit & Delete Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onEdit(tx)}
                      title="Editar Movimiento"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px'
                      }}
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${tx.concept}"?`)) {
                          onDelete(tx.id);
                        }
                      }}
                      title="Eliminar Movimiento"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-sys-color-expense)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} className="no-print" onClick={() => setSelectedPhoto(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={selectedPhoto} 
              alt="Foto ampliada" 
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} 
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: '#FFF',
                color: '#000',
                border: 'none',
                borderRadius: '50%',
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
