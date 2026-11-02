import React from 'react';
import { Layers, Info, Sparkles, Users, CreditCard, Clock, ExternalLink } from 'lucide-react';
import { StoreModulesConfig } from '@/types';

interface SettingsModulesViewProps {
  storeModules: StoreModulesConfig;
  onToggleModule: (key: keyof StoreModulesConfig, val: boolean) => void;
}

const menuBadgeStyle = (variant: 'neutral' | 'success' | 'warning' = 'neutral'): React.CSSProperties => {
  let bg = 'var(--md-sys-color-surface-container-high)';
  let color = 'var(--md-sys-color-on-surface-variant)';
  if (variant === 'warning') {
    bg = 'rgba(217, 119, 6, 0.15)';
    color = '#D97706';
  } else if (variant === 'success') {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = '#059669';
  }
  return {
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: bg,
    color: color,
    display: 'inline-flex',
    alignItems: 'center'
  };
};

export const SettingsModulesView: React.FC<SettingsModulesViewProps> = ({
  storeModules,
  onToggleModule
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Card */}
      <div className="md-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Layers size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 900, margin: 0 }}>
              Módulos y Secciones Activas del Sistema
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
              Personaliza tu ERP según el rubro de tu tienda (ropa, calzado, tecnología, ferretería, alimentos).
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '14px',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          marginTop: '12px',
          fontSize: '0.8rem',
          color: 'var(--md-sys-color-on-surface)'
        }}>
          <Info size={18} color="var(--md-sys-color-primary)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Modo Simplificado Seguro:</strong> Ocultar una sección retira sus botones y campos de los formularios para que el registro sea ultra-rápido. Los registros históricos y transacciones previas se conservan 100% seguros sin eliminarse.
          </span>
        </div>
      </div>

      {/* Tarjetas de Módulos con Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Módulo 1: Trazabilidad de Alimentos y Vencimientos */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: storeModules.enableFoodTraceability ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--md-shadow-elevation-1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: storeModules.enableFoodTraceability ? 'rgba(16, 185, 129, 0.12)' : 'var(--md-sys-color-surface-container-high)',
                color: storeModules.enableFoodTraceability ? '#059669' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    Trazabilidad de Alimentos y Vencimientos
                  </span>
                  <span style={menuBadgeStyle(storeModules.enableFoodTraceability ? 'success' : 'neutral')}>
                    {storeModules.enableFoodTraceability ? 'Activo (Alimentos / Supermercados)' : 'Desactivado (Tienda de Ropa / Tech)'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  Control de fechas de caducidad (EXP), fecha de elaboración (MFG), lotes y el <strong>Libro Oficial de Tasaciones y Vencimientos</strong>.
                </p>
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={storeModules.enableFoodTraceability}
                onChange={e => onToggleModule('enableFoodTraceability', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: storeModules.enableFoodTraceability ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                borderRadius: '34px',
                transition: '0.2s',
                display: 'block'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '22px',
                  width: '22px',
                  left: storeModules.enableFoodTraceability ? '25px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Módulo 2: Proveedores y Cuentas por Pagar */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: storeModules.enableSuppliers ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--md-shadow-elevation-1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: storeModules.enableSuppliers ? 'rgba(37, 99, 235, 0.12)' : 'var(--md-sys-color-surface-container-high)',
                color: storeModules.enableSuppliers ? '#2563EB' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    Gestión de Proveedores y Liquidaciones
                  </span>
                  <span style={menuBadgeStyle(storeModules.enableSuppliers ? 'success' : 'neutral')}>
                    {storeModules.enableSuppliers ? 'Activo' : 'Solo Mercancía Propia'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  Control de mercancías a consignación, cálculo de ganancias divididas y abonos a proveedores en CUP y USD.
                </p>
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={storeModules.enableSuppliers}
                onChange={e => onToggleModule('enableSuppliers', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: storeModules.enableSuppliers ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                borderRadius: '34px',
                transition: '0.2s',
                display: 'block'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '22px',
                  width: '22px',
                  left: storeModules.enableSuppliers ? '25px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Módulo 3: Libreta de Fiados y Deudas de Clientes */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: storeModules.enableCustomerDebts ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--md-shadow-elevation-1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: storeModules.enableCustomerDebts ? 'rgba(239, 68, 68, 0.12)' : 'var(--md-sys-color-surface-container-high)',
                color: storeModules.enableCustomerDebts ? '#DC2626' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    Libreta de Fiados y Deudas de Clientes
                  </span>
                  <span style={menuBadgeStyle(storeModules.enableCustomerDebts ? 'success' : 'neutral')}>
                    {storeModules.enableCustomerDebts ? 'Activo' : 'Solo Ventas al Contado'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  Registro de deudas a clientes, abonos parciales, saldo pendiente y libretas de cobro.
                </p>
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={storeModules.enableCustomerDebts}
                onChange={e => onToggleModule('enableCustomerDebts', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: storeModules.enableCustomerDebts ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                borderRadius: '34px',
                transition: '0.2s',
                display: 'block'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '22px',
                  width: '22px',
                  left: storeModules.enableCustomerDebts ? '25px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Módulo 4: Turnos de Caja y Arqueos */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: storeModules.enableShiftManagement ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--md-shadow-elevation-1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: storeModules.enableShiftManagement ? 'rgba(124, 58, 237, 0.12)' : 'var(--md-sys-color-surface-container-high)',
                color: storeModules.enableShiftManagement ? '#7C3AED' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    Turnos de Caja y Dependientes
                  </span>
                  <span style={menuBadgeStyle(storeModules.enableShiftManagement ? 'success' : 'neutral')}>
                    {storeModules.enableShiftManagement ? 'Turnos Activos' : 'Caja Continua (Sin Turnos)'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  Control de apertura, fondo de caja, dependientes y arqueo al cierre. Si atiendes personalmente, puedes desactivarlo; el informe y control de inventario IPV se mantiene permanentemente disponible.
                </p>
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={storeModules.enableShiftManagement}
                onChange={e => onToggleModule('enableShiftManagement', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: storeModules.enableShiftManagement ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                borderRadius: '34px',
                transition: '0.2s',
                display: 'block'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '22px',
                  width: '22px',
                  left: storeModules.enableShiftManagement ? '25px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Módulo 5: Enlaces Externos y Cotizaciones Directas */}
        <div style={{
          padding: '18px 20px',
          borderRadius: '18px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: storeModules.enableExternalProducts ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: 'var(--md-shadow-elevation-1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: storeModules.enableExternalProducts ? 'rgba(245, 158, 11, 0.12)' : 'var(--md-sys-color-surface-container-high)',
                color: storeModules.enableExternalProducts ? '#D97706' : 'var(--md-sys-color-on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ExternalLink size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    Enlaces Externos y Cotizaciones Directas
                  </span>
                  <span style={menuBadgeStyle(storeModules.enableExternalProducts ? 'success' : 'neutral')}>
                    {storeModules.enableExternalProducts ? 'Activo' : 'Solo Catálogo Local'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  Permite asociar productos a enlaces web directos o botones de cotización directa por WhatsApp con otros proveedores.
                </p>
              </div>
            </div>

            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={storeModules.enableExternalProducts}
                onChange={e => onToggleModule('enableExternalProducts', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: storeModules.enableExternalProducts ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
                borderRadius: '34px',
                transition: '0.2s',
                display: 'block'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '22px',
                  width: '22px',
                  left: storeModules.enableExternalProducts ? '25px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '50%',
                  transition: '0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};

