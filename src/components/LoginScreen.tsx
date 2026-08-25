'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, Loader2, User, LogOut } from 'lucide-react';
import { authenticateUser, setLoggedInUser } from '@/lib/storage';
import { AppUser } from '@/types';

interface LoginScreenProps {
  mode: 'master' | 'pin';
  onMasterLoginSuccess: (user: AppUser) => void;
  onPinUnlockSuccess: () => void;
  onLogoutRequested?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  mode, 
  onMasterLoginSuccess, 
  onPinUnlockSuccess,
  onLogoutRequested
}) => {
  const [username, setUsername] = useState('geyler');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPin('');
    setError('');

    const timer = setTimeout(() => {
      if (mode === 'pin') {
        pinRef.current?.focus();
      } else {
        usernameRef.current?.focus();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [mode]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = authenticateUser(username, password);
    if (user) {
      setLoggedInUser(user);
      onMasterLoginSuccess(user);
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
    setLoading(false);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handlePinDigitClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        const savedPin = localStorage.getItem('cuentacasa_pin');
        if (savedPin && newPin === savedPin) {
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem('cuentacasa_last_pin_unlock', today);
          setError('');
          onPinUnlockSuccess();
        } else {
          setError('PIN de 4 dígitos incorrecto.');
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#FFFFFF'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        padding: '36px 28px',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(236, 72, 153, 0.15)',
        border: '1px solid #FBCFE8',
        transition: 'all 0.2s ease'
      }}>
        
        {/* App Logo */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)',
          padding: '12px'
        }}>
          <img 
            src="/images/logo-nav.png" 
            alt="Samy Store" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>

        <h1 className="font-logo-script" style={{ fontSize: '2.1rem', fontWeight: 900, color: '#831843', margin: 0, lineHeight: 1 }}>
          Samy Store
        </h1>
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#DB2777', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', margin: '4px 0 12px 0' }}>
          POS & Gestión Administrativa
        </span>

        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px', marginBottom: '24px', lineHeight: '1.4', fontWeight: 500 }}>
          {mode === 'pin' 
            ? 'Ingresa tu PIN diario de 4 dígitos para acceder a la administración.' 
            : 'Introduzca la contraseña maestra para acceder.'}
        </p>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '20px',
            border: '1px solid #FCA5A5'
          }}>
            ❌ {error}
          </div>
        )}

        {/* PIN UNLOCK MODE */}
        {mode === 'pin' && (
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Hidden Input for Native Keyboard input */}
            <input
              ref={pinRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              maxLength={4}
              value={pin}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(val);
                setError('');
                if (val.length === 4) {
                  const savedPin = localStorage.getItem('cuentacasa_pin');
                  if (savedPin && val === savedPin) {
                    const today = new Date().toISOString().split('T')[0];
                    localStorage.setItem('cuentacasa_last_pin_unlock', today);
                    setError('');
                    onPinUnlockSuccess();
                  } else {
                    setError('PIN de 4 dígitos incorrecto.');
                  }
                }
              }}
              style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
            />

            {/* 4 Digit Boxes Widget */}
            <div 
              onClick={() => pinRef.current?.focus()}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              {[0, 1, 2, 3].map(idx => {
                const isFilled = pin.length > idx;
                const isCurrent = pin.length === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '52px',
                      height: '56px',
                      borderRadius: '16px',
                      border: isCurrent 
                        ? '2.5px solid #EC4899' 
                        : isFilled 
                        ? '2px solid #DB2777' 
                        : '2px solid #E2E8F0',
                      backgroundColor: isFilled ? '#FDF2F8' : '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: '#831843',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(236, 72, 153, 0.2)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {isFilled ? '●' : isCurrent ? '|' : ''}
                  </div>
                );
              })}
            </div>

            {/* Touch Keypad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              maxWidth: '280px',
              margin: '0 auto',
              width: '100%'
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigitClick(num)}
                  style={{
                    height: '48px',
                    borderRadius: '14px',
                    border: '1px solid #F1F5F9',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPin('')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => handlePinDigitClick('0')}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  border: '1px solid #F1F5F9',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                0
              </button>

              <button
                type="button"
                onClick={handlePinDelete}
                style={{
                  height: '48px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#FCE7F3',
                  color: '#BE185D',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ⌫ Borrar
              </button>
            </div>

            <button
              type="submit"
              disabled={pin.length < 4}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                border: 'none',
                background: pin.length === 4 ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' : '#E2E8F0',
                color: pin.length === 4 ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.98rem',
                fontWeight: 800,
                cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                boxShadow: pin.length === 4 ? '0 4px 16px rgba(236, 72, 153, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                transition: 'all 0.2s ease'
              }}
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
                  color: '#94A3B8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span>Usar Contraseña Maestra</span>
              </button>
            )}
          </form>
        )}

        {/* USERNAME & PASSWORD LOGIN MODE */}
        {mode === 'master' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Username Input */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={usernameRef}
                  type="text"
                  placeholder="ej. geyler"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 40px',
                    borderRadius: '14px',
                    border: '1.5px solid #FBCFE8',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.06)',
                    transition: 'all 0.2s ease'
                  }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#DB2777' }} />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 42px 14px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #FBCFE8',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.06)',
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
                    color: '#94A3B8',
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
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
                color: '#FFFFFF',
                fontSize: '0.98rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            </button>

          </form>
        )}

        <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
          {mode === 'pin' ? 'Acceso rápido con PIN diario' : 'Acceso seguro a administración Samy Store'}
        </div>

      </div>
    </div>
  );
};
