'use client';

import React, { useState, useEffect } from 'react';
import { StoreCustomizationSettings } from '@/types';
import { getStoreCustomizationSettings } from '@/lib/storage';

export interface StoreBrandDisplayProps {
  customization?: StoreCustomizationSettings;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
  imageMaxHeight?: number;
  textFontSize?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  subtitleColor?: string;
  onClick?: () => void;
}

export const StoreBrandDisplay: React.FC<StoreBrandDisplayProps> = ({
  customization: propCustomization,
  size = 'md',
  textColor,
  align = 'center',
  className = '',
  style = {},
  imageMaxHeight,
  textFontSize,
  showSubtitle = false,
  subtitleText,
  subtitleColor,
  onClick
}) => {
  const [cust, setCust] = useState<StoreCustomizationSettings>(() => {
    return propCustomization || getStoreCustomizationSettings();
  });

  useEffect(() => {
    if (propCustomization) {
      setCust(propCustomization);
      return;
    }
    const handler = (e: any) => {
      if (e.detail) setCust(e.detail);
      else setCust(getStoreCustomizationSettings());
    };
    window.addEventListener('cuentacasa-store-customization-changed', handler);
    return () => window.removeEventListener('cuentacasa-store-customization-changed', handler);
  }, [propCustomization]);

  // Dimensions based on size preset
  const sizeConfig = {
    sm: { imgH: 34, wideH: 38, wideMaxW: 190, fontS: '1.5rem', gap: 8 },
    md: { imgH: 38, wideH: 44, wideMaxW: 220, fontS: '1.85rem', gap: 10 },
    lg: { imgH: 52, wideH: 60, wideMaxW: 260, fontS: '2.2rem', gap: 12 },
    xl: { imgH: 72, wideH: 80, wideMaxW: 320, fontS: '2.6rem', gap: 14 }
  }[size];

  const effectiveImgH = imageMaxHeight || sizeConfig.imgH;
  const effectiveWideH = imageMaxHeight ? Math.round(imageMaxHeight * 1.15) : sizeConfig.wideH;
  const effectiveFontS = textFontSize || sizeConfig.fontS;
  const effectiveTextColor = textColor || 'var(--md-sys-color-primary)';

  const mode = cust.logoMode || 'both';
  const squareUrl = cust.logoSquareUrl || '/images/logo-nav.png';
  const wideUrl = cust.logoWideUrl || cust.logoSquareUrl || '/images/logo-nav.png';
  const name = cust.storeName || 'Samy Store';

  const containerJustify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: containerJustify,
        gap: `${sizeConfig.gap}px`,
        flexWrap: 'nowrap'
      }}>
        {mode === 'wide_logo' ? (
          <img
            src={wideUrl}
            alt={name}
            style={{
              maxHeight: `${effectiveWideH}px`,
              maxWidth: `${sizeConfig.wideMaxW}px`,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0
            }}
          />
        ) : (
          <>
            {(mode === 'both' || mode === 'logo_only') && (
              <img
                src={squareUrl}
                alt={name}
                style={{
                  maxHeight: `${effectiveImgH}px`,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0
                }}
              />
            )}

            {(mode === 'both' || mode === 'text_only') && (
              <span
                className="font-logo-script"
                style={{
                  fontSize: effectiveFontS,
                  fontWeight: 900,
                  color: effectiveTextColor,
                  lineHeight: 1,
                  display: 'inline-block',
                  letterSpacing: '-0.01em',
                  fontFamily: cust.logoFontFamily ? cust.logoFontFamily : undefined
                }}
              >
                {name}
              </span>
            )}
          </>
        )}
      </div>

      {showSubtitle && subtitleText && (
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: subtitleColor || 'var(--md-sys-color-on-surface-variant)',
          marginTop: '3px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          {subtitleText}
        </span>
      )}
    </div>
  );
};

