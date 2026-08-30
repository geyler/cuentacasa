import React, { useState, useEffect } from 'react';
import { 
  getStoreWhatsappNumber, 
  saveStoreWhatsappNumber, 
  getAppUsers, 
  getActiveWhatsappUserId,
  formatCubanPhone,
  getCurrencySettings,
  saveCurrencySettings,
  syncElToqueExchangeRate
} from '@/lib/storage';
import { AppUser, CurrencyMode } from '@/types';
import { 
  MessageCircle, 
  Check, 
  Crown, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Layers,
  Settings,
  HelpCircle
} from 'lucide-react';

interface StoreSettingsTabProps {
  onShowToast: (toast: { title: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }) => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | undefined>(undefined);
  const [customPhone, setCustomPhone] = useState<string>('');

  // Currency & Rate State
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('BOTH');
  const [exchangeRateUSD, setExchangeRateUSD] = useState<number>(675);
  const [exchangeRateTrend, setExchangeRateTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [autoSyncElToque, setAutoSyncElToque] = useState<boolean>(true);
  const [usdIndexedPricing, setUsdIndexedPricing] = useState<boolean>(false);
  const [isSyncingRate, setIsSyncingRate] = useState<boolean>(false);

  useEffect(() => {
    const appUsers = getAppUsers();
    setUsers(appUsers);

    const activeId = getActiveWhatsappUserId();
    setActiveUserId(activeId);

    const currentPhone = getStoreWhatsappNumber();
    setCustomPhone(currentPhone);

    // Currency settings
    const cSettings = getCurrencySettings();
    setCurrencyMode(cSettings.currencyMode);
    setExchangeRateUSD(cSettings.exchangeRateUSD);
    setExchangeRateTrend(cSettings.exchangeRateTrend || 'stable');
    setAutoSyncElToque(cSettings.autoSyncElToque !== undefined ? cSettings.autoSyncElToque : true);
    setUsdIndexedPricing(cSettings.usdIndexedPricing || false);
  }, []);

  const handleSelectUser = (user: AppUser) => {
    const phoneToSave = user.whatsappNumber || customPhone;
    setActiveUserId(user.id);
    saveStoreWhatsappNumber(phoneToSave, user.id);
    onShowToast({
      title: 'Destinatario de Pedidos Actualizado',
      message: `Los pedidos del catálogo se enviarán al WhatsApp de @${user.username} (${user.name}).`,
      type: 'success'
    });
  };

  const handleSaveCustomPhone = () => {
    if (!customPhone.trim()) {
      onShowToast({ title: 'Número Requerido', message: 'Ingresa un número de WhatsApp válido.', type: 'error' });
      return;
    }
    setActiveUserId(undefined);
    saveStoreWhatsappNumber(customPhone.trim(), undefined);
    onShowToast({
      title: 'WhatsApp Guardado',
      message: 'Los pedidos del carrito se dirigirán al número manual especificado.',
      type: 'success'
    });
  };

  const handleSaveRateSettings = (updates: Partial<{ exchangeRateUSD: number; autoSyncElToque: boolean; usdIndexedPricing: boolean; currencyMode: CurrencyMode }>) => {
    const updated = saveCurrencySettings(updates);
    if (updates.exchangeRateUSD !== undefined) setExchangeRateUSD(updated.exchangeRateUSD);
    if (updates.autoSyncElToque !== undefined) setAutoSyncElToque(updated.autoSyncElToque || false);
    if (updates.usdIndexedPricing !== undefined) setUsdIndexedPricing(updated.usdIndexedPricing || false);
    if (updates.currencyMode !== undefined) setCurrencyMode(updated.currencyMode);

    onShowToast({
      title: 'Configuración de Moneda Guardada',
      message: 'Los parámetros de tasa y recálculo se han actualizado.',
      type: 'success'
    });
  };

  const handleManualSyncElToque = async () => {
    setIsSyncingRate(true);
    try {
      const updated = await syncElToqueExchangeRate();
      setExchangeRateUSD(updated.exchangeRateUSD);
      setExchangeRateTrend(updated.exchangeRateTrend || 'stable');
      onShowToast({
        title: 'Tasa Sincronizada con elTOQUE',
        message: `Tasa representativa actualizada: 1 USD = ${updated.exchangeRateUSD} CUP`,
        type: 'success'
      });
    } catch (e) {
      onShowToast({
        title: 'Sincronización Fallida',
        message: 'No se pudo conectar con elTOQUE. Se mantendrá la tasa guardada.',
        type: 'warning'
      });
    } finally {
      setIsSyncingRate(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', width: '100%', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Dynamic Rate & USD Indexing Card */}
      <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            backgroundColor: '#0F766E',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
            flexShrink: 0
          }}>
            <DollarSign size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
              Tasa de Cambio y Recálculo Dinámico (elTOQUE)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', lineHeight: '1.4' }}>
              Control total del mercado informal de divisas y estrategia de precios de la tienda.
            </p>
          </div>
        </div>

        {/* Exchange Rate Control Row */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          padding: '14px 16px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)' }}>
                TASA ACTUAL (1 USD = CUP)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F766E' }}>
                  $ {exchangeRateUSD.toFixed(2)} CUP
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: exchangeRateTrend === 'up' ? '#DC2626' : (exchangeRateTrend === 'down' ? '#16A34A' : '#64748B'),
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {exchangeRateTrend === 'up' && <TrendingUp size={12} />}
                  {exchangeRateTrend === 'down' && <TrendingDown size={12} />}
                  {exchangeRateTrend === 'stable' && <Minus size={12} />}
                  {exchangeRateTrend === 'up' ? 'Subiendo' : (exchangeRateTrend === 'down' ? 'Bajando' : 'Estable')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSyncElToque}
              disabled={isSyncingRate}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #0F766E',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: '#0F766E',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={isSyncingRate ? 'spin' : ''} />
              <span>{isSyncingRate ? 'Sincronizando...' : 'Actualizar de elTOQUE'}</span>
            </button>
          </div>

          {/* Auto-Sync Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--md-sys-color-outline-variant)', paddingTop: '10px', marginTop: '4px' }}>
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <strong style={{ fontSize: '0.84rem', color: 'var(--md-sys-color-on-surface)', display: 'block' }}>
                ⚡ Sincronizar tasa automáticamente con elTOQUE
              </strong>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                {autoSyncElToque
                  ? 'La tasa se actualiza dinámicamente desde elTOQUE (elToque.com) al conectarse.'
                  : 'Sincronización deshabilitada. El propietario ingresa la tasa manualmente.'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoSyncElToque}
              onChange={e => handleSaveRateSettings({ autoSyncElToque: e.target.checked })}
              style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#0F766E' }}
            />
          </div>

          {/* Manual Rate Input */}
          {!autoSyncElToque && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}>Tasa Manual (CUP):</label>
              <input
                type="number"
                step="1"
                value={exchangeRateUSD}
                onChange={e => setExchangeRateUSD(Number(e.target.value))}
                style={{
                  width: '110px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--md-sys-color-outline)',
                  fontWeight: 900,
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleSaveRateSettings({ exchangeRateUSD })}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#0F766E',
                  color: '#FFF',
                  fontWeight: 800,
                  border: 'none',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Guardar Tasa
              </button>
            </div>
          )}
        </div>

