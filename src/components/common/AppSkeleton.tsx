import React from 'react';

/**
 * Componentes de Skeleton Loading profesionales con animación Shimmer.
 * Diseñados para coincidir exactamente 1:1 con la estructura visual de cada pantalla
 * evitando Cumulative Layout Shift (CLS), saltos de pantalla o distorsiones responsive.
 */

export const SkeletonBox: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  style,
  className = ''
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        flexShrink: 0,
        ...style
      }}
    />
  );
};

/**
 * Skeleton para la pantalla de Inicio Rápido (QuickEntryView)
 * Coincide 1:1 con logo Cubasoft, 2 botones gigantes (Gasto/Ingreso),
 * 2 botones de acción (POS/Turnos) y 4 tarjetas de accesos directos.
 */
export const QuickEntrySkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '768px',
      width: '100%',
      margin: '0 auto',
      padding: '20px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      alignItems: 'center',
      minHeight: '75vh',
      justifyContent: 'center'
    }}>
      {/* Brand Header: Logo + Title */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'center' }}>
        <SkeletonBox width="64px" height="64px" borderRadius="18px" />
        <SkeletonBox width="180px" height="28px" borderRadius="8px" />
        <SkeletonBox width="140px" height="14px" borderRadius="6px" />
      </div>

      {/* Main Action Buttons Grid: Registrar Gasto | Registrar Ingreso (2x2 PC, 1 col mobile) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '12px',
        width: '100%'
      }}>
        <SkeletonBox width="100%" height="56px" borderRadius="16px" />
        <SkeletonBox width="100%" height="56px" borderRadius="16px" />
      </div>

      {/* Secondary Action Buttons Grid: Escanear y Vender | Turnos de Caja */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        gap: '12px',
        width: '100%'
      }}>
        <SkeletonBox width="100%" height="52px" borderRadius="16px" />
        <SkeletonBox width="100%" height="52px" borderRadius="16px" />
      </div>

      {/* Accesos Directos Title */}
      <div style={{ width: '100%', marginTop: '6px' }}>
        <SkeletonBox width="120px" height="12px" borderRadius="4px" style={{ marginBottom: '10px' }} />
        
        {/* 4 Accesos Directos Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '10px',
          width: '100%'
        }}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="md-card"
              style={{
                padding: '12px 14px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'var(--md-sys-color-surface)'
              }}
            >
              <SkeletonBox width="40px" height="40px" borderRadius="12px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <SkeletonBox width="70%" height="15px" borderRadius="4px" />
                <SkeletonBox width="45%" height="11px" borderRadius="4px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para la pantalla principal (Dashboard / Finanzas del Hogar)
 * Coincide 1:1 con las 4 StatCards y la lista de Últimos Movimientos.
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Title + Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width="160px" height="26px" borderRadius="8px" />
        <SkeletonBox width="110px" height="38px" borderRadius="12px" />
      </div>

      {/* 4 Stat Cards: Ingresos, Gastos, Fondo Casa, Fondo Negocio */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
        gap: '12px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderRadius: '18px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="110px" height="14px" borderRadius="4px" />
              <SkeletonBox width="32px" height="32px" borderRadius="10px" />
            </div>
            <SkeletonBox width="70%" height="26px" borderRadius="6px" />
            <SkeletonBox width="50%" height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Recent Transactions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width="150px" height="18px" borderRadius="6px" />
          <SkeletonBox width="75px" height="14px" borderRadius="4px" />
        </div>

        <div className="md-card" style={{ padding: '8px 16px', borderRadius: '18px', backgroundColor: 'var(--md-sys-color-surface)' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                padding: '12px 0',
                borderBottom: i < 5 ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <SkeletonBox width="36px" height="36px" borderRadius="10px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: 0 }}>
                  <SkeletonBox width="55%" height="15px" borderRadius="4px" />
                  <SkeletonBox width="35%" height="11px" borderRadius="4px" />
                </div>
              </div>
              <SkeletonBox width="70px" height="18px" borderRadius="6px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para la pantalla de Gestión de Tienda (Inventario & POS)
 * Coincide 1:1 con 4 StatCards de Tienda, botones de acción, tabs y productos.
 */
export const StoreManagementSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Top Header: Title + QR Sync + Publicar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <SkeletonBox width="150px" height="26px" borderRadius="8px" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <SkeletonBox width="80px" height="36px" borderRadius="12px" />
          <SkeletonBox width="95px" height="36px" borderRadius="12px" />
        </div>
      </div>

      {/* 4 Store Stat Cards: Fondo, Inventario, Ganancias, Ventas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
        gap: '12px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderRadius: '18px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="110px" height="14px" borderRadius="4px" />
              <SkeletonBox width="28px" height="28px" borderRadius="8px" />
            </div>
            <SkeletonBox width="65%" height="24px" borderRadius="6px" />
            <SkeletonBox width="45%" height="16px" borderRadius="6px" />
          </div>
        ))}
      </div>

      {/* Main Button: Escanear y Vender */}
      <SkeletonBox width="100%" height="52px" borderRadius="16px" />

      {/* Secondary Buttons Grid: Turnos de Caja & Tasaciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SkeletonBox width="100%" height="50px" borderRadius="16px" />
        <SkeletonBox width="100%" height="50px" borderRadius="16px" />
      </div>

      {/* Subtabs Nav Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden', padding: '4px 0' }}>
        {[100, 110, 95, 120, 85].map((w, i) => (
          <SkeletonBox key={i} width={`${w}px`} height="36px" borderRadius="9999px" />
        ))}
      </div>

      {/* Products Inventory List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <SkeletonBox width="44px" height="44px" borderRadius="10px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                <SkeletonBox width="60%" height="15px" borderRadius="4px" />
                <SkeletonBox width="35%" height="12px" borderRadius="4px" />
              </div>
            </div>
            <SkeletonBox width="75px" height="20px" borderRadius="6px" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton para la pantalla de Reportes y Facturación (ReportView)
 */
export const ReportsSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Header + Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <SkeletonBox width="170px" height="26px" borderRadius="8px" />
        <SkeletonBox width="100px" height="36px" borderRadius="12px" />
      </div>

      {/* Date Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden' }}>
        {[70, 95, 90, 80, 110].map((w, i) => (
          <SkeletonBox key={i} width={`${w}px`} height="34px" borderRadius="9999px" />
        ))}
      </div>

      {/* 3 Summary Cards: Ingresos, Gastos, Balance Neto */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: '12px'
      }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '16px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <SkeletonBox width="100px" height="13px" borderRadius="4px" />
            <SkeletonBox width="65%" height="24px" borderRadius="6px" />
            <SkeletonBox width="40%" height="13px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Report Items List */}
      <div className="md-card" style={{ padding: '16px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--md-sys-color-surface)' }}>
        <SkeletonBox width="140px" height="18px" borderRadius="6px" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--md-sys-color-outline-variant)' : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <SkeletonBox width="50%" height="15px" borderRadius="4px" />
              <SkeletonBox width="30%" height="11px" borderRadius="4px" />
            </div>
            <SkeletonBox width="65px" height="18px" borderRadius="6px" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton para la pantalla de Ajustes y Configuración (SettingsModal)
 */
export const SettingsSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '768px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header Card */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '24px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <SkeletonBox width="46px" height="46px" borderRadius="16px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <SkeletonBox width="160px" height="20px" borderRadius="6px" />
          <SkeletonBox width="110px" height="12px" borderRadius="4px" />
        </div>
      </div>

      {/* Category 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBox width="140px" height="13px" borderRadius="4px" style={{ marginLeft: '4px' }} />
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <SkeletonBox width="42px" height="42px" borderRadius="14px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <SkeletonBox width="55%" height="15px" borderRadius="4px" />
                <SkeletonBox width="40%" height="11px" borderRadius="4px" />
              </div>
            </div>
            <SkeletonBox width="18px" height="18px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Category 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBox width="140px" height="13px" borderRadius="4px" style={{ marginLeft: '4px' }} />
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '14px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              backgroundColor: 'var(--md-sys-color-surface)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <SkeletonBox width="42px" height="42px" borderRadius="14px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <SkeletonBox width="55%" height="15px" borderRadius="4px" />
                <SkeletonBox width="40%" height="11px" borderRadius="4px" />
              </div>
            </div>
            <SkeletonBox width="18px" height="18px" borderRadius="4px" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton global del cascarón de la aplicación (Header + Main Area)
 * Se muestra durante la carga inicial en AccountingAppView evitando saltos de layout.
 */
export const AppLayoutSkeleton: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--md-sys-color-background)'
    }}>
      {/* Top Header Placeholder */}
      <header style={{
        height: '62px',
        padding: '0 clamp(12px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--md-sys-color-surface-container, #FFFFFF)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonBox width="38px" height="38px" borderRadius="10px" />
          <SkeletonBox width="120px" height="20px" borderRadius="6px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SkeletonBox width="34px" height="34px" borderRadius="10px" />
          <SkeletonBox width="34px" height="34px" borderRadius="10px" />
          <SkeletonBox width="34px" height="34px" borderRadius="10px" />
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto',
        padding: '24px 16px 120px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <QuickEntrySkeleton />
      </main>
    </div>
  );
};

/**
 * Skeleton Premium Completo para la Tienda Pública Marketplace (PublicStoreSkeleton)
 * Coincide 1:1 con la estructura visual exacta de la tienda tanto en Desktop (Web) como en Mobile:
 * 1. Header Bar superior con 2 niveles (Barra oscura + buscador central en PC / barra móvil + selector moneda + carrito + sub-barra categorías)
 * 2. Hero Banner (Fondo gradiente con H1, badges, botones CTAs y tarjeta glassmorphism a la derecha con isotipo centrado)
 * 3. Hub de Categorías (Carrusel horizontal deslizable en móvil, cuadrícula en PC)
 * 4. Vitrina de Destacados con grid responsivo (2 columnas en móvil, 4-5 en PC)
 * 5. Barra de Herramientas (Buscador/Filtros)
 * 6. Cuadrícula de Productos del Catálogo
 * 7. Footer Estructurado con 4 columnas y copyright
 */
export const PublicStoreSkeleton: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* 1. HEADER BAR DE 2 NIVELES */}
      <header style={{
        backgroundColor: 'var(--brand-primary-darker, #0B1528)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.2)'
      }}>
        {/* Nivel 1: Barra Principal */}
        <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="store-container" style={{
            paddingTop: '10px',
            paddingBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Izquierda: Menú Móvil + Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {/* Botón hamburguesa sólo en mobile */}
                <div className="mobile-flex">
                  <SkeletonBox width="38px" height="38px" borderRadius="10px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                </div>
                {/* Logo tienda */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SkeletonBox width="36px" height="36px" borderRadius="10px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                  <div className="desktop-only">
                    <SkeletonBox width="110px" height="20px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  </div>
                </div>
              </div>

              {/* Centro: Buscador PC Integrado */}
              <div className="desktop-only" style={{ flex: 1, maxWidth: '640px', margin: '0 12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '9999px',
                  height: '42px',
                  padding: '4px 6px 4px 14px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
                  gap: '10px'
                }}>
                  <SkeletonBox width="90px" height="24px" borderRadius="6px" style={{ backgroundColor: '#E2E8F0' }} />
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#CBD5E1' }} />
                  <SkeletonBox width="60%" height="18px" borderRadius="6px" style={{ backgroundColor: '#F1F5F9' }} />
                  <div style={{ marginLeft: 'auto' }}>
                    <SkeletonBox width="34px" height="34px" borderRadius="9999px" style={{ backgroundColor: 'var(--brand-primary, #1A73E8)' }} />
                  </div>
                </div>
              </div>

              {/* Derecha: Moneda, WhatsApp, Carrito y Acceso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Selector Moneda */}
                <SkeletonBox width="74px" height="30px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                
                {/* WhatsApp PC */}
                <div className="desktop-flex">
                  <SkeletonBox width="105px" height="36px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Carrito */}
                <SkeletonBox width="42px" height="38px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

                {/* Acceso / Login */}
                <div className="desktop-flex">
                  <SkeletonBox width="90px" height="36px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </div>
              </div>
            </div>

            {/* Buscador Móvil */}
            <div className="mobile-only" style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '9999px',
                height: '38px',
                padding: '0 12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
                gap: '8px'
              }}>
                <SkeletonBox width="18px" height="18px" borderRadius="9999px" style={{ backgroundColor: '#94A3B8' }} />
                <SkeletonBox width="70%" height="16px" borderRadius="6px" style={{ backgroundColor: '#E2E8F0' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Nivel 2: Sub-barra de Categorías */}
        <div style={{
          backgroundColor: 'var(--brand-primary-subtle-dark, #162440)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div className="store-container no-scrollbar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingTop: '6px',
            paddingBottom: '6px'
          }}>
            {[75, 90, 85, 110, 95, 100, 80, 105].map((w, i) => (
              <SkeletonBox
                key={i}
                width={`${w}px`}
                height="28px"
                borderRadius="9999px"
                style={{ backgroundColor: i === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER RESPONSIVO */}
      <section style={{
        width: '100%',
        margin: 0,
        background: 'linear-gradient(135deg, var(--brand-primary-darker, #0B1528) 0%, var(--brand-primary-dark, #1E3A8A) 58%, var(--brand-primary, #1A73E8) 100%)',
        padding: '36px 0 42px 0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)'
      }}>
        <div className="store-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '36px',
            alignItems: 'center'
          }} className="hero-grid-desktop">
            {/* Columna Izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '780px' }}>
              {/* Badge Novedades */}
              <SkeletonBox width="200px" height="26px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              
              {/* H1 Titular (2 líneas) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonBox width="90%" height="38px" borderRadius="10px" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
                <SkeletonBox width="65%" height="38px" borderRadius="10px" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
              </div>

              {/* Párrafo descriptivo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBox width="85%" height="16px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} />
                <SkeletonBox width="70%" height="16px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }} />
              </div>

              {/* Botones CTAs */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                <SkeletonBox width="170px" height="46px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <SkeletonBox width="180px" height="46px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Badges de confianza */}
              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.16)'
              }}>
                <SkeletonBox width="140px" height="18px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                <SkeletonBox width="130px" height="18px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                <div className="desktop-flex">
                  <SkeletonBox width="135px" height="18px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                </div>
              </div>
            </div>

            {/* Columna Derecha Glassmorphism (Desktop) */}
            <div className="desktop-only" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255, 255, 255, 0.28)',
                borderRadius: '28px',
                padding: '28px 24px',
                width: '100%',
                maxWidth: '380px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Isotipo Centrado Cuadrado */}
                <SkeletonBox width="76px" height="76px" borderRadius="20px" style={{ backgroundColor: 'rgba(255,255,255,0.24)' }} />
                
                {/* 3 Filas de ventajas */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.16)'
                    }}>
                      <SkeletonBox width="28px" height="28px" borderRadius="8px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                        <SkeletonBox width="70%" height="14px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }} />
                        <SkeletonBox width="50%" height="10px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="store-container" style={{ paddingTop: '28px', paddingBottom: '80px', flex: 1 }}>
        {/* Hub de Categorías */}
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <SkeletonBox width="22px" height="22px" borderRadius="6px" />
            <SkeletonBox width="130px" height="22px" borderRadius="6px" />
          </div>

          <div className="marketplace-cat-layout no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div
                key={i}
                className="marketplace-cat-card"
                style={{
                  padding: '10px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <SkeletonBox width="40px" height="40px" borderRadius="11px" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: 0 }}>
                  <SkeletonBox width="75%" height="14px" borderRadius="4px" />
                  <SkeletonBox width="45%" height="10px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vitrina Destacados */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SkeletonBox width="34px" height="34px" borderRadius="10px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <SkeletonBox width="190px" height="22px" borderRadius="6px" />
                <div className="desktop-only">
                  <SkeletonBox width="240px" height="13px" borderRadius="4px" />
                </div>
              </div>
            </div>
            <div className="desktop-only">
              <SkeletonBox width="130px" height="26px" borderRadius="9999px" />
            </div>
          </div>

          {/* Grid de Productos Destacados (2 en móvil, 4-5 en PC) */}
          <div className="store-product-grid">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="store-product-card"
                style={{
                  padding: '10px',
                  borderRadius: '20px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #F1F5F9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Imagen Cuadrada 1:1 */}
                <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
                  <SkeletonBox width="100%" height="100%" borderRadius="14px" />
                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    <SkeletonBox width="68px" height="20px" borderRadius="9999px" />
                  </div>
                </div>

                {/* Categoría y Nombre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonBox width="45%" height="11px" borderRadius="4px" />
                  <SkeletonBox width="90%" height="16px" borderRadius="4px" />
                  <SkeletonBox width="65%" height="16px" borderRadius="4px" />
                </div>

                {/* Precio y Botón Agregar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  paddingTop: '6px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <SkeletonBox width="80px" height="22px" borderRadius="6px" />
                    <SkeletonBox width="50px" height="11px" borderRadius="4px" />
                  </div>
                  <SkeletonBox width="36px" height="36px" borderRadius="10px" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Barra de Filtros y Orden */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '10px 14px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <SkeletonBox width="120px" height="20px" borderRadius="6px" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBox width="110px" height="34px" borderRadius="10px" />
            <SkeletonBox width="110px" height="34px" borderRadius="10px" />
          </div>
        </div>

        {/* Catálogo Principal Grid (8 items) */}
        <div className="store-product-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="store-product-card"
              style={{
                padding: '10px',
                borderRadius: '20px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #F1F5F9',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1 / 1', position: 'relative' }}>
                <SkeletonBox width="100%" height="100%" borderRadius="14px" />
                <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  <SkeletonBox width="64px" height="18px" borderRadius="9999px" />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonBox width="40%" height="11px" borderRadius="4px" />
                <SkeletonBox width="85%" height="15px" borderRadius="4px" />
                <SkeletonBox width="60%" height="15px" borderRadius="4px" />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
                paddingTop: '6px'
              }}>
                <SkeletonBox width="75px" height="20px" borderRadius="6px" />
                <SkeletonBox width="34px" height="34px" borderRadius="10px" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 4. FOOTER ESTRUCTURADO */}
      <footer style={{
        backgroundColor: 'var(--brand-primary-darker, #0B1528)',
        color: '#FFFFFF',
        padding: '48px 0 24px 0',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="store-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '32px',
            marginBottom: '36px'
          }}>
            {/* Columna 1: Marca */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SkeletonBox width="38px" height="38px" borderRadius="10px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <SkeletonBox width="120px" height="22px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }} />
              </div>
              <SkeletonBox width="90%" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
              <SkeletonBox width="75%" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }} />
            </div>

            {/* Columna 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonBox width="110px" height="16px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              {[1, 2, 3, 4].map(k => (
                <SkeletonBox key={k} width="70%" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
              ))}
            </div>

            {/* Columna 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonBox width="100px" height="16px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              {[1, 2, 3, 4].map(k => (
                <SkeletonBox key={k} width="65%" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
              ))}
            </div>

            {/* Columna 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SkeletonBox width="130px" height="16px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <SkeletonBox width="100%" height="42px" borderRadius="9999px" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <SkeletonBox width="45px" height="26px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <SkeletonBox width="45px" height="26px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <SkeletonBox width="45px" height="26px" borderRadius="6px" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
              </div>
            </div>
          </div>

          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <SkeletonBox width="180px" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <SkeletonBox width="120px" height="12px" borderRadius="4px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * StoreCatalogSkeleton (alias de PublicStoreSkeleton)
 */
export const StoreCatalogSkeleton: React.FC = () => {
  return <PublicStoreSkeleton />;
};

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Placeholder */}
      <header style={{ backgroundColor: '#0F172A', color: '#FFFFFF', padding: '14px 16px' }}>
        <div className="store-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonBox width="140px" height="24px" borderRadius="8px" />
          <SkeletonBox width="120px" height="32px" borderRadius="10px" />
          <SkeletonBox width="90px" height="34px" borderRadius="9999px" />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="store-container" style={{ padding: '24px 16px 80px 16px', flex: 1, maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation Placeholder */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <SkeletonBox width="60px" height="16px" borderRadius="4px" />
          <SkeletonBox width="14px" height="16px" borderRadius="4px" />
          <SkeletonBox width="80px" height="16px" borderRadius="4px" />
          <SkeletonBox width="14px" height="16px" borderRadius="4px" />
          <SkeletonBox width="120px" height="16px" borderRadius="4px" />
        </div>

        {/* 2-Column Product Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Left Column: Product Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SkeletonBox width="100%" height="340px" borderRadius="24px" />
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <SkeletonBox key={i} width="64px" height="64px" borderRadius="14px" />
              ))}
            </div>
          </div>

          {/* Right Column: Details, Price & CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="100px" height="26px" borderRadius="9999px" />
              <SkeletonBox width="80px" height="18px" borderRadius="6px" />
            </div>

            <SkeletonBox width="85%" height="32px" borderRadius="8px" />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
              <SkeletonBox width="140px" height="38px" borderRadius="10px" />
              <SkeletonBox width="90px" height="22px" borderRadius="6px" />
            </div>

            {/* Feature specs cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              <SkeletonBox width="100%" height="56px" borderRadius="14px" />
              <SkeletonBox width="100%" height="56px" borderRadius="14px" />
            </div>

            {/* Quantity and CTA Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <SkeletonBox width="130px" height="42px" borderRadius="12px" />
              <SkeletonBox width="100%" height="52px" borderRadius="16px" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => {
  return (
    <div className="md-card" style={{ padding: '16px', overflowX: 'auto', borderRadius: '18px', backgroundColor: 'var(--md-sys-color-surface)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Table Header Row */}
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: '1.5px solid var(--md-sys-color-outline-variant)' }}>
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBox key={c} width={`${100 / columns}%`} height="18px" borderRadius="6px" />
          ))}
        </div>
        {/* Table Body Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)', alignItems: 'center' }}>
            {Array.from({ length: columns }).map((_, c) => (
              <SkeletonBox key={c} width={`${100 / columns}%`} height="16px" borderRadius="4px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
