'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2, User, LogOut, Lock, HelpCircle } from 'lucide-react';
import { authenticateUser, setLoggedInUser, getLoggedInUser, getUserPin, clearUserPin } from '@/lib/storage';
import { AppUser } from '@/types';

interface LoginScreenProps {
  mode: 'master' | 'pin';
  onMasterLoginSuccess: (user: AppUser) => void;
  onPinUnlockSuccess: () => void;
  onLogoutRequested?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  mode: initialMode, 
  onMasterLoginSuccess, 
  onPinUnlockSuccess,
  onLogoutRequested
}) => {
  const [currentMode, setCurrentMode] = useState<'master' | 'pin'>(initialMode);
  const [username, setUsername] = useState('geyler');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResettingPinMode, setIsResettingPinMode] = useState(false);

  const currentUser = getLoggedInUser();

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setPin('');
    setError('');
  }, [currentMode]);

  // Captura de teclado físico (PC) sin abrir teclado táctil nativo en móviles
  useEffect(() => {
    if (currentMode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handlePinDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, pin]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const user = authenticateUser(username, password);
    if (user) {
      setLoggedInUser(user);
      if (isResettingPinMode) {
        clearUserPin(user.username);
        setInfoMsg(`PIN desactivado con éxito para @${user.username}.`);
      }
      onMasterLoginSuccess(user);
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
    setLoading(false);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeUsername = currentUser?.username || 'geyler';
    const savedPin = getUserPin(activeUsername);

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
        const activeUsername = currentUser?.username || 'geyler';
        const savedPin = getUserPin(activeUsername);
        
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

  const handleForgotPinClick = () => {
    setIsResettingPinMode(true);
    setCurrentMode('master');
    setInfoMsg('Ingresa con tu usuario y contraseña para restablecer tu PIN.');
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
          Gestión & Punto de Venta
        </span>

        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px', marginBottom: '20px', lineHeight: '1.4', fontWeight: 500 }}>
          {currentMode === 'pin' 
            ? `Ingresa tu PIN diario de 4 dígitos${currentUser ? ` (@${currentUser.username})` : ''}.` 
            : 'Introduzca usuario y contraseña para acceder.'}
        </p>

        {infoMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: '#EFF6FF',
            color: '#1E40AF',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '16px',
            border: '1px solid #BFDBFE'
          }}>
            ℹ️ {infoMsg}
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '16px',
            border: '1px solid #FCA5A5'
          }}>
            ❌ {error}
          </div>
        )}

        {/* MODO PIN: Teclado numérico táctil puro sin teclado emergente nativo */}
        {currentMode === 'pin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Casillas de los 4 dígitos */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '14px',
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

            {/* Teclado Táctil Integrado */}
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
              type="button"
              onClick={() => handlePinSubmit()}
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

            {/* Enlace para Olvidé mi PIN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleForgotPinClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DB2777',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <HelpCircle size={15} />
                <span>¿Olvidaste tu PIN? Recupéralo con usuario</span>
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={14} />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODO USUARIO Y CONTRASEÑA */}
        {currentMode === 'master' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>
                Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ej. geyler"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
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
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.06)'
                  }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#DB2777' }} />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: '6px', display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '14px 40px 14px 40px',
                    borderRadius: '14px',
                    border: '1.5px solid #FBCFE8',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#DB2777' }} />
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
                marginTop: '8px'
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <span>Iniciar Sesión</span>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
