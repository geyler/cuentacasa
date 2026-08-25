'use client';

import React, { useState } from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency } from '@/lib/invoice';
import { formatPhotoUrl, getStoreWhatsappNumber, formatCubanPhone, getUserProductRating, rateStoreProduct } from '@/lib/storage';
import { 
  X, 
  Tag, 
  Package, 
  DollarSign, 
  MessageCircle, 
  Truck, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  TrendingUp, 
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Star,
  Globe,
  CheckCircle2,
  Scan,
  Share2
} from 'lucide-react';
import { STORE_SEO_CONFIG, getProductSeoMeta } from '@/lib/seoHelper';

interface ProductDetailModalProps {
  initialProduct: StoreProduct | null;
  allProducts?: StoreProduct[];
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  onAddToCart?: (product: StoreProduct) => void;
  onSelectProduct?: (product: StoreProduct) => void;
  onEditProduct?: (product: StoreProduct) => void;
  onDeleteProduct?: (productId: string) => void;
  isAdmin?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  initialProduct,
  allProducts = [],
  isOpen,
  onClose,
  currency = 'CUP',
  onAddToCart,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  isAdmin = false
}) => {
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(initialProduct);
  const [imageError, setImageError] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingScore, setRatingScore] = useState<number>(5.0);
  const [ratingCount, setRatingCount] = useState<number>(1);

  React.useEffect(() => {
    setActiveProduct(initialProduct);
    setImageError(false);
    if (initialProduct?.id) {
      const seo = getProductSeoMeta(initialProduct.barcode, initialProduct.price);
      setUserRating(getUserProductRating(initialProduct.id));
      setRatingScore(initialProduct.ratingScore || seo.ratingValue);
      setRatingCount(initialProduct.ratingCount || seo.reviewCount);
    }
  }, [initialProduct]);

  if (!isOpen || !activeProduct) return null;

  const cost = activeProduct.costPrice || Math.round(activeProduct.price * 0.7);
  const profitMargin = activeProduct.price - cost;

  const relatedProducts = allProducts.filter(p => 
    p.category === activeProduct.category && p.id !== activeProduct.id && p.published
  );

  const handleRateProduct = (stars: number) => {
    if (!activeProduct) return;
    const res = rateStoreProduct(activeProduct.id, stars);
    setUserRating(stars);
    setRatingScore(res.newAvg);
    setRatingCount(res.newCount);
  };

  const handleWhatsAppOrder = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const productSeoLink = `${origin}/producto/${activeProduct.id}`;

    let text = `🛒 *PEDIDO SAMY STORE*\n`;
    text += `----------------------------------\n`;
    text += `• 1x *${activeProduct.name}* (Cod: #${activeProduct.barcode})\n`;
    text += `----------------------------------\n`;
    text += `💰 *Total*: ${formatCurrency(activeProduct.price, currency, true)} CUP\n\n`;
    text += `🔗 *Ver producto en Samy Store:*\n${productSeoLink}`;

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
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert(`¡Enlace del producto copiado al portapapeles!\n${productSeoLink}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 125,
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
          maxWidth: '560px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '24px 20px 40px 20px',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '92vh',
          overflowY: 'auto',
          animation: 'modalPop 0.25s cubic-bezier(0.1, 0.9, 0.2, 1)'
        }}
      >
        {/* MD3 Bottom-Sheet Top Drag Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto' }} />

        {/* Top Badges Bar & Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              backgroundColor: '#FCE7F3',
              color: '#831843',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}>
              {activeProduct.category}
            </span>

            <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800 }}>
              Cod: #{activeProduct.barcode}
            </span>

            {/* Rating Stars Pill */}
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
              <Star size={13} fill="#D97706" /> {seoMeta.ratingValue} ({seoMeta.reviewCount})
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Featured Product HD Image Showcase Frame */}
        <div style={{
          width: '100%',
          height: '280px',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
          border: '1px solid #F1F5F9',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
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
                objectFit: 'contain',
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

          {/* Out of Stock AGOTADO Badge Overlay */}
          {!activeProduct.isExternal && activeProduct.stock <= 0 && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
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

          {/* External Product Pill Badge */}
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

          {/* Stock Count Badge */}
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

        {/* Product Title & Price Block */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px', lineHeight: '1.25' }}>
            {activeProduct.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.03em' }}>
              {formatCurrency(activeProduct.price, currency, true)}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EC4899', backgroundColor: '#FCE7F3', padding: '2px 8px', borderRadius: '6px' }}>
              CUP
            </span>
          </div>

          {activeProduct.description && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                Descripción Detallada
              </span>
              <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5', margin: 0 }}>
                {activeProduct.description}
              </p>
            </div>
          )}
        </div>

        {/* Detalles del Artículo Grid */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          borderRadius: '18px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Especificaciones Técnicas
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Categoría</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>{activeProduct.category}</span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Disponibilidad</span>
              {activeProduct.isExternal ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={13} /> Afiliado / Externo
                </span>
              ) : activeProduct.stock > 0 ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
                  {activeProduct.stock} disponible{activeProduct.stock > 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
                  Agotado
                </span>
              )}
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Código SKU</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>#{activeProduct.barcode}</span>
            </div>

            <div style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Venta Local</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                {activeProduct.isExternal ? 'Redirección Externa' : 'Punto de Venta POS'}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Profit Breakdown (Only in Admin Mode) */}
        {isAdmin && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', opacity: 0.8 }}>
                COSTO COMPRA
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {formatCurrency(cost, '$', true)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', opacity: 0.8 }}>
                GANANCIA NETA
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                +{formatCurrency(profitMargin, '$', true)}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', opacity: 0.8 }}>
                PROVEEDOR
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                {activeProduct.supplierType === 'proveedor' ? activeProduct.supplierName : 'Propio'}
              </span>
            </div>
          </div>
        )}

        {/* Interactive 5-Star Rating Section */}
        <div style={{
          backgroundColor: '#FFFDF5',
          borderRadius: '16px',
          padding: '14px 16px',
          border: '1.5px solid #FDE68A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#92400E' }}>
              Calificación general:
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} fill="#D97706" color="#D97706" />
              {ratingScore} / 5.0 ({ratingCount} votos)
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700 }}>
            {userRating > 0 
              ? `✨ Tu voto registrado en este dispositivo: ${userRating} estrella${userRating > 1 ? 's' : ''}`
              : 'Toca una estrella para calificar este artículo desde tu dispositivo:'}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <button
                key={starIndex}
                type="button"
                onClick={() => handleRateProduct(starIndex)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'transform 0.15s ease'
                }}
                title={`Calificar con ${starIndex} estrellas`}
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

        {/* Action Buttons Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isAdmin ? (
            /* ADMIN VIEW */
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
                    padding: '14px',
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(0, 99, 155, 0.3)'
                  }}
                >
                  <Scan size={20} />
                  <span>Cargar en POS / Cobrar en Admin</span>
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
                      style={{ flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                    >
                      <Edit3 size={18} />
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
                        padding: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--md-sys-color-expense)',
                        color: '#FFF'
                      }}
                    >
                      <Trash2 size={18} />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* PUBLIC STORE CUSTOMER VIEW: Carrito, WhatsApp */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeProduct.isExternal ? (
                <button
                  onClick={() => {
                    if (activeProduct.externalUrl) {
                      window.open(activeProduct.externalUrl, '_blank');
                    } else {
                      handleWhatsAppOrder();
                    }
                  }}
                  className="md-btn md-btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(0, 99, 155, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ExternalLink size={20} />
                  <span>Ver Producto en Enlace Externo / WhatsApp</span>
                </button>
              ) : (
                <>
                  {/* Row 1: Compartir y Agregar al Carrito side-by-side */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleShareProduct}
                      className="md-btn md-btn-secondary"
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Globe size={18} />
                      <span>Compartir</span>
                    </button>

                    {onAddToCart && activeProduct.stock > 0 && (
                      <button
                        onClick={() => {
                          onAddToCart(activeProduct);
                          onClose();
                        }}
                        className="md-btn md-btn-primary"
                        style={{
                          flex: 1,
                          padding: '12px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(0, 99, 155, 0.25)'
                        }}
                      >
                        <ShoppingBag size={18} />
                        <span>Al Carrito</span>
                      </button>
                    )}
                  </div>

                  {/* Row 2: Pedir por WhatsApp solo abajo */}
                  <button
                    onClick={handleWhatsAppOrder}
                    className="md-btn"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      width: '100%',
                      padding: '14px',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <MessageCircle size={22} />
                    <span>Pedir por WhatsApp</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Structured JSON-LD Schema */}
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
              "mpn": activeProduct.barcode,
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
                "priceValidUntil": "2027-12-31",
                "availability": activeProduct.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition",
                "seller": {
                  "@type": "Organization",
                  "name": STORE_SEO_CONFIG.fullName,
                  "url": STORE_SEO_CONFIG.developerUrl
                }
              }
            })
          }}
        />
      </div>

    </div>
  );
};
