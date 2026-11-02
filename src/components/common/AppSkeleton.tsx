import React from 'react';

/**
 * Componentes de Skeleton Loading profesionales con animación Shimmer.
 * Evitan pestañeos, FOUC y saltos de layout (Cumulative Layout Shift) en toda la web y la app.
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

export const StoreCatalogSkeleton: React.FC = () => {
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Placeholder */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderRadius: '16px',
        backgroundColor: 'var(--md-sys-color-surface)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonBox width="42px" height="42px" borderRadius="12px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonBox width="140px" height="18px" borderRadius="6px" />
            <SkeletonBox width="90px" height="12px" borderRadius="4px" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <SkeletonBox width="80px" height="36px" borderRadius="10px" />
          <SkeletonBox width="42px" height="42px" borderRadius="12px" />
        </div>
      </div>

      {/* Hero Banner Placeholder */}
      <div style={{
        height: '240px',
        borderRadius: '24px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '14px',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }} className="skeleton-shimmer">
        <SkeletonBox width="130px" height="24px" borderRadius="9999px" />
        <SkeletonBox width="60%" height="32px" borderRadius="8px" />
        <SkeletonBox width="40%" height="18px" borderRadius="6px" />
      </div>

      {/* Categories Horizontal Carousel Placeholder */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'hidden' }}>
        {[80, 110, 95, 120, 90, 105].map((w, i) => (
          <SkeletonBox key={i} width={`${w}px`} height="38px" borderRadius="9999px" />
        ))}
      </div>

      {/* Products Grid Placeholder */}
      <div className="store-product-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '12px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <SkeletonBox width="100%" height="180px" borderRadius="16px" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="70px" height="16px" borderRadius="6px" />
              <SkeletonBox width="50px" height="16px" borderRadius="6px" />
            </div>
            <SkeletonBox width="85%" height="20px" borderRadius="6px" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <SkeletonBox width="90px" height="24px" borderRadius="6px" />
              <SkeletonBox width="36px" height="36px" borderRadius="10px" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      minHeight: '100dvh'
    }}>
      {/* Top Header Placeholder */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        borderRadius: '18px',
        backgroundColor: 'var(--md-sys-color-surface)',
        border: '1px solid var(--md-sys-color-outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonBox width="42px" height="42px" borderRadius="12px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonBox width="130px" height="18px" borderRadius="6px" />
            <SkeletonBox width="85px" height="12px" borderRadius="4px" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <SkeletonBox width="38px" height="38px" borderRadius="10px" />
          <SkeletonBox width="38px" height="38px" borderRadius="10px" />
          <SkeletonBox width="90px" height="38px" borderRadius="12px" />
        </div>
      </div>

      {/* Stat Cards Placeholder (4 cards: Ingresos, Gastos, Casa, Negocio) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '18px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="90px" height="16px" borderRadius="6px" />
              <SkeletonBox width="32px" height="32px" borderRadius="10px" />
            </div>
            <SkeletonBox width="65%" height="32px" borderRadius="8px" />
            <SkeletonBox width="45%" height="14px" borderRadius="4px" />
          </div>
        ))}
      </div>

      {/* Tabs / Filter Nav Placeholder */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden' }}>
        {[90, 110, 95, 120, 85].map((w, idx) => (
          <SkeletonBox key={idx} width={`${w}px`} height="40px" borderRadius="12px" />
        ))}
      </div>

      {/* Content List Items Placeholder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="md-card"
            style={{
              padding: '14px 18px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <SkeletonBox width="36px" height="36px" borderRadius="10px" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <SkeletonBox width="55%" height="16px" borderRadius="6px" />
                <SkeletonBox width="35%" height="12px" borderRadius="4px" />
              </div>
            </div>
            <SkeletonBox width="85px" height="20px" borderRadius="6px" />
          </div>
        ))}
      </div>

    </div>
  );
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          {/* Left Column: Product Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SkeletonBox width="100%" height="380px" borderRadius="24px" />
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <SkeletonBox key={i} width="70px" height="70px" borderRadius="14px" />
              ))}
            </div>
          </div>

          {/* Right Column: Details, Price & CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="100px" height="26px" borderRadius="9999px" />
              <SkeletonBox width="80px" height="18px" borderRadius="6px" />
            </div>

            <SkeletonBox width="85%" height="36px" borderRadius="8px" />

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
              <SkeletonBox width="160px" height="42px" borderRadius="10px" />
              <SkeletonBox width="100px" height="24px" borderRadius="6px" />
            </div>

            {/* Feature specs cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              <SkeletonBox width="100%" height="60px" borderRadius="14px" />
              <SkeletonBox width="100%" height="60px" borderRadius="14px" />
            </div>

            {/* Quantity and CTA Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <SkeletonBox width="140px" height="44px" borderRadius="12px" />
              <SkeletonBox width="100%" height="54px" borderRadius="16px" />
            </div>
          </div>
        </div>

        {/* Related Products Grid Placeholder */}
        <div style={{ marginTop: '56px' }}>
          <SkeletonBox width="200px" height="24px" borderRadius="6px" style={{ marginBottom: '18px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="md-card" style={{ padding: '12px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <SkeletonBox width="100%" height="160px" borderRadius="14px" />
                <SkeletonBox width="70%" height="18px" borderRadius="6px" />
                <SkeletonBox width="45%" height="22px" borderRadius="6px" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => {
  return (
    <div className="md-card" style={{ padding: '16px', overflowX: 'auto' }}>
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
