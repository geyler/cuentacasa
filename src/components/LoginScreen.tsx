'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, Loader2, Hash, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const FALLBACK_PASS = process.env.NEXT_PUBLIC_APP_PASSWORD || 'Del1Al9#';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const localPin = localStorage.getItem('cuentacasa_pin');
    if (localPin && localPin.length === 4) {
      setSavedPin(localPin);
      setMode('pin');
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (rememberMe) {
            localStorage.setItem('cuentacasa_auth', 'true');
          }
          sessionStorage.setItem('cuentacasa_auth', 'true');
          onLoginSuccess();
          return;
        } else {
          setError(data.message || 'Contraseña incorrecta. Verifique e intente nuevamente.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallback a validación local por falta de conexión:', err);
    }

    // Offline / Local fallback check
    if (password === FALLBACK_PASS) {
      if (rememberMe) {
        localStorage.setItem('cuentacasa_auth', 'true');
      }
      sessionStorage.setItem('cuentacasa_auth', 'true');
      setError('');
      onLoginSuccess();
    } else {
      setError('Contraseña incorrecta. Verifique e intente nuevamente.');
    }
    setLoading(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (savedPin && pin === savedPin) {
      localStorage.setItem('cuentacasa_auth', 'true');
      sessionStorage.setItem('cuentacasa_auth', 'true');
      setError('');
      onLoginSuccess();
    } else {
      setError('PIN de 4 dígitos incorrecto.');
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
          {mode === 'pin' ? <Hash size={34} /> : <ShieldCheck size={36} />}
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
          Cuenta Casa
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: '24px' }}>
          {mode === 'pin' ? 'Ingrese su PIN rápido de 4 dígitos para acceder' : 'Acceso protegido. Introduzca su contraseña para continuar.'}
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

        {/* PIN MODE FORM */}
        {mode === 'pin' && savedPin && (
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', display: 'block' }}>
                PIN Rápido (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                autoFocus
                style={{
                  width: '180px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '2px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.8rem',
                  letterSpacing: '0.4rem',
                  textAlign: 'center',
                  outline: 'none',
                  margin: '0 auto'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={pin.length < 4}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '1rem' }}
            >
              <KeyRound size={18} />
              <span>Desbloquear con PIN</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-sys-color-primary)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Usar contraseña completa en su lugar
            </button>
          </form>
        )}

        {/* MASTER PASSWORD MODE FORM */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
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

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--md-sys-color-primary)' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer' }}>
                Recordar sesión en este dispositivo (no pedir contraseña al reabrir)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '1rem' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            </button>

            {savedPin && (
              <button
                type="button"
                onClick={() => { setMode('pin'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Volver al PIN Rápido
              </button>
            )}

          </form>
        )}

        <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          Sesión persistente habilitada • Datos 100% seguros
        </div>

      </div>
    </div>
  );
};
