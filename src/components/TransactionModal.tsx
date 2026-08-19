'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/types';
import { fileToBase64 } from '@/lib/storage';
import { X, Camera, Upload, Trash2, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

const PRESET_INGRESOS = [
  { label: 'Pago por webs', category: 'Trabajo / Webs' },
  { label: 'Pago por venta de x cosa', category: 'Venta de Artículos' },
  { label: 'Salario / Trabajo local', category: 'Salario' },
  { label: 'Remesas / Servicios', category: 'Remesas' },
  { label: 'Otros Ingresos', category: 'Otros Ingresos' }
];

const PRESET_GASTOS = [
  { label: 'Compra de Pan', category: 'Comida' },
  { label: 'Compra de Arroz', category: 'Comida' },
  { label: 'Compra de Azúcar', category: 'Comida' },
  { label: 'Bulto de Comida General', category: 'Comida' },
  { label: 'Hamburguesas / Comida Fuera', category: 'Comida' },
  { label: 'Servicios (Luz / Agua / Internet)', category: 'Servicios' },
  { label: 'Transporte / Combustible', category: 'Transporte' },
  { label: 'Reparaciones del Hogar', category: 'Hogar' }
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'gasto',
  editingTransaction
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setConcept(editingTransaction.concept);
      setCategory(editingTransaction.category);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setNotes(editingTransaction.notes || '');
      setPhotoUrl(editingTransaction.photoUrl);
    } else {
      setType(initialType);
      setConcept('');
      setCategory(initialType === 'ingreso' ? 'Trabajo / Webs' : 'Comida');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPhotoUrl(undefined);
    }
  }, [editingTransaction, initialType, isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (label: string, cat: string) => {
    setConcept(label);
    setCategory(cat);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setPhotoUrl(base64);
      } catch (err) {
        console.error('Error reading photo:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor introduce un monto válido mayor a 0.');
      return;
    }
    if (!concept.trim()) {
      alert('Por favor introduce un concepto o selecciona una opción predeterminada.');
      return;
    }

    onSave({
      type,
      concept: concept.trim(),
      category: category.trim() || (type === 'ingreso' ? 'Ingreso General' : 'Gasto General'),
      amount: parsedAmount,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      photoUrl
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }} className="no-print">
      
      <div style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-surface)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--md-shadow-elevation-3)',
        padding: '24px',
        border: '1px solid var(--md-sys-color-surface-variant)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {editingTransaction ? 'Editar Registro' : `Nuevo ${type === 'ingreso' ? 'Ingreso' : 'Gasto'}`}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Type Selector (Gasto vs Ingreso) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          padding: '6px',
          borderRadius: '16px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => {
              setType('gasto');
              if (!concept) setCategory('Comida');
            }}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: type === 'gasto' ? 'var(--md-sys-color-expense)' : 'transparent',
              color: type === 'gasto' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            - GASTO
          </button>

          <button
            type="button"
            onClick={() => {
              setType('ingreso');
              if (!concept) setCategory('Trabajo / Webs');
            }}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: type === 'ingreso' ? 'var(--md-sys-color-income)' : 'transparent',
              color: type === 'ingreso' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            + INGRESO
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Presets */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', display: 'block' }}>
              Conceptos Rápidos ({type === 'ingreso' ? 'Ingresos' : 'Gastos'}):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(type === 'ingreso' ? PRESET_INGRESOS : PRESET_GASTOS).map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset.label, preset.category)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: concept === preset.label ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: concept === preset.label ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Concept Input */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              Concepto / Detalle *
            </label>
            <input
              type="text"
              placeholder={type === 'ingreso' ? 'Ej. Pago por webs, Venta de laptop...' : 'Ej. Pan, Arroz, Bulto de comida, Hamburguesa...'}
              value={concept}
              onChange={e => setConcept(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Amount & Category Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Monto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Categoría
              </label>
              <input
                type="text"
                placeholder="Ej. Comida, Trabajo..."
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              Fecha del Registro
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Photo Attachment (for photos of food, receipt, etc.) */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              Foto Adjunta (Comprobante / Comida / Producto)
            </label>

            {photoUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                maxHeight: '180px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: '#000'
              }}>
                <img 
                  src={photoUrl} 
                  alt="Adjunto" 
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(211, 47, 47, 0.9)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '50%',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px',
                borderRadius: '12px',
                border: '2px dashed var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface-variant)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600
              }}>
                <Camera size={20} />
                <span>Tomar o Subir Foto del Gasto/Ingreso</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }} 
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
              Notas Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalles extras..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="md-btn md-btn-secondary"
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`md-btn ${type === 'ingreso' ? 'md-btn-income' : 'md-btn-expense'}`}
              style={{ flex: 1 }}
            >
              <CheckCircle2 size={18} />
              <span>Guardar Registro</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
