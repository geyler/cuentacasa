'use client';

import React, { forwardRef } from 'react';
import { Keyboard, ArrowRight, Check } from 'lucide-react';

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  focusedField?: string | null;
  fieldName?: string;
  isNumeric?: boolean;
  unitSymbol?: string;
  onNextField?: () => void;
  onDone?: () => void;
  counterText?: string;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(({
  label,
  focusedField,
  fieldName,
  isNumeric = false,
  unitSymbol,
  onNextField,
  onDone,
  counterText,
  className = '',
  style,
  onFocus,
  onKeyDown,
  ...props
}, ref) => {
  const isSelfFocused = focusedField !== undefined && fieldName !== undefined 
    ? focusedField === fieldName 
    : false;
  
  const isAnyFieldFocused = focusedField !== undefined && focusedField !== null;
  const isOtherFieldFocused = isAnyFieldFocused && !isSelfFocused;

  return (
    <div style={{
      opacity: isOtherFieldFocused ? 0.85 : 1,
      filter: isOtherFieldFocused ? 'blur(1px)' : 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      width: '100%'
    }}>
      {/* Label / Active Spotlight Header */}
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          {isSelfFocused ? (
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Keyboard size={14} /> {label.replace(/\s*\*.*$/, '')} {unitSymbol ? `(${unitSymbol})` : ''} *
            </span>
          ) : (
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              {label} {unitSymbol ? `(${unitSymbol})` : ''}
            </label>
          )}

          {isSelfFocused && (
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onDone) onDone();
                  else if (onNextField) onNextField();
                  else (document.activeElement as HTMLElement)?.blur();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 99, 155, 0.2)'
                }}
              >
                <Check size={13} />
                <span>Aceptar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Element */}
      <input
        ref={ref}
        className={`app-input ${isNumeric ? 'app-input-numeric' : ''} ${className}`}
        onFocus={(e) => {
          if (onFocus) onFocus(e);
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onKeyDown={(e) => {
          if (onKeyDown) onKeyDown(e);
          if (e.key === 'Enter' && onNextField) {
            e.preventDefault();
            e.stopPropagation();
            onNextField();
          }
        }}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: '12px',
          border: isSelfFocused 
            ? '2px solid var(--md-sys-color-primary)' 
            : '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          fontSize: isNumeric ? '1.12rem' : '0.98rem',
          fontWeight: isNumeric ? 800 : 700,
          outline: 'none',
          boxShadow: isSelfFocused ? '0 0 0 4px rgba(0, 99, 155, 0.25)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...style
        }}
        {...props}
      />

      {counterText && (
        <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', marginTop: '2px' }}>
          {counterText}
        </div>
      )}
    </div>
  );
});

AppInput.displayName = 'AppInput';
