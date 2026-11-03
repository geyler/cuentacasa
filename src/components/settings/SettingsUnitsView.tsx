'use client';

import React, { useState, useEffect } from 'react';
import { Scale, Check, CheckSquare, Square, Info, RotateCcw } from 'lucide-react';
import { 
  ALL_SYSTEM_UNITS, 
  DEFAULT_ENABLED_UNITS, 
  getEnabledUnits, 
  saveEnabledUnits 
} from '@/lib/storage';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';

export const SettingsUnitsView: React.FC = () => {
  const { showToast } = useActionFeedback();
  const [enabledUnits, setEnabledUnits] = useState<string[]>(() => getEnabledUnits());

  useEffect(() => {
    setEnabledUnits(getEnabledUnits());
    const handler = (e: any) => {
      if (e.detail) setEnabledUnits(e.detail);
      else setEnabledUnits(getEnabledUnits());
    };
    window.addEventListener('cuentacasa-units-changed', handler);
    return () => window.removeEventListener('cuentacasa-units-changed', handler);
  }, []);

  const handleToggle = (unitId: string) => {
    let next: string[];
    if (enabledUnits.includes(unitId)) {
      if (enabledUnits.length === 1) {
        showToast({ title: 'Mínimo Requerido', message: 'Debes mantener al menos una unidad de medida activa.', type: 'warning' });
        return;
      }
      next = enabledUnits.filter(id => id !== unitId);
    } else {
      next = [...enabledUnits, unitId];
    }
    setEnabledUnits(next);
    saveEnabledUnits(next);
  };

  const handleSelectAll = () => {
    const all = ALL_SYSTEM_UNITS.map(u => u.id);
    setEnabledUnits(all);
    saveEnabledUnits(all);
    showToast({ title: 'Todas Activadas', message: 'Se habilitaron todas las unidades de medida.', type: 'info' });
  };

  const handleResetDefaults = () => {
    setEnabledUnits(DEFAULT_ENABLED_UNITS);
    saveEnabledUnits(DEFAULT_ENABLED_UNITS);
    showToast({ title: 'Valores por Defecto', message: 'Se restablecieron las unidades básicas.', type: 'info' });
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
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Scale size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0 }}>
                Unidades de Medida Activas
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Marca con palomita las que deseas usar en tu negocio para que la lista al publicar sea rápida y corta.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'transparent',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={13} /> Básicas
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="md-btn md-btn-primary"
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 800
              }}
            >
              Activar Todas
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Unidades con Palomitas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '10px'
      }}>
        {ALL_SYSTEM_UNITS.map(unit => {
          const isChecked = enabledUnits.includes(unit.id);

          return (
            <div
              key={unit.id}
              onClick={() => handleToggle(unit.id)}
              className="md-card"
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                cursor: 'pointer',
                border: isChecked ? '2px solid var(--brand-primary, #1A73E8)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: isChecked ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isChecked ? 'var(--brand-primary, #1A73E8)' : 'var(--md-sys-color-on-surface)' }}>
                  {unit.name}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  {unit.description}
                </span>
              </div>

              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: isChecked ? 'var(--brand-primary, #1A73E8)' : 'transparent',
                border: isChecked ? 'none' : '2px solid var(--md-sys-color-outline-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}>
                {isChecked && <Check size={16} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

