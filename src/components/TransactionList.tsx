'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types';
import { formatCurrency, isTransactionEditable, getRemainingEditableTime } from '@/lib/invoice';
import { getCurrencySettings } from '@/lib/storage';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit3, 
  Trash2, 
  Calendar,
  ChevronDown,
  Loader2,
  Lock,
  Clock,
  Home,
  Store,
  PiggyBank
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  currency?: string;
  showBalance?: boolean;
  limit?: number;
  isLoading?: boolean;
  deletingId?: string | null;
}

const PAGE_SIZE = 15;

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  currency = '$',
  showBalance = true,
  limit,
  isLoading = false,
  deletingId = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [movementScope, setMovementScope] = useState<'casa' | 'tienda' | 'ahorro'>('casa');
  const [selectedTransactionForModal, setSelectedTransactionForModal] = useState<Transaction | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [, setTick] = useState(0);

  // Timer ticker to update remaining time badges in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filtered transactions by exact accountSource scope, search & type
  const filtered = transactions.filter(tx => {
    let matchesScope = false;
    if (tx.accountSource) {
      matchesScope = tx.accountSource === movementScope;
    } else {
      // Legacy fallback logic for old records missing accountSource field
      const isStoreTx = tx.category.toLowerCase().includes('tienda') || 
                        tx.category.toLowerCase().includes('fondo tienda') || 
                        tx.category.toLowerCase().includes('proveedor') ||
                        tx.concept.toLowerCase().includes('venta pos');
      if (movementScope === 'casa') matchesScope = !isStoreTx;
      else if (movementScope === 'tienda') matchesScope = isStoreTx;
      else matchesScope = false;
    }

    const matchesSearch = tx.concept.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || tx.type === typeFilter;

    const { currencyMode } = getCurrencySettings();
    const txCurrency = tx.currency || 'CUP';
    const matchesCurrency = currencyMode === 'BOTH' || (currencyMode === 'CUP' && txCurrency === 'CUP') || (currencyMode === 'USD' && txCurrency === 'USD');

    return matchesScope && matchesSearch && matchesType && matchesCurrency;
  });

  // Apply limit if specified (e.g. 10 for Dashboard)
  const displayedTransactions = limit ? filtered.slice(0, limit) : filtered;

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, typeFilter, movementScope]);

  // Infinite Scroll Trigger on Window Scroll (only when no limit)
  useEffect(() => {
    if (limit) return;
    const handleScroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
        setVisibleCount(prev => (prev < filtered.length ? prev + PAGE_SIZE : prev));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filtered.length, limit]);

  const visibleTransactions = limit ? displayedTransactions : displayedTransactions.slice(0, visibleCount);
  const hasMore = !limit && visibleCount < filtered.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Top Scope Switcher: Casa vs Tienda vs Ahorro */}
      {!limit && (
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--md-sys-color-surface-container)', padding: '6px', borderRadius: '16px' }}>
          <button
            onClick={() => setMovementScope('casa')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: movementScope === 'casa' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: movementScope === 'casa' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: movementScope === 'casa' ? '0 4px 12px rgba(236, 72, 153, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Home size={16} />
            <span>Finanzas Hogar</span>
          </button>

          <button
            onClick={() => setMovementScope('tienda')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: movementScope === 'tienda' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: movementScope === 'tienda' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: movementScope === 'tienda' ? '0 4px 12px rgba(236, 72, 153, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Store size={16} />
            <span>Gestión Negocio</span>
          </button>

          <button
            onClick={() => setMovementScope('ahorro')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: movementScope === 'ahorro' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: movementScope === 'ahorro' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: movementScope === 'ahorro' ? '0 4px 12px rgba(236, 72, 153, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <PiggyBank size={16} />
            <span>Ahorro</span>
          </button>
        </div>
      )}

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
              placeholder="Buscar por concepto o categoría..."
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
                {t === 'todos' ? 'Todos' : t === 'ingreso' ? '+ Recibidos' : '- Gastados'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Loading Skeletons State */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="md-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="skeleton" style={{ width: '34px', height: '34px', borderRadius: '10px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ width: '120px', height: '14px' }} />
                  <div className="skeleton" style={{ width: '70px', height: '10px' }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: '80px', height: '18px' }} />
            </div>
          ))}
        </div>
      ) : visibleTransactions.length === 0 ? (
        <div className="md-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
            No hay movimientos registrados en esta categoría.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleTransactions.map(tx => {
            const isIncome = tx.type === 'ingreso';
            const isDeleting = deletingId === tx.id;
            const editable = isTransactionEditable(tx.createdAt);
            const remainingTime = getRemainingEditableTime(tx.createdAt);

            const scopeType = tx.accountSource || (
              (tx.category.toLowerCase().includes('tienda') || tx.category.toLowerCase().includes('proveedor') || tx.concept.toLowerCase().includes('venta pos')) ? 'tienda' : 'casa'
            );
            const scopeLabel = scopeType === 'tienda' ? '🏪 Tienda' : scopeType === 'ahorro' ? '🐖 Ahorro' : '🏠 Casa';
            const scopeBg = scopeType === 'tienda' ? '#FCE7F3' : scopeType === 'ahorro' ? '#F3E8FF' : '#E0F2FE';
            const scopeColor = scopeType === 'tienda' ? '#DB2777' : scopeType === 'ahorro' ? '#7E22CE' : '#0284C7';
            const scopeBorder = scopeType === 'tienda' ? '1px solid #FBCFE8' : scopeType === 'ahorro' ? '1px solid #E9D5FF' : '1px solid #BAE6FD';

            return (
              <div
                key={tx.id}
                className="md-card"
                onClick={() => setSelectedTransactionForModal(tx)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  opacity: isDeleting ? 0.5 : 1,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                      {/* Explicit Casa vs Tienda vs Ahorro Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        backgroundColor: scopeBg,
                        color: scopeColor,
                        border: scopeBorder,
                        flexShrink: 0
                      }}>
                        {scopeLabel}
                      </span>

                      {/* USD Badge */}
                      {tx.currency === 'USD' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          backgroundColor: '#ECFEFF',
                          color: '#0F766E',
                          border: '1px solid #99F6E4',
                          flexShrink: 0
                        }}>
                          USD$
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.72rem',
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginTop: '1px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        <span>{tx.date}</span>
                      </div>

                      {/* Category Pill */}
                      <span style={{ opacity: 0.8 }}>• {tx.category}</span>

                      {/* Remaining Editable Time Badge if active */}
                      {editable && remainingTime && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }} title="Tiempo restante para editar o eliminar">
                          <Clock size={10} />
                          {remainingTime}
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Side: Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  
                  {/* Amount Badge */}
                  <div style={{
                    textAlign: 'right',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: isIncome ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-expense)'
                  }}>
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount, tx.currency || currency, showBalance)}
                  </div>

                  {/* Edit & Delete Actions (Enabled ONLY within 5 minutes) */}
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {editable ? (
                      <>
                        <button
                          onClick={() => onEdit(tx)}
                          disabled={isDeleting}
                          title="Editar (Disponible los primeros 5 min)"
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
                          onClick={() => onDelete(tx.id)}
                          disabled={isDeleting}
                          title="Eliminar (Disponible los primeros 5 min)"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--md-sys-color-expense)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </>
                    ) : (
                      <div 
                        title="Bloqueado: Solo editable durante los primeros 5 minutos tras su creación"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          color: 'var(--md-sys-color-outline)',
                          opacity: 0.7
                        }}
                      >
                        <Lock size={15} />
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll / Load More Button */}
      {hasMore && !isLoading && (
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

      {/* Detail Modal for Clicked Transaction */}
      <TransactionDetailModal
        transaction={selectedTransactionForModal}
        onClose={() => setSelectedTransactionForModal(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        currency={currency}
      />

    </div>
  );
};
