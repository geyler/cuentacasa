import React from 'react';
import { Lock, KeyRound, Save, Users, Server, RefreshCw, RotateCcw, Sparkles, Download, Trash2 } from 'lucide-react';

interface SettingsSecurityViewProps {
  hasPin: boolean;
  isEditingPin: boolean;
  newPin: string;
  onSetIsEditingPin: (editing: boolean) => void;
  onSetNewPin: (pin: string) => void;
  onSavePin: (e: React.FormEvent) => void;
  onRemovePin: () => void;
  usersCount: number;
  onOpenUsersSubView: () => void;
  onSync: () => void;
  isSyncing: boolean;
  pendingSyncCount: number;
  onClearCache: () => void;
  onTotalCacheReset: () => void;
  onOpenRawDb?: () => void;
  onOpenMasterPassModal: () => void;
}

export const SettingsSecurityView: React.FC<SettingsSecurityViewProps> = ({
  hasPin,
  isEditingPin,
  newPin,
  onSetIsEditingPin,
  onSetNewPin,
  onSavePin,
  onRemovePin,
  usersCount,
  onOpenUsersSubView,
  onSync,
  isSyncing,
  pendingSyncCount,
  onClearCache,
  onTotalCacheReset,
  onOpenRawDb,
  onOpenMasterPassModal
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* PIN Management Card */}
      <div className="md-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Lock size={20} color="var(--md-sys-color-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>PIN de Seguridad Personal (4 Dígitos)</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px', lineHeight: 1.5 }}>
          Permite desbloqueos rápidos de sesión en el punto de venta y confirma arqueos de caja sin tener que ingresar contraseñas largas.
        </p>

        <div style={{
          padding: '16px',
          borderRadius: '16px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Estado del PIN:</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: hasPin ? '#059669' : 'var(--md-sys-color-on-surface-variant)' }}>
              {hasPin ? '🔐 Activado y Protegido (••••)' : '🔓 Sin PIN configurado'}
            </span>
          </div>

          {!isEditingPin ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => { onSetIsEditingPin(true); onSetNewPin(''); }}
                className="md-btn md-btn-secondary"
                style={{ padding: '9px 16px', fontSize: '0.82rem', borderRadius: '12px' }}
              >
                <KeyRound size={16} />
                <span>{hasPin ? 'Cambiar PIN' : 'Configurar PIN'}</span>
              </button>

              {hasPin && (
                <button
                  type="button"
                  onClick={onRemovePin}
                  style={{
                    padding: '9px 14px',
                    fontSize: '0.82rem',
                    borderRadius: '12px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Desactivar PIN
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => onSetNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 dígitos..."
                autoFocus
                style={{
                  width: '120px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.2em'
                }}
              />
              <button
                type="button"
                onClick={onSavePin}
                className="md-btn md-btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.82rem', borderRadius: '12px' }}
              >
                <Save size={16} />
                <span>Guardar PIN</span>
              </button>
              <button
                type="button"
                onClick={() => { onSetIsEditingPin(false); onSetNewPin(''); }}
                className="md-btn md-btn-secondary"
                style={{ padding: '10px 14px', fontSize: '0.82rem', borderRadius: '12px' }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Management Entry Card */}
      <div className="md-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--md-sys-color-primary)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Administración de Usuarios y Permisos</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>
                Control de roles (Propietario, Administrador, Vendedor) y acceso al punto de venta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenUsersSubView}
            className="md-btn md-btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.85rem', borderRadius: '12px' }}
          >
            <Users size={16} />
            <span>Ver y Gestionar Usuarios ({usersCount})</span>
          </button>
        </div>
      </div>

      {/* Database Connection Status Card */}
      <div className="md-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={22} color="var(--md-sys-color-primary)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Base de Datos Local MySQL</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                Conexión directa a schema <strong>cuentacasa</strong> en 127.0.0.1:3306
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="md-btn md-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '12px' }}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
            </button>
          </div>
        </div>

        <div style={{
          padding: '14px',
          borderRadius: '14px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem'
        }}>
          <span>Operaciones pendientes en cola de sincronización:</span>
          <strong style={{ color: pendingSyncCount > 0 ? 'var(--md-sys-color-warning)' : '#059669', fontSize: '0.9rem' }}>
            {pendingSyncCount} pendientes
          </strong>
        </div>
      </div>

      {/* Cache Maintenance Actions */}
      <div className="md-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px 0' }}>Mantenimiento y Caché</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
          
          <button
            type="button"
            onClick={onClearCache}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <RotateCcw size={20} color="var(--md-sys-color-primary)" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Recargar Caché de la Aplicación</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Actualiza Service Worker y limpia caché de red sin borrar tus datos.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onTotalCacheReset}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Sparkles size={20} color="#D97706" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Reset Total de Caché</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Recomendado si notas problemas de visualización o caché rebelde.
              </div>
            </div>
          </button>

        </div>
      </div>

      {/* Reset / Backup Database */}
      <div className="md-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 12px 0' }}>Respaldo y Reinicio Seguro</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          
          {onOpenRawDb && (
            <button
              type="button"
              onClick={onOpenRawDb}
              className="md-btn md-btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.84rem', borderRadius: '12px' }}
            >
              <Download size={16} />
              <span>Ver / Descargar Base de Datos (JSON)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMasterPassModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #FCA5A5',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            <span>Reiniciar Base de Datos (Conserva Usuarios)</span>
          </button>

        </div>
      </div>

    </div>
  );
};