        {/* Option 2: USD Indexed Pricing Toggle */}
        <div style={{
          backgroundColor: usdIndexedPricing ? '#F0FDF4' : 'var(--md-sys-color-surface)',
          border: usdIndexedPricing ? '2px solid #16A34A' : '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color={usdIndexedPricing ? '#16A34A' : 'var(--md-sys-color-primary)'} />
              <strong style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                Indexación Dinámica de Precios a USD
              </strong>
            </div>
            <input
              type="checkbox"
              checked={usdIndexedPricing}
              onChange={e => handleSaveRateSettings({ usdIndexedPricing: e.target.checked })}
              style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#16A34A' }}
            />
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.45' }}>
            {usdIndexedPricing ? (
              <span style={{ color: '#15803D', fontWeight: 700 }}>
                ✓ <strong>ACTIVADO:</strong> Los productos registrados en CUP o USD calcularán su precio en CUP dinámicamente según la fluctuación diaria del dólar. El precio en USD se mantendrá fijo.
              </span>
            ) : (
              <span>
                • <strong>DESACTIVADO (Precios Fijos Nativos):</strong> Cada producto conserva su precio fijo en su moneda original. Los artículos agregados en CUP no variarán su precio al cambiar la tasa a menos que el propietario los edite manualmente.
              </span>
            )}
          </p>
        </div>

      </div>

      {/* Target WhatsApp Info Card */}
      <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            backgroundColor: '#25D366',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
            flexShrink: 0
          }}>
            <MessageCircle size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', margin: 0 }}>
              Destinatario de Pedidos WhatsApp
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', lineHeight: '1.4' }}>
              Selecciona cuál propietario o administrador recibirá los pedidos de la tienda online en su número personal.
            </p>
          </div>
        </div>

        {/* Lista de Usuarios Elegibles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', maxWidth: '100%' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seleccionar Usuario Receptor:
          </span>

          {users.map(u => {
            const isSelected = activeUserId === u.id;
            const formatted = formatCubanPhone(u.whatsappNumber);

            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #25D366' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: isSelected ? '#F0FDF4' : 'var(--md-sys-color-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'propietario' ? '#BE185D' : 'var(--md-sys-color-primary-container)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0
                  }}>
                    {u.role === 'propietario' ? <Crown size={18} /> : u.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, backgroundColor: u.role === 'propietario' ? '#FCE7F3' : '#E0F2FE', color: u.role === 'propietario' ? '#BE185D' : '#0284C7', padding: '1px 6px', borderRadius: '6px', flexShrink: 0 }}>
                        {u.role}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, marginTop: '1px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      @{u.username} • {u.whatsappNumber ? formatted.display : 'Sin número asignado'}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isSelected ? (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#25D366', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} />
                    </div>
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--md-sys-color-outline-variant)' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Separador Manual */}
        <div style={{ borderTop: '1px dashed var(--md-sys-color-outline-variant)', paddingTop: '14px', marginTop: '6px', maxWidth: '100%', boxSizing: 'border-box' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
            O Ingresar Número Manual Personalizado:
          </label>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '100%' }}>
            <input
              type="tel"
              placeholder="Ej. 5351234567"
              value={customPhone}
              onChange={e => setCustomPhone(e.target.value)}
              style={{
                flex: '1 1 180px',
                minWidth: 0,
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                fontSize: '0.95rem',
                fontWeight: 700,
                outline: 'none',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={handleSaveCustomPhone}
              className="md-btn"
              style={{
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                padding: '12px 18px',
                fontSize: '0.88rem',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                flexShrink: 0
              }}
            >
              <Check size={18} />
              <span>Guardar</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
