'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const CORRECT_PASS = 'Del1Al9#';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASS) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Contraseña incorrecta. Verifique e intente nuevamente.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'var(--md-sys-color-surface)'
    }}>
      <div className="md-card" style={{
        maxWidth: '420px',
        width: '100%',
        padding: '36px 28px',
        textAlign: 'center',
        boxShadow: 'var(--md-shadow-elevation-3)'
      }}>
        
        {/* App Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #003B63 100%)',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 24px rgba(0, 99, 155, 0.3)'
        }}>
          <ShieldCheck size={36} />
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
          Cuenta Casa
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: '24px' }}>
          Acceso protegido. Introduzca su contraseña para continuar.
        </p>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'var(--md-sys-color-expense-container)',
            color: 'var(--md-sys-color-on-expense-container)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '6px', display: 'block' }}>
              Contraseña de Acceso
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="md-btn md-btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '1rem' }}
          >
            <KeyRound size={18} />
            <span>Iniciar Sesión</span>
          </button>

        </form>

        <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Sistema 100% Offline • Datos protegidos localmente
        </div>

      </div>
    </div>
  );
};
