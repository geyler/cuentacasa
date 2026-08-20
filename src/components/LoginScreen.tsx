'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, Loader2, Hash, LogOut } from 'lucide-react';

interface LoginScreenProps {
  mode: 'master' | 'pin';
  onMasterLoginSuccess: () => void;
  onPinUnlockSuccess: () => void;
  onLogoutRequested?: () => void;
}

const FALLBACK_PASS = process.env.NEXT_PUBLIC_APP_PASSWORD || 'Del1Al9#';

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  mode, 
  onMasterLoginSuccess, 
  onPinUnlockSuccess,
  onLogoutRequested
}) => {
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'pin') {
        pinRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [mode]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Timeout of 3.5s for network requests to avoid hangs on slow/unstable connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      if (navigator.onLine) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const data = await res.json();

        if (res.ok && data.success) {
          localStorage.setItem('cuentacasa_auth', 'true');
          sessionStorage.setItem('cuentacasa_auth', 'true');
          onMasterLoginSuccess();
          return;
        } else {
          setError(data.message || 'Contraseña maestra incorrecta.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Fallback a validación local por conexión lenta o inestable:', err);
    }

    // Offline / Local fallback check
    if (password === FALLBACK_PASS) {
      localStorage.setItem('cuentacasa_auth', 'true');
      sessionStorage.setItem('cuentacasa_auth', 'true');
      setError('');
      onMasterLoginSuccess();
    } else {
      setError('Contraseña maestra incorrecta.');
    }
    setLoading(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('cuentacasa_pin');
    if (savedPin && pin === savedPin) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('cuentacasa_last_pin_unlock', today);
      setError('');
      onPinUnlockSuccess();
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
        boxShadow: 'var(--md-shadow-elevation-3)',
        transition: 'all 0.2s ease'
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
          {mode === 'pin' 
            ? 'Desbloqueo diario. Ingrese su PIN de 4 dígitos para acceder hoy.' 
            : 'Acceso inicial. Introduzca la contraseña maestra para continuar.'}
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

        {/* PIN UNLOCK MODE */}
        {mode === 'pin' && (
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px', display: 'block' }}>
                PIN Rápido del Día
              </label>
              <input
                ref={pinRef}
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                required
                autoFocus
                style={{
                  width: '180px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: isFocused ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.8rem',
                  letterSpacing: '0.4rem',
                  textAlign: 'center',
                  outline: 'none',
                  margin: '0 auto',
                  boxShadow: isFocused ? '0 0 0 4px rgba(0, 99, 155, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
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
              <span>Desbloquear Hoy</span>
            </button>

            {onLogoutRequested && (
              <button
                type="button"
                onClick={onLogoutRequested}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span>Cerrar sesión por completo (Usar contraseña maestra)</span>
              </button>
            )}
          </form>
        )}

        {/* MASTER PASSWORD MODE */}
        {mode === 'master' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ position: 'relative', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '6px', display: 'block' }}>
                Contraseña Maestra
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 42px 14px 14px',
                    borderRadius: '14px',
                    border: isFocused ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '1rem',
                    outline: 'none',
                    boxShadow: isFocused ? '0 0 0 4px rgba(0, 99, 155, 0.25)' : 'none',
                    transition: 'all 0.2s ease'
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
              disabled={loading}
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '1rem' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            </button>

          </form>
        )}

        <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          {mode === 'pin' ? 'PIN local de 1 verificación diaria' : 'Acceso seguro a base de datos'}
        </div>

      </div>
    </div>
  );
};
