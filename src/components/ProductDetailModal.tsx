'use client';

import React, { useState, useEffect } from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { formatPhotoUrl, getStoreWhatsappNumber, formatCubanPhone, getUserProductRating, rateStoreProduct } from '@/lib/storage';
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
  useLockBodyScroll(isOpen);

  const currentProduct = product || initialProduct || null;
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(currentProduct);
  const [imageError, setImageError] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [voteTimestamp, setVoteTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

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

  if (!isOpen || !activeProduct) return null;

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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2500, // Por encima de toda la barra de navegación y menús
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0'
    }} className="no-print" onClick={onClose}>

      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '18px 20px 24px 20px',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          animation: 'modalPop 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)',
          position: 'relative'
        }}
      >
        {/* Tirador MD3 superior para deslizar */}
        <div style={{ width: '42px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 12px auto' }} />

        {/* Encabezado con insignias unificadas y botón cerrar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

            <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800 }}>
              Código: #{activeProduct.barcode}
            </span>

            {/* Insignia de Valoración Unificada */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '9999px'
            }}>
              <Star size={13} fill="#D97706" color="#D97706" /> {ratingScore} ({ratingCount})
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: 'none',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '6px',
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
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingRight: '2px',
          marginBottom: '12px'
        }}>
          
          {/* MARCO DE IMAGEN 100% CUADRADA PERFECCIONADO */}
          <div style={{
            width: '100%',
            aspectRatio: '1 / 1',
            maxHeight: '340px',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            {!imageError && activeProduct.photoUrl ? (
              <img 
                src={formatPhotoUrl(activeProduct.photoUrl)} 
                alt={activeProduct.name} 
                onError={() => setImageError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // Garantiza que sea perfectamente cuadrada sin romperse
                  backgroundColor: '#FFFFFF'
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
                color: '#64748B',
                padding: '20px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingBag size={32} opacity={0.5} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                  {activeProduct.name}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '6px' }}>
                  Sin foto disponible
                </span>
              </div>
            )}

            {/* Marca de AGOTADO */}
            {!activeProduct.isExternal && activeProduct.stock <= 0 && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.55)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <div style={{
                  backgroundColor: '#EF4444',
                  color: '#FFF',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  padding: '8px 24px',
                  borderRadius: '16px',
                  transform: 'rotate(-8deg)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  border: '2px solid #FFF'
                }}>
                  AGOTADO
                </div>
              </div>
            )}

            {/* Insignia de Producto Externo */}
            {activeProduct.isExternal && (
              <span style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 12
              }}>
                <Globe size={13} /> Catálogo Externo
              </span>
            )}

            {/* Cantidad en Stock */}
            {!activeProduct.isExternal && (
              <span style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: activeProduct.stock > 0 ? '#059669' : '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.76rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                zIndex: 12
              }}>
                {activeProduct.stock > 0 ? `Stock: ${activeProduct.stock}u` : 'Agotado'}
              </span>
            )}
          </div>

          {/* Título del Producto y Precio */}
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginBottom: '4px', lineHeight: '1.25' }}>
              {activeProduct.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.03em' }}>
                {formatCurrency(activeProduct.price, currency, true)}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EC4899', backgroundColor: '#FCE7F3', padding: '2px 8px', borderRadius: '6px' }}>
                CUP
              </span>
            </div>

            {activeProduct.description && (
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                  Descripción del Producto
                </span>
                <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5', margin: 0 }}>
                  {activeProduct.description}
                </p>
              </div>
            )}
          </div>

          {/* Detalles del Artículo Grid Reformateado sin jerga técnica */}
          <div style={{
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '18px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Información de Compra
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div style={{ padding: '8px 10px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                <span style={{ fontSize: '0.64rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Categoría</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{activeProduct.category}</span>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                <span style={{ fontSize: '0.64rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Disponibilidad</span>
                {activeProduct.isExternal ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={13} /> Enlace Externo
                  </span>
                ) : activeProduct.stock > 0 ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
                    {activeProduct.stock} unidades
                  </span>
                ) : (
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
                    Agotado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desglose de Ganancias (Solo Modo Administrador) */}
          {isAdmin && (
            <div style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, display: 'block', opacity: 0.85 }}>COSTO</span>
                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{formatCurrency(cost, '$', true)}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, display: 'block', opacity: 0.85 }}>GANANCIA</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#059669' }}>+{formatCurrency(profitMargin, '$', true)}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.64rem', fontWeight: 700, display: 'block', opacity: 0.85 }}>ORIGEN</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{activeProduct.supplierType === 'proveedor' ? activeProduct.supplierName : 'Propio'}</span>
              </div>
            </div>
          )}

          {/* Sección de Valoración Interactiva con Bloqueo de 1 Minuto */}
          <div style={{
            backgroundColor: '#FFFDF5',
            borderRadius: '16px',
            padding: '14px 16px',
            border: '1.5px solid #FDE68A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#92400E' }}>
                Valoración del producto:
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={16} fill="#D97706" color="#D97706" />
                {ratingScore} / 5.0 ({ratingCount} votos)
              </span>
            </div>

            {/* Estado de Voto y Temporizador de 1 Minuto */}
            <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700 }}>
              {isVoteLocked ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#92400E' }}>
                  <Lock size={13} /> Tu valoración ({userRating} estrellas) ha sido guardada.
                </span>
              ) : userRating > 0 ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706' }}>
                  <Clock size={13} /> Tienes {timeLeft}s para modificar tu voto:
                </span>
              ) : (
                'Toca una estrella para valorar este artículo:'
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <button
                  key={starIndex}
                  type="button"
                  disabled={isVoteLocked}
                  onClick={() => handleRateProduct(starIndex)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isVoteLocked ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    opacity: isVoteLocked ? 0.75 : 1,
                    transition: 'transform 0.15s ease'
                  }}
                  title={isVoteLocked ? 'Valoración bloqueada (1 min transcurrido)' : `Valorar con ${starIndex} estrellas`}
                >
                  <Star
                    size={28}
                    fill={starIndex <= userRating ? '#F59E0B' : '#E2E8F0'}
                    color={starIndex <= userRating ? '#D97706' : '#CBD5E1'}
                  />
                </button>
              ))}
            </div>
          </div>

        </div>

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
