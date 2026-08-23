'use client';

import React, { useState } from 'react';
import { StoreProduct } from '@/types';
import { formatCurrency } from '@/lib/invoice';
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
  Scan
} from 'lucide-react';
import { getProductSeoMeta, STORE_SEO_CONFIG } from '@/lib/seoHelper';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAddToCart?: (p: StoreProduct) => void;
  onEditProduct?: (p: StoreProduct) => void;
  onDeleteProduct?: (id: string, name: string) => void;
  allProducts?: StoreProduct[];
  currency?: string;
  isAdmin?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  onClose,
  onAddToCart,
  onEditProduct,
  onDeleteProduct,
  allProducts = [],
  currency = '$',
  isAdmin = false
}) => {
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(initialProduct);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setActiveProduct(initialProduct);
    setImageError(false);
  }, [initialProduct]);

  if (!activeProduct) return null;

  const cost = activeProduct.costPrice || Math.round(activeProduct.price * 0.7);
  const profitMargin = activeProduct.price - cost;
  const seoMeta = getProductSeoMeta(activeProduct.barcode, activeProduct.price);

  const relatedProducts = allProducts.filter(p => 
    p.category === activeProduct.category && p.id !== activeProduct.id && p.published
  );

  const handleWhatsAppOrder = () => {
    const text = `🛒 *CONSULTA / PEDIDO EN CUBASOFT STORE*\n\nHola! Me interesa comprar el producto:\n*${activeProduct.name}*\n• Código: #${activeProduct.barcode}\n• Precio: ${formatCurrency(activeProduct.price, currency, true)}\n• Categoría: ${activeProduct.category}\n\n¿Tienen disponibilidad para entrega?`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
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
          maxWidth: '620px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '24px',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
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
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              padding: '3px 12px',
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

        {/* Product HD Image 1:1 Showcase Frame (Sandra Shein ERP Style) */}
        <div style={{
          width: '100%',
          aspectRatio: '1/1',
          maxHeight: '300px',
          borderRadius: '22px',
          overflow: 'hidden',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!imageError && activeProduct.photoUrl ? (
            <img 
              src={activeProduct.photoUrl} 
              alt={activeProduct.name} 
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'var(--md-sys-color-surface-container-low)'
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
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface-variant)',
              padding: '20px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingBag size={32} opacity={0.4} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.7 }}>
                {activeProduct.name}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.5, backgroundColor: 'var(--md-sys-color-surface)', padding: '2px 8px', borderRadius: '6px' }}>
                Sin imagen disponible
              </span>
            </div>
          )}

          {/* Out of Stock AGOTADO Badge Overlay */}
          {!activeProduct.isExternal && activeProduct.stock <= 0 && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <div style={{
                backgroundColor: 'var(--md-sys-color-expense)',
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
              backgroundColor: activeProduct.stock > 0 ? '#00875A' : 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '0.76rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 12
            }}>
              {activeProduct.stock > 0 ? `Stock: ${activeProduct.stock}u` : 'Agotado'}
            </span>
          )}
        </div>

        {/* Product Title & Price Block */}
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', marginBottom: '6px', lineHeight: '1.25' }}>
            {activeProduct.name}
          </h2>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', letterSpacing: '-0.03em' }}>
              {formatCurrency(activeProduct.price, '$', false)}
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-primary)', backgroundColor: 'var(--md-sys-color-primary-container)', padding: '2px 8px', borderRadius: '6px' }}>
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

        {/* Detalles del Artículo Grid (Sandra Shein ERP Specs) */}
        <div style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          borderRadius: '18px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Detalles del Artículo
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
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00875A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00875A', display: 'inline-block' }} />
                  {activeProduct.stock} disponible{activeProduct.stock > 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-expense)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-expense)', display: 'inline-block' }} />
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
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#00875A' }}>
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

        {/* Action Buttons Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isAdmin ? (
            /* ADMIN VIEW: No self-contact WhatsApp links! Only Inventory POS & Management Actions */
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
            /* PUBLIC STORE CUSTOMER VIEW: Carrito, WhatsApp, Enlace Externo */
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
                  {onAddToCart && activeProduct.stock > 0 && (
                    <button
                      onClick={() => {
                        onAddToCart(activeProduct);
                        onClose();
                      }}
                      className="md-btn md-btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '1rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 16px rgba(0, 99, 155, 0.3)'
                      }}
                    >
                      <Plus size={20} />
                      <span>Agregar al Carrito de Compra</span>
                    </button>
                  )}

                  <button
                    onClick={handleWhatsAppOrder}
                    className="md-btn"
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      width: '100%',
                      padding: '14px',
                      fontSize: '1rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <MessageCircle size={22} />
                    <span>Consultar / Pedir por WhatsApp</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--md-sys-color-surface-variant)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Sparkles size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                También te puede interesar ({relatedProducts.length})
              </h3>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin'
            }}>
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => setActiveProduct(rel)}
                  style={{
                    minWidth: '140px',
                    maxWidth: '140px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    borderRadius: '14px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '90px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '6px'
                  }}>
                    <img 
                      src={rel.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">CUBASOFT</text></svg>`} 
                      alt={rel.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rel.name}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-income)', display: 'block' }}>
                    {formatCurrency(rel.price, '$', true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
