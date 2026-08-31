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
  Globe, 
  Scan, 
  Share2, 
  ShoppingBag,
  Clock,
  Lock
} from 'lucide-react';
import { STORE_SEO_CONFIG, getProductSeoMeta } from '@/lib/seoHelper';
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
  isOpen = true,
  onClose,
  currency = 'CUP',
  onAddToCart,
  onEditProduct,
  onDeleteProduct,
  isAdmin = false
}) => {
  const currentProduct = product || initialProduct || null;
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(currentProduct);
  const [imageError, setImageError] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [voteTimestamp, setVoteTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const showModal = Boolean(isOpen && activeProduct);
  useLockBodyScroll(showModal);

  // Cargar estado de voto y tiempo restante
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

  // Contador regresivo de 1 minuto para editar el voto
  useEffect(() => {
    if (!voteTimestamp) {
      setTimeLeft(0);
      return;
    }
    const updateCountdown = () => {
      const elapsed = Date.now() - voteTimestamp;
      const remaining = Math.max(0, Math.ceil((60000 - elapsed) / 1000));
      setTimeLeft(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [voteTimestamp]);

  const isVoteLocked = voteTimestamp ? (Date.now() - voteTimestamp > 60000) : false;

  const seoMeta = activeProduct 
    ? getProductSeoMeta(activeProduct.barcode, activeProduct.price)
    : { ratingValue: 5.0, reviewCount: 1, datePublished: '', dateModified: '' };

  const ratingScore = activeProduct?.ratingScore || seoMeta.ratingValue;
  const ratingCount = activeProduct?.ratingCount || seoMeta.reviewCount;

  const { showToast } = useActionFeedback();

  if (!showModal || !activeProduct) return null;

  const cost = activeProduct.costPrice || Math.round(activeProduct.price * 0.7);
  const profitMargin = activeProduct.price - cost;

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
    text += `💰 *Total*: ${formatCurrency(activeProduct.price, currency, true)} CUP\n\n`;
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
    const shareText = `🛍️ *${activeProduct.name}*\n💰 Precio: ${formatCurrency(activeProduct.price, currency, true)} CUP\n\n🔗 Ver en Samy Store:\n${productSeoLink}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: activeProduct.name,
          text: shareText,
          url: productSeoLink
        });
      } catch (e) {
        // Cancelado por el usuario
      }
    } else {
      navigator.clipboard.writeText(shareText);
      showToast({
        title: '¡Enlace Copiado!',
        message: `El enlace del producto fue copiado al portapapeles.`,
        type: 'success'
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--md-sys-color-surface)',
      zIndex: 2500,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '768px',
      margin: '0 auto',
      height: '100dvh',
      overflow: 'hidden'
    }} className="no-print">

      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--md-sys-color-surface)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: 0
        }}
      >
        {/* Encabezado con Botón Cerrar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '14px 18px',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              backgroundColor: '#FCE7F3',
              color: '#BE185D',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}>
              {activeProduct.category}
            </span>

            <span style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800 }}>
              #{activeProduct.barcode}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: 'none',
              color: 'var(--md-sys-color-on-surface)',
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

        {/* CUERPO DEL DETALLE CON SCROLL INTERNO INDEPENDIENTE */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px 20px 100px 20px'
        }}>
          
          {/* MARCO DE IMAGEN 100% CUADRADA */}
          <div style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: '0px',
            overflow: 'hidden',
            backgroundColor: '#F8FAFC',
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
                <ShoppingBag size={48} opacity={0.4} />
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                  {activeProduct.name}
                </span>
              </div>
            )}

            {!activeProduct.isExternal && activeProduct.stock <= 0 && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  backgroundColor: '#EF4444',
                  color: '#FFF',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  padding: '8px 24px',
                  borderRadius: '12px',
                  transform: 'rotate(-6deg)'
                }}>
                  AGOTADO
                </div>
              </div>
            )}
          </div>

          {/* Título del Producto y Precio */}
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px', lineHeight: '1.25' }}>
              {activeProduct.name}
            </h1>

            {(() => {
              const currencySettings = typeof window !== 'undefined' ? getCurrencySettings() : { currencyMode: 'CUP' as const, exchangeRateUSD: 350, usdIndexedPricing: false };
              const disp = getProductDisplayPrice(
                activeProduct.price || 0,
                activeProduct.currency || 'CUP',
                currencySettings.currencyMode,
                currencySettings.exchangeRateUSD,
                activeProduct.priceUSD,
                currencySettings.usdIndexedPricing
              );
              const badgeStyle = getCurrencyBadgeStyle(disp.currency);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.03em' }}>
                    {formatCurrency(disp.amount, disp.currency, true)}
                  </span>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: badgeStyle.color,
                    backgroundColor: badgeStyle.backgroundColor,
                    border: badgeStyle.border,
                    padding: '3px 10px',
                    borderRadius: '9999px'
                  }}>
                    {disp.currency}
                  </span>
                </div>
              );
            })()}

            {/* Detalles Textuales Simples (Sin cuadros rígidos) */}
            <div style={{ marginTop: '14px', fontSize: '0.86rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.6' }}>
              <span>Categoría: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>{activeProduct.category}</strong></span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Disponibilidad: <strong style={{ color: activeProduct.stock > 0 ? '#059669' : '#EF4444' }}>{activeProduct.stock > 0 ? `${activeProduct.stock} en stock` : 'Agotado'}</strong></span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span>Código: <strong style={{ color: 'var(--md-sys-color-on-surface)' }}>#{activeProduct.barcode}</strong></span>
            </div>

            {activeProduct.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5', marginTop: '12px' }}>
                {activeProduct.description}
              </p>
            )}
          </div>

          {/* Sección de Valoración Interactiva Estilo WhatsApp */}
          <div style={{
            padding: '14px 0',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Valoración del artículo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star 
                    key={s} 
                    size={18} 
                    fill={s <= Math.round(ratingScore) ? '#F59E0B' : '#E2E8F0'} 
                    color={s <= Math.round(ratingScore) ? '#D97706' : '#CBD5E1'} 
                  />
                ))}
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '6px' }}>
                  {ratingScore} ({ratingCount})
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsVoteModalOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                fontWeight: 800,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Votar
            </button>
          </div>

        </div>

        {/* MODAL POPUP ESTILO WHATSAPP DE VALORACIÓN */}
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

              {/* 5 Estrellas */}
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
                      padding: '4px',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Star
                      size={32}
                      fill={starIndex <= userRating ? '#F59E0B' : '#E2E8F0'}
                      color={starIndex <= userRating ? '#D97706' : '#CBD5E1'}
                    />
                  </button>
                ))}
              </div>

              {/* Botones estilo WhatsApp: Ahora no / Enviar */}
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
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 24px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE ACCIÓN FIJA EN LA PARTE INFERIOR (STICKY BOTTOM ACTION BAR) */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          paddingTop: '12px',
          paddingBottom: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'var(--md-sys-color-surface)',
          zIndex: 50,
          boxShadow: '0 -6px 20px rgba(0,0,0,0.08)'
        }}>
          {isAdmin ? (
            /* Vista Administrador */
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
                    fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(0, 99, 155, 0.3)'
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
            /* Vista Cliente Tienda: Carrito, Compartir y WhatsApp Fijo */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleShareProduct}
                  className="md-btn md-btn-secondary"
                  style={{
                    flex: 1,
                    padding: '10px',
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

                {onAddToCart && !activeProduct.isExternal && activeProduct.stock > 0 && (
                  <button
                    onClick={() => {
                      onAddToCart(activeProduct);
                      onClose();
                    }}
                    className="md-btn md-btn-primary"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShoppingBag size={16} />
                    <span>Al Carrito</span>
                  </button>
                )}
              </div>

              {/* Botón Principal Fijo: Pedir por WhatsApp */}
              <button
                onClick={handleWhatsAppOrder}
                className="md-btn"
                style={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  width: '100%',
                  padding: '13px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
                }}
              >
                <MessageCircle size={20} />
                <span>Pedir por WhatsApp</span>
              </button>
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
