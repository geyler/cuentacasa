'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, ArrowRightLeft, Check, X, AlertCircle } from 'lucide-react';
import { 
  getSystemCategories, 
  createCategory, 
  renameCategory, 
  deleteCategoryWithReassign,
  getRawDatabase 
} from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';

export const SettingsCategoriesView: React.FC = () => {
  const { showToast } = useActionFeedback();
  const [categories, setCategories] = useState<string[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  
  // Modal de Crear
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Modal de Renombrar
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Modal de Eliminar y Reasignar
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('General');

  const refreshCategories = () => {
    const list = getSystemCategories();
    setCategories(list);

    const db = getRawDatabase();
    const counts: Record<string, number> = {};
    (db.storeProducts || []).forEach(p => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    setProductCounts(counts);
  };

  useEffect(() => {
    refreshCategories();
    const handler = () => refreshCategories();
    window.addEventListener('cuentacasa-categories-changed', handler);
    window.addEventListener('cuentacasa-db-changed', handler);
    return () => {
      window.removeEventListener('cuentacasa-categories-changed', handler);
      window.removeEventListener('cuentacasa-db-changed', handler);
    };
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;
    if (categories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      showToast({ title: 'Categoría Duplicada', message: `La categoría "${clean}" ya existe en el sistema.`, type: 'warning' });
      return;
    }
    createCategory(clean);
    setNewCatName('');
    setIsCreating(false);
    refreshCategories();
    showToast({ title: 'Categoría Creada', message: `Se añadió "${clean}" al catálogo.`, type: 'success' });
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    const clean = renameValue.trim();
    if (!clean || clean.toLowerCase() === editingCat.toLowerCase()) {
      setEditingCat(null);
      return;
    }
    const res = renameCategory(editingCat, clean);
    if (res.success) {
      showToast({
        title: 'Categoría Renombrada',
        message: `Se actualizó a "${clean}". ${res.affectedCount} productos actualizados.`,
        type: 'success'
      });
      setEditingCat(null);
      refreshCategories();
    }
  };

  const handleDelete = () => {
    if (!deletingCat) return;
    const res = deleteCategoryWithReassign(deletingCat, reassignTarget);
    if (res.success) {
      showToast({
        title: 'Categoría Eliminada',
        message: `Categoría "${deletingCat}" eliminada. ${res.reallocatedCount} productos reasignados a "${reassignTarget}".`,
        type: 'success'
      });
      setDeletingCat(null);
      refreshCategories();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Informativo */}
      <div className="md-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(26, 115, 232, 0.12)',
              color: 'var(--brand-primary, #1A73E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0 }}>
                Categorías de Productos
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Organiza tu catálogo, renombra o reasigna productos masivamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="md-btn md-btn-primary"
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Nueva Categoría
          </button>
        </div>
      </div>

      {/* Formulario de Creación Rápida */}
      {isCreating && (
        <form 
          onSubmit={handleCreate} 
          className="md-card" 
          style={{ 
            padding: '16px', 
            border: '2px solid var(--brand-primary, #1A73E8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>Crear Nueva Categoría</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              autoFocus
              placeholder="Ej. Calzado Deportivo, Perfumería, Tornillos..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: 'var(--md-sys-color-surface)'
              }}
            />
            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ padding: '8px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '0.84rem' }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewCatName(''); }}
              style={{
                background: 'transparent',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Categorías */}
      <div className="md-card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {categories.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
            No hay categorías registradas en el sistema.
          </div>
        ) : (
          categories.map(cat => {
            const count = productCounts[cat] || 0;
            const isEditingThis = editingCat === cat;

            return (
              <div
                key={cat}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isEditingThis ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderBottom: '1px solid var(--md-sys-color-surface-container)'
                }}
              >
                {isEditingThis ? (
                  <form onSubmit={handleRename} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '2px solid var(--brand-primary, #1A73E8)',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor: '#10B981',
                        border: 'none',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        cursor: 'pointer'
                      }}
                      title="Guardar nombre"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCat(null)}
                      style={{
                        backgroundColor: '#E2E8F0',
                        border: 'none',
                        color: '#475569',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        cursor: 'pointer'
                      }}
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface)' }}>
                        {cat}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: count > 0 ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface-container)',
                        color: count > 0 ? 'var(--brand-primary, #1A73E8)' : 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        {count} {count === 1 ? 'artículo' : 'artículos'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setRenameValue(cat);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '8px',
                          color: 'var(--md-sys-color-on-surface-variant)',
                          cursor: 'pointer'
                        }}
                        title="Renombrar categoría"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const other = categories.find(c => c !== cat) || 'General';
                          setReassignTarget(other);
                          setDeletingCat(cat);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '8px',
                          color: '#EF4444',
                          cursor: 'pointer'
                        }}
                        title="Eliminar categoría"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Confirmación de Eliminación con Reasignación */}
      {deletingCat && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="md-card" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>
                  ¿Eliminar categoría &ldquo;{deletingCat}&rdquo;?
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Tiene {productCounts[deletingCat] || 0} artículos asociados en inventario.
                </p>
              </div>
            </div>

            {(productCounts[deletingCat] || 0) > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                  Reasignar estos artículos a otra categoría:
                </label>
                <select
                  value={reassignTarget}
                  onChange={e => setReassignTarget(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  {categories.filter(c => c !== deletingCat).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {!categories.includes('General') && (
                    <option value="General">General</option>
                  )}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="md-btn"
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Confirmar y Reasignar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

