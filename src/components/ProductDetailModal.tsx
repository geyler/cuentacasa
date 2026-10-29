'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency, getProductDisplayPrice, getCurrencyBadgeStyle } from '@/lib/invoice';
import { formatPhotoUrl, getStoreWhatsappNumber, formatCubanPhone, getUserProductRating, rateStoreProduct, getCurrencySettings } from '@/lib/storage';
import {
  X,
  MessageCircle,
  Edit3,
  Trash2,
  Star,
  Scan,
  Share2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { STORE_SEO_CONFIG, getProductSeoMeta, getCategoryVisualMeta } from '@/lib/seoHelper';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';

interface ProductDetailModalProps {
  product?: StoreProduct | null;
  initialProduct?: StoreProduct | null;
  allProducts?: StoreProduct[];
  isOpen?: boolean;
  onClose: () => void;
  currency?: string;
  onAddToCart?: (product: StoreProduct) => void;
  onSelectProduct?: (product: StoreProduct) => void;
  onEditProduct?: (product: StoreProduct) => void;
  onDeleteProduct?: (productId: string, name?: string) => void;
  isAdmin?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  initialProduct,
  allProducts = [],
  isOpen = true,
  onClose,
  currency = 'CUP',
  onAddToCart,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  isAdmin = false
}) => {
  const currentProduct = product || initialProduct || null;
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(currentProduct);
  const [imageError, setImageError] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [voteTimestamp, setVoteTimestamp] = useState<number | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const showModal = Boolean(isOpen && activeProduct);
  useLockBodyScroll(showModal, onClose, false);
  useLockBodyScroll(isVoteModalOpen, () => setIsVoteModalOpen(false));

  useEffect(() => {
    setActiveProduct(currentProduct);
    setImageError(false);
    if (currentProduct?.id && typeof window !== 'undefined') {
      const storedRating = getUserProductRating(currentProduct.id);
      setUserRating(storedRating);

      const storedTime = localStorage.getItem(`cuentacasa_vote_time_${currentProduct.id}`);
      if (storedTime) {
        const timeNum = parseInt(storedTime, 10);
        setVoteTimestamp(timeNum);
      } else {
        setVoteTimestamp(null);
      }
    }
  }, [currentProduct]);

  const isVoteLocked = voteTimestamp ? (Date.now() - voteTimestamp > 60000) : false;

  const seoMeta = activeProduct
    ? getProductSeoMeta(activeProduct.barcode, activeProduct.price)
    : { ratingValue: 5.0, reviewCount: 1, datePublished: '', dateModified: '' };

  const ratingScore = activeProduct?.ratingScore || seoMeta.ratingValue;
  const ratingCount = activeProduct?.ratingCount || seoMeta.reviewCount;

  const { showToast } = useActionFeedback();

  if (!showModal || !activeProduct) return null;

  const currencySettings = typeof window !== 'undefined'
    ? getCurrencySettings()
    : { currencyMode: 'CUP' as const, exchangeRateUSD: 320, usdIndexedPricing: false };

  const disp = getProductDisplayPrice(
    activeProduct.price || 0,
    activeProduct.currency || 'CUP',
    currencySettings.currencyMode,
    currencySettings.exchangeRateUSD,
    activeProduct.priceUSD,
    currencySettings.usdIndexedPricing
  );
  const badgeStyle = getCurrencyBadgeStyle(disp.currency);

  const secondaryCurr = disp.currency === 'USD' ? 'CUP' : 'USD';
  const secondaryDisp = getProductDisplayPrice(
    activeProduct.price || 0,
    activeProduct.currency || 'CUP',
    secondaryCurr,
    currencySettings.exchangeRateUSD,
    activeProduct.priceUSD,
    currencySettings.usdIndexedPricing
  );

  const catMeta = getCategoryVisualMeta(activeProduct.category);
  const relatedProducts = allProducts
    .filter(p => p.published && p.id !== activeProduct.id && p.category === activeProduct.category)
    .slice(0, 4);

  const handleRateProduct = (stars: number) => {
    if (!activeProduct || isVoteLocked) return;

    const res = rateStoreProduct(activeProduct.id, stars);
    const now = Date.now();

    setUserRating(stars);
    setVoteTimestamp(now);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cuentacasa_vote_time_${activeProduct.id}`, now.toString());
    }

    setActiveProduct(prev => prev ? {
      ...prev,
      ratingScore: res.newAvg,
      ratingCount: res.newCount
    } : null);
  };

  const handleWhatsAppOrder = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const productSeoLink = `${origin}/producto/${activeProduct.id}`;

    let text = `🛒 *PEDIDO SAMY STORE*\n`;
    text += `----------------------------------\n`;
    text += `• 1x *${activeProduct.name}* (Código: #${activeProduct.barcode})\n`;
    text += `----------------------------------\n`;
    text += `💰 *Total*: ${formatCurrency(disp.amount, disp.currency, true)} ${disp.currency}\n\n`;
    text += `🔗 *Ver producto en tienda:*\n${productSeoLink}`;

    const targetPhone = getStoreWhatsappNumber();
    const formattedPhone = formatCubanPhone(targetPhone);
    const encoded = encodeURIComponent(text);
    const waUrl = formattedPhone.cleanDigits
      ? `https://wa.me/${formattedPhone.cleanDigits}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleShareProduct = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const productSeoLink = `${origin}/producto/${activeProduct.id}`;
    const shareText = `🛍️ *${activeProduct.name}*\n💰 Precio: ${formatCurrency(disp.amount, disp.currency, true)} ${disp.currency}\n\n🔗 Ver en Samy Store:\n${productSeoLink}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: activeProduct.name,
          text: shareText,
          url: productSeoLink
        });
      } catch {
        // Cancelado por el usuario
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast({
        title: '¡Enlace Copiado!',
        message: 'El enlace del producto fue copiado al portapapeles.',
        type: 'success'
      });
    }
  };

  return (
    <div
      className="product-modal-backdrop no-print"
      onClick={onClose}
    >
      <div
        className="product-modal-content"
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado Superior Estilo Marketplace */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: catMeta.bgSoft,
              color: catMeta.accentColor,
              border: `1px solid ${catMeta.borderSoft}`,
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'capitalize'
            }}>
              {catMeta.emoji} {activeProduct.category}
            </span>

            <span style={{
              fontSize: '0.74rem',
              color: '#64748B',
              backgroundColor: '#F1F5F9',
              padding: '3px 9px',
              borderRadius: '9999px',
              fontWeight: 800
            }}>
              Código #{activeProduct.barcode}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            style={{
              background: '#F1F5F9',
              border: 'none',
              color: '#0F172A',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL DETALLE EN 2 COLUMNAS EN PC Y 1 EN MÓVIL */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 90px 20px',
          backgroundColor: '#FFFFFF'
        }}>
          <div className="product-modal-body-grid">
            {/* COLUMNA IZQUIERDA: Fotografía Cuadrada + Insignias de Confianza */}
            <div>
              <div style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '20px',
                overflow: 'hidden',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {!imageError && activeProduct.photoUrl ? (
                  <img
                    src={formatPhotoUrl(activeProduct.photoUrl)}
                    alt={activeProduct.name}
                    onError={() => setImageError(true)}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B'
                  }}>
                    <ShoppingBag size={52} opacity={0.35} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                      {activeProduct.name}
                    </span>
                  </div>
                )}

                {!activeProduct.isExternal && activeProduct.stock <= 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      backgroundColor: '#EF4444',
                      color: '#FFF',
                      fontWeight: 900,
                      fontSize: '1.15rem',
                      padding: '8px 24px',
                      borderRadius: '12px',
                      transform: 'rotate(-6deg)'
                    }}>
                      AGOTADO
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: Información Comercial, Precio Dual, Valoración y Especificaciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: activeProduct.stock > 0 || activeProduct.isExternal ? 'var(--brand-primary-dark, #1E3A8A)' : '#DC2626',
                    backgroundColor: activeProduct.stock > 0 || activeProduct.isExternal ? 'var(--brand-primary-light, #EFF6FF)' : '#FEF2F2',
                    border: activeProduct.stock > 0 || activeProduct.isExternal ? '1px solid var(--brand-primary-border, #BFDBFE)' : '1px solid #FECACA',
                    padding: '3px 10px',
                    borderRadius: '9999px'
                  }}>
                    <CheckCircle2 size={13} />
                    {activeProduct.isExternal
                      ? 'Disponible en Socio'
                      : activeProduct.stock > 0
                        ? `En Stock (${activeProduct.stock} ${activeProduct.unit || 'u'})`
                        : 'Sin existencias'}
                  </span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-primary-dark, #1E3A8A)' }}>
                    <Star size={15} fill="var(--brand-primary, #1A73E8)" color="var(--brand-primary, #1A73E8)" />
                    <span>{ratingScore}</span>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>({ratingCount} opiniones)</span>
                  </div>
                </div>

                <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', lineHeight: '1.22', margin: 0 }}>
                  {activeProduct.name}
                </h1>
              </div>

              {/* Bloque de Precio Marketplace */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '18px',
                padding: '14px 16px'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Precio Samy Store
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {formatCurrency(disp.amount, disp.currency, true)}
                  </span>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 900,
                    color: 'var(--brand-primary-dark, #1E3A8A)',
                    backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                    border: '1px solid var(--brand-primary-border, #BFDBFE)',
                    padding: '3px 10px',
                    borderRadius: '9999px'
                  }}>
                    {disp.currency}
                  </span>
                  {activeProduct.unit && activeProduct.unit !== 'u' && (
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#64748B' }}>
                      por {activeProduct.unit}
                    </span>
                  )}
                </div>

                {currencySettings.currencyMode === 'BOTH' && (Boolean(activeProduct.priceUSD && activeProduct.priceUSD > 0) || activeProduct.currency === 'USD' || currencySettings.usdIndexedPricing) && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #CBD5E1',
                    fontSize: '0.8rem',
                    color: '#475569',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>Aprox. en {secondaryDisp.currency}:</span>
                    <strong style={{ color: 'var(--brand-primary, #1A73E8)' }}>
                      {formatCurrency(secondaryDisp.amount, secondaryDisp.currency, true)} {secondaryDisp.currency}
                    </strong>
                  </div>
                )}
              </div>

              {/* Descripción del Producto */}
              <div style={{
                fontSize: '0.88rem',
                color: '#334155',
                lineHeight: '1.55',
                backgroundColor: '#FFFFFF',
                border: '1px solid #F1F5F9',
                borderRadius: '14px',
                padding: '12px 14px'
              }}>
                <strong style={{ display: 'block', color: '#0F172A', marginBottom: '4px', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  Detalles del Artículo
                </strong>
                {activeProduct.description || 'Sin descripción adicional para este producto.'}
              </div>

              {/* Valoración Interactiva Unificada */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: 'var(--brand-primary-light, #EFF6FF)',
                border: '1px solid var(--brand-primary-border, #BFDBFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-primary-dark, #1E3A8A)' }}>
                    ¿Ya compraste este producto?
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= Math.round(ratingScore) ? 'var(--brand-primary, #1A73E8)' : '#E2E8F0'}
                        color={s <= Math.round(ratingScore) ? 'var(--brand-primary, #1A73E8)' : '#CBD5E1'}
                      />
                    ))}
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--brand-primary-dark, #1E3A8A)', marginLeft: '5px' }}>
                      {ratingScore} ({ratingCount})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsVoteModalOpen(true)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--brand-primary, #1A73E8)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Calificar ★
                </button>
              </div>
            </div>
          </div>

          {/* Carrusel de Productos Relacionados de la misma categoría */}
          {relatedProducts.length > 0 && !isAdmin && (
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginBottom: '12px' }}>
                Productos similares en {activeProduct.category}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                gap: '10px'
              }}>
                {relatedProducts.map(rel => {
                  const relDisp = getProductDisplayPrice(
                    rel.price,
                    rel.currency,
                    currencySettings.currencyMode,
                    currencySettings.exchangeRateUSD,
                    rel.priceUSD,
                    currencySettings.usdIndexedPricing
                  );
                  return (
                    <div
                      key={`modal-rel-${rel.id}`}
                      onClick={() => {
                        setActiveProduct(rel);
                        if (onSelectProduct) onSelectProduct(rel);
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                        {rel.photoUrl ? (
                          <img src={formatPhotoUrl(rel.photoUrl)} alt={rel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                            <ShoppingBag size={22} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rel.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--brand-primary, #1A73E8)' }}>
                        {formatCurrency(relDisp.amount, relDisp.currency, true)} {relDisp.currency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL POPUP DE VALORACIÓN */}
        {isVoteModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsVoteModalOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '360px',
                backgroundColor: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                ¿Cómo fue tu experiencia con este producto?
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                Selecciona la cantidad de estrellas para valorar:
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(starIndex => (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setUserRating(starIndex)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Star
                      size={32}
                      fill={starIndex <= userRating ? 'var(--brand-primary, #1A73E8)' : '#E2E8F0'}
                      color={starIndex <= userRating ? 'var(--brand-primary, #1A73E8)' : '#CBD5E1'}
                    />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsVoteModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    padding: '8px 12px'
                  }}
                >
                  Ahora no
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (userRating > 0) {
                      handleRateProduct(userRating);
                    }
                    setIsVoteModalOpen(false);
                  }}
                  style={{
                    backgroundColor: 'var(--brand-primary, #1A73E8)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 24px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Enviar Calificación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE ACCIÓN FIJA EN LA PARTE INFERIOR */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid #E2E8F0',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          zIndex: 50,
          boxShadow: '0 -6px 20px rgba(0,0,0,0.06)'
        }}>
          {isAdmin ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {onAddToCart && !activeProduct.isExternal && activeProduct.stock > 0 && (
                <button
                  onClick={() => {
                    onAddToCart(activeProduct);
                    onClose();
                  }}
                  className="md-btn md-btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '0.95rem',
                    fontWeight: 800
                  }}
                >
                  <Scan size={18} />
                  <span>Cargar en Venta / Almacén</span>
                </button>
              )}

              {(onEditProduct || onDeleteProduct) && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {onEditProduct && (
                    <button
                      onClick={() => {
                        onClose();
                        onEditProduct(activeProduct);
                      }}
                      className="md-btn md-btn-secondary"
                      style={{ flex: 1, padding: '10px', fontSize: '0.88rem', fontWeight: 800 }}
                    >
                      <Edit3 size={16} />
                      <span>Editar Producto</span>
                    </button>
                  )}

                  {onDeleteProduct && (
                    <button
                      onClick={() => {
                        onClose();
                        onDeleteProduct(activeProduct.id, activeProduct.name);
                      }}
                      className="md-btn"
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--md-sys-color-expense)',
                        color: '#FFF'
                      }}
                    >
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button
                onClick={handleShareProduct}
                className="md-btn md-btn-secondary"
                style={{
                  padding: '11px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={16} />
                <span>Compartir</span>
              </button>

              {activeProduct.isExternal && activeProduct.externalUrl ? (
                <button
                  onClick={() => window.open(activeProduct.externalUrl, '_blank')}
                  className="md-btn md-btn-primary"
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ExternalLink size={17} />
                  <span>Ir al Sitio Oficial</span>
                </button>
              ) : (
                <>
                  {onAddToCart && activeProduct.stock > 0 && (
                    <button
                      onClick={() => {
                        onAddToCart(activeProduct);
                        onClose();
                      }}
                      className="md-btn md-btn-primary"
                      style={{
                        flex: 1,
                        padding: '11px 18px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <ShoppingBag size={17} />
                      <span>Agregar al Carrito</span>
                    </button>
                  )}

                  <button
                    onClick={handleWhatsAppOrder}
                    className="md-btn"
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--brand-primary-darker, #0B1528)',
                      color: '#FFFFFF',
                      padding: '11px 18px',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <MessageCircle size={18} />
                    <span>Pedir por WhatsApp</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* JSON-LD de Estructura SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": `${activeProduct.name} - ${STORE_SEO_CONFIG.fullName}`,
              "image": activeProduct.photoUrl ? [activeProduct.photoUrl] : [],
              "description": activeProduct.description || `${activeProduct.name} disponible en ${STORE_SEO_CONFIG.fullName}, Cuba. Compra con garantía local y entrega rápida.`,
              "sku": activeProduct.barcode,
              "brand": {
                "@type": "Brand",
                "name": STORE_SEO_CONFIG.storeName
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": seoMeta.ratingValue.toString(),
                "reviewCount": seoMeta.reviewCount.toString(),
                "bestRating": "5",
                "worstRating": "1"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "CUP",
                "price": activeProduct.price,
                "availability": activeProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                  "@type": "Organization",
                  "name": STORE_SEO_CONFIG.fullName
                }
              }
            })
          }}
        />
      </div>
    </div>
  );
};
