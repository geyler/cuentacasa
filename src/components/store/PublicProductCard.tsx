'use client';

import React from 'react';
import { StoreProduct } from '@/types';
import { formatPhotoUrl, DEFAULT_PRODUCT_IMAGE } from '@/lib/storage';
import { formatCurrency, getProductDisplayPrice } from '@/lib/invoice';
import { getProductSeoMeta, getCategoryVisualMeta } from '@/lib/seoHelper';
import { Star, Plus, Minus, ExternalLink, Truck, ShoppingCart, Sparkles } from 'lucide-react';

interface PublicProductCardProps {
  product: StoreProduct;
  cartQuantity?: number;
  isFeatured?: boolean;
  displayCurrency: 'CUP' | 'USD';
  exchangeRateUSD: number;
  usdIndexedPricing: boolean;
  showDualCurrency?: boolean;
  onOpenDetail: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct) => void;
  onUpdateCartQty?: (productId: string, delta: number) => void;
  onSelectCategory?: (category: string) => void;
}

export const PublicProductCard: React.FC<PublicProductCardProps> = ({
  product,
  cartQuantity = 0,
  isFeatured = false,
  displayCurrency,
  exchangeRateUSD,
  usdIndexedPricing,
  showDualCurrency = true,
  onOpenDetail,
  onAddToCart,
  onUpdateCartQty,
  onSelectCategory
}) => {
  const cardSeo = getProductSeoMeta(product.barcode, product.price);
  const ratingVal = product.ratingScore || cardSeo.ratingValue;
  const reviewCount = product.ratingCount || cardSeo.reviewCount;
  const formattedImage = formatPhotoUrl(product.photoUrl);
  const catMeta = getCategoryVisualMeta(product.category);

  const disp = getProductDisplayPrice(
    product.price,
    product.currency,
    displayCurrency,
    exchangeRateUSD,
    product.priceUSD,
    usdIndexedPricing
  );

  const secondaryCurr = disp.currency === 'USD' ? 'CUP' : 'USD';
  const secondaryDisp = getProductDisplayPrice(
    product.price,
    product.currency,
    secondaryCurr,
    exchangeRateUSD,
    product.priceUSD,
    usdIndexedPricing
  );

  const isOutOfStock = !product.isExternal && product.stock <= 0;
  const isLowStock = !product.isExternal && product.stock > 0 && product.stock <= 5;

  return (
    <article
      className="store-product-card"
      onClick={() => onOpenDetail(product)}
      style={{
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px',
        position: 'relative',
        backgroundColor: '#FFFFFF',
        border: cartQuantity > 0
          ? '2px solid var(--brand-primary, #1A73E8)'
          : '1px solid #E2E8F0'
      }}
    >
      <div>
        {/* Contenedor Cuadrado 1:1 de Fotografía (Radio Concéntrico: 20px - 8px = 12px) */}
        <div style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '8px',
          backgroundColor: '#F8FAFC',
          position: 'relative',
          border: '1px solid #F1F5F9'
        }}>
          <img
            className="store-product-img"
            src={formattedImage || DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            loading="lazy"
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Insignias Superiores Unificadas en la Paleta */}
          <div style={{
            position: 'absolute',
            top: '7px',
            left: '7px',
            right: '7px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '4px',
            pointerEvents: 'none'
          }}>
            <span
              className="desktop-only"
              onClick={e => {
                if (onSelectCategory) {
                  e.stopPropagation();
                  onSelectCategory(product.category);
                }
              }}
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(6px)',
                color: '#0F172A',
                fontSize: '0.64rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                textTransform: 'capitalize',
                maxWidth: '62%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {catMeta.emoji} {product.category}
            </span>

            {isFeatured ? (
              <span style={{
                backgroundColor: 'var(--brand-primary, #1A73E8)',
                color: '#FFFFFF',
                fontSize: '0.6rem',
                fontWeight: 900,
                padding: '3px 7px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                marginLeft: 'auto'
              }}>
                <Sparkles size={10} /> TOP
              </span>
            ) : isLowStock ? (
              <span style={{
                backgroundColor: 'var(--brand-primary-dark, #1E3A8A)',
                color: '#FFFFFF',
                fontSize: '0.6rem',
                fontWeight: 900,
                padding: '3px 7px',
                borderRadius: '6px',
                marginLeft: 'auto'
              }}>
                Quedan {product.stock}
              </span>
            ) : null}
          </div>

          {/* Overlay de Agotado */}
          {isOutOfStock && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 900,
                padding: '4px 12px',
                borderRadius: '8px',
                letterSpacing: '0.04em'
              }}>
                AGOTADO
              </span>
            </div>
          )}

          {/* Barra Inferior sobre la Imagen: Valoración */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '6px',
            right: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <span style={{
              backgroundColor: 'rgba(15, 23, 42, 0.76)',
              backdropFilter: 'blur(6px)',
              color: '#FFFFFF',
              fontSize: '0.64rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Star size={10} fill="var(--brand-primary-accent, #7DD3FC)" color="var(--brand-primary-accent, #7DD3FC)" />
              <span>{ratingVal}</span>
              <span className="desktop-only" style={{ color: '#CBD5E1', fontWeight: 600 }}>({reviewCount})</span>
            </span>

            {cartQuantity > 0 && (
              <span style={{
                backgroundColor: 'var(--brand-primary, #1A73E8)',
                color: '#FFFFFF',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '2px 7px',
                borderRadius: '9999px'
              }}>
                {cartQuantity}u
              </span>
            )}
          </div>
        </div>

        {/* Título del Producto con enlace canónico rastreable por Google */}
        <h3 style={{
          fontSize: '0.88rem',
          fontWeight: 800,
          color: '#0F172A',
          lineHeight: '1.26',
          marginBottom: '4px',
          minHeight: '2.2rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          <a
            href={`/producto/${product.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenDetail(product);
            }}
            style={{
              color: 'inherit',
              textDecoration: 'none'
            }}
          >
            {product.name}
          </a>
        </h3>

        {/* Etiqueta solo para proveedores externos */}
        {product.isExternal && (
          <div className="desktop-flex" style={{ alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.66rem',
              fontWeight: 800,
              color: 'var(--brand-primary-dark, #1E3A8A)',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              padding: '2px 7px',
              borderRadius: '5px'
            }}>
              <Truck size={11} />
              <span>Socio Verificado</span>
            </span>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Precio y Acción */}
      <div style={{
        paddingTop: '8px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
            <span className="tabular-nums" style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(disp.amount, disp.currency, true)}
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 900,
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: disp.currency === 'USD' ? 'var(--brand-secondary-light, #F0FDFA)' : 'var(--brand-primary-light, #EFF6FF)',
              color: disp.currency === 'USD' ? 'var(--brand-secondary-dark, #115E59)' : 'var(--brand-primary-dark, #1E3A8A)',
              border: disp.currency === 'USD' ? '1px solid var(--brand-secondary-border, #99F6E4)' : '1px solid var(--brand-primary-border, #BFDBFE)'
            }}>
              {disp.currency}
            </span>
          </div>
          {showDualCurrency && (Boolean(product.priceUSD && product.priceUSD > 0) || product.currency === 'USD' || usdIndexedPricing) && (
            <div className="desktop-only tabular-nums" style={{ fontSize: '0.66rem', color: 'var(--brand-secondary-dark, #115E59)', fontWeight: 700, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              ≈ {formatCurrency(secondaryDisp.amount, secondaryDisp.currency, true)} {secondaryDisp.currency}
            </div>
          )}
        </div>

        {/* Botón de Compra o Selector Directo - / + (Touch targets optimizados >= 32px) */}
        {product.isExternal ? (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (product.externalUrl) {
                window.open(product.externalUrl, '_blank');
              } else {
                onOpenDetail(product);
              }
            }}
            style={{
              minHeight: '34px',
              padding: '7px 12px',
              fontSize: '0.74rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--brand-primary, #1A73E8)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <ExternalLink size={13} />
            <span className="desktop-only">Ver</span>
          </button>
        ) : cartQuantity > 0 && onUpdateCartQty ? (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
              border: '1.5px solid var(--brand-primary, #1A73E8)',
              borderRadius: '9999px',
              padding: '3px',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              aria-label="Disminuir cantidad"
              onClick={() => onUpdateCartQty(product.id, -1)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#FFFFFF',
                color: 'var(--brand-primary-dark, #1E3A8A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="tabular-nums" style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--brand-primary-dark, #1E3A8A)', minWidth: '16px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
              {cartQuantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar cantidad"
              disabled={!product.isExternal && cartQuantity >= product.stock}
              onClick={() => onUpdateCartQty(product.id, 1)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--brand-primary, #1A73E8)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                opacity: (!product.isExternal && cartQuantity >= product.stock) ? 0.45 : 1
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Producto agotado' : 'Agregar al carrito'}
            style={{
              minHeight: '34px',
              padding: '7px 12px',
              fontSize: '0.76rem',
              borderRadius: '9999px',
              backgroundColor: isOutOfStock ? '#CBD5E1' : 'var(--brand-primary, #1A73E8)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <ShoppingCart size={14} />
            <span>+</span>
          </button>
        )}
      </div>
    </article>
  );
};
