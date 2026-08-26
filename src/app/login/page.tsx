'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/LoginScreen';
import { ActionFeedbackProvider } from '@/components/ActionFeedbackProvider';
import { Loader2 } from 'lucide-react';

function PureLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'master' | 'pin'>('master');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localAuth = localStorage.getItem('cuentacasa_auth');
    const sessionAuth = sessionStorage.getItem('cuentacasa_auth');
    const hasMasterAuth = localAuth === 'true' || sessionAuth === 'true';

    const localPin = localStorage.getItem('cuentacasa_pin');
    const lastUnlock = localStorage.getItem('cuentacasa_last_pin_unlock');
    const today = new Date().toISOString().split('T')[0];

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceLogin = params?.get('force') === 'true' || params?.get('reset') !== null;

    if (hasMasterAuth && !forceLogin) {
      if (localPin && localPin.length === 4 && lastUnlock !== today) {
        setMode('pin');
      } else {
        // Already fully unlocked, go directly to app
        router.replace('/app');
        return;
      }
    } else {
      setMode('master');
    }
    setLoading(false);
  }, [router]);

  const handleMasterLoginSuccess = () => {
    localStorage.setItem('cuentacasa_auth', 'true');
    sessionStorage.setItem('cuentacasa_auth', 'true');

    const localPin = localStorage.getItem('cuentacasa_pin');
    const lastUnlock = localStorage.getItem('cuentacasa_last_pin_unlock');
    const today = new Date().toISOString().split('T')[0];

    if (localPin && localPin.length === 4 && lastUnlock !== today) {
      setMode('pin');
    } else {
      router.replace('/app');
    }
  };

  const handlePinUnlockSuccess = () => {
    router.replace('/app');
  };

  const handleLogout = () => {
    localStorage.removeItem('cuentacasa_auth');
    sessionStorage.removeItem('cuentacasa_auth');
    setMode('master');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--md-sys-color-surface)'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--md-sys-color-primary)" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)' }}>
      <LoginScreen
        mode={mode}
        onMasterLoginSuccess={handleMasterLoginSuccess}
        onPinUnlockSuccess={handlePinUnlockSuccess}
        onLogoutRequested={handleLogout}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <ActionFeedbackProvider>
      <PureLoginPage />
    </ActionFeedbackProvider>
  );
}
