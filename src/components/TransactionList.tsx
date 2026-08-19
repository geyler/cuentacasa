'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  Trash2, 
  Calendar,
  X,
  ChevronDown
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  currency?: string;
  showBalance?: boolean;
}

const PAGE_SIZE = 15;

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  currency = '$',
  showBalance = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtered transactions
  const filtered = transactions.filter(tx => {
    const matchesSearch = tx.concept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, typeFilter]);

  // Infinite Scroll Trigger on Window Scroll
  useEffect(() => {
    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
        setVisibleCount(prev => (prev < filtered.length ? prev + PAGE_SIZE : prev));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filtered.length]);

  const visibleTransactions = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Search & Simple Filters Bar */}
      <div className="md-card" style={{ padding: '10px 14px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', flex: '1 1 180px' }}>
            <Search 
              size={15} 
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)'
              }} 
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Type Filter Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['todos', 'ingreso', 'gasto'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '0.75rem',
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

        </div>
      </div>

      {/* Transaction Items */}
      {visibleTransactions.length === 0 ? (
        <div className="md-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
            No hay movimientos registrados.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleTransactions.map(tx => {
            const isIncome = tx.type === 'ingreso';

            return (
              <div
                key={tx.id}
                className="md-card"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                {/* Left Side: Icon & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', overflow: 'hidden' }}>
                  
                  {/* Category Type Icon */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: isIncome ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-expense-container)',
                    color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>

                  {/* Concept & Date */}
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: 700, 
                      color: 'var(--md-sys-color-on-surface)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tx.concept}
                    </h4>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.72rem',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginTop: '1px'
                    }}>
                      <Calendar size={11} />
                      <span>{tx.date}</span>
                    </div>
                  </div>

                </div>

                {/* Right Side: Photo & Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  
                  {/* Photo Thumbnail */}
                  {tx.photoUrl && (
                    <button
                      onClick={() => setSelectedPhoto(tx.photoUrl || null)}
                      title="Ver foto"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        padding: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <img src={tx.photoUrl} alt={tx.concept} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  )}

                  {/* Amount Badge */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)'
                  }}>
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, currency, showBalance)}
                  </div>

                  {/* Edit & Delete Actions */}
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      onClick={() => onEdit(tx)}
                      title="Editar"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-sys-color-on-surface-variant)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${tx.concept}"?`)) {
                          onDelete(tx.id);
                        }
                      }}
                      title="Eliminar"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--md-sys-color-expense)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll / Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <button
            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
            className="md-btn md-btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
          >
            <span>Cargar más ({filtered.length - visibleCount} restantes)</span>
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
                padding: '6px',
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
